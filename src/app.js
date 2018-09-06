'use strict';

import express from 'express';
import morgan from 'morgan';


import errorMiddleware from './middleware/error';
import json404 from './middleware/json-404';

const app = module.exports = express();


app.use(morgan('tiny'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('<html><body><h1>DeltaV</h1></body></html>');
});

import authRouter from './auth/router';
app.use(authRouter);

import apiRouter from './api/api';
app.use('/api/v1', apiRouter);

app.use(json404);
app.use(errorMiddleware);

app.start = (port) =>
  new Promise((resolveCallback, rejectCallback) => {
    app.listen(port, (err, result) => {
      if (err) {
        rejectCallback(err);
      } else {
        resolveCallback(result);
      }
    });
  });
