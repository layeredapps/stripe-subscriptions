const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    return subscriptions.Storage.PaymentMethod.count()
  }
}
