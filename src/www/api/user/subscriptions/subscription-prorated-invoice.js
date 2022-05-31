const stripeCache = require('../../../../stripe-cache.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.subscriptionid) {
      throw new Error('invalid-subscriptionid')
    }
    const subscription = await global.api.user.subscriptions.Subscription.get(req)
    if (!subscription) {
      throw new Error('invalid-subscriptionid')
    }
    if (subscription.stripeObject.status !== 'active' || subscription.stripeObject.cancel_at_period_end) {
      throw new Error('invalid-subscription')
    }
    if (subscription.stripeObject.status !== 'trialing') {
      return 0
    }
    const zeroedItems = []
    for (const item of subscription.stripeObject.items) {
      item.quantity = 0
      zeroedItems.push(item)
    }
    const prorationDate = Math.floor(Date.now() / 1000)
    const proratedInvoice = await stripeCache.execute('invoices', 'retrieveUpcoming', subscription.customerid, subscription.subscriptionid, {
      subscription_items: zeroedItems,
      subscription_proration_date: prorationDate
    })
    return proratedInvoice
  }
}
