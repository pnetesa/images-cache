const { logger } = require('./utils');
const { imagesCache: { loadImages, getCacheData } } = require('./services');

const main = async () => {
    await loadImages();
    // TODL: Problem - passing Map() to parent process won't work!
    process.send({ cacheData: getCacheData() });
};

main().catch((e) => {
    logger.error("CACHE-LOADER: CAUGHT IN main()");
    logger.error(e);
});

process.on("uncaughtException", (e) => {
    logger.error("CACHE-LOADER: CAUGHT IN uncaughtException");
    logger.error(e);
    process.exit(1);
});