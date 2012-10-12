module.exports = process.env.INNEBANDY_COV
  ? require('./app-cov/app')
  : require('./app/app');
