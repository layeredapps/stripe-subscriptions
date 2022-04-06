const subscriptions = require('../../../../../index.js')

module.exports = {
  get: async (req) => {
    req.query = req.query || {}
    let setupintentids
    if (req.query.all) {
      setupintentids = await subscriptions.Storage.SetupIntent.findAll({
        attributes: ['setupintentid'],
        order: [
          ['createdAt', 'DESC']
        ]
      })
    } else {
      const offset = req.query.offset ? parseInt(req.query.offset, 10) : 0
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : global.pageSize
      setupintentids = await subscriptions.Storage.SetupIntent.findAll({
        attributes: ['setupintentid'],
        offset,
        limit,
        order: [
          ['createdAt', 'DESC']
        ]
      })
    }
    if (!setupintentids || !setupintentids.length) {
      return null
    }
    const items = []
    for (const setupintentInfo of setupintentids) {
      req.query.setupintentid = setupintentInfo.dataValues.setupintentid
      const setupIntent = await global.api.administrator.subscriptions.SetupIntent.get(req)
      items.push(setupIntent)
    }
    return items
  }
}
