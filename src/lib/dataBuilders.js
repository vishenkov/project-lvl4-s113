import _ from 'lodash';

export const buildSelectObj = (source, baseValue = {}) => {
  const base = _.isEmpty(baseValue) ? [] : [baseValue];
  return source.reduce((acc, s) =>
    ([...acc, {
      value: s.id,
      text: s.name,
    }]), base);
};

export const buildEmptyUser = () => ({
  id: null,
  name: 'unknown',
  lastName: 'unknown',
  fullName: 'unknown',
  email: 'unknown',
});

export const buildTaskObj = (task) => {
  const taskObj = { ...task.dataValues };
  if (!task.creatorId) {
    taskObj.creator = buildEmptyUser();
  }

  if (!task.assignedToId) {
    taskObj.assignedTo = buildEmptyUser();
  }

  return taskObj;
};

export const buildTasksObj = tasks => tasks.map(t => buildTaskObj(t));

export default buildSelectObj;
