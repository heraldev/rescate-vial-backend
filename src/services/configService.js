const db = require('../config/db');

const obtenerConfiguracion = async () => {
  const [rows] = await db.query(`
    SELECT
      id,
      precio_neumatico_min,
      precio_neumatico_max,
      precio_grua_min,
      precio_grua_max,
      precio_bateria_min,
      precio_bateria_max,
      precio_gasolina_min,
      precio_gasolina_max,
      comision_plataforma,
      radio_cobertura,
      servicio_nocturno
    FROM Configuracion
    WHERE id = 1
    LIMIT 1
  `);

  if (rows.length === 0) {
    throw new Error('No existe el registro de configuración con id = 1');
  }

  return rows[0];
};

const guardarConfiguracion = async (data) => {
  await db.query(`
    UPDATE Configuracion
    SET
      precio_neumatico_min = ?,
      precio_neumatico_max = ?,
      precio_grua_min = ?,
      precio_grua_max = ?,
      precio_bateria_min = ?,
      precio_bateria_max = ?,
      precio_gasolina_min = ?,
      precio_gasolina_max = ?,
      comision_plataforma = ?,
      radio_cobertura = ?,
      servicio_nocturno = ?
    WHERE id = 1
  `, [
    Number(data.precio_neumatico_min),
    Number(data.precio_neumatico_max),
    Number(data.precio_grua_min),
    Number(data.precio_grua_max),
    Number(data.precio_bateria_min),
    Number(data.precio_bateria_max),
    Number(data.precio_gasolina_min),
    Number(data.precio_gasolina_max),
    Number(data.comision_plataforma),
    Number(data.radio_cobertura),
    Number(data.servicio_nocturno) === 1 ? 1 : 0
  ]);

  return await obtenerConfiguracion();
};

module.exports = {
  obtenerConfiguracion,
  guardarConfiguracion
};