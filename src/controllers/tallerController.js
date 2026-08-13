const TallerService = require('../services/tallerService');

const TallerController = {

  // T1 obtener solciitudes cercanas al taller
  async requestAyuda(req, res) {
    try {
      const { id_user } = req.body;

      if (!id_user) {
        return res.status(400).json({
          msg: 'id_user es requerido'
        });
      }

      const data = await TallerService.obtenerSolicitudesCercanas(id_user);

      res.status(200).json({
        ok: true,
        total: data.solicitudes.length,
        solicitudes: data.solicitudes,
        taller: data.ubicacionTaller
      });
    } catch (error) {
      console.error("❌ Error en requestAyuda:", error);
      res.status(500).json({
        ok: false,
        msg: error.message
      });
    }
  },

  // T2 Taller acepta solicitud
  async aceptarSolicitud(req, res) {
    try {
      const { id_servicio, id_taller } = req.body;

      if (!id_servicio || !id_taller) {
        return res.status(400).json({ message: 'id_servicio e id_taller son requeridos' });
      }

      await TallerService.aceptarSolicitud({ id_servicio, id_taller });

      res.status(200).json({ message: 'Solicitud aceptada', id_servicio });
    } catch (error) {
      console.error('❌ Error en aceptarSolicitud:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // T3 Taller cancela solicitud
  async cancelarSolicitud(req, res) {
    try {
      const { id_servicio } = req.body;

      if (!id_servicio) {
        return res.status(400).json({ message: 'id_servicio es requerido' });
      }

      await TallerService.cancelarSolicitud({ id_servicio });

      res.status(200).json({ message: 'Solicitud regresada a pendiente', id_servicio });
    } catch (error) {
      console.error('❌ Error en cancelarSolicitud:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // T4 Verificar si el taller tiene una solicitud aceptada
  async checkSolicitudAceptada(req, res) {
    try {
      const { id_taller } = req.params;
      const solicitud = await TallerService.checkSolicitudAceptada(id_taller);

      if (!solicitud) {
        return res.status(200).json({ aceptada: false });
      }

      return res.status(200).json({
        aceptada: true,
        id_servicio: solicitud._id.toString(),
        estado: solicitud.estado,
        ubicacion_cliente: solicitud.ubicacion,
      });
    } catch (error) {
      console.error('❌ Error en checkSolicitudAceptada:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // T5 Verificar servicio activo
  async checkActiveTallerService(req, res) {
    try {
      const { id_taller } = req.params;

      const solicitud = await TallerService.checkActiveService(id_taller);

      if (!solicitud) {
        return res.status(404).json({ message: 'Sin servicio activo' });
      }

      res.status(200).json({
        id_servicio: solicitud._id.toString(),
        estado: solicitud.estado,
        ubicacion_cliente: solicitud.ubicacion,
      });
    } catch (error) {
      res.status(500).json({ message: 'Error', error: error.message });
    }
  },

  // TT1 simulaicon de ubicacion
  async actualizarPosicion(req, res) {
    try {
      const { id_servicio, lat, lng } = req.body;
      if (!id_servicio || lat == null || lng == null)
        return res.status(400).json({ message: 'Faltan datos' });

      await TallerService.actualizarPosicionTaller({ id_servicio, lat, lng });
      res.status(200).json({ ok: true });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  // TT1 simulacion
  async getPosicion(req, res) {
    try {
      const { id_servicio } = req.params;
      const coords = await TallerService.getPosicionTaller(id_servicio);
      if (!coords) return res.status(404).json({ message: 'Sin posición' });
      res.status(200).json({ lat: coords[1], lng: coords[0] });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  //T6 taller inicia ruta a el usuario
  async iniciarRuta(req, res) {
    try {
      const { id_servicio } = req.body;

      if (!id_servicio) {
        return res.status(400).json({ message: 'id_servicio requerido' });
      }

      await TallerService.cambiarEstado(id_servicio, 'en_ruta');

      res.status(200).json({
        ok: true,
        message: 'Ruta iniciada',
        estado: 'en_ruta',
      });
    } catch (error) {
      console.error('❌ Error en iniciarRuta:', error);
      res.status(500).json({ message: error.message });
    }
  },

  // T7 Taller llega al usuario
  async tallerLlego(req, res) {
    try {
      const { id_servicio } = req.body;
      if (!id_servicio) return res.status(400).json({ message: 'id_servicio requerido' });
      await TallerService.cambiarEstado(id_servicio, 'taller_llego');
      res.status(200).json({ ok: true });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // T8 Taller termina el trabajo
  async trabajoTerminado(req, res) {
    try {
      const { id_servicio } = req.body;
      if (!id_servicio) return res.status(400).json({ message: 'id_servicio requerido' });
      await TallerService.cambiarEstado(id_servicio, 'trabajo_terminado');
      res.status(200).json({ ok: true });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // T9 Taller califica al usuario
  async calificar(req, res) {
    try {
      const { id_servicio, estrellas, comentario } = req.body;
      if (!id_servicio || !estrellas) return res.status(400).json({ message: 'Faltan datos' });
      await TallerService.calificar({ id_servicio, calificador: 'taller', estrellas, comentario });
      res.status(200).json({ ok: true });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // T10 Lista las calficaciones que el taller ha recibido de los usuarios
  async getMisCalificacionesTaller(req, res) {
    try {
      const { id_user } = req.params;

      if (!id_user) {
        return res.status(400).json({ message: 'id_user requerido' });
      }

      const data = await TallerService.getMisCalificacionesTaller(id_user);

      res.status(200).json({
        ok: true,
        total: data.length,
        calificaciones: data,
      });
    } catch (error) {
      console.error('❌ Error en getMisCalificacionesTaller:', error);
      res.status(500).json({
        ok: false,
        message: 'Error al obtener actividad del taller',
        error: error.message,
      });
    }
  },


};

module.exports = TallerController;