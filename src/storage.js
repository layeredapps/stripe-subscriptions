module.exports = async () => {
  let storage
  const prefixedStorage = process.env.SUBSCRIPTIONS_STORAGE || process.env.STORAGE
  switch (prefixedStorage) {
    case 'postgresql':
    case 'postgres':
      storage = require('./storage-postgresql.js')
      break
    case 'mariadb':
      storage = require('./storage-mariadb.js')
      break
    case 'mysql':
      storage = require('./storage-mysql.js')
      break
    case 'db2':
      storage = require('./storage-db2.js')
      break
    case 'mssql':
      storage = require('./storage-mssql.js')
      break
    case 'sqlite':
    default:
      storage = require('./storage-sqlite.js')
      break
  }
  return storage()
}
