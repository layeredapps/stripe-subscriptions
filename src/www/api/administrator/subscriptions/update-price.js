const dashboard = require('@layeredapps/dashboard')
const stripeCache = require('../../../../stripe-cache.js')
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
    if (price.unpublishedAt) {
      throw new Error('invalid-price')
    }
    if (!req.body || !req.body.nickname) {
      throw new Error('invalid-nickname')
    }
    const updateInfo = {
      nickname: req.body.nickname
    }
    const priceNow = await stripeCache.execute('prices', 'update', req.query.priceid, updateInfo, req.stripeKey)
    await subscriptions.Storage.Price.update({
      stripeObject: priceNow,
      productid: price.productid
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
