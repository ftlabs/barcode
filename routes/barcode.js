const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const cache = require('../helpers/cache');
const valid = require('../helpers/validation');
const article = require('../modules/Article');
const barcode = require('../modules/Barcode');

// barf on startup if these folders are not specified in env or set up
const ORIENTATIONS  = ['v', 'h'];
const FITS          = ['cover', 'fill'];
const FOLDER_PARAMS = ['DOWNLOAD_FOLDER', 'RESULT_FOLDER'];

try{
  FOLDER_PARAMS.forEach( param => {
    const val = process.env[param];
    if (val === undefined) {
      throw new Error(`${param} not specified in env`);
    }

    if (!fs.existsSync(val)) {
      throw new Error(`${param}, ${val}, not found`);
    }

  });

  ORIENTATIONS.forEach( orientation => {
    FITS.forEach( fit => {
      const path = `${process.env.DOWNLOAD_FOLDER}/${fit}-${orientation}`;

      if (!fs.existsSync(path)) {
        throw new Error(`DOWNLOAD sub FOLDER, ${path}, not found`);
      }
    })
  });
} catch (err) {
  throw new Error(`startup, pre-router: ${err}`);
}

router.get('/', async (req, res, next) => {
  const width = (req.query.width) ? req.query.width : 1024;
  const height = (req.query.height) ? req.query.height : 768;
  const dateFrom = (req.query.dateFrom) ? req.query.dateFrom : '2018-11-15';
  const dateTo = (req.query.dateTo) ? req.query.dateTo : '2018-11-16';
  const timeFrom = (req.query.timeFrom) ? req.query.timeFrom : '00:00:00';
  const timeTo = (req.query.timeTo) ? req.query.timeTo : '00:00:00';
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
    {name: 'timeFrom', value: timeFrom, type: 'time'},
    {name: 'timeTo', value: timeTo, type: 'time'},
    {name: 'Orientation', value: orientation, type: 'alpha', selection: ORIENTATIONS},
    {name: 'Fit', value: fit, type: 'alpha', selection: FITS},
    {name: 'Share', value: share, type: '', selection: ['', 'twitter']},
  ]);

  if(validation.length != 0){
    return res.json({ errors: validation });
  }

  try {
    const hash = barcode.createHash(width, height, dateFrom, dateTo, timeFrom, timeTo, orientation, fit, share);
    const finalFilepath = `${process.env.RESULT_FOLDER}/output_${hash}.jpg`;

    if(cache.get(hash)){
      res.writeHead(200, {'Content-Type': 'image/jpg' });
      return res.end(fs.readFileSync(finalFilepath), 'binary');
    }

    const paths = {
      downloads: `${process.env.DOWNLOAD_FOLDER}/${fit}-${orientation}`,
      result: `${process.env.RESULT_FOLDER}`,
      output: finalFilepath
    };

    const allImageIds = await article.getImageIdsFromDateRange(dateFrom, dateTo, timeFrom, timeTo);

    if(allImageIds.length <= 0){
      return res.json({ error: `No images found with the search parameters, please adjust your date range and try again` });
    }

    const config = barcode.createConfig(orientation, fit, allImageIds.length, width, height, paths);
    const imageFolder = `${fit}-${orientation}`;

    const uncachedImages = getUncachedImages(allImageIds, fit, cache.get(imageFolder));
    const uncachedImagePaths = barcode.createImagePaths(config, uncachedImages);
    const uncachedImagePromises = barcode.getImagePromises(config, uncachedImagePaths);

    Promise.all(uncachedImagePromises)
      .then(values => splitNewAndFailed(values))
      .then(promiseResults => {

        //add new images to cache
        const fitImageList = cache.get(imageFolder);
        if(fitImageList && fitImageList.length > 0){
          const newList = fitImageList.concat(promiseResults.new);
          cache.set(imageFolder, newList);
        } else {
          cache.set(imageFolder, promiseResults.new);
        }

        //remove missing images from allImageIds
        const failedImages = promiseResults.failed;
        failedImages.forEach(id => {
          allImageIds.splice(allImageIds.indexOf(id), 1);
        });

        //stitch new image
        barcode.createStitchedImage(config, allImageIds)
          .then(() => shareCheck(share, config.paths.output))
          .then(() => {
            res.writeHead(200, {'Content-Type': 'image/jpg' });
            res.end(fs.readFileSync(config.paths.output), 'binary');
            cache.set(hash, finalFilepath);
            return;
          })
          .catch((err) => {
            return res.json({ error: `finalImage: ${err}` });
          });

      })
      .catch((err) => {
        return res.json({
          error: 'Issue downloading all images',
          message: `${err}`
        });
      });
	} catch (err) {
    return res.json({ error: `router: ${err}` });
  }

});

function getUncachedImages(imageIds, fit, fitImageList){
  const missingImages = [];

  if(fitImageList && fitImageList.length > 0){
    imageIds.forEach(id => {
      if(!fitImageList.includes(id)){
        missingImages.push(id);
      }
    });
    return missingImages;
  }

  return imageIds;
}

function splitNewAndFailed(values){
  const newImages = [];
  const failedImages = [];

  values.forEach(item => {
    if(item.status){
      newImages.push(item.id);
    } else {
      failedImages.push(item.id);
    }
  })

  return {
    new: newImages,
    failed: failedImages
  }
}

function shareCheck(share, imagePath){
  if(share === 'twitter'){
    barcode.postTwitter('I am a test tweet', imagePath);
  }
}


module.exports = router;
