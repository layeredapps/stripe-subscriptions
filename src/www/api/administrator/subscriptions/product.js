const dashboard = require('@layeredapps/dashboard')
const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.productid) {
      throw new Error('invalid-productid')
    }
    let product = await dashboard.StorageCache.get(req.query.productid)
    if (!product) {
      const productInfo = await subscriptions.Storage.Product.findOne({
        where: {
          productid: req.query.productid
        }
      })
      if (!productInfo) {
        throw new Error('invalid-productid')
      }
      product = {}
      for (const field of productInfo._options.attributes) {
        product[field] = productInfo.get(field)
      }
      await dashboard.StorageCache.set(req.query.productid, product)
    }
    return product
  }
}
