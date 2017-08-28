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
}, {
  freezeTableName: true, // Model tableName will be the same as the model name
});
