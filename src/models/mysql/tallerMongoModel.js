const client = require('../../config/mongo');
const { ObjectId } = require('mongodb');
const pool = require('../../config/db');

// T1
const obtenerSolicitudesCercanas = async (latitud, longitud) => {
  const db = client.db('RescateVialMongodb');
  const collection = db.collection('solicitudes');

  const solicitudes = await collection.find({
    ubicacion: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [parseFloat(longitud), parseFloat(latitud)]
        },
        $maxDistance: 5000
      }
    },
    estado: 'pendiente'
  }).toArray();

  return solicitudes;
};

// T2/T3/T6
const cambiarEstadoSolicitud = async ({ id_servicio, estado, extra = {} }) => {
  const db = client.db('RescateVialMongodb');
  const collection = db.collection('solicitudes');

  const result = await collection.updateOne(
    { _id: new ObjectId(id_servicio) },

    {
      $set: {
        estado,
        ...extra, // guarda id_taller si viene
        fecha_actualizacion: new Date(),
      }
    }
  );

  if (result.matchedCount === 0) {
    throw new Error('Solicitud no encontrada');
  }

  return result;
};

// T4
const getSolicitudAceptadaByTaller = async (id_taller) => {
  const db = client.db('RescateVialMongodb');

  let queryIds = [parseInt(id_taller), String(id_taller)];
  if (ObjectId.isValid(id_taller)) {
    queryIds.push(new ObjectId(id_taller));
  }

  return await db.collection('solicitudes').findOne(
    {
      id_taller: { $in: queryIds },
      estado: {
        $in: [
          'en_proceso',
          'aceptada',
          'en_ruta',
          'taller_llego',
          'trabajo_en_proceso',
          'trabajo_terminado',
          'completada',
        ],
      },
    },
    { sort: { fecha_actualizacion: -1 } }
  );
};

// T5
const getActiveSolicitudByTaller = async (id_taller) => {
  const db = client.db('RescateVialMongodb');

  return await db.collection('solicitudes').findOne(
    {
      id_taller: { $in: [parseInt(id_taller), String(id_taller)] },
      estado: {
        $in: [
          'en_proceso',
          'aceptada',
          'en_ruta',
          'taller_llego',
          'trabajo_en_proceso',
          'trabajo_terminado',
          'completada',
        ],
      },
    },
    { sort: { fecha_solicitud: -1 } }
  );
};


const actualizarPosicionTaller = async (id_servicio, lat, lng) => {
  const db = client.db('RescateVialMongodb');
  await db.collection('solicitudes').updateOne(
    { _id: new ObjectId(id_servicio) },
    {
      $set: {
        posicion_taller: { type: 'Point', coordinates: [lng, lat] },
        fecha_actualizacion: new Date()
      }
    }
  );
};

const getPosicionTaller = async (id_servicio) => {
  const db = client.db('RescateVialMongodb');
  const doc = await db.collection('solicitudes').findOne(
    { _id: new ObjectId(id_servicio) },
    { projection: { posicion_taller: 1 } }
  );
  return doc?.posicion_taller?.coordinates ?? null; // [lng, lat]
};


// U9/T9
const guardarCalificacion = async ({ id_servicio, calificador, estrellas, comentario }) => {
  const mongoDb = client.db('RescateVialMongodb');

  const campo = calificador === 'cliente'
    ? 'rank_cliente_to_taller'
    : 'rank_taller_to_user';

  await mongoDb.collection('solicitudes').updateOne(
    { _id: new ObjectId(id_servicio) },
    {
      $set: {
        [campo]: {
          estrellas,
          comentario,
          fecha: new Date()
        },
        fecha_actualizacion: new Date()
      }
    }
  );

  const doc = await mongoDb.collection('solicitudes').findOne(
    { _id: new ObjectId(id_servicio) },
    {
      projection: {
        rank_cliente_to_taller: 1,
        rank_taller_to_user: 1
      }
    }
  );

  if (doc?.rank_cliente_to_taller && doc?.rank_taller_to_user) {
    await mongoDb.collection('solicitudes').updateOne(
      { _id: new ObjectId(id_servicio) },
      {
        $set: {
          estado: 'calificada',
          fecha_actualizacion: new Date()
        }
      }
    );

    const servicioFinal = await mongoDb.collection('solicitudes').findOne({
      _id: new ObjectId(id_servicio)
    });

    await moverServicioCalificadoAMySQL(servicioFinal);
  }
};



