const subscriptions = require('../../../../../index.js')
const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  post: async (req) => {
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
    req.query.invoiceid = subscription.stripeObject.latest_invoice
    const invoice = await global.api.user.subscriptions.Invoice.get(req)
    if (!invoice.stripeObject.charge) {
      throw new Error('invalid-subscription')
    }
    req.query.chargeid = invoice.stripeObject.charge
    const charge = await global.api.user.subscriptions.Charge.get(req)
    if (!charge) {
      throw new Error('invalid-subscription')
    }
    const zeroed = []
    for (const item of subscription.stripeObject.items.data) {
      zeroed.push({ id: item.id, quantity: 0 })
    }
    const upcoming = await stripeCache.execute('invoices', 'retrieveUpcoming', {
      customer: subscription.customerid || subscription.customer,
      subscription: req.query.subscriptionid,
      subscription_items: zeroed
    }, req.stripeKey)
    if (upcoming.total === 0) {
      throw new Error('invalid-subscription')
    }
    const refundInfo = {
      charge: invoice.stripeObject.charge,
      amount: -upcoming.total,
      reason: 'requested_by_customer'
    }
    const refund = await stripeCache.execute('refunds', 'create', refundInfo, req.stripeKey)
    await subscriptions.Storage.Refund.create({
      appid: req.appid || global.appid,
      refundid: refund.id,
      accountid: subscription.accountid,
      subscriptionid: subscription.subscriptionid,
      customerid: subscription.customerid,
      invoiceid: invoice.invoiceid,
      productid: invoice.productid,
      paymentmethodid: invoice.paymentmethodid
    })
    req.query.refundid = refund.id
    return global.api.user.subscriptions.Refund.get(req)
  }
}
