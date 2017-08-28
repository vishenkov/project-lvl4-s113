import faker from 'faker';
import _ from 'lodash';
import container from './container';

const generateUsers = async (num = 1, acc = []) => {
  if (num <= 0) {
    return acc;
  }
  const user = {
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    email: faker.internet.email(),
    password: '1',
  };
  const userInstance = await container.User.findOne({
    where: {
      email: user.email,
    },
  });
  if (userInstance) {
    return generateUsers(num, acc);
  }
  return generateUsers(num - 1, [...acc, container.User.build(user)]);
};

const generateStatuses = async (statusNames = [], acc = []) => {
  if (!statusNames.length) {
    return acc;
  }
  const status = await container.TaskStatus.findOrCreate(
    {
      where: {
        name: statusNames[0],
      },
    });
  return generateStatuses(_.tail(statusNames), [...acc, status[0]]);
};

const generateTask = async (creator, assignedTo, status) => {
  const task = {
    name: faker.lorem.words(),
    description: faker.lorem.sentences(),
    creatorId: creator.id,
    assignedToId: assignedTo.id,
    taskStatusId: status.id,
  };
  container.logger(task);
  const taskBuild = await container.Task.build(task, {
    include: [
      { model: container.User, as: 'creator' },
      { model: container.User, as: 'assignedTo' },
      { model: container.TaskStatus, as: 'status' },
    ],
  });
  return taskBuild;
};

const generateTags = async (num = 1, acc = []) => {
  if (num <= 0) {
    return acc;
  }
  const tag = {
    name: faker.hacker.noun(),
  };
  const tagInstance = await container.Tag.findOne({
    where: {
      name: tag.name,
    },
  });
  if (tagInstance) {
    return generateTags(num, acc);
  }
  return generateTags(num - 1, [...acc, container.Tag.build(tag)]);
};


export default async (kit = 'base') => {
  const statusNames = ['new', 'atWork', 'testing', 'finished'];
  const statuses = await generateStatuses(statusNames);

  if (kit === 'base') {
    return;
  }

  const users = await generateUsers(3);
  await Promise.all(users.map(user => user.save()));
  const tags = await generateTags(3);
  await Promise.all(tags.map(tag => tag.save()));

  const task1 = await generateTask(users[0], users[0], statuses[0]);
  await task1.save();
  await task1.setTags(tags);

  const task2 = await generateTask(users[0], users[1], statuses[1]);
  await task2.save();
  await task2.setTags([tags[1]]);

  const task3 = await generateTask(users[1], users[2], statuses[3]);
  await task3.save();
  await task3.setTags([tags[1], tags[0]]);
};
