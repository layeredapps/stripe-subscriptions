const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')
const navbar = require('./navbar-tax-rate.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
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
    if (error.message === 'invalid-taxrateid' || error.message === 'invalid-taxrateid') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    req.removeContents = true
    req.data = {
      taxRate: {
        taxrateid: req.query.taxrateid
      }
    }
    return
  }
  if (req.query.message !== 'success' && !taxRateRaw.stripeObject.active) {
    req.error = 'already-inactive'
    req.removeContents = true
    req.data = {
      taxRate: {
        taxrateid: req.query.taxrateid
      }
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
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
      return dashboard.Response.end(req, res, doc)
    }
  } 
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  try {
    await global.api.administrator.subscriptions.SetTaxRateInactive.patch(req)
  } catch (error) {
    return renderPage(req, res, error.message)
  }
  if (req.query['return-url']) {
    return dashboard.Response.redirect(req, res, req.query['return-url'])
  } else {
    res.writeHead(302, {
      location: `${req.urlPath}?taxrateid=${req.query.taxrateid}&message=success`
    })
    return res.end()
  }
}
