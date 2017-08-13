import request from 'supertest';
import matchers from 'jest-supertest-matchers';
import faker from 'faker';

import app from '../src';
import db from '../src/init';

describe('requests', () => {
  let server;
  let user1;
  let cookie;

  beforeAll(async () => {
    jasmine.addMatchers(matchers);
    server = app().listen();
    await db();
    user1 = {
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
    };
  });

  it('GET users', async () => {
    const res = await request.agent(server)
      .get('/users');
    expect(res).toHaveHTTPStatus(200);
  });

  it('POST new user', async () => {
    const res = await request.agent(server)
      .post('/users')
      .send({ form: user1 });
    expect(res).toHaveHTTPStatus(302);
  });

  it('POST existing user', async () => {
    const res = await request.agent(server)
      .post('/users')
      .send({ form: user1 });
    expect(res).toHaveHTTPStatus(200);
  });

  it('POST session', async () => {
    const res = await request.agent(server)
      .post('/session')
      .send({ form: user1 });
    // console.log(res);
    const cookieReg = /koa\.sid(\.sig)*?=(.)*?;/gi;
    cookie = res.headers['set-cookie'][0].match(cookieReg).join(' ').slice(0, -1);
    expect(res).toHaveHTTPStatus(302);
  });

  it('GET users/edit', async () => {
    const res = await request.agent(server)
      .get('/users/edit')
      .set('Cookie', cookie);
    expect(res).toHaveHTTPStatus(200);
  });

  it('PATCH users/edit', async () => {
    const res = await request.agent(server)
      .patch('/users/edit')
      .set('Cookie', cookie)
      .send({ form: { ...user1, firstName: faker.name.firstName() } });
    expect(res).toHaveHTTPStatus(302);
  });

  it('PATCH users/edit/reset_password', async () => {
    const oldPass = user1.password;
    const newPass = faker.internet.password();
    user1 = { ...user1, password: newPass };

    const res = await request.agent(server)
      .patch('/users/edit/reset_password')
      .set('Cookie', cookie)
      .send({ form: { oldPass, newPass } });
    expect(res).toHaveHTTPStatus(302);
  });

  it('DELETE users/edit/delete', async () => {
    const res = await request.agent(server)
      .delete('/users/edit/delete')
      .set('Cookie', cookie)
      .send({ form: { ...user1 } });
    expect(res).toHaveHTTPStatus(302);
  });

  afterEach((done) => {
    server.close();
    done();
  });
});
