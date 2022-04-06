const dashboard = require('@layeredapps/dashboard')
const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    if (!req.query || !req.query.usagerecordid) {
      throw new Error('invalid-usagerecordid')
    }
    let usageRecord = await dashboard.StorageCache.get(req.query.usagerecordid)
    if (!usageRecord) {
      const usageRecordInfo = await subscriptions.Storage.UsageRecord.findOne({
        where: {
          usagerecordid: req.query.usagerecordid
        }
      })
      if (!usageRecordInfo) {
        throw new Error('invalid-usagerecordid')
      }
      usageRecord = {}
      for (const field of usageRecordInfo._options.attributes) {
        usageRecord[field] = usageRecordInfo.get(field)
      }
      await dashboard.StorageCache.set(req.query.usagerecordid, usageRecord)
    }
    return usageRecord
  }
}
