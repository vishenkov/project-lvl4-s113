import buildFormObj from '../lib/formObjectBuilder';
import encrypt from '../lib/secure';

export default (router, { User }) => {
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
      ctx.render('users/edit', { f: { ...buildFormObj(user), passwordDigest: '' } });
    })
    .get('resetPswdUser', '/users/edit/reset_password', async (ctx) => {
      const user = await User.findOne({
        where: {
          id: ctx.session.userId,
        },
      });
      ctx.render('users/reset_password', { f: { ...buildFormObj(user), passwordDigest: '' } });
    })
    .put('resetPswdUser', '/users/edit/reset_password', async (ctx) => {
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
          ctx.render('users/reset_password', { f: buildFormObj(user, e) });
        }
        return;
      }

      ctx.flash.set('Incorrect password!');
      ctx.redirect(router.url('resetPswdUser'));
    })
    .get('users', '/users/:id', async (ctx) => {
      const user = await User.findOne({
        where: {
          id: ctx.params.id,
        },
      });
      if (user) {
        ctx.render('users/profile', { user });
      } else {
        throw new Error('404');
      }
    })
    .put('editUser', '/users/edit', async (ctx) => {
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
        ctx.render('users/edit', { f: buildFormObj(user, e) });
      }
    })
    .delete('deleteUser', '/users/edit/delete', async (ctx) => {
      // TODO: (i am the danger)
      const user = await User.findOne({
        where: {
          id: ctx.session.userId,
        },
      });
      user.destroy();
      ctx.flash.set('User has been deleted!');
      ctx.session = {};
      ctx.redirect(router.url('root'));
    })
    .post('users', '/users', async (ctx) => {
      const form = ctx.request.body.form;
      const user = User.build(form);
      try {
        await user.save();
        ctx.flash.set('User has been created!');
        ctx.redirect(router.url('root'));
      } catch (e) {
        ctx.render('users/new', { f: buildFormObj(user, e) });
      }
    });
};
