'use strict';

jest.mock('require-all');
import modelFinder from '../../src/middleware/models';

describe('Model Finder Middleware', () => {
  it ('returns a model when a valid model is requested', done => {
    // /api/:model where :model = foo-route
    let req = {
      params: {
        model: 'foo-route',
      },
    };
    let res = {};
    let next = () => {
      expect(req.Model).toBeDefined();
      expect(req.Model.modelName).toBe('foo');
      done();
    };

    modelFinder(req, res, next);
  });

  it ('returns error when an invalid model is requested', () => {
    let req = {
      params: {
        model: 'forks',
      },
    };
    let res = {};
    let next = () => { throw 'Should not be called'; };

    expect(() => {
      modelFinder(req, res, next);
    }).toThrowError('Model Not Found');
  });
});
