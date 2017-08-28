import request from 'supertest';
import matchers from 'jest-supertest-matchers';
import faker from 'faker';

import app from '../src';
import db from '../src/init';

describe('requests', () => {
  let server;
  let user1;
  let cookie;
  let tag;
  let task;

  beforeAll(async () => {
    jasmine.addMatchers(matchers);
    server = app().listen();
    await db();
    user1 = {
      id: faker.random.number({ min: 1000, max: 10000 }),
      firstName: faker.name.firstName(),
      lastName: faker.name.lastName(),
      email: faker.internet.email(),
      password: faker.internet.password(),
    };
    tag = {
      name: faker.hacker.noun(),
    };
    task = {
      id: faker.random.number({ min: 1000, max: 10000 }),
      name: faker.lorem.words(),
      description: faker.lorem.sentences(),
    };
    await request.agent(server)
      .post('/users')
      .send({ form: user1 });
    const res = await request.agent(server)
      .post('/session')
      .send({ form: user1 });

    const cookieReg = /koa\.sid(\.sig)*?=(.)*?;/gi;
    cookie = res.headers['set-cookie'][0].match(cookieReg).join(' ').slice(0, -1);
  });

  it('GET /tasks', async () => {
    const res = await request.agent(server)
      .get('/tasks');
    expect(res).toHaveHTTPStatus(200);
  });

  it('GET /tags', async () => {
    const res = await request.agent(server)
      .get('/tags');
    expect(res).toHaveHTTPStatus(200);
  });

  it('POST Unauthorized new /tags', async () => {
    const res = await request.agent(server)
      .post('/tags')
      .send({ form: tag });
    expect(res).toHaveHTTPStatus(401);
  });

  it('POST new /tags', async () => {
    const res = await request.agent(server)
      .post('/tags')
      .set('Cookie', cookie)
      .send({ form: tag });
    expect(res).toHaveHTTPStatus(302);
  });

  it('GET /tag/:name', async () => {
    const res = await request.agent(server)
      .get(`/tag/${tag.name}`);
    expect(res).toHaveHTTPStatus(200);
  });

  it('PATCH /tag/:name', async () => {
    const res = await request.agent(server)
      .patch(`/tag/${tag.name}`)
      .set('Cookie', cookie)
      .send({ form: tag });
    expect(res).toHaveHTTPStatus(302);
  });

  it('DELETE /tag/:name/delete', async () => {
    const res = await request.agent(server)
      .delete(`/tag/${tag.name}`)
      .set('Cookie', cookie);
    expect(res).toHaveHTTPStatus(302);
  });

  it('POST Unauthorized new /tasks', async () => {
    const res = await request.agent(server)
      .post('/tasks')
      .send({ form: task });
    expect(res).toHaveHTTPStatus(401);
  });

  it('POST new /tasks', async () => {
    const res = await request.agent(server)
      .post('/tasks')
      .set('Cookie', cookie)
      .send({
        form: {
          ...task,
          assignedTo: user1.id,
        },
      });
    expect(res).toHaveHTTPStatus(302);
  });

  it('GET /task/:id', async () => {
    const res = await request.agent(server)
      .get(`/task/${task.id}`);
    expect(res).toHaveHTTPStatus(200);
  });

  it('PATCH /task/:id', async () => {
    const res = await request.agent(server)
      .patch(`/task/${task.id}`)
      .set('Cookie', cookie)
      .send({
        form: {
          ...task,
          assignedTo: user1.id,
        },
      });
    expect(res).toHaveHTTPStatus(302);
  });

  it('DELETE /task/:id', async () => {
    const res = await request.agent(server)
      .delete(`/task/${task.id}`)
      .set('Cookie', cookie);
    expect(res).toHaveHTTPStatus(302);
  });

  it('GET deleted /task/:id', async () => {
    const res = await request.agent(server)
      .get(`/task/${task.id}`);
    expect(res).toHaveHTTPStatus(404);
  });

  afterEach((done) => {
    server.close();
    done();
  });
});
