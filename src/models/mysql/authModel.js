const db = require('../../config/db');

exports.findByEmail = async (email) => {
    const [rows] = await db.query(
        'SELECT * FROM Users WHERE email_user = ?',
        [email]
    );
    return rows[0];
};

exports.createUser = async (data) => {
    const [result] = await db.query(
        `INSERT INTO Users 
        (id_userrol, name_user, lastname1_user, lastname2_user, email_user, password_user) 
        VALUES (1, ?, ?, ?, ?, ?)`,
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

exports.findByEmailWithPassword = async (email) => {
    const [rows] = await db.query(
        `SELECT id_user, id_userrol, name_user, lastname1_user, lastname2_user, email_user, password_user, status_user, email_verified_user 
         FROM Users 
         WHERE email_user = ?`,
        [email]
    );

    return rows[0];
};