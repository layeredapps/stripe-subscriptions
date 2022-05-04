const dashboard = require('@layeredapps/dashboard')
const countries = require('../../../../countries.json')
const countryDivisions = require('../../../../country-divisions.json')
const formatStripeObject = require('../../../stripe-object.js')

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  if (!req.query || !req.query.customerid) {
    req.removeContents = true
    req.error = 'invalid-customerid'
    req.data = {
      customer: {
        customerid: ''
      }
    }
    return
  }
  let customerRaw
  try {
    customerRaw = await global.api.user.subscriptions.Customer.get(req)
  } catch (error) {
    req.removeContents = true
    req.data = {
      customer: {
        customerid: ''
      }
    }
    if (error.message === 'invalid-customerid' || error.message === 'invalid-account') {
      req.error = error.message
    } else {
      req.error = 'unknown-error'
    }
    return
  }
  const customer = formatStripeObject(customerRaw)
  req.data = { customer }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  let doc
  const removeElements = []
  if (global.stripeJS === false) {
    doc = dashboard.HTML.parse(req.html || req.route.html, req.data.customer, 'customer')
    removeElements.push('stripe-v3', 'common-v3', 'handler-v3', 'form-stripejs-v3')
  } else if (global.stripeJS === 3) {
    req.data.customer.dashboardServer = global.dashboardServer
    req.data.customer.stripePublishableKey = global.stripePublishableKey
    doc = dashboard.HTML.parse(req.html || req.route.html, req.data.customer, 'customer')
    const stripePublishableKey = doc.getElementById('stripe-publishable-key')
    stripePublishableKey.setAttribute('value', global.stripePublishableKey)
    removeElements.push('form-nojs')
    res.setHeader('content-security-policy',
      'default-src * \'unsafe-inline\'; ' +
      `style-src https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/v3/ https://js.stripe.com/v2/ ${global.dashboardServer}/public/ 'unsafe-inline'; ` +
      `script-src * https://q.stripe.com/ https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/v3/ https://js.stripe.com/v2/ ${global.dashboardServer}/public/ 'unsafe-inline' 'unsafe-eval'; ` +
      'frame-src https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/ \'unsafe-inline\'; ' +
      'connect-src https://m.stripe.com/ https://m.stripe.network/ https://js.stripe.com/ \'unsafe-inline\'; ')
  }

  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      removeElements.push('form-stripejs-v3', 'form-nojs')
    }
  }
  for (const elementid of removeElements) {
    const element = doc.getElementById(elementid)
    if (!element || !element.parentNode) {
      continue
    }
    element.parentNode.removeChild(element)
  }
  if (req.removeContents) {
    return dashboard.Response.end(req, res, doc)
  }
  req.query = req.query || {}
  req.query.ip = req.ip
  const defaultCountry = await global.api.user.geoip.Country.get(req)
  let countryCode
  if (req.body) {
    countryCode = req.body.address_country
  }
  countryCode = countryCode || defaultCountry.country.iso_code
  const country = countryDivisions[countryCode]
  const states = []
  for (const code in country.divisions) {
    states.push({ code, name: country.divisions[code], object: 'state' })
  }
  states.sort(sortStates)
  dashboard.HTML.renderList(doc, states, 'state-option', 'address_state')
  if (req.body && req.body.address_state) {
    dashboard.HTML.setSelectedOptionByValue(doc, 'address_state', req.body.address_state)
  }
  dashboard.HTML.renderList(doc, countries, 'country-option', 'address_country')
  dashboard.HTML.setSelectedOptionByValue(doc, 'address_country', countryCode)
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  if (!req.body) {
    return renderPage(req, res)
  }
  if (!global.stripeJS) {
    if (!req.body.name || !req.body.name.length) {
      return renderPage(req, res, 'invalid-name')
    }
    if (!req.body.number || !req.body.number.length) {
      return renderPage(req, res, 'invalid-number')
    }
    if (!req.body.cvc || !req.body.cvc.length) {
      return renderPage(req, res, 'invalid-cvc')
    }
    if (!req.body.exp_month || !req.body.exp_month.length) {
      return renderPage(req, res, 'invalid-exp_month')
    }
    if (!req.body.exp_year || !req.body.exp_year.length) {
      return renderPage(req, res, 'invalid-exp_year')
    }
  } else if (global.stripeJS === 3) {
    if (!req.body.token || !req.body.token.length) {
      return renderPage(req, res, 'invalid-token')
    }
  }
  try {
    await global.api.user.subscriptions.CreatePaymentMethod.post(req)
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

function sortStates (a, b) {
  return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1
}
