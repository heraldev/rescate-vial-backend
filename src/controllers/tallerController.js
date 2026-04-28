const TallerService = require('../services/tallerService');

const TallerController = {
  async crearSolicitud(req, res) {
    try {
      const result = await TallerService.crearSolicitud({
        nombre: req.body.name_tr,
        horario: req.body.schudel_tr || null,
        telefono: req.body.phone_tr || null,
        correo: req.body.email_tr,
        servicioDomicilio: req.body.onsiteservice_tr ?? 0,
        fotos: req.body.photos_tr || null,
        calle: req.body.calle_tra || null,
        numInt: req.body.numint_tra || null,
        numExt: req.body.numext_tra || null,
        cp: req.body.cp_tra || null,
        colonia: req.body.colonia_tra || null,
        municipio: req.body.municipio_tra || null,
        estado: req.body.estado_tra || null
      });

      res.status(201).json({
        ok: true,
        mensaje: 'Solicitud enviada correctamente',
        id_tr: result.id_tr
      });
    } catch (error) {
      console.error('Error al crear solicitud:', error);
      res.status(500).json({
        ok: false,
        mensaje: error.message || 'Error al crear solicitud'
      });
    }
  },

  async obtenerSolicitudes(req, res) {
    try {
      const solicitudes = await TallerService.obtenerSolicitudes();
      res.json({ ok: true, solicitudes });
    } catch (error) {
      console.error('Error al obtener solicitudes:', error);
      res.status(500).json({ ok: false, mensaje: 'Error al obtener solicitudes' });
    }
  },

  async actualizarEstatus(req, res) {
    try {
      const { id } = req.params;
      const { status_tr, motivo_rechazo_tr } = req.body;

      if (!status_tr) {
        return res.status(400).json({ ok: false, mensaje: 'El estado es obligatorio' });
      }

      await TallerService.actualizarEstatus(id, status_tr, motivo_rechazo_tr);

      res.json({
        ok: true,
        mensaje: 'Estado actualizado correctamente'
      });
    } catch (error) {
      console.error('Error al actualizar solicitud:', error);
      res.status(500).json({
        ok: false,
        mensaje: error.message || 'Error al actualizar solicitud'
      });
    }
  },

  async crearPasswordDesdeCorreo(req, res) {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({
          ok: false,
          mensaje: 'Token y contraseña son obligatorios'
        });
      }

      await TallerService.crearPasswordDesdeToken(token, password);

      res.json({
        ok: true,
        mensaje: 'Contraseña creada correctamente'
      });
    } catch (error) {
      console.error('Error al crear contraseña:', error);
      res.status(400).json({
        ok: false,
        mensaje: error.message || 'No se pudo crear la contraseña'
      });
    }
  },

  //funcion para movil taller
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

  // Agrega estos métodos a tu TallerController existente

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

  //simulaicon de ubicacion
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
  //simulacion
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