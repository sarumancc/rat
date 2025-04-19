const cluster = require('cluster');
const os = require('os');  // Módulo para obtener el número de CPUs
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = require('./app'); 

const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 5000;

console.log(`//// Modep production: ${isProduction} ////\n`);
console.log(`=========* . . * . . Simple Astrometry . . * . . *=========`);

const lockFile = path.join('/home/chupacabra/simpleastrometry/procesar-imagen', 'script.lock');
if (fs.existsSync(lockFile)) {
    fs.unlinkSync(lockFile);
    console.log('\n[... script.lock finded and deleted ...]\n');
}


if (cluster.isMaster) {
  // Si es el proceso maestro, crea un proceso hijo (worker) por cada núcleo de CPU disponible
  const numCPUs = os.cpus().length;
  console.log(`Número de CPUs disponibles: ${numCPUs}`);
  console.log(`\nMaster ${process.pid} corriendo\n`);

  // Crear un worker por cada CPU disponible
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Escuchar eventos de salida de workers (en caso de que un worker muera)
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} ha muerto. Creando uno nuevo...`);
    cluster.fork();  // Crea un nuevo worker en caso de que uno falle
  });

} else {
  // Si es un worker, inicia el servidor
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`\nWorker ${process.pid} corriendo en el puerto ${PORT}\n`);
  });
}
