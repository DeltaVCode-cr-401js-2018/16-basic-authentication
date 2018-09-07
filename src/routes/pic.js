'use strict';

const debug = require('debug')('app:route/pic');

import express from 'express';
const router = express.Router();

export default router;

import Pic from '../models/pic';
import Gallery from '../models/gallery';
import uuid from 'uuid';

const dataDir = `${__dirname}/../../temp`;
import multer from 'multer';
const upload = multer({ dest: dataDir });

import del from 'del';

router.post('/gallery/:id/pic', upload.single('image'), (req, res, next) => {
  debug(`POST /gallery/${req.params.id}/pic`);

  // File not uploaded!
  if (!req.file) {
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

  Gallery.findById(req.params.id)
    .then(gallery => {
      if (!gallery)
        return next();

    })
    .then(() => {
      return new Pic({
        ...req.body,
        objectKey: uuid(),
        imageURI: `https://example.com/${uuid()}`,
        galleryID: req.params.id,
        userID: req.user._id,
      }).save();
    })
    .then(pic => {
      return pic ? res.json(pic) : next();
    })
    .catch(next);
});
