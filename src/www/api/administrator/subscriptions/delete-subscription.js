const stripeCache = require('../../../../stripe-cache.js')
const subscriptions = require('../../../../../index.js')

module.exports = {
  delete: async (req) => {
    if (!req.query || !req.query.subscriptionid) {
      throw new Error('invalid-subscriptionid')
    }
    const subscription = await global.api.administrator.subscriptions.Subscription.get(req)
    if (!subscription) {
      throw new Error('invalid-subscriptionid')
    }
    if ((subscription.stripeObject.status !== 'active' && subscription.stripeObject.status !== 'trialing') || subscription.stripeObject.cancel_at_period_end) {
      throw new Error('invalid-subscription')
    }
    req.query.planid = subscription.planid
    const plan = await global.api.administrator.subscriptions.Plan.get(req)
    if (!plan.stripeObject.amount) {
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
    req.query.invoiceid = subscription.stripeObject.latest_invoice
    const invoice = await global.api.administrator.subscriptions.Invoice.get(req)
    let subscriptionNow
    if (!invoice.amount_paid) {
      subscriptionNow = await stripeCache.execute('subscriptions', 'del', req.query.subscriptionid, req.stripeKey)
    } else {
      const deleteOptions = {
        prorate: true
      }
      subscriptionNow = await stripeCache.execute('subscriptions', 'del', req.query.subscriptionid, deleteOptions, req.stripeKey)
    }
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
