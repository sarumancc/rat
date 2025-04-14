const path = require('path');

const processController = {
	/**
	 * Simple Hello World test function
	 */
	imageProcess: async (req, res) => {
		console.log(req.body);
		console.log(req.imgInput);
		console.log(`======================`);
		console.log('Hola mundo');
		
		return res.json({ 
			status: 'OK', 
			message: 'Hola mundo' 
		});
	}
};

module.exports = processController;
