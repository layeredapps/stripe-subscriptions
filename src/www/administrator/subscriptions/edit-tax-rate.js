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
  if (req.body) {
    const displayNameField = doc.getElementById('display_name')
    displayNameField.setAttribute('value', dashboard.Format.replaceQuotes(req.body.display_name || ''))
    const descriptionField = doc.getElementById('description')
    descriptionField.setAttribute('value', dashboard.Format.replaceQuotes(req.body.description || ''))
    const jurisdictionField = doc.getElementById('jurisdiction')
    jurisdictionField.setAttribute('value', dashboard.Format.replaceQuotes(req.body.jurisdiction || ''))
    dashboard.HTML.setSelectedOptionByValue(doc, 'active', req.body.active || '')
    dashboard.HTML.setSelectedOptionByValue(doc, 'inclusive', req.body.inclusive || '')
  } else {
    const displayNameField = doc.getElementById('display_name')
    displayNameField.setAttribute('value', dashboard.Format.replaceQuotes(req.data.taxRate.display_name || ''))
    const descriptionField = doc.getElementById('description')
    descriptionField.setAttribute('value', dashboard.Format.replaceQuotes(req.data.taxRate.description || ''))
    const jurisdictionField = doc.getElementById('jurisdiction')
    jurisdictionField.setAttribute('value', dashboard.Format.replaceQuotes(req.data.taxRate.jurisdiction || ''))
    dashboard.HTML.setSelectedOptionByValue(doc, 'active', req.data.taxRate.active || '')
    dashboard.HTML.setSelectedOptionByValue(doc, 'inclusive', req.data.taxRate.inclusive || '')
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  if (!req.body) {
    return renderPage(req, res)
  }
  if (req.query && req.query.message === 'success') {
    return renderPage(req, res)
  }
  if (!req.body.display_name || !req.body.display_name.length) {
    return renderPage(req, res, 'invalid-display_name')
  }
  if (!req.body.description || !req.body.description.length) {
    return renderPage(req, res, 'invalid-description')
  }
  if (!req.body.jurisdiction || !req.body.jurisdiction.length) {
    return renderPage(req, res, 'invalid-jurisdiction')
  }
  if (!req.body.active || (req.body.active !== 'true' && req.body.active !== 'false')) {
    return renderPage(req, res, 'invalid-active')
  }
  if (!req.body.inclusive || (req.body.inclusive !== 'true' && req.body.inclusive !== 'false')) {
    return renderPage(req, res, 'invalid-inclusive')
  }
  try {
    await global.api.administrator.subscriptions.UpdateTaxRate.patch(req)
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
