const express = require('express');
const router = express.Router();
const asyncErrorHandler = require('../utils/asyncErrorHandler');
const processController = require('../controllers/processController');

// Upload and first image process
router.post('/process', asyncErrorHandler(processController.imageProcess));

module.exports = router;
