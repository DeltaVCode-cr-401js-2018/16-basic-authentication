'use strict';

const debug = require('debug')('auth/middleware');
import User from './model';

export default (req, res, next) => {
  // Step 1: parse Authorization header
  let auth = {};
  let authHeader = req.headers.authorization;
  debug({ authHeader });

  if (!authHeader) {
    return unauthorized();
  }

  if (authHeader.match(/^basic\s+/i)) {
    let base64header = authHeader.replace(/^basic\s+/i, '');
    let base64buffer = Buffer.from(base64header, 'base64');
    let bufferString = base64buffer.toString();

    let [username,password] = bufferString.split(':', 2);
    auth = { username, password };
    debug(auth); // don't ever log passwords!

    User.authenticate(auth)
      .then(user => {
        if (user) {
          res.token = user.generateToken();
          return next();
        }

        unauthorized();
      })
      .catch(err => {
        next(err);
      });
  }
  else if (authHeader.match(/^bearer\s+/i)) {
    let token = authHeader.replace(/^bearer\s+/i, '');
    User.authorize(token)
      .then(user => {
        if (user) {
          res.token = token;
          res.user = user;
          return next();
        }

        unauthorized();
      })
      .catch(next);
  }
  else {
    unauthorized();
  }

  function unauthorized() {
    // Nudge browser to ask for username + password
    res.setHeader('WWW-Authenticate', 'Basic realm="DeltaV"');

    next({
      status: 401,
    });
  }
};
