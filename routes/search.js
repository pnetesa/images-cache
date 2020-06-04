const express = require('express');
const router = express.Router();
const { search } = require('../middleware');

router.route('/:searchTerm')
    .get(search);

module.exports = router;