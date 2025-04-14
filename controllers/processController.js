/**
 * Process Controller for SimpleAstrometry
 * Handles image uploads, processing, and retrieval for astrometry operations
 */
//const iconv = require('iconv-lite');
const path = require('path');
const fs = require('fs');
const shell = require('shelljs');
const ShortUniqueId = require('short-unique-id');
const ProcessLock = require('../utils/fileLockHandler');
const ExifReader = require('exifreader');

// Configuration constants
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 26214400; // 25MB
const BASE_PATH = '/home/chupacabra/simpleastrometry/';
//const IMG_TEMP = `${BASE_PATH}procesar-imagen/img-temp`;
//const THUMBNAIL_DIR = `${BASE_PATH}public/images/thumbnail`;
const SOLVE_IMAGE_DIR = `${BASE_PATH}procesar-imagen/solve-images`;
const SCRIPT_PATH = 'procesar-imagen/./procesar_imagen.sh';

// Request counter for debugging
let requestCounter = 0;

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

/**
 * Converts HEX color to RGB format
 * @param {string} hex - Hex color code (e.g. #FF00FF)
 * @returns {string} - RGB format as "r:g:b"
 */
function hexToRgb(separator, hex) {
	const r = parseInt(hex.substring(1, 3), 16);
	const g = parseInt(hex.substring(3, 5), 16);
	const b = parseInt(hex.substring(5, 7), 16);
	if (separator === true) {
		return `${r}:${g}:${b}`;
	} else {
		return `${r},${g},${b}`;
	}
}

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

