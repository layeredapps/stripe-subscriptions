const dashboard = require('@layeredapps/dashboard')
const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.subscriptionitemid) {
      throw new Error('invalid-subscriptionitemid')
    }
    let subscriptionItem = await dashboard.StorageCache.get(req.query.subscriptionitemid)
    if (!subscriptionItem) {
      const subscriptionItemInfo = await subscriptions.Storage.SubscriptionItem.findOne({
        where: {
          subscriptionitemid: req.query.subscriptionitemid,
          appid: req.appid || global.appid
        }
      })
      if (!subscriptionItemInfo) {
        throw new Error('invalid-subscriptionitemid')
      }
      subscriptionItem = {}
      for (const field of subscriptionItemInfo._options.attributes) {
        subscriptionItem[field] = subscriptionItemInfo.get(field)
      }
      await dashboard.StorageCache.set(req.query.subscriptionitemid, subscriptionItem)
    }
    return subscriptionItem
  }
}
