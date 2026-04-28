const userService = require('../services/userService');
const db = require('../config/db');
const userMongoModel = require('../models/mysql/userMongoModel.js');

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

    res.status(201).json({ message: 'Vehículo guardado', data: result });
  } catch (error) {
    res.status(500).json({ message: 'Error al guardar el vehículo', error: error.message });
  }
};

const getUserCars = async (req, res) => {
  try {
    const { id_user } = req.body;

    if (!id_user) {
      return res.status(400).json({ message: 'id_user es obligatorio' });
    }

    const cars = await userService.getUserCars(id_user);
    res.status(200).json(cars);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener vehículos', error: error.message });
  }
};

const getCarById = async (req, res) => {
  try {
    const { id_usercar } = req.body;

    if (!id_usercar) {
      return res.status(400).json({ message: 'id_usercar es obligatorio' });
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








//admin
const obtenerConductores = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        u.id_user,
        u.name_user,
        u.lastname1_user,
        u.email_user,
        u.date_register_user,
        u.status_user,
        COUNT(sh.id_history) AS servicios
      FROM Users u
      LEFT JOIN ServiceHistory sh ON u.id_user = sh.id_user
      WHERE u.id_userrol = 3
      GROUP BY u.id_user, u.name_user, u.lastname1_user, u.email_user, u.date_register_user, u.status_user
      ORDER BY u.date_register_user DESC
    `);

    res.json({ ok: true, conductores: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, error: 'Error al obtener conductores' });
  }
};

//panel general
const obtenerDashboard = async (req, res) => {
  try {
    const [solicitudes] = await db.query(`
      SELECT COUNT(*) AS totalSolicitudes
      FROM taller_request
    `);

    const [proveedores] = await db.query(`
      SELECT COUNT(*) AS totalProveedores
      FROM UserTaller
      WHERE status_taller = 1
    `);

    const [conductores] = await db.query(`
      SELECT COUNT(*) AS totalConductores
      FROM Users
      WHERE id_userrol = 3
    `);

    const [servicios] = await db.query(`
      SELECT COUNT(*) AS totalServicios
      FROM ServiceHistory
    `);

    res.json({
      ok: true,
      dashboard: {
        totalSolicitudes: solicitudes[0].totalSolicitudes || 0,
        totalProveedores: proveedores[0].totalProveedores || 0,
        totalConductores: conductores[0].totalConductores || 0,
        totalServicios: servicios[0].totalServicios || 0
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      error: 'Error al obtener dashboard'
    });
  }
};

//PAGOS
const obtenerPagos = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        sh.id_history,
        sh.issue_type,
        sh.fecha_solicitud,
        sh.service_status,
        sh.cost_service,
        u.name_user,
        u.lastname1_user,
        ut.name_usertaller
      FROM ServiceHistory sh
      LEFT JOIN Users u ON sh.id_user = u.id_user
      LEFT JOIN UserTaller ut ON sh.id_usertaller = ut.id_usertaller
      ORDER BY sh.fecha_solicitud DESC, sh.id_history DESC
    `);

    res.json({ ok: true, pagos: rows });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      error: "Error al obtener pagos"
    });
  }
};

//REPORTES
const obtenerReportes = async (req, res) => {
  try {
    const [solicitudes] = await db.query(`
      SELECT COUNT(*) AS totalSolicitudes
      FROM taller_request
    `);

    const [aprobadas] = await db.query(`
      SELECT COUNT(*) AS totalAprobadas
      FROM taller_request
      WHERE status_tr = 'aprobado'
    `);

    const [servicios] = await db.query(`
      SELECT
        issue_type,
        COUNT(*) AS total
      FROM ServiceHistory
      GROUP BY issue_type
      ORDER BY total DESC
    `);

    const [proveedores] = await db.query(`
      SELECT
        ut.name_usertaller,
        COUNT(sh.id_history) AS totalServicios
      FROM UserTaller ut
      LEFT JOIN ServiceHistory sh ON ut.id_usertaller = sh.id_usertaller
      GROUP BY ut.id_usertaller, ut.name_usertaller
      ORDER BY totalServicios DESC
      LIMIT 5
    `);

    res.json({
      ok: true,
      reportes: {
        totalSolicitudes: solicitudes[0].totalSolicitudes || 0,
        totalAprobadas: aprobadas[0].totalAprobadas || 0,
        servicios: servicios || [],
        proveedores: proveedores || []
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      error: "Error al obtener reportes"
    });
  }
};

//simular ubicacion
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



module.exports = {
  addCar,
  getUserCars,
  getCarById,
  requestAssistance,
  cancelAssistance,
  confirmAssistance,
  getServiceStatus,
  obtenerConductores,
  obtenerDashboard,
  obtenerPagos,
  obtenerReportes,
  getPosicion,
  confirmarLlegada,
  confirmarTrabajo,
  calificar,
  getMisCalificaciones,
  getMaintenanceRecommendation
};
