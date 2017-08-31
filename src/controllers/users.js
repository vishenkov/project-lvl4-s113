import buildFormObj from '../lib/formObjectBuilder';
import encrypt from '../lib/secure';
import { checkAuth } from '../lib/middlewares';

export default (router, { User, TaskStatus, Tag, logger }) => {
  const log = logger('users');

  router
    .get('users', '/users', async (ctx) => {
      const users = await User.findAll();
      ctx.render('users', { users });
    })

    .get('newUser', '/users/new', (ctx) => {
      const user = User.build();
      ctx.render('users/new', { f: buildFormObj(user) });
    })

    .get('user', '/users/:id', async (ctx) => {
      const user = await User.findOne({
        where: {
          id: ctx.params.id,
        },
      });
      const createdTasks = await user.getCreatedTasks({
        include: [
          { model: User, as: 'creator' },
          { model: User, as: 'assignedTo' },
          { model: TaskStatus, as: 'status' },
          { model: Tag },
        ],
      });
      const assignedTasks = await user.getAssignedTasks({
        include: [
          { model: User, as: 'creator' },
          { model: User, as: 'assignedTo' },
          { model: TaskStatus, as: 'status' },
          { model: Tag },
        ],
      });
      if (user) {
        ctx.render('users/user', { user, createdTasks, assignedTasks });
      } else {
        ctx.throw(404);
      }
    })

    .delete('users', '/users', checkAuth, async (ctx) => {
      const { password } = ctx.request.body.form;
      const user = await User.findOne({
        where: {
          id: ctx.session.userId,
        },
      });
      if (user && user.passwordDigest === encrypt(password)) {
        await user.destroy();
        ctx.flash.set('User has been deleted!');
        ctx.session = {};
        ctx.redirect(router.url('root'));
        return;
      }
      ctx.flash.set('Password was wrong');
      ctx.render('users/delete', { f: buildFormObj(user) });
    })

    .post('users', '/users', async (ctx) => {
      const form = ctx.request.body.form;
      const user = User.build(form);
      try {
        await user.save();
        ctx.flash.set('User has been created!');
        ctx.redirect(router.url('root'));
      } catch (e) {
        log(e);
        ctx.render('users/new', { f: buildFormObj(user, e) });
      }
    });
};
