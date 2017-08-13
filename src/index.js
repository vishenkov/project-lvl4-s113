// @flow

import 'babel-polyfill';

import path from 'path';
import Koa from 'koa';
import Pug from 'koa-pug';
import Router from 'koa-router';
import koaLogger from 'koa-logger';
import serve from 'koa-static';
import middleware from 'koa-webpack';
import bodyParser from 'koa-bodyparser';
import session from 'koa-generic-session';
import flash from 'koa-flash-simple';
import _ from 'lodash';
import methodOverride from 'koa-methodoverride';

import rollbar from './lib/rollbar';
import getWebpackConfig from '../webpack.config.babel';
import addRoutes from './controllers';
import container from './container';
import logger from './lib/logger';


export default () => {
  const app = new Koa();
  logger('APP CREATED!');
  app.keys = ['some secret hurr'];
  app.use(session(app));
  app.use(flash());
  app.use(async (ctx, next) => {
    ctx.state = {
      flash: ctx.flash,
      isSignedIn: () => ctx.session.userId !== undefined,
    };
    await next();
  });

  app.use(bodyParser());
  app.use(async (ctx, next) => {
    // the parsed body will store in ctx.request.body
    // if nothing was parsed, body will be an empty object {}
    // logger(ctx);
    ctx.request.body = { ...ctx.request.body, ...ctx.request.query };
    await next();
  });
  app.use(methodOverride((req) => {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      // eslint-disable-next-line
      return req.body._method;
    }
    return null;
  }));
  app.use(serve(path.join(__dirname, '..', 'public')));

  app.use(async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      rollbar.log(err);
      ctx.status = err.status || 500;
      ctx.body = err.message;
      ctx.app.emit('error', err, ctx);
    }
  });

  if (process.env.NODE_ENV !== 'test') {
    app.use(middleware({
      config: getWebpackConfig(),
    }));
  }

  app.use(koaLogger());
  const router = new Router();
  addRoutes(router, container);
  app.use(router.allowedMethods());
  app.use(router.routes());

  const pug = new Pug({
    viewPath: path.join(__dirname, 'views'),
    debug: true,
    pretty: true,
    compileDebug: true,
    locals: [],
    basedir: path.join(__dirname, 'views'),
    helperPath: [
      { _ },
      { urlFor: (...args) => router.url(...args) },
    ],
  });
  pug.use(app);
  return app;
};
