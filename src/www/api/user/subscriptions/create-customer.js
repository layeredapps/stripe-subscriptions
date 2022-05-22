const subscriptions = require('../../../../../index.js')
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  post: async (req) => {
    if (!req.query || !req.query.accountid) {
      throw new Error('invalid-accountid')
    }
    const account = await global.api.user.Account.get(req)
    if (!account) {
      throw new Error('invalid-account')
    }
    if (!req.body || !req.body.email || !req.body.email.length) {
      throw new Error('invalid-email')
    }
    if (!req.body.description || !req.body.description.length) {
      throw new Error('invalid-description')
    }
    const customerInfo = {
      email: req.body.email,
      description: req.body.description
    }
    if (global.requireBillingProfileAddress && !global.stripeJS) {
      customerInfo.address = {}
      for (const field of ['line1', 'line2', 'city', 'state', 'zip', 'country']) {
        if (req.body[field] && req.body[field].length) {
          customerInfo.address[field] = req.body[`address_${field}`]
        }
      }
    }
    const customer = await stripeCache.execute('customers', 'create', customerInfo, req.stripeKey)
    await subscriptions.Storage.Customer.create({
      appid: req.appid || global.appid,
      customerid: customer.id,
      accountid: req.account.accountid,
      stripeObject: customer
    })
    req.query.customerid = customer.id
    return global.api.user.subscriptions.Customer.get(req)
  }
}
