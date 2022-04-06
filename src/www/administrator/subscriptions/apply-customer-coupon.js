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
    throw new Error('invalid-customerid')
  }
  const customerRaw = await global.api.administrator.subscriptions.Customer.get(req)
  const customer = formatStripeObject(customerRaw)
  if (req.query.message === 'success') {
    req.data = {
      customer
    }
    return
  }
  if (customer.discount && customer.discount.coupon && customer.discount.coupon.id) {
    throw new Error('invalid-customer')
  }
  req.query.all = true
  const coupons = await global.api.administrator.subscriptions.Coupons.get(req)
  const published = []
  if (coupons && coupons.length) {
    for (const i in coupons) {
      const coupon = formatStripeObject(coupons[i])
      if (!coupon.publishedAt || coupon.unpublishedAt) {
        continue
      }
      if (coupon.max_redemptions && coupon.max_redemptions === coupon.times_redeemed) {
        continue
      }
      published.push(coupon)
    }
  }
  req.data = { customer, coupons: published }
}

function renderPage (req, res, messageTemplate) {
  messageTemplate = messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html, req.data.customer, 'customer')
  navbar.setup(doc, req.data.customer)
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (messageTemplate === 'success') {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
      return dashboard.Response.end(req, res, doc)
    }
  }

  if (req.data.coupons && req.data.coupons.length) {
    dashboard.HTML.renderList(doc, req.data.coupons, 'coupon-option', 'couponid')
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
  if (coupon.unpublishedAt ||
      !coupon.publishedAt ||
      (coupon.max_redemptions &&
      coupon.max_redemptions === coupon.times_redeemed)) {
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
