const subscriptions = require('../../../../../index.js')
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  post: async (req) => {
    if (!req.query || !req.query.chargeid) {
      throw new Error('invalid-chargeid')
    }
    const charge = await global.api.user.subscriptions.Charge.get(req)
    if (!charge.stripeObject.amount || !charge.stripeObject.paid || charge.stripeObject.refunded || !global.subscriptionRefundPeriod ||
      charge.created <= Math.floor(new Date().getTime() / 1000) - global.subscriptionRefundPeriod) {
      throw new Error('invalid-charge')
    }
    req.query.invoiceid = charge.invoiceid
    const invoice = await global.api.user.subscriptions.Invoice.get(req)
    const refundInfo = {
      charge: req.query.chargeid,
      amount: charge.stripeObject.paid - (charge.stripeObject.amount_refunded || 0),
      reason: 'requested_by_customer'
    }
    req.query.subscriptionid = invoice.subscriptionid
    const subscription = await global.api.user.subscriptions.Subscription.get(req)
    if (subscription.stripeObject.status === 'active') {
      const subscriptionNow = await stripeCache.execute('subscriptions', 'del', subscription.subscriptionid, { prorate: false }, req.stripeKey)
      await subscriptions.Storage.Subscription.update({
        stripeObject: subscriptionNow
      }, {
        where: {
          subscriptionid: subscription.subscriptionid,
          appid: req.appid || global.appid
        }
      })
    }
    try {
      const refund = await stripeCache.execute('refunds', 'create', refundInfo, req.stripeKey)
      req.query.refundid = refund.id
      await subscriptions.Storage.Refund.create({
        appid: req.appid || global.appid,
        refundid: refund.id,
        accountid: req.account.accountid,
        subscriptionid: subscription.subscriptionid,
        customerid: invoice.customerid,
        invoiceid: invoice.invoiceid,
        productid: invoice.productid,
        paymentmethodid: invoice.paymentmethodid,
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
      return global.api.user.subscriptions.Refund.get(req)
    } catch (error) {
      if (error.message === 'invalid-amount') {
        throw new Error('invalid-charge')
      }
    }
  }
}
