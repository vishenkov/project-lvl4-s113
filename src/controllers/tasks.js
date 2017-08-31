import _ from 'lodash';
import buildFormObj from '../lib/formObjectBuilder';
import fsm from '../lib/fsmTaskStatus';

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
      const tasks = await Task.findAll(dbQuery);
      const rawUsers = await User.findAll();
      const users = rawUsers.map(user => ({
        value: user.id,
        text: user.id === ctx.session.userId ? '>> me <<' : user.fullName,
      }));
      users.unshift({ value: '', text: 'Any', selected: true });

      const rawTags = await Tag.findAll();
      const tags = rawTags.map(t => ({
        text: t.name,
        value: t.id,
      }));
      tags.unshift({ value: '', text: 'Any', selected: true });

      const rawStatuses = await TaskStatus.findAll();
      const statuses = rawStatuses.map(s => ({
        value: s.id,
        text: s.name,
      }));
      statuses.unshift({ value: '', text: 'Any', selected: true });
      ctx.render('tasks', { tasks, users, tags, statuses });
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

    .get('tasksByStatus', '/tasks/status/:id', async (ctx) => {
      const status = await TaskStatus.findOne({
        where: {
          id: ctx.params.id,
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
      ctx.render('tasks/status', { tasks, status });
    })

    .get('editTask', '/tasks/:id/edit', async (ctx) => {
      if (!ctx.state.isSignedIn()) {
        ctx.throw(401);
        return;
      }
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
        const users = rawUsers.map(user => ({
          value: user.id,
          text: user.id === ctx.session.userId ? '>> me <<' : user.fullName,
          selected: task.assignedToId === user.id,
        }));

        const taskTags = await task.getTags();
        const tagIds = taskTags.map(tag => tag.id);
        const otherTags = await Tag.findAll({
          where: {
            id: {
              $notIn: tagIds,
            },
          },
        });
        let tags = taskTags.map(tag => ({
          text: tag.name,
          value: tag.id,
          checked: true,
        }));
        tags = otherTags.reduce((acc, tag) => ([
          ...acc,
          {
            text: tag.name,
            value: tag.id,
          },
        ]), tags);

        log('Prepared tags: %o', tags);

        const availableStates = fsm(task.status.name).transitions();
        log('Available states: %o', availableStates);
        const availableStatuses = await TaskStatus.findAll({
          where: {
            name: {
              $in: availableStates,
            },
          },
        });
        const statuses = [...availableStatuses, task.status].map(status => ({
          value: status.id,
          text: status.name,
          selected: status.id === task.status.id,
        }));
        log('Statuses: %o', statuses);
        ctx.render('tasks/edit', { f: buildFormObj(task), task, users, tags, statuses });
      } else {
        ctx.throw(404);
      }
    })

    .get('task', '/tasks/:id', async (ctx) => {
      const task = await Task.findOne({
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
      if (task) {
        ctx.render('tasks/task', { task });
      } else {
        ctx.throw(404);
      }
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
        log(e);
        ctx.render('tasks/new', { f: buildFormObj(task, e) });
      }
    })

    .patch('task', '/tasks/:id', async (ctx) => {
      if (!ctx.state.isSignedIn()) {
        ctx.throw(401);
        return;
      }
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

      const newTags = (form.newTags instanceof Array ? form.newTags : [form.newTags])
        .reduce((acc, name) => {
          if (name) {
            return [...acc, Tag.build({ name })];
          }
          return acc;
        }, []);
      // log('Build objects for new tags: %o', newTags);
      const selectedTags = await Tag.findAll({
        where: {
          id: {
            $in: form.tags instanceof Array ? form.tags : [form.tags],
          },
        },
      });

      try {
        if (newTags) {
          await Promise.all(newTags.map(tag => tag.save()));
        }
        await Task.update(
          {
            ...taskBuild,
          },
          {
            where: {
              id: ctx.params.id,
            },
          });
        const task = await Task.findOne({
          where: {
            id: ctx.params.id,
          },
        });
        await task.setTags([...selectedTags, ...newTags]);
        await task.setAssignedTo(assignedUser);
        await task.setStatus(status);
        ctx.flash.set('Task has been updated!');
        ctx.redirect(router.url('tasks'));
      } catch (e) {
        log(e);
        ctx.redirect(router.url('tasks'));
      }
    })

    .delete('task', '/tasks/:id', async (ctx) => {
      if (!ctx.state.isSignedIn()) {
        ctx.throw(401);
        return;
      }
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
