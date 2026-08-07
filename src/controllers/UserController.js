const userService = require('../services/userService');

//  U1. Agregar un auto
const addCar = async (req, res) => {
  try {
    const {
      id_user,
      type_usercar,
      brand_usercar,
      model_usercar,
      year_usercar,
      mileage_usercar,
      colour_usercar,
    } = req.body;

    if (!id_user || !type_usercar || !brand_usercar || !model_usercar || !year_usercar || !mileage_usercar) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    const result = await userService.addCar({
      id_user,
      type_usercar,
      brand_usercar,
      model_usercar,
      year_usercar,
      mileage_usercar,
      colour_usercar: colour_usercar ?? null,
    });

    res.status(201).json({ message: 'Vehículo agregado', data: result });
  } catch (error) {
    res.status(500).json({ message: 'Error al agregar vehículo', error: error.message });
  }
};

// U2. Obtener autos del usuario para el dropdown
const getUserCars = async (req, res) => {
  try {
    const { id_user } = req.body;

    if (!id_user) {
      return res.status(400).json({ message: 'el id user es obligatorio' });
    }

    const cars = await userService.getUserCars(id_user);
    res.status(200).json(cars);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener vehículos', error: error.message });
  }
};

// U3. Obtener datos de los autos del usuario para la vista completa de sus autos
const getCarById = async (req, res) => {
  try {
    const { id_usercar } = req.body;

    if (!id_usercar) {
      return res.status(400).json({ message: 'el id usercar es obligatorio' });
    }

    const car = await userService.getCarById(id_usercar);

    if (!car) {
      return res.status(404).json({ message: 'Vehículo no encontrado' });
    }

    res.status(200).json(car);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el vehículo', error: error.message });
  }
};

// U4. Usuario hace una peticion de asistencia
const requestAssistance = async (req, res) => {
  try {
    const { id_user, id_usercar, issue_type, description, ubicacion } = req.body;

    if (!id_user || !issue_type || !ubicacion?.lat || !ubicacion?.lng) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    const result = await userService.requestAssistance({
      id_user,
      id_usercar: id_usercar ?? null,
      issue_type,
      description: description ?? '',
      ubicacion,
    });

    res.status(201).json({ message: 'Solicitud creada', id_servicio: result.insertedId });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear solicitud', error: error.message });
  }
};

// U5. Cancelar la solicitud antes de que un taller la acepte
const cancelAssistance = async (req, res) => {
  try {
    const { id_servicio } = req.body;

    if (!id_servicio) {
      return res.status(400).json({ message: 'id_servicio requerido' });
    }

    await userService.cancelAssistance(id_servicio);
    res.status(200).json({ message: 'Solicitud cancelada' });
  } catch (error) {
    res.status(500).json({ message: 'Error al cancelar', error: error.message });
  }
};

// U6. El usuario confirma que el taller le asista
const confirmAssistance = async (req, res) => {
  try {
    const { id_servicio, accion } = req.body;

    if (!id_servicio || !accion) {
      return res.status(400).json({ message: 'id_servicio y accion son requeridos' });
    }

    if (!['aceptada', 'pendiente'].includes(accion)) {
      return res.status(400).json({ message: 'Acción inválida. Use: aceptada | pendiente' });
    }

    await userService.confirmAssistance(id_servicio, accion);
    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: 'Error al confirmar', error: error.message });
  }
};

