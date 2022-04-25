const { Sequelize } = require('sequelize')
const Log = require('@layeredapps/dashboard/src/log.js')('sequelize-stripe-subscriptions-db2')

module.exports = async () => {
  const prefixedDatabase = process.env.SUBSCRIPTIONS_DB2_DATABASE || process.env.DB2_DATABASE
  const prefixedUsername = process.env.SUBSCRIPTIONS_DB2_USERNAME || process.env.DB2_USERNAME
  const prefixedPassword = process.env.SUBSCRIPTIONS_DB2_PASSWORD || process.env.DB2_PASSWORD
  const prefixedHost = process.env.SUBSCRIPTIONS_DB2_HOST || process.env.DB2_HOST
  const prefixedPort = process.env.SUBSCRIPTIONS_DB2_PORT || process.env.DB2_PORT
  const sequelize = new Sequelize(prefixedDatabase, prefixedUsername, prefixedPassword, {
    logging: (sql) => {
      return Log.info(sql)
    },
    dialect: 'db2',
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
