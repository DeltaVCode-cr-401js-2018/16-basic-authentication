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

  it('saves password hashed', ()=> {
    let password = 'Nice';
    let user = new User({
      username: uuid(),
      password: password,
    });
    return user.save()
      .then(savedUser => {
        expect(savedUser.password).not.toEqual(password);
        return savedUser;
      })
      .then(savedUser => {

        return expect(savedUser.comparePassword(password))
          .resolves.toBe(savedUser)
          .then(() => savedUser);
      })
      .then(savedUser => {

        return expect(savedUser.comparePassword('wrong'))
          .resolves.toBe(null);
      });
  });

  describe('hashing a password', ()=> {
    let password;
    let user;

    beforeEach(()=> {
      password = uuid();
      user = new User({
        username: uuid(),
        password: password,
      });
      return user.save();
    });

    it('saves hashed password', ()=> {
      expect(user.password).not.toEqual(password);
    });

    it('successfully compares passwords', ()=> {
      return expect(user.comparePassword(password))
        .resolves.toBe(user);
    });

    it('will return null on a non-matching password', ()=> {
      return expect(user.comparePassword('wrong'))
        .resolves.toBe(null);
    });

    describe('User.authenticate', ()=> {
      it('resolves with user if given the correct password', ()=> {
        return User.authenticate({
          username: user.username,
          password: password,
        })
          .then(authUser => {
            expect(authUser).toBeDefined();
            expect(authUser.username).toBe(user.username);
          });
      });

      it('resolves with null given an incorrect password', ()=> {
        return User.authenticate({
          username: user.username,
          password: 'stuff',
        })
          .then(authUser => {
            expect(authUser).toBe(null);
          });
      });

      it('resolves with null given an incorrect username', ()=> {
        return User.authenticate({
          username: 'stuff',
          password: password,
        })
          .then(authUser => {
            expect(authUser).toBe(null);
          });
      });  
    });

    describe('generateToken', ()=> {
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

      it('can generate tokens', ()=> {
        expect(user.generateToken()).toBe('I need changed!');
      });
    });
  });
});