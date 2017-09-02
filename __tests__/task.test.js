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
      id: faker.random.number({ min: 1000, max: 10000 }),
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

  it('GET /tags/:id', async () => {
    const res = await request.agent(server)
      .get(`/tags/${tag.id}`);
    expect(res).toHaveHTTPStatus(200);
  });

  it('PATCH /tags/:id', async () => {
    const res = await request.agent(server)
      .patch(`/tags/${tag.id}`)
      .set('Cookie', cookie)
      .send({ form: tag });
    expect(res).toHaveHTTPStatus(302);
  });

  it('DELETE /tags/:id', async () => {
    const res = await request.agent(server)
      .delete(`/tags/${tag.id}`)
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

  it('GET /tasks/:id', async () => {
    const res = await request.agent(server)
      .get(`/tasks/${task.id}`);
    expect(res).toHaveHTTPStatus(200);
  });

  it('PATCH /tasks/:id', async () => {
    const res = await request.agent(server)
      .patch(`/tasks/${task.id}`)
      .set('Cookie', cookie)
      .send({
        form: {
          ...task,
          status: 1,
          assignedTo: user1.id,
        },
      });
    expect(res).toHaveHTTPStatus(302);
  });

  it('DELETE /tasks/:id', async () => {
    const res = await request.agent(server)
      .delete(`/tasks/${task.id}`)
      .set('Cookie', cookie);
    expect(res).toHaveHTTPStatus(302);
  });

  it('GET deleted /tasks/:id', async () => {
    const res = await request.agent(server)
      .get(`/tasks/${task.id}`);
    expect(res).toHaveHTTPStatus(404);
  });

  afterEach((done) => {
    server.close();
    done();
  });
});
