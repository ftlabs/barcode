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

  try {
    const images = await article.getImagesFromDateRange(dateFrom, dateTo);
    const config = {
      width: width,
      height: height,
      span: 0,
      fit: fit
    };

    if(orientation === 'h'){
      config.height = Math.ceil( (height/100) * (100 / images.length) );
      config.span = config.height;
    } else {
      config.width = Math.ceil( (width/100) * (100 / images.length) );
      config.span = config.width;
    }

    const updatedImages = images.map(url => {
      const parts = url.split('?');
      return parts[0].concat(`?source=ftlabs-barcode&width=${config.width}&height=${config.height}&quality=lowest&fit=${fit}`);
    });
    

    const imagePromises = [];
    
    updatedImages.forEach((image, i) => {
      const newPromise = new Promise(function(resolve, reject) {

        const name = pad((i + 1), 5, '0');
        const options = {
          url: image,
          dest: `./downloads/${name}.jpg`
        };
        
        download.image(options)
          .then(({ filename, image }) => {
            console.log('File saved to', filename)
            resolve();
          })
          .catch((err) => {
            console.error(err)
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
              renderGm
                .in('-page', `+0+${pos}`)
                .in(`./downloads/${name}.jpg`);
            } else {
              renderGm
                .in('-page', `+${pos}+0`)
                .in(`./downloads/${name}.jpg`);
            }
          }
  
          renderGm.mosaic()
            .write('./downloads/_result/output.jpg', function (err) {
                if (err) console.log(err);
                resolve();
            });

        });
        
        promise
          .then(function(value) {

            var client = new twitter({
              consumer_key: process.env.TWITTER_CONSUMER_KEY,
              consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
              access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
              access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
            });

            // Load your image
            var data = fs.readFileSync('./downloads/_result/output.jpg');

            // Make post request on media endpoint. Pass file data as media parameter
            client.post('media/upload', {media: data}, function(error, media, response) {

              if (!error) {

                console.log(media);

                var status = {
                  status: 'I am a tweet',
                  media_ids: media.media_id_string
                }

                client.post('statuses/update', status, function(error, tweet, response) {

                  //console.log(response);

                  if (!error) {
                    console.log(tweet);
                  }
                });

              }
            });

            let img = fs.readFileSync('./downloads/_result/output.jpg');
            res.writeHead(200, {'Content-Type': 'image/jpg' });
            res.end(img, 'binary');

          })
          .catch((err) => {
            console.error(err);
          });
      })
      .catch((err) => {
        console.error(err)
      });
	} catch (err) {
		next(err);
	}
});


function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

module.exports = router;
