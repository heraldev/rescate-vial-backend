const express = require('express');
const router = express.Router();
const controller = require('../controllers/providersController');

router.get('/brands', controller.getBrands);
router.get('/brands/:id_brand/models', controller.getModels);
router.get('/list', controller.getProviders);

/*rutas api NHTSA
router.get('/brandsNH', controller.getBrands);
router.get('/modelsNH/:make', controller.getModels); */

module.exports = router;