const processController = {
	/**
	 * Processes uploaded image with astrometry parameters
	 * @param {Object} req - Express request object
	 * @param {Object} res - Express response object
	 */
	imageProcess: async (req, res) => {
		const processLock = new ProcessLock(`${BASE_PATH}/procesar-imagen/`);
		//console.log(req.body);

		try {
			// Validate file upload
			if (!req.files || Object.keys(req.files).length === 0) {
				return res.status(400).json({ status: 'fail', message: 'No files uploaded' });
			}

			const uploadedFile = req.files.imgInput;
			const inputBody = req.body;

			// Validate file size
			if (uploadedFile.size > MAX_FILE_SIZE) {
				return res.status(413).json({ status: 'fail', message: 'File exceeds maximum allowed size' });
			}

			// Validate file type
			if (!ALLOWED_MIME_TYPES.includes(uploadedFile.mimetype)) {
				return res.status(400).json({ status: 'fail', message: 'Only image files are allowed' });
			}

			// Generate unique ID and file path
			const uid = new ShortUniqueId({ length: 10 });
			const id = uid.rnd();
			const imgExt = path.extname(uploadedFile.name).toLowerCase();
			const uploadPath = `procesar-imagen/${id}${imgExt}`;

			// Log request info
			requestCounter++;
			console.log(`Processing request #${requestCounter}: ${uploadPath}`);

			// Wait for lock before proceeding
			await processLock.waitForLock();

			// Move uploaded file to destination
			uploadedFile.mv(uploadPath, async (err) => {
				if (err) {
					return res.status(500).json({
						status: 'fail',
						message: 'Error uploading file',
						data: err.message
					});
				}

				try {
					try {

						// Build command parameters
						const parameters = [];

						// Add font size parameter
						parameters.push(inputBody.fontSize);

						// Add constellation parameter if enabled
						if (inputBody.constellations === 'true') parameters.push("-C");

						// Add NGC catalog parameter if enabled
						if (inputBody.ngcCatalog === 'true') parameters.push("-N");

						// Add bright stars parameters if enabled
						if (inputBody.brightStars === 'true') {
							parameters.push("-B");
							if (parseInt(inputBody.nBrightest) !== 0) {
								parameters.push(`-b ${inputBody.nBrightest}`);
							}
						}

						// Add RA/Dec grid parameters if enabled
						if (inputBody.raDecGrid === 'true') {
							parameters.push(`-G ${inputBody.gridSpacing}`);
							parameters.push(`-g ${hexToRgb(true, inputBody.gridColor)}`);
						}

						// Build and execute command
						const command = `${SCRIPT_PATH} ${uploadPath} ${parameters.join(' ')}`;
						console.log(`Executing command: ${command}`);

						const execResult = shell.exec(command, { silent: false });

						if (execResult.code !== 0) {
							console.error("solve-field can't resolve stars", execResult.stderr);
							return res.status(500).json({
								status: 'fail',
								message: `solve-field can't resolve stars ${execResult.stderr}`
							});
							//throw new Error(`Script execution error: ${execResult.stderr}`);
						}

						// Process results
						const stdout = execResult.stdout;
						const processResults = {
							processLog: stdout,
							imgFile: stdout.split('\n')[0]
						};

						// Extract field information
						const JSONField = {
							center: {
								radec: stdout.match(/\(RA,Dec\) = \((.*?)\) deg/)?.[1] || '',
								hmsdms: stdout.match(/\(RA H:M:S.*?\) = \((.*?)\)/)?.[1] || ''
							},
							size: stdout.match(/Field size: (.*? degrees)/)?.[1] || '',
							rotation: stdout.match(/up is (.*? degrees E of N)/)?.[1] || '',
							parity: stdout.match(/Field parity: (\w+)/)?.[1] || ''
						};

						const imgFileNoExt = processResults.imgFile.substring(0, processResults.imgFile.lastIndexOf("."));
						const objectLogPath = `${SOLVE_IMAGE_DIR}/${imgFileNoExt}.txt`;
						const objectJSONPath = `${SOLVE_IMAGE_DIR}/${imgFileNoExt}.json`;
						const exifInfo = getExifData(`${SOLVE_IMAGE_DIR}/${imgFileNoExt}${imgExt}`);

						// Get object information from TXT file
						const objectTXTInfo = getObjectLog(objectLogPath);
						const objectJSONInfo = getObjectLog(objectJSONPath);

						if (!inputBody.copyrightText == null || !inputBody.copyrightText == "") {
							const textParameters = [];
							const textOpacity = inputBody.textOpacity / 100;
							const textColor = hexToRgb(false, inputBody.textColor);

							textParameters.push(`-gravity ${inputBody.textPosition}`);
							textParameters.push(`-fill "rgba(${textColor},${textOpacity})"`);
							textParameters.push(`-pointsize ${inputBody.fontSizeCopyright}`);
							textParameters.push(`-annotate +10+10 "${inputBody.copyrightText}"`);
							console.log(textParameters.join(' '));

							const imagePath = `${SOLVE_IMAGE_DIR}/${imgFileNoExt}${imgExt}`;
							const commandText = `convert ${imagePath} ${textParameters.join(' ')} ${imagePath}`;
							console.log(`Executing command: ${commandText}`);

							const execResultText = shell.exec(commandText, { silent: false });

							if (execResultText.code !== 0) {
								console.error("Error insert text in image", execResultText.stderr);
								// Return success response with all data with error message
								res.json({
									status: 'OK',
									data: processResults,
									objectTXTInfo: objectTXTInfo,
									objectJSONInfo: objectJSONInfo,
									fileName: processResults.imgFile,
									fieldInfo: JSONField,
									exifInfo: exifInfo,
									errorText: `Error insert text in image ${execResultText.stderr}`
								});
							}
						}

						// Return success response with all data
						res.json({
							status: 'OK',
							data: processResults,
							objectTXTInfo: objectTXTInfo,
							objectJSONInfo: objectJSONInfo,
							fileName: processResults.imgFile,
							fieldInfo: JSONField,
							exifInfo: exifInfo,
						});

					} finally {
						processLock.releaseLock();
					}
				} catch (error) {
					// Clean up uploaded file on error
					processLock.releaseLock();
					try {
						if (fs.existsSync(uploadPath)) {
							fs.unlinkSync(uploadPath);
						}
					} catch (cleanupError) {
						console.error("Error cleaning up file:", cleanupError);
					}

					return res.status(500).json({
						status: 'fail',
						message: `Processing error: ${error.message}`
					});
				}
			});
		} catch (error) {
			processLock.releaseLock();
			return res.status(400).json({
				status: 'fail',
				message: `Request error: ${error.message}`
			});
		}
	},
};

module.exports = processController;
