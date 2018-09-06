'use strict';

jest.mock('../../src/auth/model');

import auth from '../../src/auth/middleware';

describe('Auth Middleware', () => {
  it('works with correct username & password', done=> {
    let user = 'schrodac';
    let password = 'SCHRODAC';
    let code = btoa(`${user}:${password}`);

    let req = {
      headers: {
        authorization: `Basic ${code}`,
      },
    };
    
    let res = new FakeResponse();

    auth(req, res, ()=> {
      expect(res.token).toBe('schrodac token!');
      done();
    });
  });

  it('returns an error when the auth header is not present', done => {
    let req = { headers: {} };
    let res = new FakeResponse();

    auth(req, res, (err)=> {
      expect(err).toBeDefined();
      expect(err.status).toBe(401);
      done();
    });
  });

  it('returns with an error when the auth header is invalid Basic auth', done => {
    let req = {
      headers: {
        authorization: 'Basic Basic',
      },
    };
    
    let res = new FakeResponse();

    auth(req, res, (err)=> {
      expect(err).toBeDefined();
      expect(err.status).toBe(401);
      done();
    });
  });

  // TODO: need real username/password mismatch
});

class FakeResponse {
  setHeader() {
    
  }
}