const TallerModel = require('../models/mysql/tallerModel');
const TallerMongoModel = require('../models/mysql/tallerMongoModel');

const TallerService = {

  // T1 obtener solciitudes cercanas al taller
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

  // T2 Taller acepta solicitud
  async aceptarSolicitud({ id_servicio, id_taller }) {
    await TallerMongoModel.cambiarEstadoSolicitud({
      id_servicio,
      estado: 'en_proceso',
      extra: { id_taller }, // guarda qué taller la aceptó
    });
  },

  // T3 Taller cancela solicitud
  async cancelarSolicitud({ id_servicio }) {
    await TallerMongoModel.cambiarEstadoSolicitud({
      id_servicio,
      estado: 'pendiente',
      extra: { id_taller: null }, // limpia el taller asignado
    });
  },

  // T4 Verificar si el taller tiene una solicitud aceptada
  async checkSolicitudAceptada(id_taller) {
    return await TallerMongoModel.getSolicitudAceptadaByTaller(id_taller);
  },

  // T5 Verificar servicio activo
  async checkActiveService(id_taller) {
    return await TallerMongoModel.getActiveSolicitudByTaller(id_taller);
  },

  // TT1
  async actualizarPosicionTaller({ id_servicio, lat, lng }) {
    await TallerMongoModel.actualizarPosicionTaller(id_servicio, lat, lng);
  },
  // TT1
  async getPosicionTaller(id_servicio) {
    return await TallerMongoModel.getPosicionTaller(id_servicio);
  },

  // T6/T7/T8 Taller inicia ruta a el usuario
  async cambiarEstado(id_servicio, estado) {
    await TallerMongoModel.cambiarEstadoSolicitud({ id_servicio, estado });
  },

  //T9 Taller califica al usuario
  async calificar({ id_servicio, calificador, estrellas, comentario }) {
    await TallerMongoModel.guardarCalificacion({ id_servicio, calificador, estrellas, comentario });
  },

  // T10 Lista las calficaciones que el taller ha recibido de los usuarios
  async getMisCalificacionesTaller(id_user) {
  return await TallerModel.getMisCalificacionesTaller(id_user);
},

};

module.exports = TallerService;