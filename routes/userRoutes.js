const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');


router.get('/search', userController.getUserByEmail);

module.exports = router;
