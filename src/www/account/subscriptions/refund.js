const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.refundid) {
    req.error = 'invalid-refundid'
    req.removeContents = true
    req.data = {
      refund: {
        refundid: ''
      }
    }
    return
  }
  let refundRaw
  try {
    refundRaw = await global.api.user.subscriptions.Refund.get(req)
  } catch (error) {
    req.removeContents = true
    req.data = {
      refund: {
        refundid: ''
      }
    }
    if (error.message === 'invalid-refundid' || error.message === 'invalid-account') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    return
  }
  const refund = formatStripeObject(refundRaw)
  req.data = { refund }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.refund, 'refund')
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      const refundsTable = doc.getElementById('refunds-table')
      refundsTable.parentNode.removeChild(refundsTable)
      return dashboard.Response.end(req, res, doc)
    }
  }
  return dashboard.Response.end(req, res, doc)
}
