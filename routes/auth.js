const express = require('express');
const router = express.Router();
const { signIn, callback } = require('../controllers/auth');

router.get('/signin/:provider', signIn);
router.get('/callback/:provider', callback);

module.exports = router;
