const { logger, http: { post, get } } = require('../utils');
const config = require('../config');
const { url } = config;

let token = null;
const cache = [];

const getToken = async () => {
    const result = await post(url.AUTH, { 'apiKey': config.API_KEY });
    if (result.statusCode !== 200) {
        throw new Error(`Invalid auth key '${config.API_KEY}'!`);
    }
    return result.body.token;
};

const getImagesPage = async (page) => {
    const result = await get(`${url.GET_IMAGES_PAGE}${page}`, token);
    if (result.statusCode !== 200) {
        logger.info('Get new token from server...');
        token = await getToken();
        return getImagesPage(page);
    }
    return result;
};

const getImageDetails = async (pictureId) => {
    const result = await get(`${url.GET_IMAGE}${pictureId}`, token);
    if (result.statusCode !== 200) {
        logger.info('Get new token from server...');
        token = await getToken();
        return getImageDetails(pictureId);
    }
    return result;
};

const getImagesDetails = (pictures) => {
    const promises = pictures.map(picture => getImageDetails(picture.id));
    return Promise.all(promises);
};

const addImagesToCache = async (page = 1) => {
    const result = await getImagesPage(page);
    const imagesDetails = await getImagesDetails(result.body.pictures);

    cache.length = 0; // Invalidate
    imagesDetails.forEach(details => cache.push(details.body));

    if (result.body.hasMore) {
        addImagesToCache(page + 1);
    } else {
        logger.info(`Size: ${cache.length}`);
        logger.info(cache);
    }
};

const loadImages = async () => {
    logger.info('Loading cache...');
    await addImagesToCache();
};

module.exports = {
    loadImages
};