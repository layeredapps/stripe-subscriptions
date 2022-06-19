module.exports = addXPlansHeader

async function addXPlansHeader (req, proxyRequestOptions) {
  if (!req.account) {
    return
  }
  req.query = req.query || {}
  req.query.all = true
  const prices = await global.api.administrator.subscriptions.Prices.get(req)
  if (!prices) {
    proxyRequestOptions.headers['x-active-prices'] = '[]'
    return
  }
  const active = []
  for (const price of prices) {
    if (price.stripeObject.active) {
      active.push(price.stripeObject)
    }
  }
  proxyRequestOptions.headers['x-active-prices'] = JSON.stringify(active)
}
