
const https = require('https');
const filesystem = require("fs");
const crypto = require('crypto');
const twitter = require('twitter');
const graphicsmagick = require("gm");
const sharp = require('sharp');
const rgbHex = require('rgb-hex');
const colorSort = require('color-sort');
const average = require('image-average-color');

function createHash(...items){
  return crypto.createHash('md5').update(items.toString()).digest("hex");
}

function createConfig(orientation, fit, num, width, height, paths, sort){
  const config = {
    orientation : orientation,
    width: parseInt(width),
    height: parseInt(height),
    span: 0,
    fit: fit,
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
  let width = 0;
  let height = 0;
  let fit = "";

  if(config.fit === 'solid'){
    width = 1;
    height = 1;
    fit = 'fill';
  } else if(config.fit === 'fill'){
    width = 10;
    height = 10;
    fit = 'fill';
  } else if(config.fit === 'cover'){
    width = config.width;
    height = config.height;
    fit = 'cover';
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

  const data = filesystem.readFileSync(mediaPath);

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
    let fit = (config.fit === 'solid') ? 'fill' : config.fit;
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
      let writeStream = filesystem.createWriteStream(destination);
      downloadStream.pipe(resizeTransform).pipe(writeStream);

      const winState = { id: imageItem.id, status: 1 };
      const failState = { id: imageItem.id, status: 0 };

      writeStream.on('finish', () => {
        writeStream.end();
        resolve(winState);
      });

      writeStream.on('error', (err) => { reject(failStated); });
      downloadStream.on('error', (err) => { reject(failState); });
      resizeTransform.on('error', (err) => { reject(failState); });
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

    if(config.sort === 'colour'){
      imageIDs = await colourSortIDs(config, imageIDs);
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

async function colourSortIDs(config, imageIDs){
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
    .then(values => sortByHex(values))
    .then(values => {
      returnedImageIDs = values;
      return values;
    })
    .catch(function(err){
      console.log(err);
    });

  return returnedImageIDs;
}

function sortByHex(imageData){
  let justHexes = imageData.map(item => item.hex);
  let sortedArray = colorSort(justHexes);
  let sortedImageIds = [];
  
  sortedArray.forEach(hex => {
    imageData.forEach((image, index) => {
      if(image != null && image.hex === hex){
        sortedImageIds.push(image.id);
        imageData[index] = null;
      }
    })
  });

  return sortedImageIds;
}

module.exports = {
  createHash,
  createConfig,
  createImagePaths,
  postTwitter,
  getImagePromises,
  getDownloadPromise,
  createStitchedImage
};
