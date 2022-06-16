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
  if (req.query.message === 'success') {
    req.removeContents = true
    req.data = {
      product
    }
    return
  }
  if (!product.active) {
    req.error = 'already-inactive'
    req.removeContents = true
    req.data = {
      product: {
        productid: ''
      }
    }
    return
  }
  req.data = { product }
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
    }
  }
  return dashboard.Response.end(req, res, doc.toString())
}

async function submitForm (req, res) {
  try {
    await global.api.administrator.subscriptions.SetProductInactive.patch(req)
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
