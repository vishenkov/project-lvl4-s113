import buildFormObj from '../lib/formObjectBuilder';

export default (router, { logger, Tag, User, TaskStatus }) => {
  const log = logger('tags');
  router
    .get('tags', '/tags', async (ctx) => {
      const tags = await Tag.findAll();
      log('Tags list: %o', tags);
      ctx.render('tags', { tags });
    })

    .get('newTag', '/tags/new', async (ctx) => {
      if (!ctx.state.isSignedIn()) {
        ctx.throw(401);
        return;
      }
      const tag = Tag.build();
      ctx.render('tags/new', { f: buildFormObj(tag) });
    })

    .get('editTag', '/tags/:id/edit', async (ctx) => {
      if (!ctx.state.isSignedIn()) {
        ctx.throw(401);
        return;
      }
      const tag = await Tag.findOne({
        where: {
          id: ctx.params.id,
        },
      });
      log(`Edit tag: ${tag}`);
      if (tag) {
        ctx.render('tags/edit', { f: buildFormObj(tag), tag });
      } else {
        ctx.throw(404);
      }
    })

    .get('tag', '/tags/:id', async (ctx) => {
      const tag = await Tag.findOne({
        where: {
          id: ctx.params.id,
        },
      });

      log(`Tag by id: ${tag}`);

      if (tag) {
        const tasks = await tag.getTasks({
          include: [
            { model: User, as: 'creator' },
            { model: User, as: 'assignedTo' },
            { model: TaskStatus, as: 'status' },
            { model: Tag },
          ],
        });
        log(`Task by tag: ${tasks}`);

        ctx.render('tags/tag', { tasks, tag });
      } else {
        ctx.throw(404);
      }
    })

    .post('tags', '/tags', async (ctx) => {
      if (!ctx.state.isSignedIn()) {
        ctx.throw(401);
        return;
      }
      const form = ctx.request.body.form;
      const tag = Tag.build(form);

      try {
        await tag.save();
        ctx.flash.set('Tag has been created!');
        ctx.redirect(router.url('root'));
      } catch (e) {
        log(e);
        ctx.render('tags/new', { f: buildFormObj(tag, e) });
      }
    })

    .patch('tag', '/tags/:id', async (ctx) => {
      if (!ctx.state.isSignedIn()) {
        ctx.throw(401);
        return;
      }
      const form = ctx.request.body.form;
      const tag = await Tag.findOne({
        where: {
          id: ctx.params.id,
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
        ctx.render('tags/edit', { f: buildFormObj(tag, e) });
      }
    })

    .delete('tag', '/tags/:id', async (ctx) => {
      if (!ctx.state.isSignedIn()) {
        ctx.throw(401);
        return;
      }
      await Tag.destroy({
        where: {
          id: ctx.params.id,
        },
      });
      ctx.flash.set('Tag has been deleted!');
      ctx.redirect(router.url('tags'));
    });
};
