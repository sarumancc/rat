const express = require('express');
const router = express.Router();
const asyncErrorHandler = require('../utils/asyncErrorHandler');
const testController = require('../controllers/testController');

// Upload and first image process
router.post('/process', asyncErrorHandler(testController.imageProcess));

// Nuevas rutas para BullMQ

module.exports = router;
