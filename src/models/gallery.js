'use strict';

import mongoose, { Schema } from 'mongoose';

const gallerySchema = Schema({
  name: { type: String, required: true },
  desc: { type: String },
  created: { type: Date, required: true, default: Date.now },
  userID: { type: Schema.Types.ObjectId, ref: 'users', required: true },
});

const Gallery = mongoose.model('gallery', gallerySchema);

export default Gallery;
