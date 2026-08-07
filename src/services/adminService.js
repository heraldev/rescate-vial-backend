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



};

module.exports = AdminService;