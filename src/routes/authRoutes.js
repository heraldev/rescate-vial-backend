const express = require('express');
const router = express.Router();
const controller = require('../controllers/authController');
const { loginLimiter } = require('../middlewares/rateLimiter');

router.post('/register', controller.register);
router.post('/login', loginLimiter, controller.login);
router.post('/tallerSolicitud', controller.crearSolicitud); //taller manda solicitud de registro
router.post('/crear-password', controller.crearPasswordDesdeCorreo); //para que el taller pueda crear su password desde el correo de confirmación

module.exports = router;