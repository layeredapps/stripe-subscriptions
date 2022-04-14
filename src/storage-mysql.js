const { Sequelize } = require('sequelize')

module.exports = async () => {
  const prefixedDatabase = process.env.SUBSCRIPTIONS_MYSQL_DATABASE || process.env.MYSQL_DATABASE
  const prefixedUsername = process.env.SUBSCRIPTIONS_MYSQL_USERNAME || process.env.MYSQL_USERNAME
  const prefixedPassword = process.env.SUBSCRIPTIONS_MYSQL_PASSWORD || process.env.MYSQL_PASSWORD
  const prefixedHost = process.env.SUBSCRIPTIONS_MYSQL_HOST || process.env.MYSQL_HOST
  const prefixedPort = process.env.SUBSCRIPTIONS_MYSQL_PORT || process.env.MYSQL_PORT
  const sequelize = new Sequelize(prefixedDatabase, prefixedUsername, prefixedPassword, {
    logging: false,
    dialect: 'mysql',
    host: prefixedHost,
    port: prefixedPort,
    pool: {
      max: process.env.SUBSCRIPTIONS_MAX_CONNECTIONS || process.env.MAX_CONNECTIONS || 10,
      min: 0,
      idle: process.env.SUBSCRIPTIONS_IDLE_CONNECTION_LIMIT || process.env.IDLE_CONNECTION_LIMIT || 10000
    }
  })
  return sequelize
}
