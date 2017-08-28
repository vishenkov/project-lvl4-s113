import getUser from './User';
import getTask from './Task';
import getTag from './Tag';
import getTaskStatus from './TaskStatus';
import getTaskTag from './TaskTag';

export default (connect) => {
  const User = getUser(connect);
  const Task = getTask(connect);
  const Tag = getTag(connect);
  const TaskStatus = getTaskStatus(connect);
  const TaskTag = getTaskTag(connect);

  Task.belongsTo(User, { as: 'creator' });
  Task.belongsTo(User, { as: 'assignedTo' });
  Task.belongsTo(TaskStatus, {
    foreignKey: {
      name: 'taskStatusId',
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    as: 'status',
  });

  User.hasMany(Task, {
    foreignKey: {
      name: 'creatorId',
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    as: 'CreatedTasks',
  });

  User.hasMany(Task, {
    foreignKey: {
      name: 'assignedToId',
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    as: 'AssignedTasks',
  });

  Task.belongsToMany(Tag, {
    through: {
      model: TaskTag,
      unique: false,
    },
    foreignKey: 'task_id',
  });

  Tag.belongsToMany(Task, {
    through: {
      model: TaskTag,
      unique: false,
    },
    foreignKey: 'tag_id',
  });

  return { User, Task, TaskStatus, Tag, TaskTag };
};
