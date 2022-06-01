const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')
const navbar = require('./navbar-tax-rate.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.taxrateid) {
    req.error = 'invalid-taxrateid'
    req.removeContents = true
    req.data = {
      taxRate: {
        taxrateid: ''
      }
    }
    return
  }
  let taxRateRaw
  try {
    taxRateRaw = await global.api.administrator.subscriptions.TaxRate.get(req)
  } catch (error) {
    req.removeContents = true
    req.data = {
      taxRate: {
        taxrateid: ''
      }
    }
    if (error.message === 'invalid-taxrateid' || error.message === 'invalid-taxrate') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    return
  }
  const taxRate = formatStripeObject(taxRateRaw)
  req.data = { taxRate }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.taxRate, 'tax_rate')
  await navbar.setup(doc, req.data.taxRate)
  const removeElements = []
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      removeElements.push('tax_rates-table')
    }
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
