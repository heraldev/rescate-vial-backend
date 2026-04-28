const express = require('express');
const router = express.Router();
const controller = require('../controllers/UserController');

console.log("✅ userRoutes cargado");

router.get('/test', (req, res) => {
  res.json({ ok: true, mensaje: 'userRoutes funcionando' });
});


router.post('/addcar', controller.addCar); //agregar auto
router.post('/getUserCars', controller.getUserCars); //lista dropdown
router.post('/getCarById', controller.getCarById); //para vista autodata
router.post('/requestAssistance', controller.requestAssistance); //solicitar asitencia
router.patch('/cancelAssistance', controller.cancelAssistance); //cancelar asistencia antes de que un taller la acepte
router.get('/getServiceStatus/:id_user', controller.getServiceStatus);
router.patch('/confirmAssistance', controller.confirmAssistance);
router.get('/conductores', controller.obtenerConductores);
router.get('/dashboard', controller.obtenerDashboard);
router.get('/pagos', controller.obtenerPagos);
router.get('/reportes', controller.obtenerReportes);

router.patch('/confirmarLlegada', controller.confirmarLlegada);
router.patch('/confirmarTrabajo', controller.confirmarTrabajo);
router.post('/calificar', controller.calificar);

//rankins
router.get('/mis-calificaciones/:id_user', controller.getMisCalificaciones);

//ruta neuorna
router.post('/maintenance/recommendation', controller.getMaintenanceRecommendation);


//ruta simulada
router.get('/posicionTaller/:id_servicio', controller.getPosicion);



module.exports = router;