const dashboard = require('@layeredapps/dashboard')
const navbar = require('./navbar-charge.js')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.chargeid) {
    req.error = 'invalid-chargeid'
    req.removeContents = true
    req.data = {
      charge: {
        chargeid: ''
      }
    }
    return
  }
  let chargeRaw
  try {
    chargeRaw = await global.api.administrator.subscriptions.Charge.get(req)
  } catch (error) {
    req.removeContents = true
    req.data = {
      charge: {
        chargeid: ''
      }
    }
    if (error.message === 'invalid-chargeid' || error.message === 'invalid-charge') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    return
  }
  const charge = formatStripeObject(chargeRaw)
  req.data = { charge }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.charge, 'charge')
  navbar.setup(doc, req.data.charge)
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      const chargeTable = doc.getElementById('charge-table')
      chargeTable.parentNode.removeChild(chargeTable)
    }
  }
  return dashboard.Response.end(req, res, doc)
}
