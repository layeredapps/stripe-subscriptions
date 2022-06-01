const dashboard = require('@layeredapps/dashboard')
const countries = require('../../../../countries.json')
const countryDivisions = require('../../../../country-divisions.json')

module.exports = {
  get: renderPage,
  post: submitForm
}

async function renderPage (req, res, messageTemplate) {
  messageTemplate = req.error || messageTemplate || (req.query ? req.query.message : null)
  const doc = dashboard.HTML.parse(req.html || req.route.html)
  if (messageTemplate) {
    dashboard.HTML.renderTemplate(doc, null, messageTemplate, 'message-container')
    if (req.removeContents) {
      const submitForm = doc.getElementById('submit-form')
      submitForm.parentNode.removeChild(submitForm)
      return dashboard.Response.end(req, res, doc)
    }
  }
  const country = countryDivisions.US
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
  dashboard.HTML.renderList(doc, countries, 'country-option', 'country')
  if (req.body) {
    const nameField = doc.getElementById('display_name')
    nameField.setAttribute('value', dashboard.Format.replaceQuotes(req.body.display_name || ''))
    const descriptionField = doc.getElementById('description')
    descriptionField.setAttribute('value', dashboard.Format.replaceQuotes(req.body.description || ''))
    dashboard.HTML.setSelectedOptionByValue(doc, 'state', req.body.state || '')
    dashboard.HTML.setSelectedOptionByValue(doc, 'country', req.body.country || '')
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
  if (!req.body.display_name || !req.body.display_name.length) {
    return renderPage(req, res, 'invalid-display_name')
  }
  if (!req.body.description || !req.body.description.length) {
    return renderPage(req, res, 'invalid-description')
  }
  if (!req.body.active || (req.body.active !== 'true' && req.body.active !== 'false')) {
    return renderPage(req, res, 'invalid-active')
  }
  if (!req.body.tax_type || 
      (req.body.tax_type !== 'sales_tax' && 
       req.body.tax_type !== 'gst' &&
       req.body.tax_type !== 'vat' &&
       req.body.tax_type !== 'hst' &&
       req.body.tax_type !== 'pst' &&
       req.body.tax_type !== 'qst' &&
       req.body.tax_type !== 'rst' &&
       req.body.tax_type !== 'jct')) {
    return renderPage(req, res, 'invalid-tax_type')
  }
  if (req.body.state) {
    let foundState = false
    for (const code in countryDivisions.US.divisions) {
      const state = code.split('-').slice(1).join('')
      if (req.body.state === state) {
        foundState = true
        break
      }
    }
    if (!foundState) {
      return renderPage(req, res, 'invalid-state')
    }
  }
  if (req.body.country) {
    let foundCountry = false
    for (const country of countries) {
      if (country.code === req.body.country) {
        foundCountry = true
        break
      }
    }
    if (!foundCountry) {
      return renderPage(req, res, 'invalid-country')
    }
  }
  let taxRate
  try {
    taxRate = await global.api.administrator.subscriptions.CreateTaxRate.post(req)
  } catch (error) {
    return renderPage(req, res, error.message)
  }
  if (req.query && req.query['return-url']) {
    return dashboard.Response.redirect(req, res, req.query['return-url'])
  } else {
    res.writeHead(302, {
      location: `/administrator/subscriptions/tax-rate?taxrateid=${taxRate.taxrateid}`
    })
    return res.end()
  }
}

function sortStates (a, b) {
  return a.name.toLowerCase() > b.name.toLowerCase() ? 1 : -1
}
