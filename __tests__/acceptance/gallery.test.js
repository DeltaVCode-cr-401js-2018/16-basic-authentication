'use strict';

const debug = require('debug')('tests:acceptance/gallery');

const requireAll = require('require-all');
debug(requireAll); // This might be a mock!

// Force Jest to not use the mock require-all
jest.unmock('require-all');

import app from '../../src/app';
const request = require('supertest')(app);

import Gallery from '../../src/models/gallery';
import User from '../../src/auth/model';

const mongoConnect = require('../../src/util/mongo-connect');
const MONGODB_URI = process.env.MONGODB_URI ||
  'mongodb://localhost/401-2018-notes';

import uuid from 'uuid';
const exampleUser = { username: uuid(), password: uuid() };
const exampleGallery = { name: 'test' };

describe('Gallery Routes', () => {
  beforeAll(async () => {
    await mongoConnect(MONGODB_URI);
  });

  let testUser, testToken, hacker, hackerToken, testGallery;
  beforeEach(async () => {
    testUser = await new User(exampleUser).save();
    testToken = await testUser.generateToken();
  });
  afterEach(async () => {
    await Gallery.deleteMany({ userID: testUser._id });
    await User.findByIdAndRemove(testUser._id);
    hacker && await User.findByIdAndRemove(hacker._id);
  });

  describe('POST /api/gallery', () => {
    it('should return a gallery', () => {
      return request
        .post('/api/gallery')
        .set({ Authorization: `Bearer ${testToken}` })
        .send(exampleGallery)
        .expect(200)
        .expect(res => {
          expect(res.body).toHaveProperty('name', exampleGallery.name);
          expect(res.body).not.toHaveProperty('desc');
          expect(res.body).toHaveProperty('created');
        });
    });
    it('should return 400 given bad JSON', () => {
      return request
        .post('/api/gallery')
        .set({ Authorization: `Bearer ${testToken}` })
        .set('Content-Type', 'application/json')
        .send('["bad jason!"]x')
        .expect(400);
    });
    it('should return 400 given JSON without name', () => {
      return request
        .post('/api/gallery')
        .set({ Authorization: `Bearer ${testToken}` })
        .send({ desc: 'whatever' })
        .expect(400);
    });
  });

  describe('GET /api/gallery/:id', () => {
    describe('invalid id', () => {
      it('should return 404', () => {
        return request
          .get('/api/gallery/missing')
          .set({ 'Authorization': `Bearer ${testToken}` })
          .expect(404);
      });
    });
    describe('missing id', () => {
      it('should return 404', () => {
        return request
          .get('/api/gallery/deadbeefdeadbeefdeadbeef')
          .set({ 'Authorization': `Bearer ${testToken}` })
          .expect(404);
      });
    });
    describe('valid id', () => {
      beforeEach(async () => {
        // NO: exampleGallery.userID = testUser._id.toString();
        testGallery = await new Gallery({
          ...exampleGallery,
          userID: testUser._id,
        }).save();
      });
      it('should return a gallery', () => {
        return request
          .get(`/api/gallery/${testGallery._id}`)
          .set({ 'Authorization': `Bearer ${testToken}` })
          .expect(200)
          .expect(res => {
            expect(res.body).toHaveProperty('name', exampleGallery.name);
            expect(res.body).toHaveProperty('created');
          });
      });
      describe(`someone else's gallery`, () => {
        beforeEach(async () => {
          hacker = await new User({ username: uuid(), password: 'hack' }).save();
          hackerToken = hacker.generateToken();
        });
        it('should return 200', () => {
          return request
            .get(`/api/gallery/${testGallery._id}`)
            .set({
              Authorization: `Bearer ${hackerToken}`,
            })
            .expect(404);
        });
      });
    });
  });

  describe('DELETE /api/gallery/:id', () => {
    describe('invalid id', () => {
      it('should return 404', () => {
        return request
          .delete('/api/gallery/missing')
          .set({ 'Authorization': `Bearer ${testToken}` })
          .expect(404);
      });
    });
    describe('missing id', () => {
      it('should return 404', () => {
        return request
          .delete('/api/gallery/deadbeefdeadbeefdeadbeef')
          .set({ 'Authorization': `Bearer ${testToken}` })
          .expect(404);
      });
    });
    describe('valid id', () => {
      beforeEach(async () => {
        // NO: exampleGallery.userID = testUser._id.toString();
        testGallery = await new Gallery({
          ...exampleGallery,
          userID: testUser._id.toString(),
        }).save();
      });
      it('should return a gallery', async () => {
        await request
          .delete(`/api/gallery/${testGallery._id}`)
          .set({ 'Authorization': `Bearer ${testToken}` })
          .expect(200);

        var deleted = await Gallery.findById(testGallery._id);
        expect(deleted).toBe(null);
      });
      describe(`someone else's gallery`, () => {
        beforeEach(async () => {
          hacker = await new User({ username: uuid(), password: 'hack' }).save();
          hackerToken = hacker.generateToken();
        });
        it('should return 404', () => {
          return request
            .delete(`/api/gallery/${testGallery._id}`)
            .set({ Authorization: `Bearer ${hackerToken}` })
            .expect(404);
        });
      });
    });
  });

  describe('PUT /api/gallery/:id', () => {
    describe('invalid id', () => {
      it('should return 404', () => {
        return request
          .put('/api/gallery/missing')
          .set({ 'Authorization': `Bearer ${testToken}` })
          .expect(404);
      });
    });
    describe('missing id', () => {
      it('should return 404', () => {
        return request
          .put('/api/gallery/deadbeefdeadbeefdeadbeef')
          .set({ 'Authorization': `Bearer ${testToken}` })
          .expect(404);
      });
    });
    describe('valid id', () => {
      beforeEach(async () => {
        // NO: exampleGallery.userID = testUser._id.toString();
        testGallery = await new Gallery({
          ...exampleGallery,
          userID: testUser._id.toString(),
        }).save();
      });
      describe(`authenticated user's gallery`, () => {
        it('should return a gallery', () => {
          return request
            .put(`/api/gallery/${testGallery._id}`)
            .set({ 'Authorization': `Bearer ${testToken}` })
            .send({ name: 'updated', desc: 'new desc' })
            .expect(200)
            .expect(res => {
              expect(res.body).toHaveProperty('name', 'updated');
              expect(res.body).toHaveProperty('desc', 'new desc');
              expect(res.body).toHaveProperty('created');
            });
        });
      });
      describe(`someone else's gallery`, () => {
        beforeEach(async () =>  {
          hacker = await new User({ username: uuid(), password: 'hack' }).save();
          hackerToken = hacker.generateToken();
        });
        it('should return 404', () => {
          return request
            .put(`/api/gallery/${testGallery._id}`)
            .set({ Authorization: `Bearer ${hackerToken}` })
            .send({ name: 'updated', desc: 'new desc' })
            .expect(404);
        });
      });
    });
  });
});
