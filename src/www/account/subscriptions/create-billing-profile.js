const countries = require('../../../../countries.json')
const countryDivisions = require('../../../../country-divisions.json')
const dashboard = require('@layeredapps/dashboard')
const stripeContentSecurityPolicy = "img-src 'self' data:; font-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https://*.stripe.com; script-src 'unsafe-inline' https://*.stripe.com; frame-src https://*.stripe.com https://*.stripe.network; connect-src https://*.stripe.com;"

module.exports = {
  before: beforeRequest,
  get: renderPage,
  post: submitForm
}

async function beforeRequest (req) {
  let profile
  if (req.account.profileid) {
    try {
      req.query = req.query || {}
      req.query.profileid = req.account.profileid
      profile = await global.api.user.Profile.get(req)
    } catch (error) {
    }
  }
  req.data = { profile }
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  let doc
  const unusedVersions = []
  if (global.stripeJS === false) {
    doc = dashboard.HTML.parse(req.html || req.route.html, {}, 'dashboard')
    unusedVersions.push('stripe-v3', 'subscriptions-v3', 'handler-v3', 'form-stripejs-v3')
  } else if (global.stripeJS === 3) {
    doc = dashboard.HTML.parse(req.html || req.route.html, { stripePublishableKey: global.stripePublishableKey }, 'dashboard')
    const stripePublishableKey = doc.getElementById('stripe-publishable-key')
    stripePublishableKey.setAttribute('value', global.stripePublishableKey)
    unusedVersions.push('form-nojs')
    req.contentSecurityPolicy = req.contentSecurityPolicy || global.contentSecurityPolicy || stripeContentSecurityPolicy
  }
  for (const elementid of unusedVersions) {
    const element = doc.getElementById(elementid)
    element.parentNode.removeChild(element)
  }
  if (messageTemplate) {
    const messageContainer = doc.getElementById('message-container')
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, messageContainer)
    if (messageTemplate === 'succes') {
      return dashboard.Response.end(req, res, doc)
    }
  }
  if (global.automaticBillingProfileDescription) {
    const descriptionContainer = doc.getElementById('profile-description-container')
    descriptionContainer.parentNode.removeChild(descriptionContainer)
  }

  if (req.data.profile && req.data.profile.fullName && global.automaticBillingProfileFullName) {
    const nameField = doc.getElementById('name')
    nameField.setAttribute('value', req.data.profile.fullName)
    nameField.setAttribute('readonly', 'readonly')
    dashboard.HTML.renderTemplate(doc, req.data.profile, 'update-profile-full-name', 'note-container-full-name')
  }
  if (req.data.profile && req.data.profile.contactEmail && global.automaticBillingProfileEmail) {
    const emailField = doc.getElementById('email')
    emailField.setAttribute('value', req.data.profile.contactEmail)
    emailField.setAttribute('readonly', 'readonly')
    dashboard.HTML.renderTemplate(doc, req.data.profile, 'update-profile-contact-email', 'note-container-contact-email')
  }
  if (!global.requireBillingProfileAddress) {
    const addressContainer = doc.getElementById('address-container')
    addressContainer.parentNode.removeChild(addressContainer)
  } else {
    let countryCode
    if (req.body) {
      countryCode = req.body.country
    } else {
      if (req.country) {
        countryCode = req.country.country.iso_code
      } else {
        req.query = req.query || {}
        req.query.ip = req.ip
        const defaultCountry = await global.api.user.geoip.Country.get(req)
        countryCode = defaultCountry.country.iso_code
      }
    }
    const country = countryDivisions[countryCode]
    const states = []
    for (const code in country.divisions) {
      states.push({
        code: code.split('-').slice(1).join(''),
        name: country.divisions[code],
        object: 'state'
      })
    }
    states.sort(sortStates)
    dashboard.HTML.renderList(doc, states, 'state-option', 'state')
    if (req.body && req.body.state) {
      dashboard.HTML.setSelectedOptionByValue(doc, 'state', req.body.state)
    }
    dashboard.HTML.renderList(doc, countries, 'country-option', 'country')
    dashboard.HTML.setSelectedOptionByValue(doc, 'country', countryCode)
  }
  if (req.body) {
    for (const field in req.body) {
      if (field === 'country' || field === 'state') {
        continue
      }
      const element = doc.getElementById(field)
      if (!element || element.tag !== 'input') {
        continue
      }
      element.setAttribute('value', dashboard.Format.replaceQuotes(req.body[field]))
    }
  }
  return dashboard.Response.end(req, res, doc)
}

async function submitForm (req, res) {
  if (!req.body || req.body.refresh === 'true') {
    return renderPage(req, res)
  }
  if (req.query && req.query.message === 'success') {
    return renderPage(req, res)
  }
  if (req.data.profile && req.data.profile.contactEmail && global.automaticBillingProfileEmail) {
    req.body.email = req.data.profile.contactEmail
  } else if (!req.body.email || !req.body.email.length || req.body.email.indexOf('@') < 1) {
    return renderPage(req, res, 'invalid-email')
  }
  if (global.automaticBillingProfileDescription) {
    req.body.description = req.body.email
  } else if (!req.body.description || !req.body.description.length) {
    return renderPage(req, res, 'invalid-description')
  }
  if (req.data.profile && req.data.profile.fullName && global.automaticBillingProfileFullName) {
    req.body.name = req.data.profile.fullName
  } else if (!req.body.name || !req.body.name.length) {
    return renderPage(req, res, 'invalid-name')
  }
  if (!global.stripeJS) {
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
  } else if (global.stripeJS === 2 || global.stripeJS === 3) {
    if (!req.body.token || !req.body.token.length) {
      return renderPage(req, res, 'invalid-token')
    }
  }
  let customer
  try {
    req.query = req.query || {}
    req.query.accountid = req.account.accountid
    customer = await global.api.user.subscriptions.CreateCustomer.post(req)
  } catch (error) {
    return renderPage(req, res, error.message)
  }
  try {
    req.query.customerid = customer.customerid
    req.body.default = 'true'
    await global.api.user.subscriptions.CreatePaymentMethod.post(req)
  } catch (error) {
    return renderPage(req, res, error.message)
  }
  if (req.query['return-url']) {
    return dashboard.Response.redirect(req, res, req.query['return-url'])
  } else {
    res.writeHead(302, {
      location: '/account/subscriptions'
    })
    return res.end()
  }
}

function sortStates (a, b) {
  return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1
}
