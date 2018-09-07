'use strict';

import Note from '../../src/models/note';
// Have to import so schema is available for ref
import List from '../../src/models/list';

const mongoConnect = require('../../src/util/mongo-connect');

const MONGODB_URI = process.env.MONGODB_URI ||
  'mongodb://localhost/401-2018-notes';

describe('note model', () => {
  beforeAll(async () => {
    await mongoConnect(MONGODB_URI);
  });

  describe('save', () => {
    it('resolves with valid note', async () => {
      let note = new Note({
        title: 'Test Note',
        created: new Date(),
      });

      let saved = await note.save();
      expect(saved).toBe(note);
      expect(saved.title).toBe('Test Note');
      expect(saved.created).toEqual(note.created);
    });

    it('fails if title is missing', async () => {
      let note = new Note({
      // no title
        created: new Date(),
      });

      await expect(note.save())
        .rejects.toBeDefined();
    });
  });

  describe('findById', () => {
    let testNote;
    beforeEach(async () => {
      testNote = new Note({ title: 'Find Me!' });
      await testNote.save();
    });

    it('can find by id that exists', async () => {
      var foundNote = await Note.findById(testNote._id);

      expect(foundNote).toBeDefined();
      expect(foundNote._id).toEqual(testNote._id);
      expect(foundNote.title).toEqual(testNote.title);
    });

    it('can find by string id that exists', async () => {
      var foundNote = await Note.findById(testNote._id.toString());

      expect(foundNote).toBeDefined();
      expect(foundNote._id).toEqual(testNote._id);
      expect(foundNote.title).toEqual(testNote.title);
    });

    it('reject given id that is invalid', async () => {
      await expect(Note.findById('oops'))
        .rejects.toThrowError('Cast to ObjectId failed');
    });

    it('resolves with null given id that is valid but missing', async () => {
      await expect(Note.findById('deadbeefdeadbeefdeadbeef'))
        .resolves.toBe(null);
    });
  });

  // TODO: test Note.find()
  // TODO: test Note.remove() <= how does this work?
});
