const dashboard = require('@layeredapps/dashboard')
const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.priceid) {
      throw new Error('invalid-priceid')
    }
    let price = await dashboard.StorageCache.get(req.query.priceid)
    if (!price) {
      const priceInfo = await subscriptions.Storage.Price.findOne({
        where: {
          priceid: req.query.priceid,
          appid: req.appid || global.appid
        }
      })
      if (!priceInfo) {
        throw new Error('invalid-priceid')
      }
      price = {}
      for (const field of priceInfo._options.attributes) {
        price[field] = priceInfo.get(field)
      }
      await dashboard.StorageCache.set(req.query.priceid, price)
    }
    return price
  }
}
