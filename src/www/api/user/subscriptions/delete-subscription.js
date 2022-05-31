const stripeCache = require('../../../../stripe-cache.js')
const subscriptions = require('../../../../../index.js')

module.exports = {
  delete: async (req) => {
    if (!req.query || !req.query.subscriptionid) {
      throw new Error('invalid-subscriptionid')
    }
    const subscription = await global.api.user.subscriptions.Subscription.get(req)
    if (!subscription) {
      throw new Error('invalid-subscriptionid')
    }
    if ((subscription.stripeObject.status !== 'active' && subscription.stripeObject.status !== 'trialing') || subscription.stripeObject.cancel_at_period_end) {
      throw new Error('invalid-subscription')
    }
    if (subscription.stripeObject.status !== 'trialing') {
      const invoice = await global.api.user.subscriptions.SubscriptionProratedInvoice.get(req)
      if (invoice.amount < 0) {
        req.query.accountid = req.account.accountid
        req.query.limit = 1
        const recentInvoices = await global.api.user.subscriptions.Invoices.get(req)
        const refundInfo = {
          charge: recentInvoices[0].charge,
          amount: -invoice.amount,
          reason: 'requested_by_customer'
        }
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
      }
    }
    const subscriptionNow = await stripeCache.execute('subscriptions', 'del', req.query.subscriptionid, req.stripeKey)
    await subscriptions.Storage.Subscription.update({
      stripeObject: subscriptionNow
    }, {
      where: {
        subscriptionid: req.query.subscriptionid,
        appid: req.appid || global.appid
      }
    })
    return true
  }
}
