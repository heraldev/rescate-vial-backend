const db = require('../../config/db');

//Comprobar si el correo ya está registrado
exports.findByEmail = async (email) => {
    const [rows] = await db.query(
        'SELECT * FROM Users WHERE email_user = ?',
        [email]
    );
    return rows[0];
};

//Registrar un nuevo usuario
exports.createUser = async (data) => {
    const [result] = await db.query(
        `INSERT INTO Users 
        (id_userrol, name_user, lastname1_user, lastname2_user, email_user, password_user) 
        VALUES (2, ?, ?, ?, ?, ?)`,
        [
            data.name,
            data.lastname1,
            data.lastname2,
            data.email,
            data.password
        ]
    );

    return { id: result.insertId };
};

// Consulta los datos del usuario para hacer login()
exports.findByEmailWithPassword = async (email) => {
    const [rows] = await db.query(
        `SELECT id_user, id_userrol, name_user, lastname1_user, lastname2_user, email_user, password_user, status_user, email_verified_user 
         FROM Users 
         WHERE email_user = ?`,
        [email]
    );

    return rows[0];
};

// Registrar un intento de login (exitoso o fallido)
exports.registerLoginAttempt = async (logData) => {
    await db.query(
        `INSERT INTO LoginLogs (email_attempt, ip_address, status_attempt, reason_failed) 
         VALUES (?, ?, ?, ?)`,
        [
            logData.email,
            logData.ip,
            logData.status,
            logData.reason || null
        ]
    );
};

//Solicitudes de los talleres que desean trabajar con la plataforma

// Verificacomos si existe correo ya registrado para evitar duplicidad
exports.findSolicitudByEmail = async (email) => {
    const [rows] = await db.query(
        `SELECT * FROM taller_request WHERE email_tr = ? AND status_tr != 'rechazado'`,
        [email]
    );
    return rows[0];
};

exports.guardarSolicitudCompleta = async (taller, direccion) => {
    // Obtenemos una conexión exclusiva para la transacción
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Insertar en la tabla principal taller_request
        const queryTaller = `
        INSERT INTO taller_request 
        (name_tr, owner_name_tr, lastname1_tr, lastname2_tr, schudel_tr, phone_tr, onsiteservice_tr, photos_tr, motivo_rechazo_tr, email_tr) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [resultTaller] = await connection.query(queryTaller, [
            taller.name_tr,
            taller.owner_name_tr,
            taller.lastname1_tr,
            taller.lastname2_tr,
            taller.schudel_tr,
            taller.phone_tr,
            taller.onsiteservice_tr,
            taller.photos_tr,
            taller.motivo_rechazo_tr,
            taller.email_tr
        ]);

        // Obtenemos el ID generado para la solicitud actual
        const insertIdTr = resultTaller.insertId;

        // 2. Insertar en la tabla subordinada taller_requests_address
        const queryDireccion = `
            INSERT INTO taller_requests_address 
            (id_tr, calle_tra, numint_tra, numext_tra, cp_tra, colonia_tra, municipio_tra, estado_tra, latitude_tra, longitude_tra) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await connection.query(queryDireccion, [
            insertIdTr,
            direccion.calle_tra,
            direccion.numint_tra,
            direccion.numext_tra,
            direccion.cp_tra,
            direccion.colonia_tra,
            direccion.municipio_tra,
            direccion.estado_tra,
            direccion.latitude_tra,
            direccion.longitude_tra
        ]);

        // Si todo salió bien, confirmamos los cambios en la BD
        await connection.commit();

        return { id_tr: insertIdTr };

    } catch (error) {
        // Si ocurre cualquier error, revertimos todo para evitar datos huérfanos
        await connection.rollback();
        throw error;
    } finally {
        // Es vital liberar la conexión de vuelta al pool
        connection.release();
    }
};


//crear password con gmail, mediante link
exports.crearPassword = async (idUser, passwordHash) => {
    // 1. consultamos el estado actual del usuario
    const [rows] = await db.query(
        `SELECT password_user, email_verified_user FROM Users WHERE id_user = ?`,
        [idUser]
    );

    if (rows.length === 0) {
        throw new Error('Usuario no encontrado');
    }

    const usuario = rows[0];

    // 🌟 EL CANDADO: Si ya tiene contraseña o ya está verificado, rebotamos la petición
    if (usuario.password_user !== null || usuario.email_verified_user === 1) {
        throw new Error('Este enlace ya fue utilizado.');
    }

    // 2. Si pasó la validación, guardamos la contraseña y lo marcamos como verificado
    const [result] = await db.query(
        `UPDATE Users SET password_user = ?, email_verified_user = 1 WHERE id_user = ?`,
        [passwordHash, idUser]
    );

    return { ok: true };
};


