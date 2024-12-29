const express = require('express');
const router = express.Router();
const { DispatchCtrl } = require('../controllers');

router.get('/getList', DispatchCtrl.getList);
router.post('/register', DispatchCtrl.register);
router.post('/addBackup', DispatchCtrl.addBackup);
router.post('/updateBackupDisabled', DispatchCtrl.updateBackupDisabled);
router.post('/updateShareDisabled', DispatchCtrl.updateShareDisabled);
router.post('/updateShareDelay', DispatchCtrl.updateShareDelay);

router.post('/requestRecover', DispatchCtrl.requestRecover);

module.exports = router;