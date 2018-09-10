'use strict';

const requireAll = require('require-all');
console.log(requireAll);
jest.unmock('require-all');

const request = require('supertest');
import app from '../src/app';
import Instrument from '../src/models/instrument';
import Ensemble from '../src/models/ensemble';
import uuid from 'uuid';
import User from '../src/auth/model';
const mongoConnect = require('../src/util/mongo-connect');

const MONGODB_URI = process.env.MONGODB_URI ||
  'mongodb://localhost/401-2018-instruments';

describe('api/', () => {
  let token;
  beforeAll(() => {
    return mongoConnect(MONGODB_URI)
      .then(() => {
        let testUser = new User({
          username: 'api-test-' + uuid(),
          password: 'penultimate',
        });
        return testUser.save()
          .then(savedUser => {
            token = savedUser.generateToken();
          });
      });
  });
  describe('instruments', ()=>{
    it('returns 401 for invalid authorization', ()=>{
      return request(app)
        .get('/api/v1/instruments')
        .expect(401);
    });
    it('can get /api/v1/instruments', () => {
      var instruments = [
        new Instrument({ name: 'test 1', family: '1' }),
        new Instrument({ name: 'test 2', family: '2' }),
        new Instrument({ name: 'test 3', family: '3' }),
      ];
      return Promise.all(
        instruments.map(instrument => instrument.save())
      ).then(savedinstruments => {
        return request(app)
          .get('/api/v1/instruments')
          .set('Authorization', `Bearer ${token}`)
          .expect(200)
          .expect('Content-Type', 'application/json; charset=utf-8')
          .expect(({ body }) => {
            expect(body.length).toBeGreaterThanOrEqual(savedinstruments.length);
            savedinstruments.forEach(savedinstrument => {
              expect(body.find(instrument => instrument._id === savedinstrument._id.toString())).toBeDefined();
            });
          });
      });
    });
    it('can get /api/v1/instruments/:id', () => {
      var instrument = new Instrument({ name: 'save me', family: 'please' });
      return instrument.save()
        .then(saved => {
          return request(app)
            .get(`/api/v1/instruments/${saved._id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(({ body }) => {
              expect(body._id).toBe(body._id.toString());
            });
        });
    });
    it('returns 404 for GET /api/v1/instruments/:id with invalid id', () => {
      return request(app)
        .get('/api/v1/instruments/oops')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
    it('returns 404 for GET /api/v1/instruments/:id with valid but missing id', () => {
      return request(app)
        .get('/api/v1/instruments/nothing')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
    it('returns 400 for POST /api/v1/instruments without body', () => {
      return request(app)
        .post('/api/v1/instruments')
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json; charset=utf-8')
        .send('this is not json')
        .expect(400);
    });
    it('returns 400 for POST /api/v1/instruments with empty body', () => {
      return request(app)
        .post('/api/v1/instruments')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400)
        .expect(response => {
          expect(response.body.message)
            .toBe('instrument validation failed: family: Path `family` is required., name: Path `name` is required.');
        });
    });
    it('can POST /api/v1/instruments to create instrument', () => {
      return request(app)
        .post('/api/v1/instruments')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Testing', family: 'It works!' })
        .expect(200)
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(response => {
          expect(response.body).toBeDefined();
          expect(response.body._id).toBeDefined();
          expect(response.body.name).toBe('Testing');
          expect(response.body.family).toBe('It works!');
        });
    });
    describe('DELETE /api/v1/instruments/:id', () => {
      let testInstrument;
      beforeEach(() => {
        testInstrument = new Instrument({ name: 'Delete Me', family: 'Please'});
        return testInstrument.save()
          .then(() => {
            return request(app)
              .get(`/api/v1/instruments/${testInstrument._id}`)
              .set('Authorization', `Bearer ${token}`)
              .expect(200)
              .expect(response => {
                expect(response.body._id).toEqual(testInstrument._id.toString());
              });
          });
      });
      it('returns 200 with JSON for successful delete', () => {
        let resourcePath = `/api/v1/instruments/${testInstrument._id}`;
        return request(app)
          .delete(resourcePath)
          .set('Authorization', `Bearer ${token}`)
          .expect(200)
          .expect('Content-Type', 'application/json; charset=utf-8')
          .expect({ message: `ID ${testInstrument._id} was deleted` })
          .expect(() => {
            console.log('resource deleted! ' + resourcePath);
            return request(app)
              .get(resourcePath)
              .set('Authorization', `Bearer ${token}`)
              .expect(404)
              .expect(response => {
                console.log(response);
              });
          });
      });
      it('returns 404 with invalid id', () => {
        return request(app)
          .delete('/api/v1/instruments/oops')
          .set('Authorization', `Bearer ${token}`)
          .expect(404);
      });
      it('returns 404 with valid but missing id', () => {
        return request(app)
          .delete('/api/v1/instruments/deadbeefdeadbeefdeadbeef')
          .set('Authorization', `Bearer ${token}`)
          .expect(404);
      });
    });
  });
  describe('with ensemble', () => {
    let testEnsemble;
    beforeEach(() => {
      testEnsemble = new Ensemble({ name: 'Add instruments to me' });
      return testEnsemble.save();
    });
    it('can create instrument on ensemble', () => {
      let instrumentBody = {
        name: 'Add me to a ensemble',
        family: 'test',
        ensemble: testEnsemble._id,
      };
      return request(app)
        .post('/api/v1/instruments')
        .set('Authorization', `Bearer ${token}`)
        .send(instrumentBody)
        .expect(200)
        .expect(response => {
          let instrument = response.body;
          console.log({ instrument });
          expect(instrument.ensemble).toBeDefined();
          expect(instrument.ensemble._id).toEqual(testEnsemble._id.toString());
          expect(instrument.ensemble.name).toEqual(testEnsemble.name);
          return request(app)
            .get(`/api/ensembles/${testEnsemble._id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .expect(response => {
              let ensemble = response.body;
              console.log({ ensemble });
              expect(ensemble).toBeDefined();
              expect(ensemble.instruments).toBeDefined();
              expect(ensemble.instruments.length).toBe(1);
              expect(ensemble.instruments[0]._id).toEqual(instrument._id.toString());
            });
        });
    });
  });
}); 