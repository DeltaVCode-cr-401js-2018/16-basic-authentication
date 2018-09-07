'use strict';

const debug = require('debug')('app/middleware/error');

export default (err, req, res, next) => {
  if (err.name === 'CastError') {
    res.sendStatus(404);
    return;
  }

  if (err.name === 'ValidationError') {
    res.statusCode = 400;
    res.json({
      message: err.message,
    });
    return;
  }

  console.error(err);

  if (req.headers['accept'] !== 'application/json') {
    next(err);
    return;
  }

  res.statusCode = 500;
  res.json({
    error: err.message,
  });
};
