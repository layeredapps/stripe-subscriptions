const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  const total = await global.api.administrator.subscriptions.PaymentIntentsCount.get(req)
  const paymentIntents = await global.api.administrator.subscriptions.PaymentIntents.get(req)
  if (paymentIntents && paymentIntents.length) {
    for (const i in paymentIntents) {
      const paymentIntent = formatStripeObject(paymentIntents[i])
      paymentIntents[i] = paymentIntent
    }
  }
  const offset = req.query ? req.query.offset || 0 : 0
  req.data = { paymentIntents, total, offset }
}

async function renderPage (req, res) {
  const doc = dashboard.HTML.parse(req.html || req.route.html)
  if (req.data.paymentIntents && req.data.paymentIntents.length) {
    dashboard.HTML.renderTable(doc, req.data.paymentIntents, 'payment-intent-row', 'payment-intents-table')
    for (const paymentIntent of req.data.paymentIntents) {
      dashboard.HTML.renderTemplate(doc, null, paymentIntent.status, `${paymentIntent.id}-status`)
    }
    if (req.data.total <= global.pageSize) {
      const pageLinks = doc.getElementById('page-links')
      pageLinks.parentNode.removeChild(pageLinks)
    } else {
      dashboard.HTML.renderPagination(doc, req.data.offset, req.data.total)
    }
    const noPayouts = doc.getElementById('no-payment-intents')
    noPayouts.parentNode.removeChild(noPayouts)
  } else {
    const paymentIntentsTable = doc.getElementById('payment-intents-table')
    paymentIntentsTable.parentNode.removeChild(paymentIntentsTable)
  }
  return dashboard.Response.end(req, res, doc)
}
