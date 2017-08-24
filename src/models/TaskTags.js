import Sequelize from 'sequelize';

export default connect => connect.define('TaskTags', {
  tag: {
    type: Sequelize.INTEGER,
    field: 'tag_id',
    validate: {
      notEmpty: true,
    },
  },
  task: {
    type: Sequelize.INTEGER,
    field: 'task_id',
    validate: {
      notEmpty: true,
    },
  },
}, {
  freezeTableName: true, // Model tableName will be the same as the model name
});
