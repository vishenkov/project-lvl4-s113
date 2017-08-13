import welcome from './welcome';
import users from './users';
import sessions from './sessions';
import profile from './profile';

const controllers = [welcome, users, sessions, profile];

export default (router, container) => controllers.forEach(f => f(router, container));
