const express = require('express');
const router = express.Router();
const { BackupCtrl } = require('../controllers');

router.get('/get', BackupCtrl.get);
router.get('/getList', BackupCtrl.getList);
router.get('/getAll', BackupCtrl.getAll);

module.exports = router;