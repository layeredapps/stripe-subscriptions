const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.lineitemid) {
    req.error = 'invalid-lineitemid'
    req.removeContents = true
    req.data = {
      customer: {
        invoiceitem: ''
      }
    }
    return
  }
  let invoiceItemRaw
  try {
    invoiceItemRaw = await global.api.administrator.subscriptions.LineItem.get(req)
  } catch (error) {
    req.removeContents = true
    req.data = {
      customer: {
        lineitemid: ''
      }
    }
    if (error.message === 'invalid-invoiceitem') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    return
  }
  const customer = formatStripeObject(invoiceItemRaw)
  if (req.query.message === 'success') {
    req.removeContents = true
    req.data = {
      invoiceItem: {
        lineitemid: ''
      }
    }
    return
  }
  req.query.all = true
  const taxRates = await global.api.administrator.subscriptions.TaxRates.get(req)
  const published = []
  if (taxRates && taxRates.length) {
    for (const i in taxRates) {
      const taxRate = formatStripeObject(taxRates[i])
      if (!taxRate.active) {
        continue
      }
      published.push(taxRate)
    }
  }
  req.data = { customer, taxRates: published }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.invoiceItem, 'line_item')
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
    }
  } else {
    if (req.data.taxRates && req.data.taxRates.length) {
      dashboard.HTML.renderList(doc, req.data.taxRates, 'tax-rate-option', 'taxrateid')
    }
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  if (!req.body || !req.body.taxrateid) {
    return renderPage(req, res)
  }
  let found = false
  for (const taxRate of req.data.taxRates) {
    if (taxRate.taxrateid === req.body.taxrateid) {
      found = true
      break
    }
  }
  if (!found) {
    return renderPage(req, res, 'invalid-tax-rate')
  }
  try {
    await global.api.administrator.subscriptions.AddLineItemTaxRate.patch(req)
  } catch (error) {
    return renderPage(req, res, error.message)
  }
  if (req.query['return-url']) {
    return dashboard.Response.redirect(req, res, req.query['return-url'])
  } else {
    res.writeHead(302, {
      location: `${req.urlPath}?lineitemid=${req.query.lineitemid}&message=success`
    })
    return res.end()
  }
}
