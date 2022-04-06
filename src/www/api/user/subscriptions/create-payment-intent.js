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
    const paymentIntent = await stripeCache.execute('paymentIntents', 'create', {
      amount: req.body.amount,
      currency: req.body.currency,
      payment_method_types: ['card'],
      customer: req.query.customerid
    }, req.stripeKey)
    req.query.paymentintentid = paymentIntent.id
    await subscriptions.Storage.PaymentIntent.create({
      paymentintentid: paymentIntent.id,
      accountid: customer.accountid,
      customerid: customer.customerid,
      paymentmethodid: req.body.paymentmethodid,
      status: paymentIntent.status,
      stripeObject: paymentIntent
    })
    return global.api.user.subscriptions.PaymentIntent.get(req)
  }
}
