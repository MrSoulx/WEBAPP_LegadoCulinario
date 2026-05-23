const express = require('express');
const router = express.Router();
const { geoip } = require('../controllers/geoipController');

router.get('/', geoip);

module.exports = router;
