const subscriptions = require('../../../../../index.js')
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  post: async (req) => {
    if (!req.query || !req.query.customerid) {
      throw new Error('invalid-customerid')
    }
    const customer = await global.api.user.subscriptions.Customer.get(req)
    if (!customer) {
      throw new Error('invalid-customerid')
    }
    if (!req.body || !req.body.paymentmethodid) {
      throw new Error('invalid-paymentmethodid')
    }
    req.query.paymentmethodid = req.body.paymentmethodid
    const paymentMethod = await global.api.user.subscriptions.PaymentMethod.get(req)
    if (!paymentMethod) {
      throw new Error('invalid-paymentmethodid')
    }
    const setupIntent = await stripeCache.execute('setupIntents', 'create', {
      payment_method_types: ['card'],
      customer: req.query.customerid,
      payment_method: req.body.paymentmethodid
    }, req.stripeKey)
    req.query.setupintentid = setupIntent.id
    console.log("******", {
      appid: req.appid || global.appid,
      setupintentid: setupIntent.id,
      accountid: req.account.accountid,
      customerid: req.query.customerid,
      paymentmethodid: req.body.paymentmethodid,
      stripeObject: setupIntent
    })
    await subscriptions.Storage.SetupIntent.create({
      appid: req.appid || global.appid,
      setupintentid: setupIntent.id,
      accountid: req.account.accountid,
      customerid: req.query.customerid,
      paymentmethodid: req.body.paymentmethodid,
      stripeObject: setupIntent
    })
    return global.api.user.subscriptions.SetupIntent.get(req)
  }
}
