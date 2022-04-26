const dashboard = require('@layeredapps/dashboard')
const subscriptions = require('../../../../../index.js')

module.exports = {
  patch: async (req) => {
    if (!req.query || !req.query.productid) {
      throw new Error('invalid-productid')
    }
    const product = await global.api.administrator.subscriptions.Product.get(req)
    if (!product) {
      throw new Error('invalid-productid')
    }
    if (product.publishedAt || product.unpublishedAt) {
      throw new Error('invalid-product')
    }
    await subscriptions.Storage.Product.update({
      publishedAt: new Date()
    }, {
      where: {
        productid: req.query.productid,
        appid: req.appid || global.appid
      }
    })
    await dashboard.StorageCache.remove(req.query.productid)
    return global.api.administrator.subscriptions.Product.get(req)
  }
}
