const configService = require('../services/configService');

const obtenerConfiguracion = async (req, res) => {
  try {
    const config = await configService.obtenerConfiguracion();

    res.status(200).json({
      ok: true,
      config
    });
  } catch (error) {
    console.error('Error al obtener configuración:', error);
    res.status(500).json({
      ok: false,
      error: 'Error al obtener configuración'
    });
  }
};

const guardarConfiguracion = async (req, res) => {
  try {
    const configActualizada = await configService.guardarConfiguracion(req.body);

    res.status(200).json({
      ok: true,
      mensaje: 'Configuración guardada correctamente',
      config: configActualizada
    });
  } catch (error) {
    console.error('Error al guardar configuración:', error);
    res.status(500).json({
      ok: false,
      error: 'Error al guardar configuración'
    });
  }
};

module.exports = {
  obtenerConfiguracion,
  guardarConfiguracion
};