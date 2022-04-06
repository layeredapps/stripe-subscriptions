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
    throw new Error('invalid-productid')
  }
  if (req.query.message === 'success') {
    req.data = {
      product: {
        id: req.query.productid,
        object: 'product'
      }
    }
    return
  }
  const productRaw = await global.api.administrator.subscriptions.Product.get(req)
  const product = formatStripeObject(productRaw)
  req.data = { product }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.product, 'product')
  navbar.setup(doc, req.data.product)

  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (messageTemplate === 'success') {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
    }
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  if (req.data.product.deleted) {
    return renderPage(req, res, 'success')
  }
  try {
    await global.api.administrator.subscriptions.DeleteProduct.delete(req)
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
