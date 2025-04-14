const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
	res.render('index', { status: '200' });
});

router.get('/imageviewer', (req, res) => {
	const imagID = req.query.id;
	res.render('imageviewer', { status: '200', imagID: imagID });
});

router.get('/gallery', (req, res) => {
	res.render('gallery', { status: '200' });
});

router.get('/docs', (req, res) => {
	res.render('docs', { status: '200' });
});

// Manejar rutas no encontradas
router.use((req, res, next) => {
	res.status(404).render('404');
});

module.exports = router;
