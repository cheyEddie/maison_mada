const express = require('express');

const { show } = require('../controllers/statsController');

const router = express.Router();

router.get('/', show);

module.exports = router;
