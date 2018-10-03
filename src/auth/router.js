'use strict';

const debug = require('debug')('app:auth/router');
import superagent from 'superagent';

import express from 'express';
const authRouter = express.Router();

import User from './model';
import auth from './middleware';

authRouter.post('/signup', (req, res, next) => {
  let user = new User(req.body);
  user.save()
    .then(user => {
      const token = user.generateToken();
      setAuthCookie(res, token);

      res.send({
        token,
      });
    })
    .catch(next);
});

authRouter.get('/signin', auth, (req, res) => {
  setAuthCookie(res, req.token);

  res.send({
    token: req.token,
  });
});

authRouter.post('/signin', auth, (req, res) => {
  setAuthCookie(res, req.token);

  res.send({
    token: req.token,
  });
});

function setAuthCookie(res, token) {
  res.cookie('X-Token', token, { maxAge: 900000 });
}

authRouter.post('/signout', auth, (req, res) => {
  setAuthCookie(res, '');

  res.send({
    status: 'success',
  });
});

authRouter.get('/user', auth, (req, res) => {
  res.send({
    ...req.user.toObject(),
    capabilities: req.user.capabilities,
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

authRouter.get('/oauth/github/code', (req, res, next) => {
  const { code } = req.query;
  debug('OAuth code response', req.query);
  if (!code) {
    res.redirect(process.env.CLIENT_URL);
    return;
  }

  const body = {
    grant_type: 'authorization_code',
    code, // code: code,
    redirect_uri: `${CLIENT_URL}/oauth/github/code`,
    client_id: GITHUB_CLIENT_ID,
    client_secret: process.env.GITHUB_CLIENT_SECRET,
  };
  debug(body);

  superagent
    .post('https://github.com/login/oauth/access_token')
    .set('Accept', 'application/json')
    .type('form')
    .send(body)
    // GitHub Token Response
    .then(response => {
      const gitHubToken = response.body.access_token;

      return superagent.get('https://api.github.com/user/emails')
        .set('Authorization', `Bearer ${gitHubToken}`)
        .then(emailResponse => {
          var primaryEmail = emailResponse.body.find(email => email.primary);
          res.redirect('http://localhost:5500?email=' + primaryEmail.email);
        });
    })
    .catch(next);
});

export default authRouter;
