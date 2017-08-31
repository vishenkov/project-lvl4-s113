import welcome from './welcome';
import users from './users';
import sessions from './sessions';
import profile from './profile';
import task from './task';
import tasks from './tasks';
import tags from './tags';


const controllers = [welcome, users, sessions, profile, task, tasks, tags];

export default (router, container) => controllers.forEach(f => f(router, container));
