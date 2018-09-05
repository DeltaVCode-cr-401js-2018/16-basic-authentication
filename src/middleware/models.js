'use strict';

const debug = require('debug')('app/middleware/models');

const models = require('require-all')(`${__dirname}/../models`);
const modelLookup = {};
Object.values(models)
  .map(module => module.default)
  .forEach(model => {
    modelLookup[model.route || model.modelName] = model;
  });
debug({ models, modelLookup });

export default (req, res, next) => {
  let model = req.params.model;

  if (model && modelLookup[model]) {
    req.Model = modelLookup[model];
    debug({ model, Model: req.Model.modelName });
    return next();
  }

  throw new Error('Model Not Found');
};
