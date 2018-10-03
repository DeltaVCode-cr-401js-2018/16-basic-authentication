'use strict';

import mongoose, { Schema } from 'mongoose';
// const { Schema } = mongoose;

import List from './list';

const noteSchema = Schema({
  title: { type: String, required: true },
  content: { type: String },
  created: { type: Date, required: true, default: Date.now },
  completed: { type: Boolean, required: true, default: false },
  list: { type: Schema.Types.ObjectId, ref: 'list' },
  userID: { type: Schema.Types.ObjectId, ref: 'users', required: true },
});

noteSchema.pre('findOne', function(next) {
  console.log('pre findOne');
  this.populate('list');
  next();
});

noteSchema.pre('save', function(next) {
  let noteId = this._id;
  let listId = this.list;

  // List is optional
  if (!listId) {
    return next();
  }

  List.findById(listId)
    .then(list => {
      if (!list) {
        return Promise.reject('Invalid List ID');
      }

      return List.findByIdAndUpdate(
        listId,
        { $addToSet: { notes: noteId } }
      );
    })
    .then(() => next())
    .catch(err => next(err));
});

// Trying to get list to populate after save...
// noteSchema.post('save', function() {
//   console.log('post save');
//   this.populate('list');
// });

// If Mongoose already has note defined, use it as-is
const Note = mongoose.models.note ||
  // Otherwise, create a new note schema
  mongoose.model('note', noteSchema, 'note');

// For models middleware
Note.route = 'notes';

// Export our note constructor
export default Note;
