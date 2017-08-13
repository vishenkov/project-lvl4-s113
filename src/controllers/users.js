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
    .get('editUser', '/users/edit', async (ctx) => {
      const user = await User.findOne({
        where: {
          id: ctx.session.userId,
        },
      });
      ctx.render('users/edit', { f: buildFormObj(user) });
    })
    .get('resetPswdUser', '/users/edit/reset_password', async (ctx) => {
      const user = await User.findOne({
        where: {
          id: ctx.session.userId,
        },
      });
      ctx.render('users/reset_password', { f: buildFormObj(user) });
    })
    .get('deleteUser', '/users/edit/delete', async (ctx) => {
      const user = await User.findOne({
        where: {
          id: ctx.session.userId,
        },
      });
      ctx.render('users/delete', { f: buildFormObj(user) });
    })
    .patch('resetPswdUser', '/users/edit/reset_password', async (ctx) => {
      const { newPass, oldPass } = ctx.request.body.form;
      const user = await User.findOne({
        where: {
          id: ctx.session.userId,
        },
      });
      if (user && user.passwordDigest === encrypt(oldPass)) {
        try {
          await User.update(
            {
              password: newPass,
            },
            {
              where: {
                id: ctx.session.userId,
              },
            });
          ctx.flash.set('Password has been updated!');
          ctx.redirect(router.url('resetPswdUser'));
        } catch (e) {
          logger(e);
          ctx.render('users/reset_password', { f: buildFormObj(user, e) });
        }
        return;
      }

      ctx.flash.set('Incorrect password!');
      ctx.redirect(router.url('resetPswdUser'));
    })
    .patch('editUser', '/users/edit', async (ctx) => {
      const form = ctx.request.body.form;
      const user = User.build(form);
      try {
        await User.update(
          {
            ...form,
          },
          {
            where: {
              id: ctx.session.userId,
            },
          });
        ctx.flash.set('User has been updated!');
        ctx.redirect(router.url('editUser'));
      } catch (e) {
        logger(e);
        ctx.render('users/edit', { f: buildFormObj(user, e) });
      }
    })
    .delete('deleteUser', '/users/edit/delete', async (ctx) => {
      // TODO: (i am the danger)
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
