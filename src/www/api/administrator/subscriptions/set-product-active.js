const dashboard = require('@layeredapps/dashboard')
const stripeCache = require('../../../../stripe-cache.js')
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
    if (product.stripeObject.active) {
      throw new Error('invalid-product')
    }
    const updateInfo = {
      active: true
    }
    const productNow = await stripeCache.execute('products', 'update', req.query.productid, updateInfo, req.stripeKey)
    await subscriptions.Storage.Product.update({
      stripeObject: productNow,
      active: productNow.active
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
