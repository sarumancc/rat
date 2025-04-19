const express = require('express');
const geoip = require('geoip-lite');
const fs = require('fs')
const router = express.Router();
const JSON_PATH = '/home/chupacabra/simpleastrometry/geoiplog/';

router.get('/', (req, res) => {
	geoipLookup('index',req);
	res.render('index', { status: '200' });
});

router.get('/imageviewer', (req, res) => {
	geoipLookup('imageviewer',req);
	const imagID = req.query.id;
	res.render('imageviewer', { status: '200', imagID: imagID });
});

router.get('/gallery', (req, res) => {
	geoipLookup('gallery',req);
	res.render('gallery', { status: '200' });
});

router.get('/docs', (req, res) => {
	geoipLookup('docs',req);
	res.render('docs', { status: '200' });
});

router.get('/counter', (req, res) => {
	const logFilePath = `${JSON_PATH}/geoip_logs.json`;
	let geoipLogs = [];
	
	try {
		if (fs.existsSync(logFilePath)) {
			geoipLogs = JSON.parse(fs.readFileSync(logFilePath));
		}
		res.render('counter', { status: '200', geoipLogs: geoipLogs });
	} catch (error) {
		console.error('Error reading geoip logs:', error);
		res.render('counter', { status: '500', geoipLogs: [], error: 'Failed to load logs' });
	}
});
// Manejar rutas no encontradas
router.use((req, res, next) => {
	res.status(404).render('404');
});

module.exports = router;


function geoipLookup(section,req) {
	const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const geo = geoip.lookup(ip);
	const timestamp = Date.now();
	const baseLogFile = `${JSON_PATH}/geoip_logs`;

	const jsonGeoIp = {
		timestamp,
		section,
		ip,
		geo
	};
		
	let currentLogFile = `${baseLogFile}.json`;

/* 	while (fs.existsSync(currentLogFile) && fs.statSync(currentLogFile).size >= 50 * 1024) {
		currentLogFile = `${baseLogFile}_${Date.now()}.json`;
	}
 */
	let existingLogs = []
	if (fs.existsSync(currentLogFile)) {
		existingLogs = JSON.parse(fs.readFileSync(currentLogFile));
	}
	
	existingLogs.push(jsonGeoIp)
	fs.writeFileSync(currentLogFile, JSON.stringify(existingLogs, null, 2));

  return jsonGeoIp;	
}