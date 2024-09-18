const express = require('express');
const router = express.Router();
const salisController = require('../controllers/sailsController')

router.post('/:service/:method',salisController.postService)
router.post('/query/:service/:method',salisController.executeQuery)


module.exports = router;