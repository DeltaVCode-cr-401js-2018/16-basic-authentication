'use strict';

import User from '../../src/auth/model';
import jwt from 'jsonwebtoken';
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

  describe('password hashing', () => {
    let password;
    let user;

    beforeEach(() => {
      password = uuid();
      user = new User({
        username: uuid(),
        password: password,
      });
      return user.save();
    });

    it('saves password hashed', () => {
      expect(user.password).not.toEqual(password);
    });

    it('can successfully compare passwords', () => {
      return expect(user.comparePassword(password))
        .resolves.toBe(user);
    });

    it('returns null if password does not match', () => {
      return expect(user.comparePassword('wrong'))
        .resolves.toBe(null);
    });

    describe('User.authenticate()', () => {
      it('resolves with user given correct password', () => {
        return User.authenticate({
          username: user.username,
          password: password,
        })
          .then(authUser => {
            expect(authUser).toBeDefined();
            expect(authUser.username).toBe(user.username);
          });
      });

      it('resolves with null given incorrect password', () => {
        return User.authenticate({
          username: user.username,
          password: 'oops',
        })
          .then(authUser => {
            expect(authUser).toBe(null);
          });
      });

      it('resolves with null given incorrect username', () => {
        return User.authenticate({
          username: 'oops',
          password: password,
        })
          .then(authUser => {
            expect(authUser).toBe(null);
          });
      });
    });
  });

  describe('generateToken', () => {
    let password;
    let user;

    beforeEach(() => {
      password = uuid();
      user = new User({
        username: uuid(),
        password: password,
      });
      return user.save();
    });

    it('generates a token', () => {
      var token = user.generateToken();
      expect(token).toBeDefined();

      var verification = jwt.verify(token, 'DeltaV Secret');
      console.log({ token, verification });
      expect(verification).toBeDefined();
      expect(verification.id).toBe(user._id.toString());
    });
  });
});
