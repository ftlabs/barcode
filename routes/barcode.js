const express = require('express');
const fs = require('fs');
const router = express.Router();
const time = require('../helpers/time');
const valid = require('../helpers/validation');
const barcode = require('../modules/Barcode');
const queue = require('../helpers/responseQueue');

// barf on startup if these folders are not specified in env or set up
const ORIENTATIONS  = ['v', 'h'];
const FITS          = ['cover', 'fill', 'solid'];
const ORDERS        = ['published', 'colour'];
const SORTS         = ['asc', 'desc'];
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

router.get('/', async (req, res) => {
  const width = (req.query.width) ? req.query.width : 1024;
  const height = (req.query.height) ? req.query.height : 768;
  const dateFrom = (req.query.dateFrom) ? req.query.dateFrom : time.yesterday();
  const dateTo = (req.query.dateTo) ? req.query.dateTo : time.today();
  const timeFrom = (req.query.timeFrom) ? req.query.timeFrom : '00:00:00';
  const timeTo = (req.query.timeTo) ? req.query.timeTo : '00:00:00';
  const orientation = (req.query.orientation) ? req.query.orientation : 'v';
  const fit = (req.query.fit) ? req.query.fit : 'fill';
  const order = (req.query.order) ? req.query.order : 'colour';
  const sort = (req.query.sort) ? req.query.sort : 'asc';
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
    {name: 'Order', value: order, type: 'alpha', selection: ORDERS},
    {name: 'Sort', value: sort, type: 'alpha', selection: SORTS},
    {name: 'Share', value: share, type: '', selection: ['', 'twitter']},
  ]);

  if(validation.length != 0){
    return res.json({ errors: validation });
  }
  
  try {
    const params = { width, height, dateFrom, dateTo, timeFrom, timeTo, orientation, fit, order, sort, share };
    const hash = barcode.createHash(params);
    console.log('REQ:', params);
    console.log('HASH::', hash);
    const finalFilepath = `${process.env.RESULT_FOLDER}/output_${hash}.jpg`;

    return queue.add({
      params,
      finalFilepath,
      hash,
      res,
      callback: barcode.generateAndSendBarcode
    });

  } catch (err) {
    return res.json({ error: `router: ${err}` });
  }
});


module.exports = router;
