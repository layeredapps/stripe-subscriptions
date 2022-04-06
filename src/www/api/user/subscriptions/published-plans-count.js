const sequelize = require('sequelize')
const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    const minDate = new Date()
    minDate.setDate(minDate.getDate() + 1)
    return subscriptions.Storage.Plan.count({
      where: {
        publishedAt: {
          [sequelize.Op.lte]: minDate
        }
      }
    })
  }
}
