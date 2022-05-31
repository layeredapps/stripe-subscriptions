const stripeCache = require('../../../../stripe-cache.js')
const subscriptions = require('../../../../../index.js')

module.exports = {
  post: async (req) => {
    if (!req.query || !req.query.chargeid) {
      throw new Error('invalid-chargeid')
    }
    if (!req.body || !req.body.amount) {
      throw new Error('invalid-amount')
    }
    const charge = await global.api.administrator.subscriptions.Charge.get(req)
    if (!charge) {
      throw new Error('invalid-chargeid')
    }
    const balance = charge.stripeObject.amount - (charge.stripeObject.amount_refunded || 0)
    if (charge.refunded || !charge.stripeObject.paid || charge.stripeObject.amount === 0 || balance === 0) {
      throw new Error('invalid-charge')
    }
    try {
      req.body.amount = parseInt(req.body.amount, 10)
      if (!req.body.amount || req.body.amount < 0 || req.body.amount > balance) {
        throw new Error('invalid-amount')
      }
    } catch (error) {
      throw new Error('invalid-amount')
    }
    req.query.invoiceid = charge.stripeObject.invoice
    const invoice = await global.api.administrator.subscriptions.Invoice.get(req)
    const refundInfo = {
      charge: req.query.chargeid,
      amount: req.body.amount,
      reason: 'requested_by_customer'
    }
    const refund = await stripeCache.execute('refunds', 'create', refundInfo, req.stripeKey)
    await subscriptions.Storage.Refund.create({
      appid: req.appid || global.appid,
      accountid: charge.accountid,
      refundid: refund.id,
      chargeid: charge.id,
      customerid: charge.stripeObject.customer.id,
      invoiceid: charge.stripeObject.invoice,
      subscriptionid: invoice.stripeObject.subscriptionid,
      productid: invoice.stripeObject.productid,
      stripeObject: refund
    })
    const chargeNow = await stripeCache.retrieve(req.query.chargeid, 'charges', req.stripeKey)
    await subscriptions.Storage.Charge.update({
      stripeObject: chargeNow
    }, {
      where: {
        chargeid: req.query.chargeid,
        appid: req.appid || global.appid
      }
    })
    req.query.refundid = refund.id
    return global.api.administrator.subscriptions.Refund.get(req)
  }
}
