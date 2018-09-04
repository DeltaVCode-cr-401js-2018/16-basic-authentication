'use strict';

import User from './model';

export default (req, res, next) => {
  // Step 1: parse Authorization header
  let auth = {};
  let authHeader = req.headers.authorization;

  if (!authHeader) {
    return unauthorized();
  }

  if (authHeader.match(/^basic\s+/i)) {
    let base64header = authHeader.replace(/^basic\s+/i, '');
    let base64buffer = Buffer.from(base64header, 'base64');
    let bufferString = base64buffer.toString();

    let [username,password] = bufferString.split(':', 2);
    auth = { username, password };

    User.authenticate(auth)
      .then(user => {
        if (user) {
          res.token = user.generateToken();
          return next();
        }

        unauthorized();
      });
  }
  else {
    next();
  }

  function unauthorized() {
    // Nudge browser to ask for username + password
    res.setHeader('WWW-Authenticate', 'Basic realm="DeltaV"');

    next({
      status: 401,
    });
  }
};
