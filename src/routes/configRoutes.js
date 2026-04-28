const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');

router.get('/', configController.obtenerConfiguracion);
router.put('/', configController.guardarConfiguracion);

module.exports = router;;