'use strict';

import app from '../src/app';
const request = require('supertest')(app);

describe('app', () => {
  it('responds with 404 for unknown path', async () => {
    await request
      .get('/404')
      .expect(404)
      .expect('Content-Type', 'text/html; charset=utf-8');
  });

  it('responds with JSON 404 for unknown path given Accept: application/json', async () => {
    await request
      .get('/404')
      .set('Accept', 'application/json')
      .expect(404, { error: 'Not Found' })
      .expect('Content-Type', 'application/json; charset=utf-8');
  });

  it('responds with HTML for /', async () => {
    await request
      .get('/')
      .expect(200, /DeltaV/)
      .expect('Content-Type', 'text/html; charset=utf-8');
  });
});