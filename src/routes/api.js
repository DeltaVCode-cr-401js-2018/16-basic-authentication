'use strict';

const debug = require('debug')('app:route/api');

import express from 'express';
const router = express.Router();

export default router;

import modelFinder from '../middleware/models';
// Only populate req.Model for API requests
router.param('model', modelFinder);

// Only API should allow cross-origin requests
import cors from 'cors';
router.use(cors());

import auth from '../auth/middleware';

function withUserID(req, query) {
  if (req.user && req.Model.schema.paths.hasOwnProperty('userID')) {
    query.userID = req.user._id;
  }
  debug(query);
  return query;
}

// Get all notes
router.get('/:model', (req, res, next) => {
  let query = withUserID(req, {});

  req.Model.find(query)
    .then(models => {
      res.json(models);
    });
});

// Create a note
// Explicitly require auth for POST
router.post('/:model', auth, (req, res, next) => {
  if (!req.body) {
    res.send(400);
    res.end();
    return;
  }

  const doc = withUserID(req, { ...req.body });
  var newModel = new req.Model(doc);
  newModel.save()
    .then(saved => {
      return req.Model.findById(saved._id);
    })
    .then(found => {
      res.json(found);
    })
    .catch(next);
});

// Get an individual note
router.get('/:model/:id', (req, res, next) => {
  const query = withUserID(req, { _id: req.params.id });

  req.Model.findOne(query)
    .then(model => {
      if (model === null) {
        // 404 Option 1:
        res.sendStatus(404);
        // apparently this works (without return)?
        res.end();
        // but we should return anyway to skip extra work
        return;
      }
      res.json(model);
    })
    .catch(err => {
      // Could not convert to ObjectId
      // Note: this is now also handled by error middleware
      if (err.name === 'CastError') {
        // 404 Option 2:
        // Preferred for 404 because it lets the rest of the
        // express middelware pipeline do its thing,
        // e.g. respond with JSON or HTML
        next();
      } else {
        // Do whatever we do for real errors
        next(err);
      }
    });
});

router.put('/:model/:id', auth, (req, res, next) => {
  // discard readonly _id and _v
  const { _id, _v, ...update } = req.body;
  const query = withUserID(req, { _id: req.params.id });

  req.Model.findOneAndUpdate(query, update, { new: true })
    .then(gallery => gallery ? res.json(gallery) : next())
    .catch(next);
});

// Explicitly require auth for DELETE
router.delete('/:model/:id', auth, (req, res, next) => {
  const query = withUserID(req, { _id: req.params.id });

  req.Model.findOneAndRemove(query)
    .then(removed => {
      // Not found, continue on Express middleware pipeline
      if (!removed) {
        return next();
      }

      res.json({
        message: `ID ${req.params.id} was deleted`,
      });
    })
    .catch(next); // same as .catch(err => next(err));
});
