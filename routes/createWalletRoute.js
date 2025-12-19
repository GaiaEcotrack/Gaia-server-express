const express = require('express');
const router = express.Router();
const { createWallet } = require('../controllers/createWallet');

router.post('/', createWallet);

module.exports = router;