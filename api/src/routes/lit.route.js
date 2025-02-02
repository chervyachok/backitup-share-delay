const express = require('express');
const router = express.Router();
const { LitCtrl } = require('../controllers');

router.post('/getCreditsSign', LitCtrl.getCreditsSign);

module.exports = router;