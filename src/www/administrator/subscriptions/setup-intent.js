const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')
const statusFields = [
  'requires_capture', 'requires_setup_method', 'requires_payment_method', 'processing', 'requires_confirmation', 'requires_action', 'canceled', 'succeeded'
]

module.exports = {
  before: beforeRequest,
  get: renderPage
}

async function beforeRequest (req) {
  if (!req.query || !req.query.setupintentid) {
    req.error = 'invalid-setupintentid'
    req.removeContents = true
    req.data = {
      setupIntent: {
        setupintentid: ''
      }
    }
    return
  }
  let setupIntentRaw
  try {
    setupIntentRaw = await global.api.administrator.subscriptions.SetupIntent.get(req)
  } catch (error) {
    req.removeContents = true
    req.data = {
      setupIntent: {
        setupintentid: ''
      }
    }
    if (error.message === 'invalid-setupintentid' || error.message === 'invalid-setupintent') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    return
  }
  const setupIntent = formatStripeObject(setupIntentRaw)
  req.data = { setupIntent }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.setupIntent, 'setup_intent')
  const removeElements = []
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      removeElements.push('setup_intents-table')
    }
  } else {
    for (const status of statusFields) {
      if (req.data.setupIntent.status !== status) {
        removeElements.push(status)
      }
    }
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
