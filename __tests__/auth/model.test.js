'use strict';

import User from '../../src/auth/model';
import uuid from 'uuid';

const mongoConnect = require('../../src/util/mongo-connect');

const MONGODB_URI = process.env.MONGODB_URI ||
  'mongodb://localhost/401-2018-auth';

describe('auth routes', () => {
  beforeAll(async () => {
    await mongoConnect(MONGODB_URI);
  });
  it('saves password hashed', ()=>{
    let password = 'DeltaV';
    let user = new User({
      username: uuid(),
      password: password,
    });
    return user.save()
      .then(savedUser =>{
        console.log(savedUser);
        expect(savedUser.password).not.toEqual(password);
        return savedUser;
      })
      .then(savedUser => {
        return expect(savedUser.comparePassword(password))
          .resolves.toBe(savedUser)
          .then(()=> savedUser);
      })
      .then(saveUser => {
        return expect(saveUser.comparePassword('wrong'))
          .resolves.toBe(null);
      });
  });
});
