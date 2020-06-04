const { logger, http: { post, get } } = require('../utils');
const config = require('../config');
const { url } = config;

let token = null;
let idToPicture = null;
let attrToId = null;
let attrKeywords = null;

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

    if (map[key]) {
        map[key.toLowerCase()].push(id);
    } else {
        map[key.toLowerCase()] = [id];
    }
};

const addImagesToCache = async (page = 1) => {
    const result = await getImagesPage(page);
    const imagesDetails = await getImagesDetails(result.body.pictures);

    imagesDetails.forEach(({ body }) => {
        const { id, author, camera, tags } = body;
        idToPicture[id] = body;
        addId(attrToId, author, id);
        addId(attrToId, camera, id);
        tags.split('#').forEach(tag => addId(attrToId, tag.trim(), id));
    });

    if (result.body.hasMore) {
        await addImagesToCache(page + 1);
    } else {
        logger.info(`Done loading cache. Size: ${Object.keys(idToPicture).length} objects.`);
        attrKeywords = Object.keys(attrToId);
    }
};

const loadImages = async () => {
    logger.info('Loading cache...');
    // Invalidate cache
    idToPicture = {};
    attrToId = {};
    attrKeywords = [];
    await addImagesToCache();
};

const search = (searchTerm = '') => {
    const uniqueIdMap = {};

    const searchKey = searchTerm.toLowerCase();
    if (attrToId[searchKey]) {
        const pictureIds = attrToId[searchKey];
        pictureIds.forEach(pictureId => uniqueIdMap[pictureId] = idToPicture[pictureId]);
        return Object.values(uniqueIdMap);
    }
    // No full match, perform substring scan...
    const found = attrKeywords.reduce((arr, keyword) => {
        if (keyword.includes(searchKey)) {
            arr.push(keyword);
        }
        return arr;
    }, []);

    found.forEach(key => attrToId[key].forEach(id => uniqueIdMap[id] = idToPicture[id]));
    return Object.values(uniqueIdMap);
};

module.exports = {
    loadImages,
    search
};