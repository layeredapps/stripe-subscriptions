const subscriptions = require('../../../../../index.js')
const sequelize = require('sequelize')

module.exports = {
  get: async (req) => {
    req.query = req.query || {}
    const minDate = new Date()
    minDate.setDate(minDate.getDate() + 1)
    const where = {
      publishedAt: {
        [sequelize.Op.lte]: minDate
      },
      appid: req.appid || global.appid
    }
    let priceids
    if (req.query.all) {
      priceids = await subscriptions.Storage.Price.findAll({
        where,
        attributes: ['priceid'],
        order: [
          ['createdAt', 'DESC']
        ]
      })
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : global.pageSize
      priceids = await subscriptions.Storage.Price.findAll({
        where,
        attributes: ['priceid'],
        offset,
        limit,
        order: [
          ['createdAt', 'DESC']
        ]
      })
    }
    if (!priceids || !priceids.length) {
      return null
    }
    const items = []
    for (const priceInfo of priceids) {
      req.query.priceid = priceInfo.dataValues.priceid
      const price = await global.api.user.subscriptions.PublishedPrice.get(req)
      items.push(price)
    }
    return items
  }
}
