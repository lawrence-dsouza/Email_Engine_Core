const express = require('express');
const router = express.Router();
const { mailBoxCount, folderMails } = require('../controllers/dashboard');
const authHandler = require('../middlewares/authentication');

router.get('/:provider/index/', authHandler, mailBoxCount);
router.get('/:provider/:folderName', authHandler, folderMails);

module.exports = router;
