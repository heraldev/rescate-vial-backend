const express = require('express');
const router = express.Router();
const TallerController = require('../controllers/tallerController');

//Gestion de las solicitudes de assitencia
router.post('/requestAyuda', TallerController.requestAyuda); // T1 Obtener solicitudes cercanas al taller
router.post('/aceptarSolicitud', TallerController.aceptarSolicitud); // T2 taller acepta solicitud
router.post('/cancelarSolicitud', TallerController.cancelarSolicitud); // T3cancelar solicitud de ayuda cliente
router.get('/checkAceptada/:id_taller', TallerController.checkSolicitudAceptada); // T4 Verificar si el taller tiene una solicitud aceptada
router.get('/activeService/:id_taller', TallerController.checkActiveTallerService); // T5 Verificar servicio activo

router.patch('/iniciarRuta', TallerController.iniciarRuta); // T6 Taller inicia ruta a el usuario
router.patch('/tallerLlego', TallerController.tallerLlego); // T7 Taller llega al usuario
router.patch('/trabajoTerminado', TallerController.trabajoTerminado); // T8 Taller termina el trabajo
router.post('/calificar', TallerController.calificar); // T9 Taller califica al usuario

router.get('/mis-calificaciones/:id_user', TallerController.getMisCalificacionesTaller); // T10 Lista las calficaciones que el taller ha recibido de los usuarios

//simular ruta de auto
router.patch('/posicion', TallerController.actualizarPosicion);
router.get('/posicion/:id_servicio', TallerController.getPosicion);


module.exports = router;