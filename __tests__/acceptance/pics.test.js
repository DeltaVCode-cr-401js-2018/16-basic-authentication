'use strict';

const debug = require('debug')('tests:acceptance/pics');

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
const examplePic = {
  name: 'testing',
  image: `${__dirname}/data/tester.png`,
};

describe('Picture Route', () => {
  beforeAll(async function () { // or arrow function works, as below
    await mongoConnect(MONGODB_URI);
  });

  let testUser, testToken, testGallery;
  beforeEach(async () => {
    testUser = await new User(exampleUser).save();
    testToken = await testUser.generateToken();

    testGallery = await new Gallery({
      ...exampleGallery,
      userID: testUser._id,
    }).save();
  });
  afterEach(async () => {
    await Gallery.deleteMany({ userID: testUser._id });
    await User.findByIdAndRemove(testUser._id);
  });

  describe('POST /api/gallery/:id/pic', () => {
    it('should return 401 without Authorization', async () => {
      await request
        .post(`/api/gallery/${testGallery._id}/pic`)
        .expect(401);
    });

    it('should return 404 with file but bad id', async () => {
      await request
        .post(`/api/gallery/oops/pic`)
        .set({ Authorization: `Bearer ${testToken}` })
        .field({
          name: examplePic.name,
        })
        .attach('image', examplePic.image)
        .expect(404);
    });

    it('should return 404 with file but bad id', async () => {
      await request
        .post(`/api/gallery/deadbeefdeadbeefdeadbeef/pic`)
        .set({ Authorization: `Bearer ${testToken}` })
        .field({
          name: examplePic.name,
        })
        .attach('image', examplePic.image)
        .expect(404);
    });

    it('should return 400 without fields', async () => {
      await request
        .post(`/api/gallery/${testGallery._id}/pic`)
        .set({ Authorization: `Bearer ${testToken}` })
        // .field({
        //   name: examplePic.name,
        // })
        .attach('image', examplePic.image)
        .expect(400);
    });

    it('should return 400 without file', async () => {
      await request
        .post(`/api/gallery/${testGallery._id}/pic`)
        .set({ Authorization: `Bearer ${testToken}` })
        .field({
          name: examplePic.name,
        })
        // .attach('image', examplePic.image)
        .expect(400);
    });

    it('should return a pic for valid id and request', async () => {
      await request
        .post(`/api/gallery/${testGallery._id}/pic`)
        .set({ Authorization: `Bearer ${testToken}` })
        .field({
          name: examplePic.name,
        })
        .attach('image', examplePic.image)
        .expect(200)
        .expect(response => {
          expect(response.body).toHaveProperty('name', examplePic.name);
          expect(response.body).toHaveProperty('userID', testUser._id.toString());
          // TODO: populate gallery instead?
          expect(response.body).toHaveProperty('galleryID', testGallery._id.toString());
        });

    });
  });
});
