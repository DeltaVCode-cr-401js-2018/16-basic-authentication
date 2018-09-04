'use strict';

import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';

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

export default mongoose.model('users', userSchema);
