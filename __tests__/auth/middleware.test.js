'use strict';

jest.mock('../../src/auth/model');

import auth from '../../src/auth/middleware';

describe('Auth Middleware', () => {
  it('works for correct username and password', done => {
    let user = 'dahlbyk';
    let password = 'DAHLBYK';

    // btoa = Base64 encode username:password
    let code = btoa(`${user}:${password}`);

    let req = {
      headers: {
        authorization: `Basic ${code}`,
      },
    };
    let res = new FakeResponse();

    // auth = middleware, which receives request, response, next
    auth(req, res, () => {
      expect(res.token).toBe('dahlbyk token!');
      done();
    });
  });

  it('returns error when the auth header is not present', done => {
    let req = { headers: {} };
    let res = new FakeResponse();

    auth(req, res, (err) => {
      expect(err).toBeDefined();
      expect(err.status).toBe(401);
      done();
    });
  });

  it('returns error when the auth header is invalid Basic auth', done => {
    let req = {
      headers: {
        authorization: 'Basic Basic',
      },
    };
    let res = new FakeResponse();

    auth(req, res, (err) => {
      expect(err).toBeDefined();
      expect(err.status).toBe(401);
      done();
    });
  });

  // TODO: real username/password mismatch
});

class FakeResponse {
  setHeader() {
  }
}