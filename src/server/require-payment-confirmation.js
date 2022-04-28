const dashboard = require('@layeredapps/dashboard')

module.exports = {
  after: requirePaymentConfirmation
}

async function requirePaymentConfirmation (req, res) {
  if (!req.account) {
    return
  }
  if (req.urlPath === '/account' ||
    req.urlPath === '/administrator' ||
    req.url.startsWith('/public/') ||
    req.url.startsWith('/account/') ||
    req.url.startsWith('/administrator/') ||
    req.url.startsWith('/api/')) {
    return
  }
  const queryWas = req.query
  req.query = {
    accountid: req.account.accountid,
    limit: 1
  }
  const paymentIntents = await global.api.user.subscriptions.PaymentIntentsPendingConfirmation.get(req)
  req.query = queryWas
  if (paymentIntents && paymentIntents.length) {
    res.ended = true
    let confirmPaymentURL = `/account/subscriptions/confirm-payment?invoiceid=${paymentIntents[0].invoice}`
    confirmPaymentURL += '&return-url=' + req.url
    return dashboard.Response.redirect(req, res, confirmPaymentURL)
  }
}
