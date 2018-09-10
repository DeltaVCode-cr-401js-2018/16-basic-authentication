'use strict';

const debug = require('debug')('app/auth/router');
import superagent from 'superagent';

import express from 'express';
const authRouter = express.Router();

import User from './model';
import auth from './middleware';


authRouter.get('/signin', auth, (req, res)=>{
  res.send(res.token);
  return;
});

authRouter.post('/signup', (req, res, next)=>{
  let user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  user.save()
    .then(user=>{
      res.send({
        token: user.generateToken(),
      });
    })
    .catch(next);
});

authRouter.post('/signin', auth, (req, res) => {
  res.send({
    token: res.token,
  });
});

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID || 'spotify_id';
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5000';

authRouter.get('/login/spotify', (req, res)=>{
  let spotifyUrl = 'https://accounts.spotify.com/authorize';
  let redirectUri = `${CLIENT_URL}/oauth/spotify/code`;
  let scope = 'user-read-currently-playing';

  res.redirect(`${spotifyUrl}?response_type=code&client_id=${SPOTIFY_CLIENT_ID}&scope=${scope}&redirect_uri=${encodeURIComponent(redirectUri)}`);
});

authRouter.get('/oauth/spotify/code', (req,res,next)=>{
  const {code} = req.query;
  if(!code){
    res.redirect(CLIENT_URL);
    return;
  }

  const body = {
    grant_type : 'authorization_code',
    code,
    redirect_uri: `${CLIENT_URL}/oauth/spotify/code`,
    client_id: SPOTIFY_CLIENT_ID,
    client_secret: process.env.SPOTIFY_CLIENT_SECRET,
  };
  debug(body);
  superagent
    .post('https://accounts.spotify.com/api/token')
    .set('Accept', 'application/json')
    .type('form')
    .send(body)
    .then(response =>{
      const spotifyToken = response.body.access_token;
      debug(spotifyToken);
      return superagent.get('https://api.spotify.com/v1/me/player/currently-playing')
        .set('Authorization', `Bearer ${spotifyToken}`)
        .then(playingRes =>{
          let currentlyPlaying = playingRes.body.item.name;
          res.json(currentlyPlaying);
        });
    })
    .catch(next);
});

export default authRouter;
