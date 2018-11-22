const download = require('image-downloader');
const graphicsmagick = require("gm");
const filesystem = require("fs");
const path = require('path');
const twitter = require('twitter');

function createConfig(orientation, fit, num, width, height){
  const config = {
    width: width,
    height: height,
    span: 0,
    fit: fit
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

function createImagePaths(images, fit, width, height){
  if(fit === 'fill'){
    return images.map(url => {
      const parts = url.split('?');
      return parts[0].concat(`?source=ftlabs-barcode&width=10&height=10&quality=highest&fit=${fit}`);
    });
  }
  
  return images.map(url => {
    const parts = url.split('?');
    return parts[0].concat(`?source=ftlabs-barcode&width=${width}&height=${height}&quality=highest&fit=${fit}`);
  });
}

function postTwitter(message, mediaPath){
  let client = new twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
  });

  let data = filesystem.readFileSync(mediaPath);

  client.post('media/upload', {media: data}, function(error, media, response) {
    if (!error) {
      let status = {
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

function getImages(config, images, orientation, downloadPath) {
  const promiseList = [];
  images.forEach((image, i) => {
    promiseList.push(getDownloadPromise(config, image, i, orientation, downloadPath));
  });
  return promiseList;
}

function getDownloadPromise(config, image, i, orientation, downloadPath) {
  return newPromise = new Promise(function(resolve, reject) {
    const options = {
      url: image,
      dest: `${downloadPath}/${pad((i + 1), 5, '0')}.jpg`
    };

    download.image(options)
      .then(({ filename }) => {

        if(orientation === 'h'){
          graphicsmagick(filename)
            .resize(config.width, config.span, "!")
            .write(filename, function (err) {
              if (err) {
                throw err;
              }
              resolve();
            });
        } else {
          graphicsmagick(filename)
            .resize(config.span, config.height, "!")
            .write(filename, function (err) {
              if (err){
                throw err;
              }
              resolve();
            });
        }
      })
      .catch((err) => {
        throw err;
      });
  });
}

function createStitchedImage(config, imagePromises, downloadPath, orientation, outputPath){
  return new Promise(function(resolve, reject) {
    let renderGm = graphicsmagick();

    for(let i = 0; i < imagePromises.length; i++){
      const name = pad((i + 1), 5, '0');
      const pos = (i * config.span);

      if(orientation === 'h'){
        renderGm.in('-page', `+0+${pos}`)
          .in(`${downloadPath}/${name}.jpg`);
      } else {
        renderGm.in('-page', `+${pos}+0`)
          .in(`${downloadPath}/${name}.jpg`);
      }
    }

    renderGm.mosaic()
      .write(outputPath, function (err) {
          if (err){
            throw err;
          };
          resolve();
      });
  });
}

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}


module.exports = {
  createConfig,
  createImagePaths,
  postTwitter,
  getImages,
  getDownloadPromise,
  createStitchedImage,
  pad
};
