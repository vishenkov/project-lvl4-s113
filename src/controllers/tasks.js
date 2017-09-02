import _ from 'lodash';
import buildFormObj from '../lib/formObjectBuilder';
import { checkAuth } from '../lib/middlewares';
import { buildSelectObj, buildTasksObj, buildTaskObj, buildSelectUser, buildSelectStatus } from '../lib/dataBuilders';


export default (router, { Task, User, Tag, TaskStatus, logger }) => {
  const log = logger('tasks');
  router
    .get('tasks', '/tasks', async (ctx) => {
      const query = ctx.query;
      log('Task filter query: %o,', query);

      const creator = { model: User, as: 'creator' };
      if (query.creator) {
        creator.where = { id: query.creator };
      }
      const assignedTo = { model: User, as: 'assignedTo' };
      if (query.assignedTo) {
        assignedTo.where = { id: query.assignedTo };
      }
      const status = { model: TaskStatus, as: 'status' };
      if (query.status) {
        status.where = { id: query.status };
      }
      const tag = { model: Tag };
      if (query.tag) {
        tag.where = { id: query.tag };
      }

      const dbQuery = {
        include: [
          creator,
          assignedTo,
          status,
          tag,
        ],
      };
      log('DB query: %o', dbQuery);
      const rawTasks = await Task.findAll(dbQuery);
      const tasks = buildTasksObj(rawTasks);
      log(tasks);

      const baseValue = { value: '', text: 'Any', selected: true };
      const rawUsers = await User.findAll();
      const users = rawUsers.reduce((acc, user) =>
        ([...acc, {
          value: user.id,
          text: user.id === ctx.session.userId ? '>> me <<' : user.fullName,
        }]), [baseValue]);

      const rawTags = await Tag.findAll();
      const tags = buildSelectObj(rawTags, baseValue);

      const rawStatuses = await TaskStatus.findAll();
      const statuses = buildSelectObj(rawStatuses, baseValue);

      ctx.render('tasks', { tasks, users, tags, statuses });
    })

    .get('newTask', '/tasks/new', checkAuth, async (ctx) => {
      const task = Task.build();
      const rawUsers = await User.findAll();
      const users = buildSelectUser(rawUsers, ctx.session.userId, task.assignedToId);

      ctx.render('tasks/new', { f: buildFormObj(task), users });
    })

    .get('tasksByStatus', '/tasks/status/:id', async (ctx) => {
      const status = await TaskStatus.findOne({
        where: {
          id: ctx.params.id,
        },
      });
      if (!status) {
        ctx.throw(404);
      }
      const rawTasks = await Task.findAll({
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
      const tasks = buildTasksObj(rawTasks);

      ctx.render('tasks/status', { tasks, status });
    })

    .get('editTask', '/tasks/:id/edit', checkAuth, async (ctx) => {
      const task = await Task.findOne({
        include: [
          { model: User, as: 'creator' },
          { model: User, as: 'assignedTo' },
          { model: TaskStatus, as: 'status' },
        ],
        where: {
          id: ctx.params.id,
        },
      });
      if (task) {
        const rawUsers = await User.findAll();
        const users = buildSelectUser(rawUsers, ctx.session.userId, task.assignedToId);

        const rawTags = await task.getTags();
        const tags = rawTags.map(tag => tag.name).join(', ');
        task.tags = tags;
        log('Prepared tags: %o', tags);

        const statuses = await buildSelectStatus(task.status);
        log('Statuses: %o', statuses);
        ctx.render('tasks/edit', { f: buildFormObj(task), task, users, tags, statuses });
      } else {
        ctx.throw(404);
      }
    })

    .get('task', '/tasks/:id', async (ctx) => {
      const rawTask = await Task.findOne({
        include: [
          { model: User, as: 'creator' },
          { model: User, as: 'assignedTo' },
          { model: TaskStatus, as: 'status' },
          { model: Tag },
        ],
        where: {
          id: ctx.params.id,
        },
      });

      if (rawTask) {
        const task = buildTaskObj(rawTask);
        ctx.render('tasks/task', { task });
      } else {
        ctx.throw(404);
      }
    })


    .post('tasks', '/tasks', checkAuth, async (ctx) => {
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

      const reqTags = form.tags ? form.tags.split(',').map(tag => tag.trim()) : [];

      const task = Task.build({
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
      try {
        await task.save();

        await Promise.all(reqTags.map(async name =>
          Tag.findOne({ where: { name } }).then(async tag =>
            (tag ? task.addTag(tag) : task.createTag({ name })))));

        ctx.flash.set('Task has been created!');
        ctx.redirect(router.url('root'));
      } catch (e) {
        log(e);
        const rawUsers = await User.findAll();
        const users = buildSelectUser(rawUsers, ctx.session.userId, task.assignedToId);
        ctx.render('tasks/new', { f: buildFormObj(task, e), users, tags: form.tags });
      }
    })


    .patch('task', '/tasks/:id', checkAuth, async (ctx) => {
      const form = ctx.request.body.form;
      log('Recieved post data to patch: %o', form);
      const taskKeys = Object.keys(form).filter(key =>
        !_.includes(['assignedTo', 'tags', 'newTags', 'status'], key));
      log('Keys for task: %o', taskKeys);
      const taskBuild = taskKeys.reduce((acc, key) => {
        acc[key] = form[key];
        return acc;
      }, {});
      log('Task build object: %o', taskBuild);

      const task = await Task.findById(ctx.params.id);
      const assignedUser = await User.findOne({
        where: {
          id: form.assignedTo,
        },
      });
      const status = await TaskStatus.findOne({
        where: {
          id: form.status,
        },
      });

      const reqTags = form.tags ? form.tags.split(',').map(tag => tag.trim()) : [];
      log('request tags: %o', reqTags);

      try {
        await task.update({
          ...taskBuild,
        });

        await task.setAssignedTo(assignedUser);
        await task.setStatus(status);
        await task.setTags([]);
        await Promise.all(reqTags.map(async name =>
          Tag.findOne({ where: { name } }).then(async tag =>
            (tag ? task.addTag(tag) : task.createTag({ name })))));

        ctx.flash.set('Task has been updated!');
        ctx.redirect(router.url('tasks'));
      } catch (e) {
        log(e);
        const rawUsers = await User.findAll();
        const users = buildSelectUser(rawUsers, ctx.session.userId, task.assignedToId);
        const statuses = await buildSelectStatus(status);
        ctx.render('tasks/edit', {
          f: buildFormObj(taskBuild, e),
          task: { id: ctx.params.id, ...taskBuild },
          users,
          statuses,
          tags: form.tags,
        });
      }
    })

    .delete('task', '/tasks/:id', checkAuth, async (ctx) => {
      const task = await Task.findOne({
        where: {
          id: ctx.params.id,
        },
      });
      if (task) {
        await task.destroy();
        ctx.flash.set('Task has been deleted!');
        ctx.redirect(router.url('tasks'));
      } else {
        ctx.throw(404);
      }
    });
};
