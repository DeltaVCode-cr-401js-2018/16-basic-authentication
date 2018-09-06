'use strict';

const debug = require('debug')('app/auth/router');

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

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'github_id';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5000';
// OAuth!
authRouter.get('/login/github', (req, res) => {
  var gitHubUrl = 'https://github.com/login/oauth/authorize';
  var client_id = GITHUB_CLIENT_ID;
  var redirect_uri = `${CLIENT_URL}/oauth/github/code`;
  var scope = 'user:email';

  debug(`redirecting to GitHub with scope ${scope}`);
  res.redirect(`${gitHubUrl}?client_id=${client_id}&redirect_uri=${redirect_uri}&scope=${scope}`);
});

export default authRouter;
