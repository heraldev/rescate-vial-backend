const TallerModel = require('../models/mysql/tallerModel');
const TallerMongoModel = require('../models/mysql/tallerMongoModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const mailService = require('./mailServices');

const TallerService = {

  // =========================
  // OBTENER SOLICITUDES ADMIN
  // =========================
  async obtenerSolicitudes() {
    return TallerModel.obtenerSolicitudes();
  },

  // =========================
  // CREAR SOLICITUD (WEB)
  // =========================
  async crearSolicitud(data) {
    const payload = {
      nombre: data.nombre,
      horario: data.horario || null,
      telefono: data.telefono || null,
      correo: data.correo,
      servicioDomicilio: data.servicioDomicilio ?? 0,
      fotos: data.fotos || null,
      calle: data.calle || null,
      numInt: data.numInt || null,
      numExt: data.numExt || null,
      cp: data.cp || null,
      colonia: data.colonia || null,
      municipio: data.municipio || null,
      estado: data.estado || null,
    };

    const result = await TallerModel.crearSolicitud(payload);

    await mailService.enviarSolicitudRegistrada({
      correo: payload.correo,
      nombre: payload.nombre
    });

    return result;
  },

  // =========================
  // APROBAR / RECHAZAR
  // =========================
  async actualizarEstatus(id, status, motivoRechazo = null) {

    const estado = status.trim().toLowerCase();
    console.log("STATUS:", estado);

    if (estado === 'aprobado') {

      const result = await TallerModel.aprobarSolicitud(id);
      console.log("RESULT:", result);

      if (!result || !result.correo) {
        throw new Error("No se obtuvo correo del usuario");
      }

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

      console.log("LINK:", linkCrearPassword);

      try {
        await mailService.enviarSolicitudAprobada({
          correo: result.correo,
          nombre: result.nombre,
          linkCrearPassword
        });

        console.log("📩 correo enviado correctamente");
      } catch (err) {
        console.error("❌ error enviando correo:", err);
      }

      return { ok: true };
    }

    if (estado === 'rechazado') {
      const result = await TallerModel.rechazarSolicitud(id, motivoRechazo);

      await mailService.enviarSolicitudRechazada({
        correo: result.correo,
        nombre: result.nombre,
        motivo: motivoRechazo
      });

      return { ok: true };
    }

    return TallerModel.actualizarEstatus(id, estado, motivoRechazo);
  },

  // =========================
  // CREAR PASSWORD DESDE LINK
  // =========================
  async crearPasswordDesdeToken(token, password) {

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_PASSWORD_SETUP_SECRET);
    } catch (err) {
      throw new Error('Token inválido o expirado');
    }

    if (decoded.tipo !== 'crear_password_taller') {
      throw new Error('Token no válido');
    }

    const { idUser } = decoded;

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // guardar en DB (usa tu método real)
    await TallerModel.crearPassword(idUser, hashedPassword);

    return { ok: true };
  },

  // =========================
  // MOVIL - SOLICITUDES CERCANAS
  // =========================


  async obtenerSolicitudesCercanas(id_user) {
    const ubicacion = await TallerModel.obtenerUbicacionTaller(id_user);

    if (!ubicacion) {
      throw new Error('El taller no tiene ubicación registrada');
    }

    const { latitud, longitud } = ubicacion;

    const solicitudesMongo = await TallerMongoModel.obtenerSolicitudesCercanas(
      latitud,
      longitud
    );

    const solicitudesCompletas = [];

    for (const solicitud of solicitudesMongo) {
      const datosClienteAuto = await TallerModel.obtenerDatosClienteYAuto(
        solicitud.id_user,
        solicitud.id_usercar
      );

      solicitudesCompletas.push({
        ...solicitud,
        cliente_nombre: datosClienteAuto?.name_user || 'Usuario',
        cliente_apellido1: datosClienteAuto?.lastname1_user || '',
        cliente_apellido2: datosClienteAuto?.lastname2_user || '',
        brand_usercar: datosClienteAuto?.brand_usercar || '',
        model_usercar: datosClienteAuto?.model_usercar || '',
        year_usercar: datosClienteAuto?.year_usercar || '',
      });
    }

    return {
      solicitudes: solicitudesCompletas,
      ubicacionTaller: ubicacion
    };
  },

  // Agrega estos métodos a tu TallerService existente

  async aceptarSolicitud({ id_servicio, id_taller }) {
    await TallerMongoModel.cambiarEstadoSolicitud({
      id_servicio,
      estado: 'en_proceso',
      extra: { id_taller }, // guarda qué taller la aceptó
    });
  },

  async cancelarSolicitud({ id_servicio }) {
    await TallerMongoModel.cambiarEstadoSolicitud({
      id_servicio,
      estado: 'pendiente',
      extra: { id_taller: null }, // limpia el taller asignado
    });
  },

  async checkSolicitudAceptada(id_taller) {
    return await TallerMongoModel.getSolicitudAceptadaByTaller(id_taller);
  },

  async checkActiveService(id_taller) {
    return await TallerMongoModel.getActiveSolicitudByTaller(id_taller);
  },

  async actualizarPosicionTaller({ id_servicio, lat, lng }) {
    await TallerMongoModel.actualizarPosicionTaller(id_servicio, lat, lng);
  },

  async getPosicionTaller(id_servicio) {
    return await TallerMongoModel.getPosicionTaller(id_servicio);
  },

  async cambiarEstado(id_servicio, estado) {
    await TallerMongoModel.cambiarEstadoSolicitud({ id_servicio, estado });
  },

  async calificar({ id_servicio, calificador, estrellas, comentario }) {
    await TallerMongoModel.guardarCalificacion({ id_servicio, calificador, estrellas, comentario });
  },

  async getMisCalificacionesTaller(id_user) {
  return await TallerModel.getMisCalificacionesTaller(id_user);
},

};

module.exports = TallerService;