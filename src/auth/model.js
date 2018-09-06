'use strict';

import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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
  console.log(auth.username, auth.password);
  return this.findOne(query)
    .then(user => user && user.comparePassword(auth.password));
};

userSchema.methods.generateToken = function(){
  const payload = {
    id: this._id,
  };
  return jwt.sign(payload, process.env.SECRET || 'DeltaV Secret');
};

userSchema.statics.authorize= function(token){
  try{
    let payload = jwt.verify(token, process.env.SECRET || 'DeltaV Secret');
    return this.findById(payload.id)
      .then(user=>{
        return user;
      });
  }
  catch(err){
    return Promise.resolve(null);
  }
};

export default mongoose.model('users', userSchema);
