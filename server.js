const { logger } = require('./utils');
const config = require('./config');
const { imagesCache: { loadImages } } = require('./services');

const express = require('express');
const app = express();

const { search } = require('./routes');
app.use('/search', search);

app.listen(config.PORT, () => logger.info(`Listening at http://localhost:${config.PORT}`));

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const scheduleNextLoadImages = async () => {
    await loadImages();
    await delay(config.CACHE_RELOAD_PERIOD);
    await scheduleNextLoadImages();
};

const main = async () => {
    await scheduleNextLoadImages();
};

main().catch((e) => {
    logger.error("CAUGHT IN main()");
    logger.error(e);
});

process.on("uncaughtException", (e) => {
    logger.error("CAUGHT IN uncaughtException");
    logger.error(e);
});