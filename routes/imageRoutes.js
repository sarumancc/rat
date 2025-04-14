const express = require('express');
const router = express.Router();
const asyncErrorHandler = require('../utils/asyncErrorHandler');
const imageController = require('../controllers/imageController');

// Upload and first image process
router.get('/lastimages', asyncErrorHandler(imageController.getLastUploadedImages));
router.get('/getimage/:id', asyncErrorHandler(imageController.getImage));
router.get('/imageviewer/:id', asyncErrorHandler(imageController.imageViewer));

module.exports = router;
