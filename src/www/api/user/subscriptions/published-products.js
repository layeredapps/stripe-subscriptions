const sequelize = require('sequelize')
const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    req.query = req.query || {}
    const minDate = new Date()
    minDate.setDate(minDate.getDate() + 1)
    const where = {
      publishedAt: {
        [sequelize.Op.lte]: minDate
      }
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
      const product = await global.api.user.subscriptions.PublishedProduct.get(req)
      items.push(product)
    }
    return items
  }
}
