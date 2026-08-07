const pool = require('../../config/db');

const AdminModel = {

  //tabla de solicitudes de talleres del admin
  async obtenerSolicitudes() {
    const [rows] = await pool.query(`
      SELECT 
        tr.id_tr,
        tr.name_tr,
        tr.owner_name_tr,
        tr.schudel_tr,
        tr.phone_tr,
        tr.email_tr,
        tr.onsiteservice_tr,
        tr.status_tr,
        tr.motivo_rechazo_tr,
        tr.fecha_solicitud,
        tra.calle_tra,
        tra.numint_tra,
        tra.numext_tra,
        tra.cp_tra,
        tra.colonia_tra,
        tra.municipio_tra,
        tra.estado_tra,
        tra.latitude_tra,
        tra.longitude_tra
      FROM taller_request tr
      LEFT JOIN taller_requests_address tra ON tr.id_tr = tra.id_tr
      ORDER BY tr.fecha_solicitud ASC
    `);

    return rows;
  },


  //Funciones para aprobar o rechazar solicitudes de registro de talleres
  async obtenerSolicitudPorId(id) {
    const [rows] = await pool.query('SELECT * FROM taller_request WHERE id_tr = ?', [id]);
    return rows[0];
  },

  async actualizarEstatus(id, status, motivoRechazo) {
    const [result] = await pool.query(
      `UPDATE taller_request SET status_tr = ?, motivo_rechazo_tr = ? WHERE id_tr = ?`,
      [status, motivoRechazo, id]
    );
    if (result.affectedRows === 0) throw new Error('Solicitud no encontrada');
    return { ok: true };
  },

  async aprobarSolicitud(id) {
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      // 1. Obtener la solicitud original
      const [solRows] = await conn.query(`SELECT * FROM taller_request WHERE id_tr = ?`, [id]);
      if (solRows.length === 0) throw new Error('Solicitud no encontrada');
      const solicitud = solRows[0];

      if (solicitud.status_tr === 'aprobado') throw new Error('La solicitud ya fue aprobada');
      if (solicitud.status_tr === 'rechazado') throw new Error('La solicitud ya fue rechazada');

      // 2. Obtener la dirección asociada de la solicitud
      const [addrRows] = await conn.query(`SELECT * FROM taller_requests_address WHERE id_tr = ?`, [id]);
      const direccion = addrRows[0];

      // 3. Validar si el email ya existe en Users
      const [existRows] = await conn.query(`SELECT * FROM Users WHERE email_user = ?`, [solicitud.email_tr]);
      if (existRows.length > 0) throw new Error('El correo del taller ya está registrado en la plataforma');

      // 4. Insertar en Users (Propietario como Usuario Oficial con Rol 3)
      const [userResult] = await conn.query(
        `INSERT INTO Users (id_userrol, name_user, lastname1_user, lastname2_user, email_user, password_user, status_user, email_verified_user) VALUES (?, ?, ?, ?, ?, NULL, 1, 0)`,
        [ 3, solicitud.owner_name_tr, solicitud.lastname1_tr, solicitud.lastname2_tr, solicitud.email_tr ]
      );

      const idUser = userResult.insertId;

      // 5. Insertar en UserTaller (Datos oficiales del negocio)
      const [tallerResult] = await conn.query(
        `INSERT INTO UserTaller (id_user, name_usertaller, schudel_usertaller, phone_taller, onsiteservice_usertaller, photos_usertaller, status_taller)
         VALUES (?, ?, ?, ?, ?, NULL, 1)`,
        [idUser, solicitud.name_tr, solicitud.schudel_tr, solicitud.phone_tr, solicitud.onsiteservice_tr, solicitud.photos_tr]
      );
      const idUserTaller = tallerResult.insertId;

      // 6. Insertar en UserTallerAddress (Vaciado completo con coordenadas)
      if (direccion) {
        await conn.query(
          `INSERT INTO UserTallerAddress
           (id_usertaller, calle_addresstaller, numint_addresstaller, numext_addresstaller, cp_addresstaller,
            colonia_addresstaller, municipio_addresstaller, estado_addresstaller, latitude_addresstaller, longitude_addresstaller)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            idUserTaller,
            direccion.calle_tra, direccion.numint_tra, direccion.numext_tra,
            direccion.cp_tra, direccion.colonia_tra, direccion.municipio_tra, direccion.estado_tra,
            direccion.latitude_tra, direccion.longitude_tra
          ]
        );
      }

      // 7. Actualizar estatus de la solicitud a 'aprobado'
      await conn.query(`UPDATE taller_request SET status_tr = 'aprobado' WHERE id_tr = ?`, [id]);

      await conn.commit();

      // Retornamos los datos limpios y exactos que requiere el servicio para el JWT y el Correo
      return {
        ok: true,
        idUser,
        correo: solicitud.email_tr,
        nombre: solicitud.owner_name_tr // Se le enviará el correo al nombre del propietario
      };
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

    return { ok: true, correo: solicitud.email_tr, nombre: solicitud.owner_name_tr };
  },


  
};

module.exports = AdminModel;
