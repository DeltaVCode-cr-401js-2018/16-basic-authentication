'use strict';

import mongoose from 'mongoose';

module.exports = (uri) => {
  return mongoose.connect(uri, { useNewUrlParser: true });
};