const express = require('express');
const router = express.Router();
const controller = require('../controllers/UserController');
const { verificarToken } = require('../middlewares/usersMiddlewares');
const { apiLimiter } = require('../middlewares/rateLimiter');

// Aplica el limitador global a todo este archivo de rutas:
router.use(apiLimiter);

//vehiculos
router.post('/addcar', verificarToken, controller.addCar); // el usuario agrega un auto
router.post('/getUserCars', verificarToken, controller.getUserCars); // obtiene los datos para crear la lista/menu dropdown de autos del usuario
router.post('/getCarById', verificarToken, controller.getCarById); // obtener datos para vista completa de los vehiculos del usuario

//solicitudes (para asistencia vial)
router.post('/requestAssistance', verificarToken, controller.requestAssistance); //solicitar asitencia
router.patch('/cancelAssistance', verificarToken, controller.cancelAssistance); //cancelar asistencia antes de que un taller la acepte
router.get('/getServiceStatus/:id_user', verificarToken, controller.getServiceStatus);
router.patch('/confirmAssistance', verificarToken, controller.confirmAssistance); //el usuario confirma que el taller le asista
router.patch('/confirmarLlegada', verificarToken, controller.confirmarLlegada); //el usuario confirma la llegada del taller a su ubicacion
router.patch('/confirmarTrabajo', verificarToken, controller.confirmarTrabajo); // el usuario confirma que el taller ha terminado su trabajo

router.post('/calificar', verificarToken, controller.calificar); // el usuario califica al taller su servicio

router.get('/mis-calificaciones/:id_user', verificarToken, controller.getMisCalificaciones); // carga las calificaciones que el usuario ha recibido de los talleres


//BITACORA
router.post('/mileage/update', verificarToken, controller.updateMileage); //actualiza el kilometraje del auto del usuario
router.get('/tipos-servicio', verificarToken, controller.getTiposServicio); //carga los tipos de servicios
router.post('/bitacora', verificarToken, controller.crearBitacora); //agregar registro a la bitacora
router.post('/bitacora/por-servicio', verificarToken, controller.getBitacoraByServicio); //obtiene los registros de la bitacora por id_usercar y id_tipo_servicio
router.get('/vehicle/:id_usercar/parts-health', verificarToken, controller.getPartsHealth);



//ruta neuorna
router.post('/maintenance/recommendation', verificarToken, controller.getMaintenanceRecommendation);
//ruta simulada
router.get('/posicionTaller/:id_servicio', verificarToken, controller.getPosicion);



module.exports = router;