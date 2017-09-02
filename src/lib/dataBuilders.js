import _ from 'lodash';
import fsm from './fsmTaskStatus';
import container from '../container';

export const buildSelectObj = (source, baseValue = {}) => {
  const base = _.isEmpty(baseValue) ? [] : [baseValue];
  return source.reduce((acc, s) =>
    ([...acc, {
      value: s.id,
      text: s.name,
    }]), base);
};

export const buildSelectUser = (users, sessionId, selectedId) => users.map(user => ({
  value: user.id,
  text: user.id === sessionId ? '>> me <<' : user.fullName,
  selected: selectedId === user.id,
}));

export const buildSelectStatus = async (currentStatus) => {
  const availableStates = fsm(currentStatus.name).transitions();

  const availableStatuses = await container.TaskStatus.findAll({
    where: {
      name: {
        $in: availableStates,
      },
    },
  });
  return [...availableStatuses, currentStatus].map(status => ({
    value: status.id,
    text: status.name,
    selected: status.id === currentStatus.id,
  }));
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
