const express = require('express');
const router = express.Router();
const asyncErrorHandler = require('../utils/asyncErrorHandler');
const galleryController = require('../controllers/galleryController');

// Upload and first image process
router.get('/gallery', asyncErrorHandler(galleryController.getGallery));
router.get('/gallerypaginated', asyncErrorHandler(galleryController.getGalleryPaginated));
module.exports = router;
