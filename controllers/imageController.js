/**
 * Image Controller for SimpleAstrometry
 * Handles image uploads, processing, and retrieval for astrometry operations
 */
const fs = require('fs');
const ExifReader = require('exifreader');


// Configuration constants
const BASE_PATH = '/home/chupacabra/simpleastrometry/';
const THUMBNAIL_DIR = `${BASE_PATH}public/images/thumbnail`;
const SOLVE_IMAGE_DIR = `${BASE_PATH}procesar-imagen/solve-images`;


function getExifData(imagePath) {
	try {
		// Check if file exists
		if (!fs.existsSync(imagePath)) {
			console.log(`Image file does not exist: ${imagePath}`);
			return null;
		}

		// Read the file as a buffer
		const imageBuffer = fs.readFileSync(imagePath);

		// Extract EXIF data with expanded option to get nested structures
		const tags = ExifReader.load(imageBuffer, { expanded: true });

		// Create a clean object with only the requested fields
		const exifData = {};

		// Helper function to safely add properties if they exist
		const addIfExists = (obj, source, field, sourcePath) => {
			const parts = sourcePath ? sourcePath.split('.') : [field];
			let current = source;

			// Navigate through the object path
			for (const part of parts) {
				if (!current || !current[part]) return;
				current = current[part];
			}

			if (current && current.description !== undefined) {
				obj[field] = current.description;
			}
		};

		// Camera and image basic info
		if (tags.exif) {
			addIfExists(exifData, tags.exif, 'Make', 'Make');
			addIfExists(exifData, tags.exif, 'Model', 'Model');
			addIfExists(exifData, tags.exif, 'Software', 'Software');
			addIfExists(exifData, tags.exif, 'DateTime', 'DateTime');
			addIfExists(exifData, tags.file, 'Image Height', 'Image Height');
			addIfExists(exifData, tags.file, 'Image Width', 'Image Width');
			addIfExists(exifData, tags.file, 'FileType', 'FileType');

			// Exposure information
			addIfExists(exifData, tags.exif, 'ExposureTime', 'ExposureTime');
			addIfExists(exifData, tags.exif, 'FNumber', 'FNumber');
			addIfExists(exifData, tags.exif, 'ISOSpeedRatings', 'ISOSpeedRatings');
			addIfExists(exifData, tags.exif, 'ExposureBiasValue', 'ExposureBiasValue');
			addIfExists(exifData, tags.exif, 'ShutterSpeedValue', 'ShutterSpeedValue');
			addIfExists(exifData, tags.exif, 'ApertureValue', 'ApertureValue');
			addIfExists(exifData, tags.exif, 'Flash', 'Flash');

			// Lens information
			addIfExists(exifData, tags.exif, 'FocalLength', 'FocalLength');
			addIfExists(exifData, tags.exif, 'LensModel', 'LensModel');
			addIfExists(exifData, tags.exif, 'LensSerialNumber', 'LensSerialNumber');
			addIfExists(exifData, tags.xmp, 'LensProfileName', 'LensProfileName');

			// Other EXIF data
			addIfExists(exifData, tags.exif, 'ColorSpace', 'ColorSpace');
			addIfExists(exifData, tags.exif, 'ExifVersion', 'ExifVersion');
			addIfExists(exifData, tags.exif, 'OffsetTime', 'OffsetTime');

			addIfExists(exifData, tags.exif, 'GPSLatitudeRef', 'GPSLatitudeRef');
			addIfExists(exifData, tags.exif, 'GPSLatitude', 'GPSLatitude');
			addIfExists(exifData, tags.exif, 'GPSLongitudeRef', 'GPSLongitudeRef');
			addIfExists(exifData, tags.exif, 'GPSLongitude', 'GPSLongitude');
			addIfExists(exifData, tags.exif, 'GPSAltitude', 'GPSAltitude');
		}

		//console.log(tags);
		return exifData;
	} catch (error) {
		console.error(`Error reading EXIF data: ${error.message}`);
		return null;
	}
}

function getObjectLog(filepath) {
	try {
		if (!fs.existsSync(filepath)) {
			console.log(`File does not exist: ${filepath}`);
			return '[]';
		}
		return fs.readFileSync(filepath, 'utf-8');
	} catch (error) {
		console.error(`Error reading Object log: ${error.message}`);
		return '[]';
	}
}

const imageController = {

	getLastUploadedImages: async (req, res) => {
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
					.sort((a, b) => b.timestamp - a.timestamp)
					.slice(0, 8) // Get 8 most recent images
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
	getImage: async (req, res) => {
		try {
			const imgFilename = req.params.id;

			// Validate filename to prevent path traversal
			if (!imgFilename || imgFilename.includes('..') || imgFilename.includes('/')) {
				return res.status(400).json({
					status: 'fail',
					message: 'Invalid image filename'
				});
			}

			const imagePath = `${SOLVE_IMAGE_DIR}/${imgFilename}`;

			// Check if file exists before sending
			if (!fs.existsSync(imagePath)) {
				return res.status(404).json({
					status: 'fail',
					message: 'Image not found'
				});
			}

			res.sendFile(imagePath);
		} catch (error) {
			res.status(500).json({
				status: 'fail',
				message: `Error retrieving image: ${error.message}`
			});
		}
	},
	imageViewer: async (req, res) => {
		try {
			const imagID = req.params.id;

			// Validate filename to prevent path traversal
			if (!imagID || imagID.includes('..') || imagID.includes('/')) {
				return res.status(400).json({
					status: 'fail',
					message: 'Invalid image filename'
				});
			}

			const [filename, extension] = imagID.split('.');
			const datetime = filename.toString();

			const processedImg = `${imagID}`;
			const originalImg = `${filename}.original.${extension}`;
			const JSONImg = `${SOLVE_IMAGE_DIR}/${filename}.json`;
			const txtImg = `${SOLVE_IMAGE_DIR}/${filename}.txt`;
			const logImg = `${SOLVE_IMAGE_DIR}/${filename}.log`;

			// Check if file exists before sending
			if (!fs.existsSync(`${SOLVE_IMAGE_DIR}/${processedImg}`)) {
				return res.status(404).json({
					status: 'fail',
					message: 'Image not found'
				});
			}

			const objectTXTInfo = getObjectLog(txtImg);
			const objectJSONInfo = getObjectLog(JSONImg);
			const objectLogInfo = getObjectLog(logImg);
			const exifInfo = getExifData(`${SOLVE_IMAGE_DIR}/${processedImg}`);

			// Extract field information
			const JSONField = {
				center: {
					radec: objectLogInfo.match(/\(RA,Dec\) = \((.*?)\) deg/)?.[1] || '',
					hmsdms: objectLogInfo.match(/\(RA H:M:S.*?\) = \((.*?)\)/)?.[1] || ''
				},
				size: objectLogInfo.match(/Field size: (.*? degrees)/)?.[1] || '',
				rotation: objectLogInfo.match(/up is (.*? degrees E of N)/)?.[1] || '',
				parity: objectLogInfo.match(/Field parity: (\w+)/)?.[1] || ''
			};

			res.json({
				status: 'OK',
				processedImg,
				datetime,
				originalImg,
				objectTXTInfo,
				objectJSONInfo,
				objectLogInfo,
				JSONField,
				exifInfo
			});

		} catch (error) {
			res.status(500).json({
				status: 'fail',
				message: `Error retrieving image: ${error.message}`
			});
		}
	},
};

module.exports = imageController;