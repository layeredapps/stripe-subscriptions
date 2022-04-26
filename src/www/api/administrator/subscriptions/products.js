const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    req.query = req.query || {}
    const where = {
      appid: req.appid || global.appid
    }
    let productids
    if (req.query.all) {
      productids = await subscriptions.Storage.Product.findAll({
        where,
        attributes: ['productid'],
        order: [
          ['createdAt', 'DESC']
        ]
      })
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : global.pageSize
      productids = await subscriptions.Storage.Product.findAll({
        where,
        attributes: ['productid'],
        offset,
        limit,
        order: [
          ['createdAt', 'DESC']
        ]
      })
    }
    if (!productids || !productids.length) {
      return null
    }
    const items = []
    for (const productInfo of productids) {
      req.query.productid = productInfo.dataValues.productid
      const product = await global.api.administrator.subscriptions.Product.get(req)
      items.push(product)
    }
    return items
  }
}
