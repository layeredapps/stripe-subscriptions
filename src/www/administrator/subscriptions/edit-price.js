const dashboard = require('@layeredapps/dashboard')
const navbar = require('./navbar-price.js')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.priceid) {
    req.error = 'invalid-priceid'
    req.removeContents = true
    req.data = {
      price: {
        priceid: ''
      }
    }
    return
  }
  let priceRaw
  try {
    priceRaw = await global.api.administrator.subscriptions.Price.get(req)
  } catch (error) {
    req.removeContents = true
    if (error.message === 'invalid-priceid' || error.message === 'invalid-price') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    req.data = {
      price: {
        priceid: req.query.priceid
      }
    }
    return
  }
  const price = formatStripeObject(priceRaw)
  if (!price.active) {
    req.error = 'inactive-price'
    req.removeContents = true
    req.data = {
      price: {
        priceid: ''
      }
    }
    return
  }
  req.data = { price }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.price, 'price')
  navbar.setup(doc, req.data.price)
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
      return dashboard.Response.end(req, res, doc)
    }
  }
  if (req.body) {
    const nicknameField = doc.getElementById('nickname')
    nicknameField.setAttribute('value', dashboard.Format.replaceQuotes(req.body.nickname || ''))
  } else {
    const nicknameField = doc.getElementById('nickname')
    nicknameField.setAttribute('value', dashboard.Format.replaceQuotes(req.data.price.nickname))
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
  if (!req.body.nickname) {
    return renderPage(req, res, 'invalid-nickname')
  }
  try {
    await global.api.administrator.subscriptions.UpdatePrice.patch(req)
  } catch (error) {
    return renderPage(req, res, error.message)
  }
  if (req.query['return-url']) {
    return dashboard.Response.redirect(req, res, req.query['return-url'])
  } else {
    res.writeHead(302, {
      location: `${req.urlPath}?priceid=${req.query.priceid}&message=success`
    })
    return res.end()
  }
}
