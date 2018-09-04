'use strict';

import express from 'express';
const authRouter = express.Router();

import User from './model';
import auth from './middleware';

// TODO: POST /signup
// body: { username: 'john', password: 'hancock' }
// response: generated token

// TODO: GET /signin
authRouter.get('/signin', auth, (req, res) => {
  res.send(res.token);
});

// TODO: POST /signin

export default authRouter;