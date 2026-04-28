const express = require('express');
const router = express.Router();
const TallerController = require('../controllers/tallerController');

//aceptas las solicitudes que realizan los talleres para trabajar en la app
router.post("/taller-request", TallerController.crearSolicitud);
router.get('/solicitudes', TallerController.obtenerSolicitudes);
router.post('/crear-password', TallerController.crearPasswordDesdeCorreo);
router.put('/solicitudes/:id/status', TallerController.actualizarEstatus);

//movil - gestion de asistencia vial
router.post('/requestAyuda', TallerController.requestAyuda); //ruta de la movil que muestra las peticiones
router.post('/aceptarSolicitud', TallerController.aceptarSolicitud); //aceptar solicitud de ayuda cliente
router.post('/cancelarSolicitud', TallerController.cancelarSolicitud); //cancelar solicitud de ayuda cliente
router.get('/checkAceptada/:id_taller', TallerController.checkSolicitudAceptada);
router.get('/activeService/:id_taller', TallerController.checkActiveTallerService);

router.patch('/iniciarRuta', TallerController.iniciarRuta);
router.patch('/tallerLlego', TallerController.tallerLlego);
router.patch('/trabajoTerminado', TallerController.trabajoTerminado);
router.post('/calificar', TallerController.calificar);

//cslificionees
router.get('/mis-calificaciones/:id_user', TallerController.getMisCalificacionesTaller);


//simular ruta de auto
router.patch('/posicion', TallerController.actualizarPosicion);
router.get('/posicion/:id_servicio', TallerController.getPosicion);


//router.put('/solicitud/:id/status', TallerController.actualizarEstatus);

module.exports = router;