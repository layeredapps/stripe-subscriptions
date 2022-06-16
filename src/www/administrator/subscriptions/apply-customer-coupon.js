const dashboard = require('@layeredapps/dashboard')
const navbar = require('./navbar-customer.js')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.customerid) {
    req.error = 'invalid-customerid'
    req.removeContents = true
    req.data = {
      customer: {
        customerid: ''
      }
    }
    return
  }
  let customerRaw
  try {
    customerRaw = await global.api.administrator.subscriptions.Customer.get(req)
  } catch (error) {
    req.removeContents = true
    req.data = {
      customer: {
        customerid: ''
      }
    }
    if (error.message === 'invalid-customerid') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    return
  }
  const customer = formatStripeObject(customerRaw)
  if (req.query.message === 'success') {
    req.removeContents = true
    req.data = {
      customer
    }
    return
  }
  if (customer.discount && customer.discount.coupon && customer.discount.coupon.id) {
    req.error = 'invalid-customer'
    req.removeContents = true
    req.data = {
      customer: {
        customerid: ''
      }
    }
    return
  }
  req.query.all = true
  const coupons = await global.api.administrator.subscriptions.Coupons.get(req)
  const active = []
  if (coupons && coupons.length) {
    for (const i in coupons) {
      const coupon = formatStripeObject(coupons[i])
      if (coupon.max_redemptions && coupon.max_redemptions === coupon.times_redeemed) {
        continue
      }
      active.push(coupon)
    }
  }
  req.data = { customer, coupons: active }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.customer, 'customer')
  navbar.setup(doc, req.data.customer)
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
    }
  } else {
    if (req.data.coupons && req.data.coupons.length) {
      dashboard.HTML.renderList(doc, req.data.coupons, 'coupon-option', 'couponid')
    }
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  if (!req.body || !req.body.couponid) {
    return renderPage(req, res)
  }
  req.query.couponid = req.body.couponid
  let coupon
  try {
    coupon = await global.api.administrator.subscriptions.Coupon.get(req)
  } catch (error) {
    return renderPage(req, res, error.message)
  }
  if (coupon.max_redemptions && coupon.max_redemptions === coupon.times_redeemed) {
    return renderPage(req, res, 'invalid-coupon')
  }
  try {
    await global.api.administrator.subscriptions.SetCustomerCoupon.patch(req)
  } catch (error) {
    return renderPage(req, res, error.message)
  }
  if (req.query['return-url']) {
    return dashboard.Response.redirect(req, res, req.query['return-url'])
  } else {
    res.writeHead(302, {
      location: `${req.urlPath}?customerid=${req.query.customerid}&message=success`
    })
    return res.end()
  }
}
