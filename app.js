const express = require('express');
const helmet = require("helmet")
const path = require('path');
const app = express();
const cors = require('cors')
const compression = require('compression');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const RateLimit = require("express-rate-limit");
const permissionsPolicy = require("permissions-policy");

// ---- Importa las rutas
// RUTAS CONTROLLER API REST
/* const usuariosRoutes = require('./routes/database/usuariosRoutes');
const dashboardRoutes = require('./routes/general/dashboardRoutes');*/
const processRoutes = require('./routes/processRoutes');
const imageRoutes = require('./routes/imageRoutes');
const galleryRoutes = require('./routes/galleryRoutes');
const testRoutes = require('./routes/testRoutes');

// CONTROLLER PAGINA WEB 
const pagesRoutes = require('./routes/pages/pageRoutes');

app.disable("x-powered-by");
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      "script-src": [
        "'self'",
        "'unsafe-inline'",
				"'unsafe-hashes'",
				"https://cdnjs.cloudflare.com",
        "https://cdn.jsdelivr.net",
        "https://unpkg.com"
      ],
      "style-src": [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-hashes'",
				"https://cdnjs.cloudflare.com",
        "https://cdn.jsdelivr.net",
        "https://cdn-uicons.flaticon.com",
        "https://unpkg.com"
      ],
			"img-src": [
        "'self'",
        "'unsafe-inline'",
				"data:",
				"blob:",
				"https://placehold.co",
        "https://flagcdn.com",
				"https://a.tile.openstreetmap.org",
				"https://b.tile.openstreetmap.org",
				"https://c.tile.openstreetmap.org",
				"https://unpkg.com",
				"https://flagcdn.com"
      ],
      "script-src-attr": ["'unsafe-inline'"],
    },
  })
);
app.use(helmet.hsts({maxAge: 31536000, includeSubDomains: true, preload: true}));
app.use(helmet.noSniff());
app.use(helmet.referrerPolicy({policy: "strict-origin-when-cross-origin"}));
app.use(permissionsPolicy({
    features: {
      geolocation: [],
      camera: [],
      microphone: [],
      fullscreen: ["self"],
    }
  })
);

// Habilitar GZIP en todas las respuestas HTTP
app.use(compression());

// PLANTILLA EJS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
/* , {
	setHeaders: (res, path) => {
			res.setHeader('Cache-Control', 'public, max-age=31536000');//activacion politicas de caché
	}
} */

// MIDDLEWARES
app.use(express.json());
app.use(cookieParser());
app.set('trust proxy', 1) //* number of proxies between user and server */
app.use(fileUpload());
// Set up rate limiter: maximum of 100 requests per minute
const limiter = RateLimit({
	windowMs: 1 * 60 * 1000, // 1 minute
	max: 100,
});
app.use(limiter);

// CORS
app.use(cors());
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Usa las rutas
/* app.use('/api/usuarios', usuariosRoutes);
app.use('/api/dashboard', dashboardRoutes); */
app.use('/api/astrometry', processRoutes);
app.use('/api/image', imageRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/test', testRoutes);
app.use('/', pagesRoutes);

module.exports = app;