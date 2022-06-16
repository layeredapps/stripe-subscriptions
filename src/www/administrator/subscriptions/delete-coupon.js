const dashboard = require('@layeredapps/dashboard')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.couponid) {
    req.error = 'invalid-couponid'
    req.removeContents = true
    req.data = {
      coupon: {
        couponid: ''
      }
    }
    return
  }
  if (req.query.message === 'success') {
    req.removeContents = true
    req.data = {
      coupon: {
        couponid: req.query.couponid,
        object: 'coupon'
      }
    }
    return
  }
  let couponRaw
  try {
    couponRaw = await global.api.administrator.subscriptions.Coupon.get(req)
  } catch (error) {
    req.removeContents = true
    req.data = {
      coupon: {
        couponid: ''
      }
    }
    if (error.message === 'invalid-couponid' || error.message === 'invalid-coupon') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    return
  }
  const coupon = formatStripeObject(couponRaw)
  req.data = { coupon }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.coupon, 'coupon')
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
      return dashboard.Response.end(req, res, doc.toString())
    }
  }
  return dashboard.Response.end(req, res, doc.toString())
}

async function submitForm (req, res) {
  try {
    await global.api.administrator.subscriptions.DeleteCoupon.delete(req)
  } catch (error) {
    return renderPage(req, res, error.message)
  }
  if (req.query['return-url']) {
    return dashboard.Response.redirect(req, res, req.query['return-url'])
  } else {
    res.writeHead(302, {
      location: `${req.urlPath}?couponid=${req.query.couponid}&message=success`
    })
    return res.end()
  }
}
