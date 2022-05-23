let cardNumber
let stripe
const stripeElements = []
window.onload = function () {
  const stripePublishableKey = document.getElementById('stripe-publishable-key')
  stripe = window.Stripe(stripePublishableKey.value)
  const elements = stripe.elements()
  let style
  if (!window.stripeElementStyle) {
    style = {}
  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
    style = window.stripeElementStyle.dark || {}
  } else {
    style = window.stripeElementStyle.light || {}
  }
  const postalCode = elements.create('postalCode', { style })
  postalCode.mount('#postal_code-container')
  const cvcNumber = elements.create('cardCvc', { style })
  cvcNumber.mount('#cvc-container')
  const expiryNumber = elements.create('cardExpiry', { style })
  expiryNumber.mount('#expiry-container')
  cardNumber = elements.create('cardNumber', { style })
  cardNumber.mount('#card-container')
  stripeElements.push(postalCode, cvcNumber, expiryNumber, cardNumber)
  const submit = document.getElementById('submit-button')
  submit.addEventListener('click', convertCard)
  window.loaded = true
}

function convertCard (e) {
  e.preventDefault()
  const additionalData = {}
  const fields = ['name', 'line1', 'line2', 'city', 'state', 'country']
  for (let i = 0, len = fields.length; i < len; i++) {
    const input = document.getElementById(fields[i])
    if (input && input.value) {
      if (i === 0) {
        additionalData[fields[i]] = input.value
      } else {
        additionalData[`address_${fields[i]}`] = input.value
      }
    }
  }
  return stripe.createToken(cardNumber, additionalData).then(function (result) {
    if (result.error) {
      const errorElement = document.getElementById('card-errors')
      errorElement.innerHTML = `<div class="error message">${result.error.message}</div>`
      return
    }
    const token = document.getElementById('token')
    token.value = result.token.id
    const form = document.getElementById('form-stripejs-v3')
    return form.submit()
  })
}
