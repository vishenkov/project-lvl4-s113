import buildFormObj from '../lib/formObjectBuilder';

export default (router, { logger, Tag, TaskTag }) => {
  router
    .get('tags', '/tags', async (ctx) => {
      const tags = await Tag.findAll();
      const taskTags = await TaskTag.findAll();
      ctx.render('tags', { tags, taskTags });
    })

    .get('newTag', '/tags/new', async (ctx) => {
      if (!ctx.state.isSignedIn()) {
        ctx.throw(401);
        return;
      }
      const tag = Tag.build();
      ctx.render('tags/new', { f: buildFormObj(tag) });
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
        logger(e);
        ctx.render('tags/new', { f: buildFormObj(tag, e) });
      }
    });
};
