const express = require('express');
const router = express.Router();
const article = require('../modules/Article');

router.get('/search/:searchTerm', async (req, res, next) => {
	try {
		const articles = await article.searchByTerm(req.params.searchTerm);
		res.json(articles);
	} catch (err) {
		next(err);
	}
});

router.get('/get/:uuid', async (req, res, next) => {
	try {
		const singleArticle = await article.getByUuid(req.params.uuid);
		res.json(singleArticle);
	} catch (err) {
		next(err);
	}
});

module.exports = router;
