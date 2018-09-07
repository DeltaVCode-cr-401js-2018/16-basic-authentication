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
      expect(req.token).toBe('dahlbyk token!');
      expect(req.user).toBeDefined();
      done();
    });
  });

  it('returns error when the auth header is not present', done => {
    let req = { headers: {} };
    let res = new FakeResponse();

    auth(req, res, (err) => {
      expect(err).toBeDefined();
      expect(err.status).toBe(401);

      expect(req.token).not.toBeDefined();
      expect(req.user).not.toBeDefined();

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

      expect(req.token).not.toBeDefined();
      expect(req.user).not.toBeDefined();

      done();
    });
  });

  // TODO: real username/password mismatch

  describe('Bearer Auth', () => {
    it('works for valid token', done => {
      let token = 'DeltaV token!';
      let req = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };
      let res = new FakeResponse();

      auth(req, res, (err) => {
        expect(err).not.toBeDefined();

        expect(req.token).toBe(token);
        expect(req.user).toBeDefined();

        done();
      });
    });

    it('does not set token for missing user', done => {
      let token = 'ShmeltaV token!';
      let req = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };
      let res = new FakeResponse();

      auth(req, res, (err) => {
        expect(err).toBeDefined();
        expect(err.status).toBe(401);

        expect(req.token).not.toBeDefined();
        expect(req.user).not.toBeDefined();

        done();
      });
    });
  });
});

class FakeResponse {
  setHeader() {
  }
}