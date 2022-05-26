const dashboard = require('@layeredapps/dashboard')
const subscriptions = require('../../../../../index.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.priceid) {
      throw new Error('invalid-priceid')
    }
    const price = await global.api.administrator.subscriptions.Price.get(req)
    if (!price) {
      throw new Error('invalid-priceid')
    }
    if (price.publishedAt || price.unpublishedAt) {
      throw new Error('invalid-price')
    }
    await subscriptions.Storage.Price.update({
      publishedAt: new Date()
    }, {
      where: {
        priceid: req.query.priceid,
        appid: req.appid || global.appid
      }
    })
    await dashboard.StorageCache.remove(req.query.priceid)
    return global.api.administrator.subscriptions.Price.get(req)
  }
}