async function moverServicioCalificadoAMySQL(doc) {
  if (!doc) {
    throw new Error('No se recibió el documento del servicio');
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const idService = doc._id.toString();
    const idUser = doc.id_user;
    const idUserCar = doc.id_usercar;
    const idTallerUser = doc.id_taller;

    if (!idService || !idUser || !idUserCar || !idTallerUser) {
      throw new Error('Faltan datos obligatorios del servicio');
    }

    // Evitar duplicados
    const [historialExistente] = await conn.query(
      `SELECT id_history FROM ServiceHistory WHERE id_service = ? LIMIT 1`,
      [idService]
    );

    if (historialExistente.length > 0) {
      await conn.rollback();
      return;
    }

    // Mongo.id_taller = Users.id_user del taller
    // De aquí sacamos el id_usertaller real
    const [tallerRows] = await conn.query(
      `SELECT id_usertaller
       FROM UserTaller
       WHERE id_user = ?
       LIMIT 1`,
      [idTallerUser]
    );

    if (tallerRows.length === 0) {
      throw new Error(`No se encontró id_usertaller para id_user taller = ${idTallerUser}`);
    }

    const idUserTaller = tallerRows[0].id_usertaller;

    let idRatingPrincipal = null;

    // 1) rating cliente -> taller
    if (doc.rank_cliente_to_taller) {
      const [r1] = await conn.query(
        `INSERT INTO ratings
        (
          id_service,
          id_user,
          id_rated_user,
          score_rating,
          comentario,
          date_rating
        )
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          idService,
          idUser,
          idTallerUser,
          doc.rank_cliente_to_taller.estrellas,
          doc.rank_cliente_to_taller.comentario || null,
          new Date(doc.rank_cliente_to_taller.fecha),
        ]
      );

      idRatingPrincipal = r1.insertId;
    }

    // 2) rating taller -> cliente
    if (doc.rank_taller_to_user) {
      await conn.query(
        `INSERT INTO ratings
        (
          id_service,
          id_user,
          id_rated_user,
          score_rating,
          comentario,
          date_rating
        )
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
          idService,
          idTallerUser,
          idUser,
          doc.rank_taller_to_user.estrellas,
          doc.rank_taller_to_user.comentario || null,
          new Date(doc.rank_taller_to_user.fecha),
        ]
      );
    }

    const coords = doc.ubicacion?.coordinates || [null, null];
    const locationService =
      coords[1] != null && coords[0] != null
        ? `${coords[1]},${coords[0]}`
        : null;

    await conn.query(
      `INSERT INTO ServiceHistory
      (
        id_service,
        id_user,
        id_usertaller,
        id_usercar,
        issue_type,
        location_service,
        description_service,
        fecha_solicitud,
        service_status,
        cost_service,
        id_rating
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idService,
        idUser,
        idUserTaller,
        idUserCar,
        doc.issue_type || null,
        locationService,
        doc.description || null,
        doc.fecha_solicitud ? new Date(doc.fecha_solicitud) : null,
        'completed',
        null,
        idRatingPrincipal,
      ]
    );

    await conn.commit();
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

module.exports = {
  obtenerSolicitudesCercanas,
  cambiarEstadoSolicitud,
  getSolicitudAceptadaByTaller,
  getActiveSolicitudByTaller,
  actualizarPosicionTaller,
  getPosicionTaller,
  guardarCalificacion,
  moverServicioCalificadoAMySQL
};