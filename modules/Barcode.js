const download = require('image-downloader');
const graphicsmagick = require("gm");
const filesystem = require("fs");
const twitter = require('twitter');

function validateVars(input){
  const errors = [];
  input.forEach(item => {
    switch(item.type){
      case 'dimensions':
        if(typeof(item.value) !== 'number' && item.value % 1 != 0 && item.value > 10) {
          errors.push(`${item.name} needs to be a positive whole number greater than 10`);
        }
        break;
      case 'alpha':
        const alpha = /([a-zA-Z].*)/;
        if(!alpha.test(item.value)) {
          errors.push(`${item.name} needs to be just alpha (a-z) characters`);
        }
        break;
      case 'date':
        const datePattern = /([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/;
        if(!datePattern.test(item.value)) {
          errors.push(`${item.name} needs to be a date value in the yyyy-mm-dd format`);
        }
        break;
      case 'datePast':
        if(item.value > getCurrentDate()){
          errors.push(`${item.name} must be in the past`);
        }
        break;
      case 'greaterThan':
        if(item.value[0] < item.value[1]) {
          errors.push(`${item.name[0]} needs to be greater than ${item.name[1]}`);
        }
        break;
      case 'lessThan':
        if(item.value[0] > item.value[1]) {
          errors.push(`${item.name[0]} needs to be less than ${item.name[1]}`);
        }
        break;
    }
    if('selection' in item && item.selection.indexOf(item.value) < 0){
      errors.push(`${item.name} needs to be one of the following values: ${item.selection.join(',')}`);
    }
  });
  return errors;
}

function getCurrentDate(){
    var x = new Date();
    var y = x.getFullYear().toString();
    var m = (x.getMonth() + 1).toString();
    var d = x.getDate().toString();
    (d.length == 1) && (d = '0' + d);
    (m.length == 1) && (m = '0' + m);
    return `${y}-${m}-${d}`;
}

function createConfig(orientation, fit, num, width, height, paths){
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
  images.forEach((image, i) => {
    promiseList.push(getDownloadPromise(config, image, i, config.orientation, config.paths.downloads));
  });
  return promiseList;
}

function getDownloadPromise(config, image, i) {
  return newPromise = new Promise(function(resolve, reject) {
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

function createStitchedImage(config, imagePromises){
  return new Promise(function(resolve, reject) {
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
  validateVars,
  createConfig,
  createImagePaths,
  postTwitter,
  getImages,
  getDownloadPromise,
  createStitchedImage
};
