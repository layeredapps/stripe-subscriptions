const dashboard = require('@layeredapps/dashboard')

module.exports = {
  after: checkBeforeCancelSubscription
}

async function checkBeforeCancelSubscription (req, res) {
  if (!req.url.startsWith('/account/subscriptions/cancel-subscription')) {
    return
  }
  if (!global.applicationServer) {
    return
  }
  const urlWas = req.url
  if (process.env.CHECK_BEFORE_CANCEL_SUBSCRIPTION) {
    req.url = `${process.env.CHECK_BEFORE_CANCEL_SUBSCRIPTION}?subscriptionid=${req.query.subscriptionid}`
  } else {
    req.url = `/api/check-before-cancel-subscription?subscriptionid=${req.query.subscriptionid}`
  }
  const response = await dashboard.Proxy.get(req)
  req.url = urlWas
  if (response.startsWith('{')) {
    const result = JSON.parse(response)
    if (result.redirect) {
      return dashboard.Response.redirect(req, res, response.redirect)
    }
  }
}
