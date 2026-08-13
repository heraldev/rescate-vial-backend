const pool = require('../../config/db');
const client = require('../../config/mongo');
const { ObjectId } = require('mongodb');

const AdminModel = {

  //tabla de solicitudes de talleres del admin
  async obtenerSolicitudes() {
    const [rows] = await pool.query(`
      SELECT 
        tr.id_tr,
        tr.name_tr,
        tr.owner_name_tr,
        tr.schudel_tr,
        tr.phone_tr,
        tr.email_tr,
        tr.onsiteservice_tr,
        tr.status_tr,
        tr.motivo_rechazo_tr,
        tr.fecha_solicitud,
        tra.calle_tra,
        tra.numint_tra,
        tra.numext_tra,
        tra.cp_tra,
        tra.colonia_tra,
        tra.municipio_tra,
        tra.estado_tra,
        tra.latitude_tra,
        tra.longitude_tra
      FROM taller_request tr
      LEFT JOIN taller_requests_address tra ON tr.id_tr = tra.id_tr
      ORDER BY tr.fecha_solicitud ASC
    `);

    return rows;
  },


  //Funciones para aprobar o rechazar solicitudes de registro de talleres
  async obtenerSolicitudPorId(id) {
    const [rows] = await pool.query('SELECT * FROM taller_request WHERE id_tr = ?', [id]);
    return rows[0];
  },

  async actualizarEstatus(id, status, motivoRechazo) {
    const [result] = await pool.query(
      `UPDATE taller_request SET status_tr = ?, motivo_rechazo_tr = ? WHERE id_tr = ?`,
      [status, motivoRechazo, id]
    );
    if (result.affectedRows === 0) throw new Error('Solicitud no encontrada');
    return { ok: true };
  },

  async aprobarSolicitud(id) {
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // 1. Obtener la solicitud original
      const [solRows] = await conn.query(`SELECT * FROM taller_request WHERE id_tr = ?`, [id]);
      if (solRows.length === 0) throw new Error('Solicitud no encontrada');
      const solicitud = solRows[0];

      if (solicitud.status_tr === 'aprobado') throw new Error('La solicitud ya fue aprobada');
      if (solicitud.status_tr === 'rechazado') throw new Error('La solicitud ya fue rechazada');

      // 2. Obtener la dirección asociada de la solicitud
      const [addrRows] = await conn.query(`SELECT * FROM taller_requests_address WHERE id_tr = ?`, [id]);
      const direccion = addrRows[0];

      // 3. Validar si el email ya existe en Users
      const [existRows] = await conn.query(`SELECT * FROM Users WHERE email_user = ?`, [solicitud.email_tr]);
      if (existRows.length > 0) throw new Error('El correo del taller ya está registrado en la plataforma');

      // 4. Insertar en Users (Propietario como Usuario Oficial con Rol 3)
      const [userResult] = await conn.query(
        `INSERT INTO Users (id_userrol, name_user, lastname1_user, lastname2_user, email_user, password_user, status_user, email_verified_user) VALUES (?, ?, ?, ?, ?, NULL, 1, 0)`,
        [3, solicitud.owner_name_tr, solicitud.lastname1_tr, solicitud.lastname2_tr, solicitud.email_tr]
      );

      const idUser = userResult.insertId;

      // 5. Insertar en UserTaller (Datos oficiales del negocio)
      const [tallerResult] = await conn.query(
        `INSERT INTO UserTaller (id_user, name_usertaller, schudel_usertaller, phone_taller, onsiteservice_usertaller, photos_usertaller, status_taller)
         VALUES (?, ?, ?, ?, ?, NULL, 1)`,
        [idUser, solicitud.name_tr, solicitud.schudel_tr, solicitud.phone_tr, solicitud.onsiteservice_tr, solicitud.photos_tr]
      );
      const idUserTaller = tallerResult.insertId;

      // 6. Insertar en UserTallerAddress (Vaciado completo con coordenadas)
      if (direccion) {
        await conn.query(
          `INSERT INTO UserTallerAddress
           (id_usertaller, calle_addresstaller, numint_addresstaller, numext_addresstaller, cp_addresstaller,
            colonia_addresstaller, municipio_addresstaller, estado_addresstaller, latitude_addresstaller, longitude_addresstaller)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            idUserTaller,
            direccion.calle_tra, direccion.numint_tra, direccion.numext_tra,
            direccion.cp_tra, direccion.colonia_tra, direccion.municipio_tra, direccion.estado_tra,
            direccion.latitude_tra, direccion.longitude_tra
          ]
        );
      }

      // 7. Actualizar estatus de la solicitud a 'aprobado'
      await conn.query(`UPDATE taller_request SET status_tr = 'aprobado' WHERE id_tr = ?`, [id]);

      await conn.commit();

      // Retornamos los datos limpios y exactos que requiere el servicio para el JWT y el Correo
      return {
        ok: true,
        idUser,
        correo: solicitud.email_tr,
        nombre: solicitud.owner_name_tr // Se le enviará el correo al nombre del propietario
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  },

  async rechazarSolicitud(id, motivo) {
    const solicitud = await this.obtenerSolicitudPorId(id);
    if (!solicitud) throw new Error('Solicitud no encontrada');
    if (solicitud.status_tr === 'aprobado') throw new Error('No se puede rechazar una solicitud ya aprobada');
    if (solicitud.status_tr === 'rechazado') throw new Error('La solicitud ya fue rechazada');

    await pool.query(
      `UPDATE taller_request SET status_tr = 'rechazado', motivo_rechazo_tr = ? WHERE id_tr = ?`,
      [motivo, id]
    );

    return { ok: true, correo: solicitud.email_tr, nombre: solicitud.owner_name_tr };
  },


  //------------Conductores/Users---------------------

  // 1. OBTENER METRICAS TOP (KPIs de usuarios rol 2)
  async obtenerMetricasConductores() {
    // Consulta optimizada para traer los 3 contadores en una sola petición
    const query = `
      SELECT 
        COUNT(CASE WHEN id_userrol = 2 THEN 1 END) AS total_registrados,
        COUNT(CASE WHEN id_userrol = 2 AND status_user = 0 THEN 1 END) AS bloqueados,
        (
          SELECT COUNT(DISTINCT id_user) 
          FROM ServiceHistory 
          WHERE DATE_FORMAT(fecha_solicitud, '%Y-%m') = DATE_FORMAT(CURRENT_DATE(), '%Y-%m')
        ) AS activos_este_mes
      FROM Users;
    `;

    const [rows] = await pool.query(query);
    return rows[0];
  },

  // 2. OBTENER TABLA DE CONDUCTORES / USUARIOS CON HISTORIAL
  async obtenerTablaConductores() {
    const query = `
      SELECT 
        u.id_user,
        CONCAT(u.name_user, ' ', u.lastname1_user) AS nombre_completo,
        u.email_user,
        u.date_register_user,
        u.status_user,
        COUNT(sh.id_user) AS total_servicios,
        MAX(sh.fecha_solicitud) AS ultimo_servicio
      FROM Users u
      LEFT JOIN ServiceHistory sh ON u.id_user = sh.id_user
      WHERE u.id_userrol = 2
      GROUP BY u.id_user
      ORDER BY u.date_register_user DESC;
    `;

    const [rows] = await pool.query(query);
    return rows;
  },



  //--------SOlicitudes de talleres en MongoDB para el dashboard del admin (KPIs y tabla de solicitudes)--------
  async obtenerMetricasSolicitudes() {
    const db = client.db('RescateVialMongodb'); // Tu base de datos en Mongo

    // Rango de fechas para el día de hoy
    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);

    const finHoy = new Date();
    finHoy.setHours(23, 59, 59, 999);

    const matchHoy = {
      fecha_solicitud: { $gte: inicioHoy, $lte: finHoy }
    };

    const estadosProgreso = [
      'pendiente', 'en_proceso', 'aceptada', 'en_ruta',
      'taller_llego', 'trabajo_en_proceso', 'trabajo_terminado'
    ];

    const stats = await db.collection('solicitudes').aggregate([
      { $match: matchHoy },
      {
        $group: {
          _id: null,
          totalesHoy: { $sum: 1 },
          enProgreso: {
            $sum: {
              $cond: [{ $in: ['$estado', estadosProgreso] }, 1, 0]
            }
          },
          completadas: {
            $sum: {
              $cond: [{ $in: ['$estado', ['completada', 'calificada']] }, 1, 0]
            }
          },
          canceladas: {
            $sum: {
              $cond: [{ $eq: ['$estado', 'cancelada'] }, 1, 0]
            }
          }
        }
      }
    ]).toArray();

    return stats[0] || { totalesHoy: 0, enProgreso: 0, completadas: 0, canceladas: 0 };
  },

  // OBTENER SOLICITUDES DE MONGO Y RELLENAR NOMBRES DESDE MYSQL
  async obtenerTablaSolicitudes() {
    const db = client.db('RescateVialMongodb');

    // 1. Obtener las últimas 50 solicitudes de Mongo
    const solicitudesMongo = await db.collection('solicitudes')
      .find({})
      .sort({ fecha_solicitud: -1 })
      .limit(50)
      .toArray();

    if (solicitudesMongo.length === 0) return [];

    // 2. Extraer IDs únicos para consultar en MySQL
    const userIds = [...new Set(solicitudesMongo.map(s => s.id_user).filter(Boolean))];
    const tallerUserIds = [...new Set(solicitudesMongo.map(s => s.id_taller).filter(Boolean))];

    // Mapas auxiliares para búsqueda O(1)
    const userMap = {};
    const tallerMap = {};

    // 3. Consultar nombres de Clientes en MySQL (Users)
    if (userIds.length > 0) {
      const [users] = await pool.query(
        `SELECT id_user, CONCAT(name_user, ' ', lastname1_user) AS nombre_completo 
         FROM Users WHERE id_user IN (?)`,
        [userIds]
      );
      users.forEach(u => { userMap[u.id_user] = u.nombre_completo; });
    }

    // 4. Consultar nombres de Talleres en MySQL (UserTaller mapeado por id_user)
    if (tallerUserIds.length > 0) {
      const [talleres] = await pool.query(
        `SELECT id_user, name_usertaller FROM UserTaller WHERE id_user IN (?)`,
        [tallerUserIds]
      );
      talleres.forEach(t => { tallerMap[t.id_user] = t.name_usertaller; });
    }

    // 5. Unir los datos
    return solicitudesMongo.map(s => ({
      ...s,
      nombre_cliente: userMap[s.id_user] || `Usuario #${s.id_user}`,
      nombre_taller: tallerMap[s.id_taller] || 'Sin asignar'
    }));
  },







};

module.exports = AdminModel;
