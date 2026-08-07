const authModel = require('../models/mysql/authModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mailService = require('./mailServices');
const { privateKeyEC } = require('../config/keys/keys.js');


//Logica de negocio para el registro y login de usuarios

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
            // Manda los datos del usuario sin la contraseña
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


const registrarSolicitud = async (data) => {
    const email = data.correoElectronico?.trim();

    if (!email) {
        throw new Error('El correo electrónico es obligatorio.');
    }

    // 🌟 VALIDACIÓN 1: Comprobar si el correo ya es usuario oficial de la plataforma
    const usuarioExistente = await authModel.findByEmail(email);
    if (usuarioExistente) {
        throw new Error('Este correo electrónico ya está registrado como un usuario activo.');
    }

    // 🌟 VALIDACIÓN 2: Comprobar si ya tiene una solicitud en proceso
    const solicitudExistente = await authModel.findSolicitudByEmail(email);
    if (solicitudExistente) {
        throw new Error('Ya existe una solicitud de registro en proceso para este correo electrónico.');
    }

    // 1. Mapear y preparar datos para la tabla `taller_request`
    const datosTaller = {
        name_tr: data.nombreTaller,
        owner_name_tr: data.nombrePropietario,
        lastname1_tr: data.apellidoPaterno,
        lastname2_tr: data.apellidoMaterno,
        schudel_tr: data.horarioTaller,
        phone_tr: data.telefonoTaller,
        onsiteservice_tr: data.servicioDomicilio ? 1 : 0,
        email_tr: email,
        photos_tr: null,
        motivo_rechazo_tr: null,
    };

    // 2. Mapear y preparar datos para la tabla `taller_requests_address`
    const datosDireccion = {
        calle_tra: data.calle,
        numint_tra: data.numInt || null,
        numext_tra: data.numExt,
        cp_tra: data.cp,
        colonia_tra: data.colonia,
        municipio_tra: data.municipio,
        estado_tra: data.estado,
        latitude_tra: data.coordenadas?.lat || null,
        longitude_tra: data.coordenadas?.lng || null
    };

    // 3. Mandar los objetos al modelo encargado de ejecutar la transacción
    const resultado = await authModel.guardarSolicitudCompleta(datosTaller, datosDireccion);

    // 🌟 4. ENVÍO DEL EMAIL DE AVISO (Solo si el paso 3 fue exitoso)
    // Usamos el nombre del propietario para personalizar el template, o el nombre del taller si lo prefieres
    mailService.enviarSolicitudRegistrada({
        correo: email,
        nombre: data.nombrePropietario
    }).catch(error => {
        // Capturamos el error en consola por si falla Nodemailer (credenciales expiradas, etc)
        // Pero no detenemos la ejecución de la app porque la transacción en BD ya fue exitosa.
        console.error(`❌ Error al enviar correo de confirmación a ${email}:`, error.message);
    });

    // 5. Retornamos el resultado exitoso al frontend
    return resultado;

};


// CREAR PASSWORD DESDE LINK
const crearPasswordDesdeToken = async (token, password) => {

    let decoded;

    try {
        decoded = jwt.verify(token, process.env.JWT_PASSWORD_SETUP_SECRET);
    } catch (err) {
        throw new Error('Token inválido o expirado');
    }

    if (decoded.tipo !== 'crear_password_taller') {
        throw new Error('Token no válido');
    }

    const { idUser } = decoded;

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // guardar en DB (usa tu método real)
    await authModel.crearPassword(idUser, hashedPassword);

    return { ok: true };
};





module.exports = {
    registerUser,
    loginUser,
    registrarSolicitud,
    crearPasswordDesdeToken
};