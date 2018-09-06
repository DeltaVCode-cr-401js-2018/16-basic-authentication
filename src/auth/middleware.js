'use strict';

import User from './model';

export default (req, res, next) => {
  let auth = {};
  let authHeader = req.headers.authorization;

  if(!authHeader){
    console.log('no auth header');
    return unauthorized();
  }
  if(authHeader.match(/^basic\s+/i)){
    let base64Header = authHeader.replace(/^basic\s+/i, '');
    let base64Buffer = Buffer.from(base64Header, 'base64');
    let bufferString = base64Buffer.toString();

    let [username, password] = bufferString.split(':', 2);
    auth = {username, password};
    console.log({ base64Header, base64Buffer, bufferString, auth });

    User.authenticate(auth)
      .then(user =>{
        if(user){
          res.token = user.generateToken();
          return next();
        }
        unauthorized();
      })
      .catch(err=>{
        next(err);
      });
  } 
  else if(authHeader.match(/^bearer\s+/i)){
    let token = authHeader.replace(/^bearer\s+/i, '');
    User.authorize(token)
      .then(user =>{
        if(user){
          res.token = token;
          res.user = user;
          return next();
        }
        unauthorized();
      })
      .catch(next);
  }
  else{
    unauthorized();
  }
  function unauthorized(){
    res.setHeader('WWW-Authenticate', 'Basic realm="DeltaV"');
    next({
      status: 401,
    });
  }
};
