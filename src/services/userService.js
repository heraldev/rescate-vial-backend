const userModel = require('../models/mysql/userModel');
const userMongoModel = require('../models/mysql/userMongoModel.js');
const TallerMongoModel = require('../models/mysql/tallerMongoModel');

const addCar = async (carData) => {
  return await userModel.insertUserCar(carData);
};

const getUserCars = async (id_user) => {
  return await userModel.getUserCarsByUser(id_user);
};

const getCarById = async (id_usercar) => {
  return await userModel.getCarById(id_usercar);
};

const requestAssistance = async (data) => {
  return await userMongoModel.createAssistanceRequest(data);
};

const cancelAssistance = async (id_servicio) => {
  return await userMongoModel.updateAssistanceStatus(id_servicio, 'cancelada');
};

const confirmAssistance = async (id_servicio, accion) => {
  return await userMongoModel.updateAssistanceStatus(id_servicio, accion);
};

const getServiceStatus = async (id_user) => {
  // 1. Buscar solicitud activa en Mongo
  const solicitud = await userMongoModel.getActiveSolicitudByUser(id_user);
  if (!solicitud) return null;

  const response = {
    id_servicio: solicitud._id.toString(),
    estado: solicitud.estado,
    issue_type: solicitud.issue_type,
    description: solicitud.description,
    ubicacion: solicitud.ubicacion,
    fecha_solicitud: solicitud.fecha_solicitud,
  };

  // 2. Si está en_proceso y tiene taller, consultar MySQL
  if (
    ['en_proceso', 'aceptada', 'en_ruta', 'taller_llego', 'trabajo_en_proceso', 'trabajo_terminado', 'completada']
      .includes(solicitud.estado) &&
    solicitud.id_taller
  ) {
    const taller = await userModel.getTallerByIdUser(solicitud.id_taller);
    if (taller) {
      response.taller = {
        nombre: taller.name_usertaller,
        telefono: taller.phone_taller,
        horario: taller.schudel_usertaller,
        ubicacion: {
          lat: parseFloat(taller.latitud),
          lng: parseFloat(taller.longitud),
        },
      };
    }
  }

  return response;
};

const getPosicionTaller = async (id_servicio) => {
  return await userMongoModel.getPosicionTaller(id_servicio);
};

const cambiarEstado = async (id_servicio, estado) => {
  return await userMongoModel.updateAssistanceStatus(id_servicio, estado);
};

const calificar = async ({ id_servicio, calificador, estrellas, comentario }) => {
  return await TallerMongoModel.guardarCalificacion({ id_servicio, calificador, estrellas, comentario });
};

const getMisCalificaciones = async (id_user) => {
  return await userModel.getMisCalificaciones(id_user);
};



//neurorona
const getMaintenanceRecommendation = async ({ id_user, id_usercar, current_mileage }) => {
  const autoData = await userModel.getMaintenanceCarData(id_user, id_usercar);

  if (!autoData) {
    throw new Error('No se encontraron datos del auto');
  }

  const startMileage = Number(autoData.start_mileage ?? autoData.mileage_usercar ?? 0);
  const currentMileage = Number(current_mileage || 0);

  if (currentMileage < startMileage) {
    throw new Error('El kilometraje actual no puede ser menor al inicial');
  }

  const diffMileage = currentMileage - startMileage;

  const result = await userModel.runMaintenanceNeuron({
    typeUsercar: autoData.type_usercar,
    brand: autoData.brand_usercar,
    model: autoData.model_usercar,
    year: autoData.year_usercar,
    mileageBase: autoData.mileage_usercar,
    startMileage,
    currentMileage,
    diffMileage,
  });

  return {
    id_usercar: autoData.id_usercar,
    brand_usercar: autoData.brand_usercar,
    model_usercar: autoData.model_usercar,
    year_usercar: autoData.year_usercar,
    type_usercar: autoData.type_usercar,
    mileage_usercar: autoData.mileage_usercar,
    start_mileage: startMileage,
    current_mileage: currentMileage,
    diff_mileage: diffMileage,
    ...result,
  };
};



module.exports = {
  addCar,
  getUserCars,
  getCarById,
  requestAssistance,
  cancelAssistance,
  confirmAssistance,
  getServiceStatus,
  getPosicionTaller,
  cambiarEstado,
  calificar,
  getMisCalificaciones,
  getMaintenanceRecommendation,
};