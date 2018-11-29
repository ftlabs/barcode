const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const valid = require('../helpers/validation');
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
  const validation = valid.validateVars([
    {name: 'Width', value: width, type: 'dimensions'},
    {name: 'Height', value: height, type: 'dimensions'},
    {name: 'DateFrom', value: dateFrom, type: 'date'},
    {name: 'DateFrom', value: dateFrom, type: 'datePast'},
    {name: 'DateTo', value: dateTo, type: 'date'},
    {name: 'DateTo', value: dateTo, type: 'datePast'},
    {name: ['dateFrom', 'dateTo'], value: [dateFrom, dateTo], type: 'lessThan'},
    {name: ['dateFrom', 'dateTo'], value: [dateFrom, dateTo], type: 'notMatching'},
    {name: ['dateFrom', 'dateTo'], value: [dateFrom, dateTo], type: 'dateRangeLimit', limit: 5},
    {name: 'Orientation', value: orientation, type: 'alpha', selection: ['v', 'h']},
    {name: 'Fit', value: fit, type: 'alpha', selection: ['cover', 'fill']},
    {name: 'Share', value: share, type: '', selection: ['', 'twitter']},
  ]);

  if(validation.length != 0){
    return res.json({ errors: validation });
  }

  try {
    const hash = barcode.createHash(width, height, dateFrom, dateTo, orientation, fit, share);
    const finalFilepath = `${process.env.RESULT_FOLDER}/output_${hash}.jpg`;

    if(fs.existsSync(finalFilepath)){
      res.writeHead(200, {'Content-Type': 'image/jpg' });
      res.end(fs.readFileSync(finalFilepath), 'binary');
      return;
    }

    createHashFolder(hash, process.env.DOWNLOAD_FOLDER);

    const paths = {
      downloads: `${process.env.DOWNLOAD_FOLDER}/${hash}`,
      result: `${process.env.RESULT_FOLDER}`,
      output: finalFilepath
    };
    
    if (!fs.existsSync(paths.downloads) || !fs.existsSync(paths.result)) {
      return res.json({ error: "Download folders not found" });
    }

    if(path.isAbsolute(paths.downloads) || path.isAbsolute(paths.result)) {
      return res.json({ error: "Download folders need to be relative paths" });
    }

    const images = await article.getImagesFromDateRange(dateFrom, dateTo);

    if(images.length <= 0){
      return res.json({ error: `No images found with the search parameters, please adjust your date range and try again` });
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
            removeHashFolderAndContents(hash, process.env.DOWNLOAD_FOLDER);
            res.writeHead(200, {'Content-Type': 'image/jpg' });
            res.end(fs.readFileSync(config.paths.output), 'binary');
            return;
          })
          .catch((err) => {
            return res.json({ error: `finalImage: ${err}` });
          });
      })
      .catch((err) => {
        return res.json({ error: `imagePromises: ${err}` });
      });
	} catch (err) {
    next(err);
    return res.json({ error: `router: ${err}` });
	}
});

function shareCheck(share, imagePath){
  if(share === 'twitter'){
    barcode.postTwitter('I am a test tweet', imagePath);
  }
}

function createHashFolder(hash, dir){
  if (!fs.existsSync(`${dir}/${hash}`)){
    fs.mkdirSync(`${dir}/${hash}`);
  }
}

function removeHashFolderAndContents(hash, dir){
  const dirPath = `${dir}/${hash}`;
  let files;
  try {
    files = fs.readdirSync(dirPath);
  } catch(e) {
    return;
  }
  if (files.length > 0)
    for (let i = 0; i < files.length; i++) {
      const filePath = dirPath + '/' + files[i];
      if (fs.statSync(filePath).isFile())
        fs.unlinkSync(filePath);
      else
        rmDir(filePath);
    }
  fs.rmdirSync(dirPath);
}

module.exports = router;
