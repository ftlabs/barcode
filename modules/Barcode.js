const sharp = require('sharp');
const https = require('https');
const graphicsmagick = require("gm");
const filesystem = require("fs");
const twitter = require('twitter');
const crypto = require('crypto');

function createHash(...items){
  return crypto.createHash('md5').update(items.toString()).digest("hex");
}

function createConfig(orientation, fit, num, width, height, paths){
  const config = {
    orientation : orientation,
    width: parseInt(width),
    height: parseInt(height),
    span: 0,
    fit: fit,
    paths: paths
  };

  if(fit === 'fill'){
    if(orientation === 'h'){
      config.span = Math.ceil( (height/100) * (100 / num) );
    } else {
      config.span = Math.ceil( (width/100) * (100 / num) );
    }
  } else {
    if(orientation === 'h'){
      config.height = Math.ceil( (height/100) * (100 / num) );
      config.span = config.height;
    } else {
      config.width = Math.ceil( (width/100) * (100 / num) );
      config.span = config.width;
    }
  }
  return config;
}

function createImagePaths(config, images){
  const width = (config.fit === 'fill') ? 10 : config.width;
  const height = (config.fit === 'fill') ? 10 : config.height;
  return images.map(id => {
    return {
      id: id,
      path: `https://www.ft.com/__origami/service/image/v2/images/raw/http%3A%2F%2Fprod-upp-image-read.ft.com%2F${id}?source=ftlabs-barcode&width=${width}&height=${height}&quality=highest&fit=${config.fit}`
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
    const destination = `${config.paths.downloads}/${imageItem.id}.jpg`;
    let width;
    let height;

    if(config.fit === 'fill'){
      width =  (config.orientation === 'h') ? 2000 : 10;
      height =  (config.orientation === 'h') ? 10 : 2000;
    } else {
      width =  (config.orientation === 'h') ? config.width : config.span;
      height =  (config.orientation === 'h') ? config.span : config.height;
    }

    const resizeTransform = sharp().resize(width, height , { fit: config.fit });

    https.get(imageItem.path, downloadStream => {
      let writeStream = filesystem.createWriteStream(destination);
      downloadStream.pipe(resizeTransform).pipe(writeStream);

      const winState = {
        id: imageItem.id,
        status: 1
      }
      const failState = {
        id: imageItem.id,
        status: 0
      }

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
  return new Promise(function(resolve) {
    const renderGm = graphicsmagick();

    imageIDs.forEach(image => {
      renderGm.montage(`${config.paths.downloads}/${image}.jpg`);
    });

    if(config.orientation === 'v'){
      renderGm.tile(`${imageIDs.length}x1`);
    } else {
      renderGm.tile(`1x${imageIDs.length}`);
    }

    if(config.fit === 'fill'){
      renderGm.geometry('+0+0').resize(config.width, config.height, "!");
    } else {
      renderGm.geometry('+0+0');
    }

    renderGm.write(config.paths.output, function (err) {
        if (err){
          throw err;
        };
        resolve();
    });
  });
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
