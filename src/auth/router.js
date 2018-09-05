'use strict';

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

export default authRouter;
