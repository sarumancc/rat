const cluster = require('cluster');
const os = require('os');  // Módulo para obtener el número de CPUs
require('dotenv').config();

const app = require('./app'); 
const PORT = process.env.PORT || 5000;
console.log(`=========* . . * . . Simple Astrometry . . * . . *=========`);

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
  app.listen(PORT, () => {
    console.log(`\nWorker ${process.pid} corriendo en el puerto ${PORT}\n`);
  });
}
