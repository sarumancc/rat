/**
 * Image Controller for SimpleAstrometry
 * Handles image uploads, processing, and retrieval for astrometry operations
 */
const fs = require('fs');

// Configuration constants
const BASE_PATH = '/home/chupacabra/simpleastrometry/';
const THUMBNAIL_DIR = `${BASE_PATH}public/images/thumbnail`;

const imageController = {
	getGallery: async (req, res) => {
		try {
			fs.readdir(THUMBNAIL_DIR, (err, files) => {
				if (err) {
					return res.status(500).json({
						status: 'fail',
						message: `Error reading directory: ${err.message}`
					});
				}

				// Filter valid image files, sort by timestamp, and take most recent
				const images = files
					.filter(file => /^\d+\.(jpg|jpeg|png|gif)$/i.test(file))
					.map(file => ({
						filename: file,
						timestamp: parseInt(file.split('.')[0], 10)
					}))
					.sort((a, b) => a.timestamp - b.timestamp)
					.map(img => img.filename);

				res.json({ status: 'OK', data: images });
			});
		} catch (error) {
			return res.status(500).json({
				status: 'fail',
				message: `Error retrieving images: ${error.message}`
			});
		}
	},
	getGalleryPaginated: async (req, res) => {
		try {
			const fileList = [];
			const limit = 16;
			const page = parseInt(req.query.page) || 1;

			fs.readdir(THUMBNAIL_DIR, (err, files) => {
				if (err) {
					return res.status(500).json({
						status: 'fail',
						message: `Error reading directory: ${err.message}`
					});
				}

				files.forEach(file => {
					fileList.push(file);
				});


				// Filter valid image files, sort by timestamp, and take most recent
				const images = fileList
					.filter(file => /^\d+\.(jpg|jpeg|png|gif)$/i.test(file))
					.map(file => ({
						filename: file,
						timestamp: parseInt(file.split('.')[0], 10)
					}))
					.sort((a, b) => b.timestamp - a.timestamp)
					.map(img => img.filename);;

				const totalItems = images.length;
				const startIndex = (page - 1) * limit;
				const endIndex = startIndex + limit;
				const paginatedData = images.slice(startIndex, endIndex);
				const totalPages = Math.ceil(totalItems / limit);

				res.json({
					status: 'OK',
					totalItems: totalItems,
					totalPages: totalPages,
					currentPage: page,
					data: paginatedData
				});
			});
		} catch (error) {
			return res.status(500).json({
				status: 'fail',
				message: `Error retrieving images: ${error.message}`
			});
		}
	},
}

module.exports = imageController;