const userModel = require('../models/mysql/userModel');
const userMongoModel = require('../models/mysql/userMongoModel.js');
const TallerMongoModel = require('../models/mysql/tallerMongoModel');
const { fetchPartMetadataFromAI } = require('./aiServices');
const { calculatePartHealth } = require('../utils/healthCalculator');

// U1
const addCar = async (carData) => {
  return await userModel.insertUserCar(carData);
};

// U2
const getUserCars = async (id_user) => {
  return await userModel.getUserCarsByUser(id_user);
};

// U3
const getCarById = async (id_usercar) => {
  return await userModel.getCarById(id_usercar);
};

// U4
const requestAssistance = async (data) => {
  return await userMongoModel.createAssistanceRequest(data);
};

// U5
const cancelAssistance = async (id_servicio) => {
  return await userMongoModel.updateAssistanceStatus(id_servicio, 'cancelada');
};

// U6
const confirmAssistance = async (id_servicio, accion) => {
  return await userMongoModel.updateAssistanceStatus(id_servicio, accion);
};

// U7
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



// U8
const cambiarEstado = async (id_servicio, estado) => {
  return await userMongoModel.updateAssistanceStatus(id_servicio, estado);
};

// U9
const calificar = async ({ id_servicio, calificador, estrellas, comentario }) => {
  return await TallerMongoModel.guardarCalificacion({ id_servicio, calificador, estrellas, comentario });
};

// U10
const getMisCalificaciones = async (id_user) => {
  return await userModel.getMisCalificaciones(id_user);
};


//-------------------BITACORA-----------------------

const addMileageLog = async ({ id_usercar, new_mileage }) => {
  if (!id_usercar || new_mileage === undefined || new_mileage === null) {
    throw new Error('El ID del vehículo y el nuevo kilometraje son requeridos.');
  }

  const parsedMileage = parseInt(new_mileage, 10);
  if (isNaN(parsedMileage) || parsedMileage < 0) {
    throw new Error('El kilometraje debe ser un número entero positivo.');
  }

  // 1. Obtener el auto y su último kilometraje
  const car = await userModel.getCarById(id_usercar);
  if (!car) {
    throw new Error('Vehículo no encontrado.');
  }

  const previousMileage = car.current_mileage;

  // 2. Validar que el kilometraje no retroceda
  if (parsedMileage < previousMileage) {
    throw new Error(
      `El kilometraje ingresado (${parsedMileage} km) no puede ser menor al anterior (${previousMileage} km).`
    );
  }

  // 3. Calcular la diferencia
  const diff_mileage = parsedMileage - previousMileage;

  // 4. Guardar en MileageLog
  const result = await userModel.addMileageLog({
    id_usercar,
    start_mileage: previousMileage,
    value_mileage: parsedMileage,
    diff_mileage,
  });

  return {
    id_mileages: result.insertId,
    id_usercar,
    start_mileage: previousMileage,
    value_mileage: parsedMileage,
    diff_mileage,
  };
};

const getTiposServicio = async () => {
  return await userModel.getTiposServicio();
};

const crearRegistro = async (data) => {
  // Validaciones básicas de negocio antes de insertar
  if (!data.id_user || !data.id_usercar || !data.id_tipo_servicio) {
    throw new Error('Faltan identificadores clave (usuario, auto o servicio)');
  }

  if (!data.descripcion || !data.kilometraje || !data.fecha_servicio) {
    throw new Error('Los campos descripción, kilometraje y fecha son obligatorios');
  }

  const result = await userModel.crearRegistro(data);
  return {
    id_bitacora: result.insertId,
    ...data,
  };
};

const obtenerRegistrosServicio = async (id_usercar, id_tipo_servicio) => {
  if (!id_usercar || !id_tipo_servicio) {
    throw new Error('Se requiere el ID del auto y del tipo de servicio.');
  }

  const registros = await userModel.obtenerBitacoraPorAutoYServicio(
    id_usercar,
    id_tipo_servicio
  );

  return registros;
};

// U11
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



//U13
const getVehiclePartsHealth = async (id_usercar) => {
  // 1. Obtener la información del auto y su kilometraje actual
  const car = await userModel.getCarById(id_usercar);
  if (!car) throw new Error('Vehículo no encontrado');

  const currentMileage = car.current_mileage;

  // 2. Obtener los servicios/piezas registrados en la bitácora del usuario
  const bitacoraEntries = await userModel.getLatestBitacoraPerPart(id_usercar);

  const partsHealthSummary = [];

  // 3. Procesar cada pieza registrada en la bitácora
  for (const entry of bitacoraEntries) {
    const partName = entry.pieza_cambiada || entry.nombre_servicio;
    
    // a. Buscar en catálogo si existen los parámetros de esta pieza
    let catalogItem = await userModel.getCatalogPart(car.brand_usercar, car.model_usercar, partName);

    // b. Si NO existe en el catálogo, llamamos a la IA y la guardamos
    if (!catalogItem) {
      const aiData = await fetchPartMetadataFromAI(
        car.brand_usercar,
        car.model_usercar,
        car.year_usercar,
        partName
      );

      const newPartId = await userModel.saveCatalogPart({
        id_tipo_servicio: entry.id_tipo_servicio,
        brand_car: car.brand_usercar,
        model_car: car.model_usercar,
        name_part: partName,
        lifespan_km: aiData.lifespan_km,
        fatigue_k: aiData.fatigue_k
      });

      catalogItem = {
        id_part: newPartId,
        lifespan_km: aiData.lifespan_km,
        fatigue_k: aiData.fatigue_k
      };
    }

    // c. Calcular salud con el motor matemático
    const healthData = calculatePartHealth(
      currentMileage,
      entry.kilometraje, // km en el que se le hizo el servicio
      catalogItem.lifespan_km,
      catalogItem.fatigue_k
    );

    partsHealthSummary.push({
      id_bitacora: entry.id_bitacora,
      part_name: partName,
      service_type: entry.nombre_servicio,
      last_change_km: entry.kilometraje,
      last_change_date: entry.fecha_servicio,
      lifespan_km: catalogItem.lifespan_km,
      fatigue_k: catalogItem.fatigue_k,
      ...healthData // agrega kmTraveled, healthPercentage, kmRemaining, status
    });
  }

  return {
    car_info: {
      id_usercar: car.id_usercar,
      brand: car.brand_usercar,
      model: car.model_usercar,
      current_mileage: currentMileage
    },
    parts: partsHealthSummary
  };
};




//--------FIN BITACORA----------------


// U12
const getPosicionTaller = async (id_servicio) => {
  return await userMongoModel.getPosicionTaller(id_servicio);
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
  addMileageLog,
  getTiposServicio,
  crearRegistro,
  obtenerRegistrosServicio,
  getVehiclePartsHealth,
};