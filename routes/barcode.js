const express = require('express');
const router = express.Router();
const article = require('../modules/Article');

router.get('/', async (req, res, next) => {
	res.json({
    error: "status"
  });
});

module.exports = router;
