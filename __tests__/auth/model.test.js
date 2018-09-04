'use strict';

import User from '../../src/auth/model';
import uuid from 'uuid';

const mongoConnect = require('../../src/util/mongo-connect');

const MONGODB_URI = process.env.MONGODB_URI ||
  'mongodb://localhost/401-2018-auth';

describe('auth model', () => {
  beforeAll(async () => {
    await mongoConnect(MONGODB_URI);
  });

  it('saves password hashed', () => {
    let password = 'DeltaV!';
    let user = new User({
      username: uuid(),
      password: password,
    });

    return user.save()
      .then(savedUser => {
        console.log(savedUser);
        expect(savedUser.password).not.toEqual(password);
        return savedUser;
      })
      .then(savedUser => {
        // comparePassword should resolve with the user
        // if that user's password matches
        return expect(savedUser.comparePassword(password))
          .resolves.toBe(savedUser)
          .then(() => savedUser);
      })
      .then(savedUser => {
        // comparePassword should resolve with null
        // if that user's password does not match
        return expect(savedUser.comparePassword('wrong'))
          .resolves.toBe(null);
      });
  });
});
