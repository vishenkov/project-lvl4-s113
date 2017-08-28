import buildFormObj from '../lib/formObjectBuilder';

export default (router, { Tag, User, TaskStatus, logger }) => {
  router
    .get('editTag', '/tag/:name/edit', async (ctx) => {
      if (!ctx.state.isSignedIn()) {
        ctx.throw(401);
        return;
      }
      const tag = await Tag.findOne({
        where: {
          name: ctx.params.name,
        },
      });
      if (tag) {
        ctx.render('tag/edit', { f: buildFormObj(tag), tag });
      } else {
        ctx.throw(404);
      }
    })

    .get('tag', '/tag/:name', async (ctx) => {
      const tag = await Tag.findOne({
        where: {
          name: ctx.params.name,
        },
      });
      if (tag) {
        const tasks = await tag.getTasks({
          include: [
            { model: User, as: 'creator' },
            { model: User, as: 'assignedTo' },
            { model: TaskStatus, as: 'status' },
            { model: Tag },
          ],
        });
        ctx.render('tag', { tasks });
      } else {
        ctx.throw(404);
      }
    })

    .patch('tag', '/tag/:name', async (ctx) => {
      if (!ctx.state.isSignedIn()) {
        ctx.throw(401);
        return;
      }
      const form = ctx.request.body.form;
      const tag = await Tag.findOne({
        where: {
          name: ctx.params.name,
        },
      });
      try {
        await Tag.update(
          {
            name: form.name,
          },
          {
            where: {
              id: tag.id,
            },
          });
        ctx.flash.set('Tag has been updated!');
        ctx.redirect(router.url('tags'));
      } catch (e) {
        logger(e);
        ctx.render('tag/edit', { f: buildFormObj(tag, e) });
      }
    })

    .delete('tag', '/tag/:name', async (ctx) => {
      if (!ctx.state.isSignedIn()) {
        ctx.throw(401);
        return;
      }
      await Tag.destroy({
        where: {
          name: ctx.params.name,
        },
      });
      ctx.flash.set(`Tag '${ctx.params.name}' has been deleted!`);
      ctx.redirect(router.url('tags'));
    });
};
