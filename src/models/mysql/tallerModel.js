const pool = require('../../config/db');

const TallerModel = {

  // T1
  async obtenerDatosClienteYAuto(id_user, id_usercar) {
    const [rows] = await pool.query(`
    SELECT 
      u.name_user,
      u.lastname1_user,
      u.lastname2_user,
      uc.brand_usercar,
      uc.model_usercar,
      uc.year_usercar
    FROM Users u
    LEFT JOIN UsersCars uc
      ON u.id_user = uc.id_user
      AND uc.id_usercar = ?
    WHERE u.id_user = ?
    LIMIT 1
  `, [id_usercar, id_user]);

    if (rows.length === 0) return null;

    return rows[0];
  },


  //funcion movil
  async obtenerUbicacionTaller(id_user) {
    const [rows] = await pool.query(`
      SELECT uta.latitud, uta.longitud
      FROM UserTaller ut
      INNER JOIN UserTallerAddress uta 
        ON ut.id_usertaller = uta.id_usertaller
      WHERE ut.id_user = ?
      LIMIT 1
    `, [id_user]);

    if (rows.length === 0) return null;

    return rows[0];
  },

  // T10 Lista las calficaciones que el taller ha recibido de los usuarios
  async getMisCalificacionesTaller(id_user) {
  const [rows] = await pool.query(`
    SELECT
      sh.id_history,
      sh.id_service,
      sh.issue_type,
      sh.description_service,
      sh.fecha_solicitud,
      sh.service_status,

      u.id_user,
      u.name_user,
      u.lastname1_user,
      u.lastname2_user,

      uc.id_usercar,
      uc.brand_usercar,
      uc.model_usercar,
      uc.year_usercar,

      r.id_rating,
      r.score_rating,
      r.comentario,
      r.date_rating

    FROM ServiceHistory sh
    INNER JOIN UserTaller ut
      ON sh.id_usertaller = ut.id_usertaller
    INNER JOIN Users u
      ON sh.id_user = u.id_user
    INNER JOIN UsersCars uc
      ON sh.id_usercar = uc.id_usercar
    INNER JOIN ratings r
      ON r.id_service = sh.id_service
      AND r.id_user = ut.id_user

    WHERE ut.id_user = ?
      AND sh.service_status = 'completed'

    ORDER BY sh.fecha_solicitud DESC, r.date_rating DESC
  `, [id_user]);

  return rows;
}


};

module.exports = TallerModel;