'use strict';

const debug = require('debug')('app:middleware/error');

export default (err, req, res, next) => {
  if (err.name === 'CastError') {
    res.sendStatus(404);
    return;
  }

  if (err.name === 'ValidationError') {
    res.statusCode = 400;
    debug('ValidationError', err.message);
    res.json({
      message: err.message,
    });
    return;
  }

  if (err.code === 11000) {
    res.statusCode = 409;
    debug('Conflict!', err.message);
    res.json({
      message: 'This name is taken. Please try again',
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
