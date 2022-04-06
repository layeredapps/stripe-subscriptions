const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async () => {
    return subscriptions.Storage.Charge.count()
  }
}
