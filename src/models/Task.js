import Sequelize from 'sequelize';

export default connect => connect.define('Task', {
  name: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true,
    },
  },
  description: {
    type: Sequelize.STRING,
  },
  status: {
    type: Sequelize.INTEGER,
    validate: {
      notEmpty: true,
    },
  },
  creator: {
    type: Sequelize.INTEGER,
    validate: {
      notEmpty: true,
    },
  },
  assignedTo: {
    type: Sequelize.INTEGER,
    field: 'assigned_to',
    validate: {
      notEmpty: true,
    },
  },
}, {
  freezeTableName: true, // Model tableName will be the same as the model name
});
