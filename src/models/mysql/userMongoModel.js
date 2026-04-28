const client = require('../../config/mongo');
const { ObjectId } = require('mongodb');
const db = require('../../config/db');

const getCollection = () => client.db('RescateVialMongodb').collection('solicitudes');

const createAssistanceRequest = async ({ id_user, id_usercar, issue_type, description, ubicacion }) => {
  const doc = {
    id_user,
    id_usercar,
    issue_type,
    description,
    ubicacion: {
      type: 'Point',
      coordinates: [ubicacion.lng, ubicacion.lat],
    },
    estado: 'pendiente',
    fecha_solicitud: new Date(),
  };
  return await getCollection().insertOne(doc);
};

const updateAssistanceStatus = async (id_servicio, estado) => {
  return await getCollection().updateOne(
    { _id: new ObjectId(id_servicio) },
    { $set: { estado, fecha_actualizacion: new Date() } }
  );
};

const getActiveSolicitudByUser = async (id_user) => {
  return await getCollection().findOne(
    {
      id_user: parseInt(id_user),
      estado: {
        $in: [
          'pendiente',
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

const getPosicionTaller = async (id_servicio) => {
  const db = client.db('RescateVialMongodb');
  const doc = await db.collection('solicitudes').findOne(
    { _id: new ObjectId(id_servicio) },
    { projection: { posicion_taller: 1 } }
  );
  return doc?.posicion_taller?.coordinates ?? null; // [lng, lat]
};



module.exports = {
  createAssistanceRequest,
  updateAssistanceStatus,
  getActiveSolicitudByUser,
  getPosicionTaller
};