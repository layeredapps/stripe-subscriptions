const sequelize = require('sequelize')
const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    const minDate = new Date()
    minDate.setDate(minDate.getDate() + 1)
    return subscriptions.Storage.Product.count({
      where: {
        publishedAt: {
          [sequelize.Op.lte]: minDate
        },
        appid: req.appid || global.appid
      }
    })
  }
}
