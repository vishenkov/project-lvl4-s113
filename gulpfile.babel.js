import 'babel-polyfill';

import gulp from 'gulp';
import gutil from 'gulp-util';
import repl from 'repl';
import container from './src/container';
import init from './src/init';
import getServer from './src';
import genDbData from './src/generator';


gulp.task('console', () => {
  gutil.log = gutil.noop;
  const replServer = repl.start({
    prompt: 'Application console > ',
  });

  Object.keys(container).forEach((key) => {
    replServer.context[key] = container[key];
  });
});

gulp.task('init', async () => {
  await init();
  console.log('db was created');
});

gulp.task('gendb', async () => {
  await genDbData('all');
  console.log('db data was created');
});

gulp.task('gendbbase', async () => {
  await genDbData('base');
  console.log('base db data was created');
});

gulp.task('server', (cb) => {
  getServer().listen(process.env.PORT || 3000, cb);
});
