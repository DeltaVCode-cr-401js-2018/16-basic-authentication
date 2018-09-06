'use strict';

import mongoose, { Schema } from 'mongoose';
import Ensemble from './ensemble';

const instrumentSchema = Schema({
  name: { type: String, required: true},
  family: { type: String, required: true},
  retailer: { type: String},
  ensemble: {type: Schema.Types.ObjectId, ref: 'ensemble'},
});

instrumentSchema.pre('findOne', function(next){
  this.populate('ensemble');
  next();
});

instrumentSchema.pre('save', function(next){
  let instrumentId = this._id;
  let ensembleId = this.ensemble;
  if(!ensembleId){
    return next();
  }

  Ensemble.findById(ensembleId)
    .then(ensemble =>{
      if(!ensemble){
        return Promise.reject('Invalid ensemble ID');
      }
      return Ensemble.findByIdAndUpdate(
        ensembleId,
        {$addToSet: { instruments: instrumentId } }
      );
    })
    .then(()=> next())
    .catch(err => next(err));
});

const Instrument = mongoose.models.instrument || mongoose.model('instrument', instrumentSchema, 'instrument');

Instrument.route = 'instruments';

export default Instrument;