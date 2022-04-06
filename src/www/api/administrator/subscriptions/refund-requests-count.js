const subscriptions = require('../../../../../index.js')
const sequelize = require('sequelize')

module.exports = {
  get: async (req) => {
    const minDate = new Date()
    minDate.setDate(minDate.getDate() + 1)
    return subscriptions.Storage.Charge.count({
      where: {
        refundRequested: {
          [sequelize.Op.lte]: minDate
        }
      }
    })
  }
}