// U7. Estado de la peticion de asistencia 'en_proceso', 'aceptada', 'en_ruta', 'taller_llego', 'trabajo_en_proceso', 'trabajo_terminado', 'completada'
const getServiceStatus = async (req, res) => {
  try {
    const { id_user } = req.params;

    if (!id_user) {
      return res.status(400).json({ message: 'id_user requerido' });
    }

    const data = await userService.getServiceStatus(id_user);

    if (!data) {
      return res.status(404).json({ message: 'Sin solicitud activa' });
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener estado', error: error.message });
  }
};

// U8. El usuario confirma que el taller llego
const confirmarLlegada = async (req, res) => {
  try {
    const { id_servicio } = req.body;
    if (!id_servicio) return res.status(400).json({ message: 'id_servicio requerido' });
    await userService.cambiarEstado(id_servicio, 'trabajo_en_proceso');
    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// U8. EL usuario confirmar que el taller ha terminado el trabajo
const confirmarTrabajo = async (req, res) => {
  try {
    const { id_servicio } = req.body;
    if (!id_servicio) return res.status(400).json({ message: 'id_servicio requerido' });
    await userService.cambiarEstado(id_servicio, 'completada');
    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// U9. El usuario califica al taller
const calificar = async (req, res) => {
  try {
    const { id_servicio, estrellas, comentario } = req.body;
    if (!id_servicio || !estrellas) return res.status(400).json({ message: 'Faltan datos' });
    await userService.calificar({ id_servicio, calificador: 'cliente', estrellas, comentario });
    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// U10. Obtiene sus calificaciones
const getMisCalificaciones = async (req, res) => {
  try {
    const { id_user } = req.params;

    if (!id_user) {
      return res.status(400).json({ message: 'id_user requerido' });
    }

    const data = await userService.getMisCalificaciones(id_user);

    res.status(200).json({
      ok: true,
      total: data.length,
      calificaciones: data,
    });
  } catch (error) {
    console.error('❌ Error en getMisCalificaciones:', error);
    res.status(500).json({
      ok: false,
      message: 'Error al obtener calificaciones',
      error: error.message,
    });
  }
};


// FUNCIONES PARA LA BITACORA
const updateMileage = async (req, res) => {
  try {
    const { id_usercar, new_mileage } = req.body;

    const updatedLog = await userService.addMileageLog({
      id_usercar,
      new_mileage,
    });

    res.status(200).json({
      ok: true,
      message: 'Kilometraje actualizado correctamente',
      data: updatedLog,
    });
  } catch (error) {
    console.error('❌ Error en updateMileage:', error);
    res.status(400).json({
      ok: false,
      message: error.message || 'Error al actualizar el kilometraje',
    });
  }
};

const getTiposServicio = async (req, res) => {
  try {
    const tipos = await userService.getTiposServicio();

    res.status(200).json(tipos);
  } catch (error) {
    console.error('❌ Error en getTiposServicio:', error);
    res.status(500).json({
      ok: false,
      message: 'Error al obtener los tipos de servicio',
      error: error.message,
    });
  }
};

const crearBitacora = async (req, res) => {
  try {
    const data = req.body;

    const nuevoRegistro = await userService.crearRegistro(data);

    res.status(201).json({
      ok: true,
      message: 'Registro guardado exitosamente en la bitácora',
      data: nuevoRegistro,
    });
  } catch (error) {
    console.error('❌ Error en crearBitacora:', error);
    res.status(500).json({
      ok: false,
      message: error.message || 'Error al guardar el registro en la bitácora',
    });
  }
};

const getBitacoraByServicio = async (req, res) => {
  try {
    const { id_usercar, id_tipo_servicio } = req.body; // O req.query si prefieres GET

    const registros = await userService.obtenerRegistrosServicio(
      id_usercar,
      id_tipo_servicio
    );

    res.status(200).json({
      ok: true,
      data: registros,
    });
  } catch (error) {
    console.error('❌ Error en getBitacoraByServicio:', error);
    res.status(500).json({
      ok: false,
      message: error.message || 'Error al obtener los registros de la bitácora',
    });
  }
};






// U11. kilometraje para la neurona
const getMaintenanceRecommendation = async (req, res) => {
  try {
    const { id_user, id_usercar, current_mileage } = req.body;

    if (!id_user || !id_usercar || current_mileage == null) {
      return res.status(400).json({
        ok: false,
        message: 'id_user, id_usercar y current_mileage son requeridos'
      });
    }

    const data = await userService.getMaintenanceRecommendation({
      id_user,
      id_usercar,
      current_mileage,
    });

    res.status(200).json({
      ok: true,
      recommendation: data,
    });
  } catch (error) {
    console.error('❌ Error en getMaintenanceRecommendation:', error);
    res.status(500).json({
      ok: false,
      message: 'Error al obtener recomendación de mantenimiento',
      error: error.message,
    });
  }
};

// U12. Simulación de ubicación
const getPosicion = async (req, res) => {
  try {
    const { id_servicio } = req.params;
    const coords = await userService.getPosicionTaller(id_servicio); // ← via service
    if (!coords) return res.status(404).json({ message: 'Sin posición' });
    res.status(200).json({ lat: coords[1], lng: coords[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


module.exports = {
  addCar,
  getUserCars,
  getCarById,
  requestAssistance,
  cancelAssistance,
  confirmAssistance,
  getServiceStatus,
  getPosicion,
  confirmarLlegada,
  confirmarTrabajo,
  calificar,
  getMisCalificaciones,
  getMaintenanceRecommendation,
  updateMileage,
  getTiposServicio,
  crearBitacora,
  getBitacoraByServicio,
};
