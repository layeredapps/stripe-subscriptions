const dashboard = require('@layeredapps/dashboard')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  req.query = req.query || {}
  req.query.all = true
  const taxCodes = await global.api.administrator.subscriptions.TaxCodes.get(req)
  req.data = { taxCodes }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html)
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
      return dashboard.Response.end(req, res, doc)
    }
  }
  await dashboard.HTML.renderList(doc, req.data.taxCodes, 'tax-code-option', 'tax_code')
  if (req.body) {
    const nameField = doc.getElementById('name')
    nameField.setAttribute('value', dashboard.Format.replaceQuotes(req.body.name || ''))
    const statementDescriptorField = doc.getElementById('statement_descriptor')
    statementDescriptorField.setAttribute('value', dashboard.Format.replaceQuotes(req.body.statement_descriptor || ''))
    const unitLabelField = doc.getElementById('unit_label')
    unitLabelField.setAttribute('value', dashboard.Format.replaceQuotes(req.body.unit_label || ''))
    await dashboard.HTML.setSelectedOptionByValue(doc, 'tax_code', req.body.tax_code || '')
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
  if (!req.body.name || !req.body.name.length) {
    return renderPage(req, res, 'invalid-name')
  }
  if (global.minimumProductNameLength < req.body.name ||
    global.maximumProductNameLength > req.body.name) {
    return renderPage(req, res, 'invalid-product-name-length')
  }
  if (!req.body.statement_descriptor || !req.body.statement_descriptor.length) {
    return renderPage(req, res, 'invalid-statement_descriptor')
  }
  if (!req.body.unit_label || !req.body.unit_label.length) {
    return renderPage(req, res, 'invalid-unit_label')
  }
  let product
  try {
    product = await global.api.administrator.subscriptions.CreateProduct.post(req)
  } catch (error) {
    return renderPage(req, res, error.message)
  }
  if (req.query && req.query['return-url']) {
    return dashboard.Response.redirect(req, res, req.query['return-url'])
  } else {
    res.writeHead(302, {
      location: `/administrator/subscriptions/product?productid=${product.productid}`
    })
    return res.end()
  }
}
