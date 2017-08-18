import buildFormObj from '../lib/formObjectBuilder';
import encrypt from '../lib/secure';

export default (router, { User, logger }) => {
  router
    .get('users', '/users', async (ctx) => {
      const users = await User.findAll();
      ctx.render('users', { users });
    })
    .get('newUser', '/users/new', (ctx) => {
      const user = User.build();
      ctx.render('users/new', { f: buildFormObj(user) });
    })
    .get('deleteUser', '/users/delete', async (ctx) => {
      const user = await User.findOne({
        where: {
          id: ctx.session.userId,
        },
      });
      ctx.render('users/delete', { f: buildFormObj(user) });
    })
    .delete('users', '/users', async (ctx) => {
      const { password } = ctx.request.body.form;
      const user = await User.findOne({
        where: {
          id: ctx.session.userId,
        },
      });
      if (user && user.passwordDigest === encrypt(password)) {
        user.destroy();
        ctx.flash.set('User has been deleted!');
        ctx.session = {};
        ctx.redirect(router.url('root'));
        return;
      }
      ctx.flash.set('Password were wrong');
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
        logger(e);
        ctx.render('users/new', { f: buildFormObj(user, e) });
      }
    });
};
