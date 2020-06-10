const { logger, http: { post, get } } = require('../utils');
const config = require('../config');
const { url } = config;

let token = null;
const idToPicture = new Map();
const attrToId = new Map();

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

const addId = (map, key, id) => {
    if (!key) {
        return;
    }

    const $key = key.toLowerCase();

    if (map.has($key)) {
        map.get($key).push(id);
    } else {
        map.set($key.toLowerCase(), [id]);
    }
};

const addImagesToCache = async (page = 1) => {
    const result = await getImagesPage(page);
    const imagesDetails = await getImagesDetails(result.body.pictures);

    imagesDetails.forEach(({ body }) => {
        const { id, author, camera, tags } = body;
        idToPicture.set(id, body);
        addId(attrToId, author, id);
        addId(attrToId, camera, id);
        tags.split('#').forEach(tag => addId(attrToId, tag.trim(), id));
    });

    if (result.body.hasMore) {
        await addImagesToCache(page + 1);
    } else {
        logger.info(`Done loading cache. Size: ${idToPicture.size} objects.`);
    }
};

const loadImages = async () => {
    logger.info('Loading cache...');
    // Invalidate cache
    idToPicture.clear();
    attrToId.clear();
    await addImagesToCache();
};

const search = (searchTerm = '') => {
    const uniqueIdMap = new Map();

    const searchKey = searchTerm.toLowerCase();
    const pictureIds = attrToId.get(searchKey);
    if (pictureIds) {
        pictureIds.forEach(pictureId => uniqueIdMap.set(pictureId, idToPicture.get(pictureId)));
        return Array.from(uniqueIdMap.values());
    }

    // No full match, perform substring scan...
    for (let keyword of attrToId.keys()) {
        if (keyword.includes(searchKey)) {
            attrToId.get(keyword)
                .forEach(id => uniqueIdMap.set(id, idToPicture.get(id)));
        }
    }

    return Array.from(uniqueIdMap.values());
};

module.exports = {
    loadImages,
    search
};