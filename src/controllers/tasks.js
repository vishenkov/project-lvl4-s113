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
      const rawUsers = await User.findAll();
      const users = rawUsers.map(user => ({
        value: user.id,
        text: user.id === ctx.session.userId ? '>> me <<' : user.fullName,
        selected: task.assignedToId === user.id,
      }));

      const rawTags = await Tag.findAll();
      const tags = rawTags.map(tag => ({
        text: tag.name,
        value: tag.id,
      }));

      ctx.render('tasks/new', { f: buildFormObj(task), users, tags });
    })

    .get('tasksByStatus', '/tasks/status/:status', async (ctx) => {
      const status = await TaskStatus.findOne({
        where: {
          name: ctx.params.status,
        },
      });
      if (!status) {
        ctx.throw(404);
      }
      const tasks = await Task.findAll({
        where: {
          taskStatusId: status.id,
        },
        include: [
          { model: User, as: 'creator' },
          { model: User, as: 'assignedTo' },
          { model: TaskStatus, as: 'status' },
          { model: Tag },
        ],
      });
      ctx.render('tasks/status', { tasks });
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

      const newTags = (form.newTags instanceof Array ? form.newTags : [form.newTags])
        .reduce((acc, name) => {
          if (name) {
            return [...acc, Tag.build({ name })];
          }
          return acc;
        }, []);

      const selectedTags = await Tag.findAll({
        where: {
          id: {
            $in: form.tags instanceof Array ? form.tags : [form.tags],
          },
        },
      });

      let task;
      try {
        if (newTags) {
          await Promise.all(newTags.map(tag => tag.save()));
        }
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

        await task.setTags([...selectedTags, ...newTags]);
        ctx.flash.set('Task has been created!');
        ctx.redirect(router.url('root'));
      } catch (e) {
        logger(e);
        ctx.render('tasks/new', { f: buildFormObj(task, e) });
      }
    });
};
