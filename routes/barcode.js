const express = require('express');
const router = express.Router();
const article = require('../modules/Article');

router.get('/', async (req, res, next) => {
  const width = (req.query.width) ? req.query.width : 1024;
  const height = (req.query.height) ? req.query.height : 768;
  const dateFrom = (req.query.dateFrom) ? req.query.dateFrom : '2018-11-11';
  const dateTo = (req.query.dateTo) ? req.query.dateTo : '2018-11-12';

  try {
    const images = await article.getImagesFromDateRange(dateFrom, dateTo);
    const imgWidth = Math.round(100 / images.length);
    const updatedImages = images.map(url => {
      const parts = url.split('?');
      return parts[0].concat(`?source=ftlabs&width=${width}&height=${height}`);
    });


    

		res.json(updatedImages);
	} catch (err) {
		next(err);
	}
});

module.exports = router;
