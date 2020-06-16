const { logger } = require('./utils');
const config = require('./config');
const { imagesCache: { setCacheData } } = require('./services');
const { errorHandler } = require('./middleware');
const { fork } = require('child_process');

const express = require('express');
const app = express();

const { search } = require('./routes');
app.use('/search', search);
app.use(errorHandler);

let isStarting = true;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const scheduleNextImagesLoad = async () => {
    const forked = fork('cache-loader.js');

    await new Promise((resolve) => {
        forked.on('message', (msg) => {
            setCacheData(msg.cacheData);
            resolve();
        });
    });

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
    process.exit(1);
});