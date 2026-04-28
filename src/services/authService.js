const bcrypt = require('bcryptjs');
const authModel = require('../models/mysql/authModel');
const jwt = require('jsonwebtoken');
const { privateKeyEC } = require('../config/keys/keys.js');

// Registro de usuarios
const registerUser = async (data) => {
    const { name, lastname1, lastname2, email, password } = data;

    const existing = await authModel.findByEmail(email);
    if (existing) {
        throw new Error('El correo ya está registrado');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await authModel.createUser({
        name,
        lastname1,
        lastname2,
        email,
        password: hashedPassword
    });

    return user;
};

// Login normal
const loginUser = async (data) => {
    const { email, password } = data;

    const user = await authModel.findByEmailWithPassword(email);
    if (!user) {
        throw new Error('Usuario no encontrado');
    }

    if (user.status_user === 0) {
        throw new Error('Cuenta desactivada');
    }

    const isMatch = await bcrypt.compare(password, user.password_user);
    if (!isMatch) {
        throw new Error('Contraseña incorrecta');
    }

    const token = jwt.sign(
        {
            id: user.id_user,
            email: user.email_user,
            rol: user.id_userrol
        },
        privateKeyEC,
        {
            algorithm: 'ES256',
            expiresIn: '1h'
        }
    );

    return {
        token,
        user: {
            id: user.id_user,
            id_userrol: user.id_userrol || '',
            name: user.name_user || '',
            lastname1: user.lastname1_user || '',
            lastname2: user.lastname2_user || '',
            email: user.email_user,
            status_user: user.status_user ?? 0,
            email_verified_user: user.email_verified_user ?? 0
        }
    };
};



module.exports = {
    registerUser,
    loginUser
};