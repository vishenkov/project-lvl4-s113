export default (router, { User }) => {
  router
    .get('profile', '/profile/:id', async (ctx) => {
      const user = await User.findOne({
        where: {
          id: ctx.params.id,
        },
      });
      if (user) {
        ctx.render('profile', { user });
      } else {
        throw new Error('404');
      }
    });
};
