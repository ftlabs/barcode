const express = require('express');
const fs = require("fs");
const router = express.Router();
const article = require('../modules/Article');
const barcode = require('../modules/Barcode');

router.get('/', async (req, res, next) => {
  const width = (req.query.width) ? req.query.width : 1024;
  const height = (req.query.height) ? req.query.height : 768;
  const dateFrom = (req.query.dateFrom) ? req.query.dateFrom : '2018-11-15';
  const dateTo = (req.query.dateTo) ? req.query.dateTo : '2018-11-12';
  const orientation = (req.query.orientation) ? req.query.orientation : 'h';
  const fit = (req.query.fit) ? req.query.fit : 'cover';
  const share = (req.query.share) ? req.query.share : '';

  try {
    const downloadPath = `${process.env.DOWNLOAD_FOLDER}`;
    const resultPath = `${process.env.RESULT_FOLDER}`;
    const outputPath = `${resultPath}/output.jpg`;
    
    if (!fs.existsSync(downloadPath) || !fs.existsSync(resultPath)) {
      res.json({ error: "Download folders not found" });
    }

    const images = await article.getImagesFromDateRange(dateFrom, dateTo);
    const config = barcode.createConfig(orientation, fit, images.length, width, height);
    const updatedImages = barcode.createImagePaths(images, fit, config.width, config.height);
    const imagePromises = barcode.getImages(config, updatedImages, orientation, downloadPath);

    Promise.all(imagePromises)
      .then(function(values) {
        const finalImage = barcode.createStitchedImage(config, imagePromises, downloadPath, orientation, outputPath);
        finalImage
          .then(() => shareCheck(share, outputPath))
          .then(() => {
            let img = fs.readFileSync(outputPath);
            res.writeHead(200, {'Content-Type': 'image/jpg' });
            res.end(img, 'binary');
          })
          .catch((err) => {
            res.json({ error: `finalImage: ${err}` });
          });
      })
      .catch((err) => {
        res.json({ error: `imagePromises: ${err}` });
      });
	} catch (err) {
    next(err);
    res.json({ error: `router: ${err}` });
	}
});

function shareCheck(share, outputPath){
  if(share === 'twitter'){
    barcode.postTwitter('I am a tweet', outputPath);
  }
}

module.exports = router;
