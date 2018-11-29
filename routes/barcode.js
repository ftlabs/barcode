const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const article = require('../modules/Article');
const barcode = require('../modules/Barcode');

router.get('/', async (req, res, next) => {
  const width = (req.query.width) ? req.query.width : 1024;
  const height = (req.query.height) ? req.query.height : 768;
  const dateFrom = (req.query.dateFrom) ? req.query.dateFrom : '2018-11-15';
  const dateTo = (req.query.dateTo) ? req.query.dateTo : '2018-11-16';
  const orientation = (req.query.orientation) ? req.query.orientation : 'h';
  const fit = (req.query.fit) ? req.query.fit : 'fill';
  const share = (req.query.share) ? req.query.share : '';

  const validation = barcode.validateVars([
    {name: 'Width', value: width, type: 'dimensions'},
    {name: 'Height', value: height, type: 'dimensions'},
    {name: 'DateFrom', value: dateFrom, type: 'date'},
    {name: 'DateFrom', value: dateFrom, type: 'datePast'},
    {name: 'DateTo', value: dateTo, type: 'date'},
    {name: 'DateTo', value: dateTo, type: 'datePast'},
    {name: ['dateFrom', 'dateTo'], value: [dateFrom, dateTo], type: 'lessThan'},
    {name: ['dateFrom', 'dateTo'], value: [dateFrom, dateTo], type: 'notMatching'},
    {name: 'Orientation', value: orientation, type: 'alpha', selection: ['v', 'h']},
    {name: 'Fit', value: fit, type: 'alpha', selection: ['cover', 'fill']},
    {name: 'Share', value: share, type: '', selection: ['', 'twitter']},
  ]);
  if(validation.length != 0){
    res.json({ errors: validation });
    return;
  }

  try {
    const paths = {
      downloads: `${process.env.DOWNLOAD_FOLDER}`,
      result: `${process.env.RESULT_FOLDER}`,
      output: `${process.env.RESULT_FOLDER}/output.jpg`
    };
    
    if (!fs.existsSync(paths.downloads) || !fs.existsSync(paths.result)) {
      res.json({ error: "Download folders not found" }); return;
    }

    if(path.isAbsolute(paths.downloads) || path.isAbsolute(paths.result)) {
      res.json({ error: "Download folders need to be relative paths" }); return;
    }

    const images = await article.getImagesFromDateRange(dateFrom, dateTo);

    if(images.length <= 0){
      res.json({ error: `No images found with the search parameters, please adjust your date range and try again` }); return;
    }

    const config = barcode.createConfig(orientation, fit, images.length, width, height, paths);
    const updatedImages = barcode.createImagePaths(config, images);
    const imagePromises = barcode.getImages(config, updatedImages);

    Promise.all(imagePromises)
      .then(function(values) {
        const finalImage = barcode.createStitchedImage(config, imagePromises);
        finalImage
          .then(() => shareCheck(share, config.paths.output))
          .then(() => {
            const img = fs.readFileSync(config.paths.output);
            res.writeHead(200, {'Content-Type': 'image/jpg' });
            res.end(img, 'binary');
            return;
          })
          .catch((err) => {
            res.json({ error: `finalImage: ${err}` }); return;
          });
      })
      .catch((err) => {
        res.json({ error: `imagePromises: ${err}` }); return;
      });
	} catch (err) {
    next(err);
    res.json({ error: `router: ${err}` }); return;
	}
});

function shareCheck(share, imagePath){
  if(share === 'twitter'){
    barcode.postTwitter('I am a test tweet', imagePath);
  }
}

module.exports = router;
