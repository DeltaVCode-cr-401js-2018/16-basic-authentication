'use strict';

import User from '../../src/auth/model';
import uuid from 'uuid';
import jwt from 'jsonwebtoken';
//import { request } from 'https';

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
  describe('password hashing', ()=>{
    let password;
    let user;
    beforeEach(()=>{
      password = uuid();
      user = new User({
        username : uuid(),
        password : password,
      });
      return user.save();
    });
    it('saves password hasehd', ()=>{
      expect(user.password).not.toEqual(password);
    });
    it('can compare passwords', ()=>{
      return expect(user.comparePassword(password))
        .resolves.toBe(user);
    });
    it('returns null if passwords are different', ()=>{
      return expect(user.comparePassword('wrong'))
        .resolves.toBe(null);
    });
    describe('User authenticate', ()=>{
      it('resolves with user when given correct password', ()=>{
        return User.authenticate({
          username: user.username,
          password: password,
        })
          .then(authUser =>{
            expect(authUser).toBeDefined();
            expect(authUser.username).toBe(user.username);
          });
      });
      it('resolves with null given and incorrect password', ()=>{
        return User.authenticate({
          username: user.username,
          password: 'wrong',
        })
          .then(authUser =>{
            expect(authUser).toBe(null);
          });
      });
      it('resolves with null given a wrong username', ()=>{
        return User.authenticate({
          username: 'no',
          password: password,
        })
          .then(authUser=>{
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
      let token = user.generateToken();
      expect(jwt.verify(token, 'DeltaV Secret').id).toBe(user._id.toString());
    });

    describe('User.authorize()', ()=>{
      it('can verify a token with User.authorize()', ()=>{
        var token = user.generateToken();
        return User.authorize(token)
          .then(authUser =>{
            expect(authUser).toBeDefined();
            expect(authUser._id).toEqual(user._id);
          });
      });
      it('resolves with null for invalid token', ()=>{
        var token = 'no';
        return User.authorize(token)
          .then(authUser =>{
            expect(authUser).toBe(null);
          });
      });
    });

  });
    
});
