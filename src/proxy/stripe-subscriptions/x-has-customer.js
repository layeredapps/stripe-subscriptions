module.exports = async (req, proxyRequestOptions) => {
  if (!req.account) {
    return
  }
  req.query = req.query || {}
  req.query.accountid = req.account.accountid
  req.query.all = true
  req.query.limit = 1
  const customers = await global.api.user.subscriptions.Customers.get(req)
  if (!customers) {
    proxyRequestOptions.headers['x-has-customer'] = 'false'
    return
  }
  proxyRequestOptions.headers['x-has-subscription'] = 'true'
}
