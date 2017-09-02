import Sequelize from 'sequelize';

export default connect => connect.define('Tag', {
  name: {
    type: Sequelize.STRING,
    unique: true,
    validate: {
      notEmpty: {
        arg: true,
        msg: 'Please, define tag name!',
      },
    },
  },
}, {
  freezeTableName: true, // Model tableName will be the same as the model name
});
