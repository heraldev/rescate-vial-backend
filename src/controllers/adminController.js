const AdminService = require('../services/adminService');

const AdminController = {

  //listar las solicutudes de los talleres
  async obtenerSolicitudes(req, res) {
    try {
      const solicitudes = await AdminService.obtenerSolicitudes();
      res.json({ ok: true, solicitudes });
    } catch (error) {
      console.error('Error al obtener solicitudes:', error);
      res.status(500).json({ ok: false, mensaje: 'Error al obtener solicitudes' });
    }
  },

  //se actuliza el status y el taller podra trabajar
  async actualizarEstatus(req, res) {
    try {
      const { id } = req.params;
      const { status_tr, motivo_rechazo_tr } = req.body;

      if (!status_tr) {
        return res.status(400).json({ ok: false, mensaje: 'El estado es obligatorio' });
      }

      await AdminService.actualizarEstatus(id, status_tr, motivo_rechazo_tr);

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


  //------------Conductores/Users---------------------

  // GET /api/admin/conductores-stats
  async obtenerConductoresStats(req, res) {
    try {
      const data = await AdminService.obtenerDashboardConductores();
      res.json({
        ok: true,
        data
      });
    } catch (error) {
      console.error('Error al obtener estadísticas de conductores:', error);
      res.status(500).json({
        ok: false,
        mensaje: 'Error al obtener métricas de conductores'
      });
    }
  },

  async obtenerSolicitudesStats(req, res) {
    try {
      const data = await AdminService.obtenerDashboardSolicitudes();
      res.json({ ok: true, data });
    } catch (error) {
      console.error('Error al obtener solicitudes:', error);
      res.status(500).json({ ok: false, mensaje: 'Error al obtener solicitudes' });
    }
  },




};

module.exports = AdminController;