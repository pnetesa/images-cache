const { logger } = require('../utils');

const errorHandler = (err, req, res, next) => {
    logger.error(err);
    res.status(500).json({error: 'Server error'});
}

module.exports = errorHandler;