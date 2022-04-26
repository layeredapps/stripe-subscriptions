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
    const deleteOptions = {
      prorate: false
    }
    const subscriptionNow = await stripeCache.execute('subscriptions', 'del', req.query.subscriptionid, deleteOptions, req.stripeKey)
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
