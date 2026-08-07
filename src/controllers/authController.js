const authService = require('../services/authService');
const authModel = require('../models/mysql/authModel');

// registro de un usuario nuevo
const register = async (req, res) => {
    try {
        const user = await authService.registerUser(req.body);

        res.status(201).json({
            message: 'Usuario registrado correctamente',
            user
        });
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
};

//inicio de sesión de un usuario
const login = async (req, res) => {
    const { email } = req.body;

    // Captura la IP real detrás de Nginx o la local de desarrollo
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

    try {
        const result = await authService.loginUser(req.body);

        // Bitacora de registro de login exitoso
        await authModel.registerLoginAttempt({
            email: email,
            ip: ip,
            status: 'SUCCESS'
        });

        res.status(200).json({
            ok: true,
            mensaje: 'Login correcto',
            token: result.token,
            user: result.user
        });

    } catch (error) {

        // Bitacora de registro de login fallido
        await authModel.registerLoginAttempt({
            email: email || 'Desconocido',
            ip: ip,
            status: 'FAILED',
            reason: error.message //(Captura el motivo exacto)
        });

        res.status(400).json({
            ok: false,
            mensaje: error.message
        });
    }
};

const crearSolicitud = async (req, res) => {
    try {
        const resultado = await authService.registrarSolicitud(req.body);
        res.status(201).json({
            message: 'Solicitud de taller registrada correctamente.',
            solicitudId: resultado.id_tr
        });
    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
};

//para que el taller pueda crear su password desde el correo que se le envia al ser aceptado
const crearPasswordDesdeCorreo = async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Token y contraseña son obligatorios'
            });
        }

        await authService.crearPasswordDesdeToken(token, password);

        res.json({
            ok: true,
            mensaje: 'Contraseña creada correctamente'
        });
    } catch (error) {
        console.error('Error al crear contraseña:', error);
        res.status(400).json({
            ok: false,
            mensaje: error.message || 'No se pudo crear la contraseña'
        });
    }
};




module.exports = {
    register,
    login,
    crearSolicitud,
    crearPasswordDesdeCorreo
};
