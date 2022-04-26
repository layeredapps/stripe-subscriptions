const dashboard = require('@layeredapps/dashboard')
const subscriptions = require('../../../../../index.js')
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.paymentintentid) {
      throw new Error('invalid-paymentintentid')
    }
    const paymentIntent = await global.api.user.subscriptions.PaymentIntent.get(req)
    if (!paymentIntent) {
      throw new Error('invalid-paymentintentid')
    }
    req.query.customerid = paymentIntent.customerid
    const customer = await global.api.user.subscriptions.Customer.get(req)
    if (!customer) {
      throw new Error('invalid-paymentintentid')
    }
    const paymentIntentNow = await stripeCache.execute('paymentIntents', 'cancel', req.query.paymentintentid, req.stripeKey)
    await subscriptions.Storage.PaymentIntent.update({
      stripeObject: paymentIntentNow
    }, {
      where: {
        paymentintentid: req.query.paymentintentid,
        appid: req.appid || global.appid
      }
    })
    await dashboard.StorageCache.remove(req.query.paymentintentid)
    return global.api.user.subscriptions.PaymentIntent.get(req)
  }
}
