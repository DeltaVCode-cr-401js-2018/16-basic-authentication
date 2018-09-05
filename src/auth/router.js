'use strict';

import express from 'express';
const authRouter = express.Router();

import User from './model';
import auth from './middleware';

authRouter.post('/signup', (req, res, next) => {
  let user = new User(req.body);
  user.save()
    .then(user => {
      res.send({
        token: user.generateToken(),
      });
    })
    .catch(next);
});

authRouter.get('/signin', auth, (req, res) => {
  res.send({
    token: res.token,
  });
});

authRouter.post('/signin', auth, (req, res) => {
  res.send({
    token: res.token,
  });
});

// TODO: POST /signin

export default authRouter;
