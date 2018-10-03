'use strict';

import mongoose, { Schema } from 'mongoose';

const listSchema = Schema({
  name: { type: String, required: true },
  timestamp: { type: Date, required: true, default: Date.now },
  notes: [
    { type: Schema.Types.ObjectId, ref: 'note' },
  ],
  userID: { type: Schema.Types.ObjectId, ref: 'users', required: true },
});

listSchema.pre('findOne', function (next) {
  this.populate('notes');
  next();
});

const List = mongoose.model('list', listSchema);

// For models middleware
// to support /api/lists instead of /api/list
List.route = 'lists';

export default List;
