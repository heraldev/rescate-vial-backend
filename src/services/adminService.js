const AdminModel = require('../models/mysql/adminModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const mailService = require('./mailServices');

const AdminService = {

  // OBTENER SOLICITUDES ADMIN
  async obtenerSolicitudes() {
    return AdminModel.obtenerSolicitudes();
  },

  // APROBAR / RECHAZAR
  async actualizarEstatus(id, status, motivoRechazo = null) {
    const estado = status.trim().toLowerCase();

    if (estado === 'aprobado') {
      const result = await AdminModel.aprobarSolicitud(id);

      if (!result || !result.correo) {
        throw new Error("No se obtuvo correo del usuario");
      }

      // Generación del token usando el correo_tr real del taller
      const token = jwt.sign(
        {
          idUser: result.idUser,
          correo: result.correo,
          tipo: 'crear_password_taller'
        },
        process.env.JWT_PASSWORD_SETUP_SECRET,
        { expiresIn: '1d' }
      );

      const linkCrearPassword = `${process.env.FRONTEND_URL}/crear-password-taller?token=${token}`;

      try {
        await mailService.enviarSolicitudAprobada({
          correo: result.correo,
          nombre: result.nombre, // Nombre del propietario
          linkCrearPassword
        });
      } catch (err) {
        console.error("❌ Error enviando correo:", err);
      }

      return { ok: true };
    }

    if (estado === 'rechazado') {
      const result = await AdminModel.rechazarSolicitud(id, motivoRechazo);

      try {
        await mailService.enviarSolicitudRechazada({
          correo: result.correo,
          nombre: result.nombre,
          motivo: motivoRechazo
        });
      } catch (err) {
        console.error("❌ Error enviando correo:", err);
      }

      return { ok: true };
    }

    // Para cualquier otro estado ('pendiente', 'suspendido', etc.)
    return AdminModel.actualizarEstatus(id, estado, motivoRechazo);
  },


  //------------Conductores/Users---------------------

  // Obtener estadísticas y lista detallada de conductores
  async obtenerDashboardConductores() {
    const metricas = await AdminModel.obtenerMetricasConductores();
    const listaUsuarios = await AdminModel.obtenerTablaConductores();

    return {
      stats: {
        totalRegistrados: metricas.total_registrados || 0,
        activosEsteMes: metricas.activos_este_mes || 0,
        bloqueados: metricas.bloqueados || 0
      },
      usuarios: listaUsuarios
    };
  },


  //------------Solicitudes---------------------

  async obtenerDashboardSolicitudes() {
    const stats = await AdminModel.obtenerMetricasSolicitudes();
    const rawSolicitudes = await AdminModel.obtenerTablaSolicitudes();

    const estadosProgreso = [
      'pendiente', 'en_proceso', 'aceptada', 'en_ruta',
      'taller_llego', 'trabajo_en_proceso', 'trabajo_terminado'
    ];

    const solicitudes = rawSolicitudes.map((s) => {
      // Normalización del estado para los filtros de la interfaz
      let estadoUI = 'En progreso';
      if (s.estado === 'pendiente') estadoUI = 'Nuevas';
      else if (estadosProgreso.includes(s.estado)) estadoUI = 'En progreso';
      else if (s.estado === 'completada' || s.estado === 'calificada') estadoUI = 'Completadas';
      else if (s.estado === 'cancelada') estadoUI = 'Canceladas';

      // Tomamos los últimos 4 o 6 caracteres del ObjectId de Mongo como Folio
      const folio = `#${s._id.toString().substring(18, 24).toUpperCase()}`;

      return {
        id: s._id,
        folio: folio,
        usuario: s.nombre_cliente,
        servicio: s.issue_type || 'Asistencia Vial',
        proveedor: s.nombre_taller,
        estado: estadoUI,
        fecha: s.fecha_solicitud
      };
    });

    return {
      stats,
      solicitudes
    };
  },






};

module.exports = AdminService;