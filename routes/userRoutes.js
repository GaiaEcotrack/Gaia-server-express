const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');


router.get('/search', userController.getUserByEmail);
router.get('/:user_id', userController.getUserById);
router.get('/', userController.getUsers);
router.post('/', userController.addUser);
router.put('/', userController.updateUserProperty);
router.delete('/:user_id', userController.deleteUserById);

module.exports = router;
