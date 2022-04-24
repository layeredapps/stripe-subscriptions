module.exports = async (req, proxyRequestOptions) => {
  if (!req.account) {
    return
  }
  req.query = req.query || {}
  req.query.all = true
  const plans = await global.api.user.subscriptions.PublishedPlans.get(req)
  if (!plans) {
    proxyRequestOptions.headers['x-published-plans'] = '[]'
    return
  }
  for (const i in plans) {
    plans[i] = plans[i].stripeObject
  }
  proxyRequestOptions.headers['x-published-plans'] = JSON.stringify(plans)
}
