const dashboard = require('@layeredapps/dashboard')
const subscriptions = require('../../../../../index.js')
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.setupintentid) {
      throw new Error('invalid-setupintentid')
    }
    const setupIntent = await global.api.user.subscriptions.SetupIntent.get(req)
    if (!setupIntent) {
      throw new Error('invalid-setupintentid')
    }
    req.query.customerid = setupIntent.customerid
    const customer = await global.api.user.subscriptions.Customer.get(req)
    if (!customer) {
      throw new Error('invalid-setupintentid')
    }
    const setupIntentNow = await stripeCache.execute('setupIntents', 'cancel', req.query.setupintentid, req.stripeKey)
    await subscriptions.Storage.SetupIntent.update({
      stripeObject: setupIntentNow
    }, {
      where: {
        setupintentid: req.query.setupintentid
      }
    })
    await dashboard.StorageCache.remove(req.query.setupintentid)
    return global.api.user.subscriptions.SetupIntent.get(req)
  }
}
