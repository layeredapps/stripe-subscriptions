const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.payoutid) {
    req.error = 'invalid-payoutid'
    req.removeContents = true
    req.data = {
      payout: {
        payoutid: ''
      }
    }
    return
  }
  let payoutRaw
  try {
    payoutRaw = await global.api.administrator.subscriptions.Payout.get(req)
  } catch (error) {
    if (error.message === 'invalid-payoutid' || error.message === 'invalid-payout') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    req.removeContents = true
    req.data = {
      payout: {
        payoutid: req.query.invoiceid
      }
    }
    return
  }
  const payout = formatStripeObject(payoutRaw)
  req.data = { payout }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.payout, 'payout')
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      const payoutsTable = doc.getElementById('payouts-table')
      payoutsTable.parentNode.removeChild(payoutsTable)
    }
  } else {
    if (req.data.payout.failure_code) {
      dashboard.HTML.renderTemplate(doc, null, req.data.payout.failure_code, `status-${req.data.payout.id}`)
    }
  }
  return dashboard.Response.end(req, res, doc)
}
