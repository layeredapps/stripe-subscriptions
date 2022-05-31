const dashboard = require('@layeredapps/dashboard')
const navbar = require('./navbar-product.js')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.productid) {
    req.error = 'invalid-productid'
    req.removeContents = true
    req.data = {
      product: {
        productid: ''
      }
    }
    return
  }
  let productRaw
  try {
    productRaw = await global.api.administrator.subscriptions.Product.get(req)
  } catch (error) {
    if (error.message === 'invalid-productid' || error.message === 'invalid-product') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    req.removeContents = true
    req.data = {
      product: {
        productid: req.query.productid
      }
    }
    return
  }
  const product = formatStripeObject(productRaw)
  if (product.unpublishedAt) {
    req.error = 'unpublished-product'
    req.removeContents = true
    req.data = {
      product: {
        productid: ''
      }
    }
    return
  }
  req.query.all = true
  const taxCodes = await global.api.administrator.subscriptions.TaxCodes.get(req)
  req.data = { product, taxCodes }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.product, 'product')
  navbar.setup(doc, req.data.product)
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
  } else {
    const nameField = doc.getElementById('name')
    nameField.setAttribute('value', req.data.product.name)
    const statementDescriptorField = doc.getElementById('statement_descriptor')
    statementDescriptorField.setAttribute('value', dashboard.Format.replaceQuotes(req.data.product.statement_descriptor))
    const unitLabelField = doc.getElementById('unit_label')
    unitLabelField.setAttribute('value', dashboard.Format.replaceQuotes(req.data.product.unit_label))
    await dashboard.HTML.setSelectedOptionByValue(doc, 'tax_code', req.data.product.tax_code)
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
  try {
    await global.api.administrator.subscriptions.UpdateProduct.patch(req)
  } catch (error) {
    return renderPage(req, res, error.message)
  }
  if (req.query['return-url']) {
    return dashboard.Response.redirect(req, res, req.query['return-url'])
  } else {
    res.writeHead(302, {
      location: `${req.urlPath}?productid=${req.query.productid}&message=success`
    })
    return res.end()
  }
}
