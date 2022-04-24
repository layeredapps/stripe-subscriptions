module.exports = async (req, proxyRequestOptions) => {
  if (!req.account) {
    return
  }
  req.query = req.query || {}
  req.query.accountid = req.account.accountid
  req.query.all = true
  const customers = await global.api.user.subscriptions.Customers.get(req)
  if (!customers) {
    proxyRequestOptions.headers['x-customers'] = '[]'
    return
  }
  for (const i in customers) {
    customers[i] = customers[i].stripeObject
  }
  proxyRequestOptions.headers['x-customers'] = JSON.stringify(customers)
}
