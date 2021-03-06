const dashboard = require('@layeredapps/dashboard')
const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.customerid) {
      throw new Error('invalid-customerid')
    }
    let customer = await dashboard.StorageCache.get(req.query.customerid)
    if (!customer) {
      const customerInfo = await subscriptions.Storage.Customer.findOne({
        where: {
          customerid: req.query.customerid,
          appid: req.appid || global.appid
        }
      })
      if (!customerInfo) {
        throw new Error('invalid-customerid')
      }
      customer = {}
      for (const field of customerInfo._options.attributes) {
        customer[field] = customerInfo.get(field)
      }
      await dashboard.StorageCache.set(req.query.customerid, customer)
    }
    return customer
  }
}
