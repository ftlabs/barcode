const https = require('https');
const fs = require('fs');
const crypto = require('crypto');
const twitter = require('twitter');
const graphicsmagick = require("gm");
const sharp = require('sharp');
const rgbHex = require('rgb-hex');
const colorSort = require('color-sort');
const average = require('image-average-color');

const { today } = require('../helpers/utils');
const cache = require('../helpers/cache');
const article = require('../modules/Article');

function createHash(items){
  return crypto.createHash('md5').update(JSON.stringify(items)).digest("hex");
}

function createConfig(orientation, fit, num, width, height, paths, order, sort){
  const config = {
    orientation : orientation,
    width: parseInt(width),
    height: parseInt(height),
    span: 0,
    fit: fit,
    order: order,
    sort: sort,
    paths: paths
  };

  if(orientation === 'h'){
    config.span = Math.ceil( (height/100) * (100 / num) );
  } else {
    config.span = Math.ceil( (width/100) * (100 / num) );
  }
  
  return config;
}

function createImagePaths(config, images){
  const fit = (config.fit === 'solid') ? 'fill' : config.fit;
  let width = 0;
  let height = 0;

  if(config.fit === 'solid'){
    width = 1;
    height = 1;
  } else if(config.fit === 'fill'){
    width = 10;
    height = 10;
  } else if(config.fit === 'cover'){
    width = config.width;
    height = config.height;
  }

  return images.map(id => {
    return {
      id: id,
      path: `https://www.ft.com/__origami/service/image/v2/images/raw/http%3A%2F%2Fprod-upp-image-read.ft.com%2F${id}?source=ftlabs-barcode&format=jpg&width=${width}&height=${height}&quality=highest&fit=${fit}`
    };
  });
}

function postTwitter(message, mediaPath){
  const client = new twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
  });

  const data = fs.readFileSync(mediaPath);

  client.post('media/upload', {media: data}, function(error, media, response) {
    if (!error) {
      const status = {
        status: message,
        media_ids: media.media_id_string
      }
      client.post('statuses/update', status, function(error, tweet, response) {
        if (!error) {
          console.log(tweet);
        }
      });
    }
  });
}

function getImagePromises(config, paths) {
  const promiseList = [];
  paths.forEach(imageItem => {
    promiseList.push(getDownloadPromise(config, imageItem));
  });
  return promiseList;
}

function getDownloadPromise(config, imageItem) {
  const downloadPromise = new Promise(function(resolve, reject) {
    const minFillDimension = 10;
    const maxFillDimension = 2000;
    const destination = `${config.paths.downloads}/${imageItem.id}.jpg`;
    const fit = (config.fit === 'solid') ? 'fill' : config.fit;
    let width;
    let height;

    if(config.fit === 'fill'){
      width = (config.orientation === 'h') ? maxFillDimension : minFillDimension;
      height = (config.orientation === 'h') ? minFillDimension : maxFillDimension;
    } else {
      width = (config.orientation === 'h') ? config.width : config.span;
      height = (config.orientation === 'h') ? config.span : config.height;
    }

    const resizeTransform = sharp().resize(width, height, { fit: fit });

    https.get(imageItem.path, downloadStream => {
      let writeStream = fs.createWriteStream(destination);
      downloadStream.pipe(resizeTransform).pipe(writeStream);

      const winState = { id: imageItem.id, status: 1 };
      const failState = { id: imageItem.id, status: 0 };

      writeStream.on('finish', () => {
        writeStream.end();
        resolve(winState);
      });

      writeStream.on('error', (err) => { resolve(failStated); });
      downloadStream.on('error', (err) => { resolve(failState); });
      resizeTransform.on('error', (err) => { resolve(failState); });
    });
  })
  .catch(function(err){
    console.log(err);
  });

  return downloadPromise;
}

function createStitchedImage(config, imageIDs){
  return new Promise(async function(resolve) {
    const renderGm = graphicsmagick();

    if(config.order === 'colour'){
      imageIDs = await colourOrderIDs(config, imageIDs);
    }

    if(config.sort === 'desc'){
      imageIDs.reverse();
    }

    imageIDs.forEach(image => {
      renderGm.montage(`${config.paths.downloads}/${image}.jpg`);
    });

    if(config.orientation === 'v'){
      renderGm.tile(`${imageIDs.length}x1`);
    } else {
      renderGm.tile(`1x${imageIDs.length}`);
    }

    renderGm.geometry('+0+0')
      .resizeExact(config.width, config.height)
      .write(config.paths.output, function (err) {
        if (err){
          throw err;
        };
        resolve();
    });
  });
}

