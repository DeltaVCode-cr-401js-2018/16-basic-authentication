'use strict';

import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

userSchema.pre('save', function(next) {
  bcrypt.hash(this.password, 10)
    .then(hashedPassword => {
      // Replace plain-text password with hashed version
      this.password = hashedPassword;
      // Continue to perform save
      next();
    })
    .catch(err => { throw err; });
});

userSchema.methods.comparePassword = function(password) {
  return bcrypt.compare(password, this.password)
    // If valid, resolve with this,
    // otherwise pretend user does not exist
    .then(valid => valid ? this : null);
};

userSchema.statics.authenticate = function(auth) {
  // MongoDB query by username
  let query = { username: auth.username };

  return this.findOne(query)
    .then(user => user && user.comparePassword(auth.password));
};

userSchema.methods.generateToken = function () {
  const payload = {
    id: this._id,
  };
  return jwt.sign(payload, process.env.SECRET || 'DeltaV Secret');
};

userSchema.statics.authorize = function (token) {
  try {
    let payload = jwt.verify(token, process.env.SECRET || 'DeltaV Secret');
    return this.findById(payload.id)
      .then(user => {
        // TODO: anything useful
        return user;
      });
  }
  catch (err) {
    return Promise.resolve(null);
  }
};

export default mongoose.model('users', userSchema);
