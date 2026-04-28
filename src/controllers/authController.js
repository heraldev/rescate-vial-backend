const authService = require('../services/authService');

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

const login = async (req, res) => {
    try {
        const result = await authService.loginUser(req.body);

        res.status(200).json({
            ok: true,
            mensaje: 'Login correcto',
            token: result.token,
            user: result.user
        });
    } catch (error) {
        res.status(400).json({
            ok: false,
            mensaje: error.message
        });
    }
};


module.exports = {
    register,
    login
};