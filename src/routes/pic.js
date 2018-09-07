'use strict';

const debug = require('debug')('app:route/pic');

import express from 'express';
const router = express.Router();

export default router;

import Pic from '../models/pic';
import Gallery from '../models/gallery';

const dataDir = `${__dirname}/../../temp`;
import multer from 'multer';
const upload = multer({ dest: dataDir });

import del from 'del';
import fs from 'fs';
//import path from 'path';
import AWS from 'aws-sdk';

AWS.config.setPromisesDependency(Promise);

// Promisify S3 Upload
const s3uploadAsync = (options) => {
  const s3 = new AWS.S3();
  return new Promise((resolve, reject) => {
    s3.upload(options, (err, data) => {
      if (err) return reject(err);
      else return resolve(data);
    });
  });
};

router.post('/gallery/:id/pic', upload.single('image'), (req, res, next) => {
  debug(`POST /gallery/${req.params.id}/pic`);

  // File not uploaded!
  if (!req.file) {
    debug('File missing!');
    return next({ status: 400 });
  }

  // Something went wrong with upload
  if (!req.file.path) {
    return next(new Error('file not saved'));
  }

  // Cleanup on Aisle 5; delete temp upload file when response is sent
  res.on('finish', () => {
    debug(`Deleting ${req.file.path}`);
    del([req.file.path]);
  });

  // Turns out we don't need this...not sure why it's in the demo...
  // but this is how you can get a file extension!
  // req.file.ext = path.extname(req.file.originalname);
  // debug(req.file);

  Gallery.findById(req.params.id)
    .then(gallery => {
      if (!gallery)
        return next();

      let s3options = {
        ACL: 'public-read',
        Bucket: process.env.AWS_BUCKET,
        Key: `${req.file.filename}-${req.file.originalname}`, // deadbeef-logo.png
        ContentType: req.file.mimetype,
        Body: fs.createReadStream(req.file.path),
      };
      debug({ s3options });

      return s3uploadAsync(s3options);
    })
    .then(s3data => {
      return new Pic({
        ...req.body,
        objectKey: s3data.Key,
        imageURI: s3data.Location,
        galleryID: req.params.id,
        userID: req.user._id,
      }).save();
    })
    .then(pic => {
      return pic ? res.json(pic) : next();
    })
    .catch(next);
});
