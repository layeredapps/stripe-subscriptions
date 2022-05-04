const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.paymentmethodid) {
    req.error = 'invalid-paymentmethodid'
    req.removeContents = true
    req.data = {
      paymentMethod: {
        paymentmethodid: ''
      }
    }
    return
  }
  let paymentMethodRaw
  try {
    paymentMethodRaw = await global.api.administrator.subscriptions.PaymentMethod.get(req)
  } catch (error) {
    if (error.message === 'invalid-paymentmethodid' || error.message === 'invalid-paymentmethod') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    req.removeContents = true
    req.data = {
      paymentmethod: {
        paymentmethodid: req.query.paymentmethodid
      }
    }
    return
  }
  const paymentMethod = formatStripeObject(paymentMethodRaw)
  req.data = { paymentMethod }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.paymentMethod, 'payment_method')
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      const paymentMethodsTable = doc.getElementById('payment_methods-table')
      paymentMethodsTable.parentNode.removeChild(paymentMethodsTable)
    }
  }
  return dashboard.Response.end(req, res, doc)
}
