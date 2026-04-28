const express = require('express');
const router = express.Router();
const { publicKey } = require('../config/keys/keys.js');

router.get('/public-key', (req, res) => {
    res.send(publicKey);
});

module.exports = router;