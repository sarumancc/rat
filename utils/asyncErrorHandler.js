/**
 * @fileoverview Este archivo contiene una función para manejar errores asíncronos en manejadores de rutas.
 * 
 * @author Camilo Ortiz
 * @version 1.5
 * @since 2023-08-06
 * 
 * @requires Express
 * 
 * Funciones principales:
 * - makeHandlerAwareOfAsyncErrors: Envuelve un manejador de rutas para capturar errores asíncronos y pasarlos a la siguiente función de middleware.
 */

/**
 * Envuelve un manejador de rutas para capturar errores asíncronos y pasarlos a la siguiente función de middleware.
 * 
 * @param {Function} handler - El manejador de rutas asíncrono que se desea envolver.
 * @returns {Function} Una nueva función que envuelve el manejador original y maneja cualquier error asíncrono.
 */
function makeHandlerAwareOfAsyncErrors(handler) {
    return async function(req, res, next) {
        try {
            await handler(req, res);
        } catch (error) {
            next(error);
        }
    };
}

module.exports = makeHandlerAwareOfAsyncErrors;
