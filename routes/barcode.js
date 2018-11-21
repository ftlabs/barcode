const express = require('express');
const download = require('image-downloader');
const graphicsmagick = require("gm");
const fs = require("fs");
const twitter = require('twitter');
const router = express.Router();
const article = require('../modules/Article');

router.get('/', async (req, res, next) => {
  const width = (req.query.width) ? req.query.width : 1024;
  const height = (req.query.height) ? req.query.height : 768;
  const dateFrom = (req.query.dateFrom) ? req.query.dateFrom : '2018-11-15';
  const dateTo = (req.query.dateTo) ? req.query.dateTo : '2018-11-12';
  const orientation = (req.query.orientation) ? req.query.orientation : 'h';
  const fit = (req.query.fit) ? req.query.fit : 'cover';
  const share = (req.query.share) ? req.query.share : '';

  try {
    const images = await article.getImagesFromDateRange(dateFrom, dateTo);
    const config = createConfig(orientation, fit, images.length, width, height);
    const updatedImages = createImages(images, fit, config.width, config.height);
    const outputPath = './downloads/_result/output.jpg';
    const imagePromises = [];
    
    updatedImages.forEach((image, i) => {
      const newPromise = new Promise(function(resolve, reject) {
        const options = {
          url: image,
          dest: `./downloads/${pad((i + 1), 5, '0')}.jpg`
        };
        
        download.image(options)
          .then(({ filename, image }) => {
            if(orientation === 'h'){
              graphicsmagick(filename)
                .resize(config.width, config.span, "!")
                .write(filename, function (err) {
                  if (err) {
                    console.log(err);
                    res.json({ error: err });
                  }
                  resolve();
                });
            } else {
              graphicsmagick(filename)
                .resize(config.span, config.height, "!")
                .write(filename, function (err) {
                  if (err){
                    console.log(err);
                    res.json({ error: err });
                  }
                  resolve();
                });
            }
          })
          .catch((err) => {
            console.error(err);
            res.json({ error: err });
            reject();
          });
      });

      imagePromises.push(newPromise);
    });

    Promise.all(imagePromises)
      .then(function(values) {
        let promise = new Promise(function(resolve, reject) {
          let renderGm = graphicsmagick();

          for(let i = 0; i < imagePromises.length; i++){
            const name = pad((i + 1), 5, '0');
            const pos = (i * config.span);

            if(orientation === 'h'){
              renderGm.in('-page', `+0+${pos}`)
                .in(`./downloads/${name}.jpg`);
            } else {
              renderGm.in('-page', `+${pos}+0`)
                .in(`./downloads/${name}.jpg`);
            }
          }

          renderGm.mosaic()
            .write(outputPath, function (err) {
                if (err) console.log(err);
                resolve();
            });
        });
        
        promise
          .then(function(value) {
            if(share === 'twitter'){
              postTwitter('I am a tweet', outputPath);
            }

            let img = fs.readFileSync(outputPath);
            res.writeHead(200, {'Content-Type': 'image/jpg' });
            res.end(img, 'binary');
          })
          .catch((err) => {
            console.error(err);
          });
      })
      .catch((err) => {
        console.error(err);
      });
	} catch (err) {
		next(err);
	}
});

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

function createImages(images, fit, width, height){
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

  let data = fs.readFileSync(mediaPath);

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

function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

module.exports = router;
