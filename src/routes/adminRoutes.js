const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/adminController');

//Rutas para las solicitudes de los talleres que desean trabajar con la plataforma
router.get('/solicitudes', AdminController.obtenerSolicitudes); //muestra las solicitudes para el crud de admin
router.put('/solicitudes/:id/status', AdminController.actualizarEstatus); //el admin acepta o rechaza




module.exports = router;