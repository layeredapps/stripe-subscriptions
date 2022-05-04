const dashboard = require('@layeredapps/dashboard')
const navbar = require('./navbar-product.js')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage
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
  req.data = { product }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.product, 'product')
  navbar.setup(doc, req.data.product)
  const removeElements = []
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      removeElements.push('products-table')
    }
  } else {
    if (req.data.product.unpublishedAt) {
      removeElements.push('published', 'not-published')
    } else if (req.data.product.publishedAt) {
      removeElements.push('unpublished', 'not-published')
    } else {
      removeElements.push('published', 'unpublished')
    }
  }
  for (const id of removeElements) {
    const element = doc.getElementById(id)
    element.parentNode.removeChild(element)
  }
  return dashboard.Response.end(req, res, doc)
}
