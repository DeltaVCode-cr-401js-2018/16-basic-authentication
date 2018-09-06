'use strict';

module.exports = function requireAllMock(dir){
  if(typeof dir !== 'string'){
    throw new Error('Require all needs a dir');
  }
  return{
    'foo' : { default: fakeModel('foo', 'foo-route') },
    'bar': { default: fakeModel('bar') },
  };
};
function fakeModel(modelName, route){
  class Fake{
    constructor(){
    }
    static findBydId(id){
      return new Fake();
    }
  }
  Fake.modelName = modelName;
  Fake.route = route;
  return Fake;
}