'use strict';

import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true},
});

userSchema.pre('save', function(next){
  bcrypt.hash(this.password, 10)
    .then(hashedPass =>{
      this.password = hashedPass;
      next();
    })
    .catch(err => { throw err; });
});

userSchema.methods.comparePassword = function(password) {
  return bcrypt.compare(password, this.password)
    .then(valid => valid ? this : null);
};

userSchema.statics.authenticate = function(auth){
  let query = { username: auth.username };
  return this.findOne(query)
    .then(user => user && user.comparePassword(auth.password));
};

userSchema.methods.generateToken = function(){
  return 'change me';
};

export default mongoose.model('users', userSchema);
