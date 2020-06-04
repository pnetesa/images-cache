const express = require('express');
const router = express.Router();
const { search } = require('../services');

router.route('/:searchTerm')
    .get(search);

module.exports = router;