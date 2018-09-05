'use strict';

import express from 'express';
const authRouter = express.Router();

import User from './model';
import auth from './middleware';


authRouter.get('/signin', auth, (req, res)=>{
  res.send(res.token);
  return;
});

authRouter.post('/signup', (req, res)=>{
  let user = new User({
    username: req.body.username,
    password: req.body.password,
  });
  return user.save()
    .then(user=>{
      res.send(user);
    });
  
});

export default authRouter;
