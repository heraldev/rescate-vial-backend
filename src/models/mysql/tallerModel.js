const pool = require('../../config/db');

const TallerModel = {

  async obtenerSolicitudes() {
    const [rows] = await pool.query(`
      SELECT 
        tr.id_tr,
        tr.name_tr,
        tr.schudel_tr,
        tr.phone_tr,
        tr.email_tr,
        tr.onsiteservice_tr,
        tr.photos_tr,
        tr.status_tr,
        tr.motivo_rechazo_tr,
        tr.fecha_solicitud,
        tra.calle_tra,
        tra.numint_tra,
        tra.numext_tra,
        tra.cp_tra,
        tra.colonia_tra,
        tra.municipio_tra,
        tra.estado_tra
      FROM taller_request tr
      LEFT JOIN taller_requests_address tra ON tr.id_tr = tra.id_tr
      ORDER BY tr.fecha_solicitud DESC
    `);

    return rows;
  },

  async crearSolicitud(data) {
    const {
      nombre, horario, telefono, correo,
      servicioDomicilio, fotos,
      calle, numInt, numExt, cp, colonia, municipio, estado
    } = data;

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [result] = await conn.query(
        `INSERT INTO taller_request
         (name_tr, schudel_tr, phone_tr, email_tr, onsiteservice_tr, photos_tr, status_tr)
         VALUES (?, ?, ?, ?, ?, ?, 'pendiente')`,
        [nombre, horario, telefono, correo, servicioDomicilio, fotos]
      );

      const id_tr = result.insertId;

      await conn.query(
        `INSERT INTO taller_requests_address
         (id_tr, calle_tra, numint_tra, numext_tra, cp_tra, colonia_tra, municipio_tra, estado_tra)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [id_tr, calle, numInt, numExt, cp, colonia, municipio, estado]
      );

      await conn.commit();
      return { id_tr };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  },

  async actualizarEstatus(id, status, motivoRechazo) {
    const [result] = await pool.query(
      `UPDATE taller_request
       SET status_tr = ?, motivo_rechazo_tr = ?
       WHERE id_tr = ?`,
      [status, motivoRechazo, id]
    );

    if (result.affectedRows === 0) {
      throw new Error('Solicitud no encontrada');
    }

    return { ok: true };
  },

  // ── Métodos heredados del modelo anterior ────────────────────────────────

  async obtenerSolicitudPorId(id) {
    const [rows] = await pool.query(
      `SELECT * FROM taller_request WHERE id_tr = ?`,
      [id]
    );
    return rows[0];
  },

  async obtenerDireccionSolicitud(id) {
    const [rows] = await pool.query(
      `SELECT * FROM taller_requests_address WHERE id_tr = ?`,
      [id]
    );
    return rows[0];
  },

  async aprobarSolicitud(id) {
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [solRows] = await conn.query(
        `SELECT * FROM taller_request WHERE id_tr = ?`, [id]
      );

      if (solRows.length === 0) throw new Error('Solicitud no encontrada');

      const solicitud = solRows[0];

      if (solicitud.status_tr === 'aprobado') throw new Error('La solicitud ya fue aprobada');
      if (solicitud.status_tr === 'rechazado') throw new Error('La solicitud ya fue rechazada');

      const [addrRows] = await conn.query(
        `SELECT * FROM taller_requests_address WHERE id_tr = ?`, [id]
      );
      const direccion = addrRows[0];

      const [existRows] = await conn.query(
        `SELECT * FROM Users WHERE email_user = ?`, [solicitud.email_tr]
      );
      if (existRows.length > 0) throw new Error('Ya existe un usuario con ese correo');

      const [userResult] = await conn.query(
        `INSERT INTO Users
         (id_userrol, name_user, email_user, password_user, status_user, email_verified_user)
         VALUES (?, ?, ?, ?, 1, 1)`,
        [3, solicitud.name_tr, solicitud.email_tr, null]
      );
      const idUser = userResult.insertId;

      const [tallerResult] = await conn.query(
        `INSERT INTO UserTaller
         (id_user, name_usertaller, schudel_usertaller, phone_taller, onsiteservice_usertaller, photos_usertaller, status_taller)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        [idUser, solicitud.name_tr, solicitud.schudel_tr, solicitud.phone_tr, solicitud.onsiteservice_tr, solicitud.photos_tr]
      );
      const idUserTaller = tallerResult.insertId;

      if (direccion) {
        await conn.query(
          `INSERT INTO UserTallerAddress
           (id_usertaller, calle_addresstaller, numint_addresstaller, numext_addresstaller, cp_addresstaller,
            colonia_addresstaller, municipio_addresstaller, estado_addresstaller)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            idUserTaller,
            direccion.calle_tra, direccion.numint_tra, direccion.numext_tra,
            direccion.cp_tra, direccion.colonia_tra, direccion.municipio_tra, direccion.estado_tra
          ]
        );
      }

      await conn.query(
        `UPDATE taller_request SET status_tr = 'aprobado' WHERE id_tr = ?`, [id]
      );

      await conn.commit();
      return { ok: true, idUser, correo: solicitud.email_tr, nombre: solicitud.name_tr };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  },

  async rechazarSolicitud(id, motivo) {
    const solicitud = await this.obtenerSolicitudPorId(id);

    if (!solicitud) throw new Error('Solicitud no encontrada');
    if (solicitud.status_tr === 'aprobado') throw new Error('No se puede rechazar una solicitud ya aprobada');
    if (solicitud.status_tr === 'rechazado') throw new Error('La solicitud ya fue rechazada');

    await pool.query(
      `UPDATE taller_request SET status_tr = 'rechazado', motivo_rechazo_tr = ? WHERE id_tr = ?`,
      [motivo, id]
    );

    return { ok: true, correo: solicitud.email_tr, nombre: solicitud.name_tr };
  },

  //crear password con gmail, mediante link
  async crearPassword(idUser, passwordHash) {
    const [result] = await pool.query(
      `UPDATE Users SET password_user = ? WHERE id_user = ?`,
      [passwordHash, idUser]
    );

    if (result.affectedRows === 0) throw new Error('Usuario no encontrado');
    return { ok: true };
  },

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