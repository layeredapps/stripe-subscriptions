const dashboard = require('@layeredapps/dashboard')
const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.subscriptionid) {
      throw new Error('invalid-subscriptionid')
    }
    let subscription = await dashboard.StorageCache.get(req.query.subscriptionid)
    if (!subscription) {
      const subscriptionInfo = await subscriptions.Storage.Subscription.findOne({
        where: {
          subscriptionid: req.query.subscriptionid,
          appid: req.appid || global.appid
        }
      })
      if (!subscriptionInfo) {
        throw new Error('invalid-subscriptionid')
      }
      subscription = {}
      for (const field of subscriptionInfo._options.attributes) {
        subscription[field] = subscriptionInfo.get(field)
      }
      await dashboard.StorageCache.set(req.query.subscriptionid, subscription)
    }
    return subscription
  }
}
