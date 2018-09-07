'use strict';

const requireAll = require('require-all');
console.log(requireAll); // This might be a mock!

// Force Jest to not use the mock require-all
jest.unmock('require-all');

const request = require('supertest');

import app from '../../src/app';
import Note from '../../src/models/note';
import List from '../../src/models/list';

import uuid from 'uuid';
import User from '../../src/auth/model';

const mongoConnect = require('../../src/util/mongo-connect');

const MONGODB_URI = process.env.MONGODB_URI ||
  'mongodb://localhost/401-2018-notes';

describe('api/', () => {
  let token;
  beforeAll(() => {
    return mongoConnect(MONGODB_URI)
      .then(() => {
        let testUser = new User({
          username: 'api-test-' + uuid(),
          password: 'whatever',
        });
        return testUser.save()
          .then(savedUser => {
            token = savedUser.generateToken();
          });
      });
  });

  describe('notes', () => {
    it('is unauthorized without valid Authorization', () => {
      return request(app)
        .get('/api/notes')
        .expect(401);
    });

    it('can get /api/notes', () => {
      var notes = [
        new Note({ title: 'test 1', content: 'uno' }),
        new Note({ title: 'test 2', content: 'dos' }),
        new Note({ title: 'test 3', content: 'tres' }),
      ];

      return Promise.all(
        notes.map(note => note.save())
      ).then(savedNotes => {
        return request(app)
          .get('/api/notes')
          .set('Authorization', `Bearer ${token}`)
          .expect(200)
          .expect('Content-Type', 'application/json; charset=utf-8')
          .expect(({ body }) => {
            expect(body.length).toBeGreaterThanOrEqual(savedNotes.length);

            savedNotes.forEach(savedNote => {
              expect(body.find(note => note._id === savedNote._id.toString())).toBeDefined();
            });
          });
      });
    });

    it('can get /api/notes/:id', () => {
      var note = new Note({ title: 'save me', content: 'please' });

      return note.save()
        .then(saved => {
          return request(app)
            .get(`/api/notes/${saved._id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .expect('Content-Type', 'application/json; charset=utf-8')
            .expect(({ body }) => {
              expect(body._id).toBe(body._id.toString());
            });
        });
    });

    it('returns 404 for GET /api/notes/:id with invalid id', () => {
      return request(app)
        .get('/api/notes/oops')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('returns 404 for GET /api/notes/:id with valid but missing id', () => {
      return request(app)
        .get('/api/notes/deadbeefdeadbeefdeadbeef')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('returns 400 for POST /api/notes without body', () => {
      return request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json; charset=utf-8')
        .send('this is not json')
        .expect(400);
    });

    it('returns 400 for POST /api/notes with empty body', () => {
      return request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400)
        .expect(response => {
          expect(response.body.message)
            .toBe('note validation failed: title: Path `title` is required.');
        });
    });

    it('can POST /api/notes to create note', () => {
      return request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Testing', content: 'It works!' })
        .expect(200)
        .expect('Content-Type', 'application/json; charset=utf-8')
        .expect(response => {
          expect(response.body).toBeDefined();
          expect(response.body._id).toBeDefined();
          expect(response.body.title).toBe('Testing');
          expect(response.body.content).toBe('It works!');
        });
    });

    describe('DELETE /api/notes/:id', () => {
      let testNote;
      beforeEach(() => {
        testNote = new Note({ title: 'Delete Me' });
        return testNote.save()
          .then(() => {
            return request(app)
              .get(`/api/notes/${testNote._id}`)
              .set('Authorization', `Bearer ${token}`)
              .expect(200)
              .expect(response => {
                expect(response.body._id).toEqual(testNote._id.toString());
              });
          });
      });

      it('returns 200 with JSON for successful delete', () => {
        let resourcePath = `/api/notes/${testNote._id}`;
        return request(app)
          .delete(resourcePath)
          .set('Authorization', `Bearer ${token}`)
          .expect(200)
          .expect('Content-Type', 'application/json; charset=utf-8')
          .expect({ message: `ID ${testNote._id} was deleted` })
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
          .delete('/api/notes/oops')
          .set('Authorization', `Bearer ${token}`)
          .expect(404);
      });

      it('returns 404 with valid but missing id', () => {
        return request(app)
          .delete('/api/notes/deadbeefdeadbeefdeadbeef')
          .set('Authorization', `Bearer ${token}`)
          .expect(404);
      });
    });
  });

  describe('with list', () => {
    let testList;
    beforeEach(() => {
      testList = new List({ name: 'Add notes to me' });
      return testList.save();
    });

    it('can create note on list', () => {
      let noteBody = {
        title: 'Add me to a list',
        list: testList._id,
      };
      return request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${token}`)
        .send(noteBody)
        .expect(200)
        .expect(response => {
          let note = response.body;
          console.log({ note });
          expect(note.list).toBeDefined();
          expect(note.list._id).toEqual(testList._id.toString());
          expect(note.list.name).toEqual(testList.name);

          return request(app)
            .get(`/api/lists/${testList._id}`)
            .set('Authorization', `Bearer ${token}`)
            .expect(200)
            .expect(response => {
              let list = response.body;
              console.log({ list });
              expect(list).toBeDefined();
              expect(list.notes).toBeDefined();
              expect(list.notes.length).toBe(1);
              expect(list.notes[0]._id).toEqual(note._id.toString());
            });
        });
    });
  });
});