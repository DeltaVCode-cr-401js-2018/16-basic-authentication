'use strict';

module.exports = (dir)=> {
  if (typeof dir !== 'string') {
    throw new Error('require-all needs dir');
  }


  return {
    'foo': { default: fakeRoute('foo', 'foo-route') },
    'bar': { default: fakeRoute() },
  };
};

function fakeRoute(modelName, route) {
  class Fake {
    constructor() {

    }

    static findById(id) {
      return new Fake();
    }
  }
  Fake.modelName = modelName;
  Fake.route = route;
  return Fake;
}