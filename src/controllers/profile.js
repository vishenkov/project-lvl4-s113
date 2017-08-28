import buildFormObj from '../lib/formObjectBuilder';
import encrypt from '../lib/secure';

export default (router, { User, TaskStatus, Tag, logger }) => {
  router
    .get('editUser', '/profile/edit', async (ctx) => {
      if (!ctx.state.isSignedIn()) {
        ctx.throw(401);
        return;
      }
      const user = await User.findOne({
        where: {
          id: ctx.session.userId,
        },
      });
      ctx.render('profile/edit', { f: buildFormObj(user) });
    })

    .get('resetPswdUser', '/profile/edit/reset_password', async (ctx) => {
      if (!ctx.state.isSignedIn()) {
        ctx.throw(401);
        return;
      }
      const user = await User.findOne({
        where: {
          id: ctx.session.userId,
        },
      });
      ctx.render('profile/reset_password', { f: buildFormObj(user) });
    })

    .get('profile', '/profile/:id', async (ctx) => {
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
        ctx.render('profile', { user, createdTasks, assignedTasks });
      } else {
        ctx.throw(404);
      }
    })

    .patch('resetPswdUser', '/profile/edit/reset_password', async (ctx) => {
      if (!ctx.state.isSignedIn()) {
        ctx.throw(401);
        return;
      }
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
          ctx.render('profile/reset_password', { f: buildFormObj(user, e) });
        }
        return;
      }

      ctx.flash.set('Incorrect password!');
      ctx.redirect(router.url('resetPswdUser'));
    })

    .patch('editUser', '/profile/edit', async (ctx) => {
      if (!ctx.state.isSignedIn()) {
        ctx.throw(401);
        return;
      }
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
        ctx.render('profile/edit', { f: buildFormObj(user, e) });
      }
    });
};
