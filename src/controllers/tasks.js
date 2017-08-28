import _ from 'lodash';
import buildFormObj from '../lib/formObjectBuilder';

export default (router, { Task, User, Tag, TaskStatus, logger }) => {
  router
    .get('tasks', '/tasks', async (ctx) => {
      const tasks = await Task.findAll({
        include: [
          { model: User, as: 'creator' },
          { model: User, as: 'assignedTo' },
          { model: TaskStatus, as: 'status' },
          { model: Tag },
        ],
      });
      ctx.render('tasks', { tasks });
    })

    .get('newTask', '/tasks/new', async (ctx) => {
      if (!ctx.state.isSignedIn()) {
        ctx.throw(401);
        return;
      }
      const task = Task.build();
      const rawUsers = await User.findAll({
        where: {
          id: {
            $ne: ctx.session.userId,
          },
        },
      });
      const users = rawUsers.map(user => ({
        value: user.id,
        text: user.fullName,
      }));
      users.unshift({
        value: ctx.session.userId,
        text: '>> me <<',
      });
      ctx.render('tasks/new', { f: buildFormObj(task), users });
    })

    .post('tasks', '/tasks', async (ctx) => {
      if (!ctx.state.isSignedIn()) {
        ctx.throw(401);
        return;
      }
      const form = ctx.request.body.form;
      const taskKeys = Object.keys(form).filter(key =>
        !_.includes(['assignedTo', 'tags', 'newTags', 'status'], key));
      const taskBuild = taskKeys.reduce((acc, key) => {
        acc[key] = form[key];
        return acc;
      }, {});

      const assignedUser = await User.findOne({
        where: {
          id: form.assignedTo,
        },
      });
      const creator = await User.findOne({
        where: {
          id: ctx.session.userId,
        },
      });
      const status = await TaskStatus.findOne({
        where: {
          name: 'new',
        },
      });
      let task;
      try {
        task = await Task.create(
          {
            ...taskBuild,
            creatorId: creator.id,
            assignedToId: assignedUser.id,
            taskStatusId: status.id,
          }, {
            include: [
              { model: User, as: 'creator' },
              { model: User, as: 'assignedTo' },
              { model: TaskStatus, as: 'status' },
            ],
          });

        ctx.flash.set('Task has been created!');
        ctx.redirect(router.url('root'));
      } catch (e) {
        logger(e);
        ctx.render('tasks/new', { f: buildFormObj(task, e) });
      }
    });
};
