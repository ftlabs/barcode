const download = require('image-downloader');
const graphicsmagick = require("gm");
const filesystem = require("fs");
const twitter = require('twitter');
const crypto = require('crypto');

function createHash(...vars){
  return crypto.createHash('md5').update(vars.toString()).digest("hex");
}

function createConfig(orientation, fit, num, width, height, paths){
  console.log('createConfig');
  const config = {
    orientation : orientation,
    width: width,
    height: height,
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
  console.log('createImagePaths');
  if(config.fit === 'fill'){
    return images.map(url => {
      const parts = url.split('?');
      return parts[0].concat(`?source=ftlabs-barcode&width=10&height=10&quality=highest&fit=${config.fit}`);
    });
  }
  
  return images.map(url => {
    const parts = url.split('?');
    return parts[0].concat(`?source=ftlabs-barcode&width=${config.width}&height=${config.height}&quality=highest&fit=${config.fit}`);
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

function getImages(config, images) {
  const promiseList = [];
  console.log('getImages');
  images.forEach((image, i) => {
    promiseList.push(getDownloadPromise(config, image, i, config.orientation, config.paths.downloads));
  });
  console.log('getImages: out');
  return promiseList;
}

function getDownloadPromise(config, image, i) {
  return new Promise(function(resolve, reject) {
    const options = {
      url: image,
      dest: `${config.paths.downloads}/${pad((i + 1), 5, '0')}.jpg`
    };

    download.image(options)
      .then(({ filename }) => {
        if(config.orientation === 'h'){
          graphicsmagick(filename)
            .resize(config.width, config.span, "!")
            .write(filename, function (err) {
              if (err) {
                console.log('download if' + err)
                throw err;
              }
              resolve();
            });
        } else {
          graphicsmagick(filename)
            .resize(config.span, config.height, "!")
            .write(filename, function (err) {
              if (err){
                console.log('download else' + err)
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

function createStitchedImage(config, imagePromises){
  console.log('createStitchedImage');
  return new Promise(function(resolve) {
    const renderGm = graphicsmagick();

    for(let i = 0; i < imagePromises.length; i++){
      const name = pad((i + 1), 5, '0');
      const pos = (i * config.span);

      if(config.orientation === 'h'){
        renderGm.in('-page', `+0+${pos}`)
          .in(`${config.paths.downloads}/${name}.jpg`);
      } else {
        renderGm.in('-page', `+${pos}+0`)
          .in(`${config.paths.downloads}/${name}.jpg`);
      }
    }

    renderGm.mosaic()
      .write(config.paths.output, function (err) {
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
  createHash,
  createConfig,
  createImagePaths,
  postTwitter,
  getImages,
  getDownloadPromise,
  createStitchedImage
};
