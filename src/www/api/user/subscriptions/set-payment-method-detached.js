const dashboard = require('@layeredapps/dashboard')
const subscriptions = require('../../../../../index.js')
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.paymentmethodid) {
      throw new Error('invalid-paymentmethodid')
    }
    const paymentMethod = await global.api.user.subscriptions.PaymentMethod.get(req)
    if (!paymentMethod) {
      throw new Error('invalid-paymentmethodid')
    }
    if (!paymentMethod.customerid) {
      throw new Error('invalid-paymentmethod')
    }
    req.query.customerid = paymentMethod.customerid
    const customer = await global.api.user.subscriptions.Customer.get(req)
    if (customer.stripeObject.invoice_settings && customer.stripeObject.invoice_settings.default_payment_method === req.query.paymentmethodid) {
      throw new Error('invalid-paymentmethod')
    }
    const paymentMethodNow = await stripeCache.execute('paymentMethods', 'detach', req.query.paymentmethodid, req.stripeKey)
    await subscriptions.Storage.PaymentMethod.update({
      stripeObject: paymentMethodNow
    }, {
      where: {
        paymentmethodid: req.query.paymentmethodid
      }
    })
    await dashboard.StorageCache.remove(req.query.paymentmethodid)
    return global.api.user.subscriptions.PaymentMethod.get(req)
  }
}
