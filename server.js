const { logger } = require('./utils');
const config = require('./config');
const { imagesCache: { loadImages } } = require('./services');
const { errorHandler } = require('./middleware');

const express = require('express');
const app = express();

const { search } = require('./routes');
app.use('/search', search);
app.use(errorHandler);

let isStarting = true;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const scheduleNextImagesLoad = async () => {
    await loadImages();
    if (isStarting) {
        isStarting = false;
        app.listen(config.PORT, () => logger.info(`Listening at http://localhost:${config.PORT}`));
    }
    await delay(config.CACHE_RELOAD_PERIOD);
    await scheduleNextImagesLoad();
};

const main = async () => {
    await scheduleNextImagesLoad();
};

main().catch((e) => {
    logger.error("CAUGHT IN main()");
    logger.error(e);
});

process.on("uncaughtException", (e) => {
    logger.error("CAUGHT IN uncaughtException");
    logger.error(e);
});