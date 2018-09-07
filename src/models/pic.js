'use strict';

import mongoose, { Schema } from 'mongoose';

const picSchema = Schema({
  name: { type: String, required: true },
  desc: { type: String },
  created: { type: Date, required: true, default: Date.now },

  imageURI: { type: String, require: true, unique: true },
  objectKey: { type: String, required: true, unique: true },

  userID: { type: Schema.Types.ObjectId, ref: 'users', required: true },
  galleryID: { type: Schema.Types.ObjectId, ref: 'gallery', required: true },
});

const Pic = mongoose.model('pic', picSchema);

Pic.route = 'pics';

export default Pic;
