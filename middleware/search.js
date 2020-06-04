const { imagesCache } = require('../services');

const search = (req, res) => {
    const { searchTerm } = req.params;
    res.json(imagesCache.search(searchTerm));
};

module.exports = search;