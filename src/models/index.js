import getUser from './User';
import getTask from './Task';
import getTag from './Tag';
import getTaskStatus from './TaskStatus';
import getTaskTags from './TaskTags';

export default connect => ({
  User: getUser(connect),
  Task: getTask(connect),
  Tag: getTag(connect),
  TaskStatus: getTaskStatus(connect),
  TaskTags: getTaskTags(connect),
});
