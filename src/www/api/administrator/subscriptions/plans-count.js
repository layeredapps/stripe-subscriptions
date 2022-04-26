const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    return subscriptions.Storage.Plan.count({
      where: {
        appid: req.appid || global.appid
      }
    })
  }
}