async function colourOrderIDs(config, imageIDs){
  let returnedImageIDs = [];
  let colourPromises = [];
    
  imageIDs.forEach(image => {
    const colourPromise = new Promise(function(resolve){
      average(`${config.paths.downloads}/${image}.jpg`, (err, color) => {
        if (err) throw err;
        let [red, green, blue] = color;
        resolve({
          id: image,
          hex: `#${rgbHex(red, green, blue)}`
        });
      });
    });

    colourPromises.push(colourPromise);
  });

  await Promise.all(colourPromises)
    .then(values => orderByHex(values))
    .then(values => {
      returnedImageIDs = values;
      return values;
    })
    .catch(function(err){
      console.log(err);
    });

  return returnedImageIDs;
}

function orderByHex(imageData){
  let justHexes = imageData.map(item => item.hex);
  let orderedArray = colorSort(justHexes);
  let orderedImageIds = [];
  
  orderedArray.forEach(hex => {
    imageData.forEach((image, index) => {
      if(image != null && image.hex === hex){
        orderedImageIds.push(image.id);
        imageData[index] = null;
      }
    })
  });

  return orderedImageIds;
}

function todaysParams(){
  return {
    width: 1024,
    height: 768,
    dateFrom: today(-1),
    dateTo: today(),
    timeFrom: '00:00:00',
    timeTo: '00:00:00',
    orientation: 'v',
    fit: 'fill',
    order: 'colour',
    sort: 'asc',
    share: ''
  };
}

async function generateAndSendBarcode(params, finalFilepath, hash, res) {
    if(cache.get(hash) && res){
      res.writeHead(200, {'Content-Type': 'image/jpg' });
      return res.end(fs.readFileSync(finalFilepath), 'binary');
    }

    const paths = {
      imageFolder: `${params.fit}-${params.orientation}`,
      downloads: `${process.env.DOWNLOAD_FOLDER}/${params.fit}-${params.orientation}`,
      result: `${process.env.RESULT_FOLDER}`,
      output: finalFilepath
    };

    const allImageIds = await article.getImageIdsFromDateRange(params.dateFrom, params.dateTo, params.timeFrom, params.timeTo);

    if(allImageIds.length <= 0){
      if(res) {
        return res.json({ error: `No images found with the search parameters, please adjust your date range and try again` }); 
      }
      
      return undefined;
    }

    const config = createConfig(params.orientation, params.fit, allImageIds.length, params.width, params.height, paths, params.order, params.sort);
    const uncachedImages = getUncachedImages(allImageIds, params.fit, cache.get(paths.imageFolder));
    const uncachedImagePaths = createImagePaths(config, uncachedImages);
    const uncachedImagePromises = getImagePromises(config, uncachedImagePaths);

    return Promise.all(uncachedImagePromises)
      .then(values => splitNewAndFailed(values))
      .then(async promiseResults => {

        //add new images to cache
        const fitImageList = cache.get(paths.imageFolder);
        if(fitImageList && fitImageList.length > 0){
          const newList = fitImageList.concat(promiseResults.new);
          cache.set(paths.imageFolder, newList);
        } else {
          cache.set(paths.imageFolder, promiseResults.new);
        }

        //remove missing images from allImageIds
        const failedImages = promiseResults.failed;
        failedImages.forEach(id => {
          allImageIds.splice(allImageIds.indexOf(id), 1);
        });

        //stitch new image
        return await createStitchedImage(config, allImageIds)
          .then(() => shareCheck(params.share, config.paths.output))
          .then(() => {
            if(res) {  
              res.writeHead(200, {'Content-Type': 'image/jpg' });
              res.end(fs.readFileSync(config.paths.output), 'binary'); 
            }
            cache.set(hash, finalFilepath);
            return hash;
          })
          .catch((err) => {
            if(res) {
              return res.json({ error: `finalImage: ${err}` }); 
            }
            return undefined;
          });

      })
      .catch((err) => {
        if(res) {
          return res.json({
            error: 'Issue downloading all images',
            message: `${err}`
          });
        }
        return undefined;
      });
}

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

module.exports = {
  createHash,
  createConfig,
  createImagePaths,
  postTwitter,
  getImagePromises,
  getDownloadPromise,
  createStitchedImage,
  todaysParams,
  generateAndSendBarcode
};
