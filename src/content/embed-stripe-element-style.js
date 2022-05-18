const defaultStyle = require('../../stripe-element-style.json')
const Proxy = require('@layeredapps/dashboard/src/proxy.js')
let cache
let lastFetched

module.exports = {
  page: embedElementStyle,
  template: embedElementStyle
}

async function embedElementStyle(_, __, doc) {
  const scriptTags = doc.getElementsByTagName('script')
  if (!scriptTags || !scriptTags.length) {
    return
  }
  for (const scriptTag of scriptTags) {
    if (!scriptTag.attr || !scriptTag.attr.src) {
      continue
    }
    if (scriptTag.attr.src !== '/public/subscriptions/stripe-v3-add-payment-method.js' && 
        scriptTag.attr.src !== '/public/subscriptions/stripe-v3-create-billing-profile.js') {
      continue
    }
    const now = new Date()
    if (lastFetched) {
      if (now.getTime() - lastFetched.getTime() > 60000) {
        cache = null
      }
    }
    let contents
    if (cache) {
      contents = cache
    } else if (global.applicationServer) {
      contents = await Proxy.get({
        url: `${global.applicationServer}/stripe-element-style.json`
      })
    }
    if (!contents || !contents.length) {
      contents = JSON.stringify(defaultStyle)
    }
    cache = contents
    lastFetched = now
    const newScript = doc.createElement('script')
    newScript.child = [{
      node: 'text',
      text: `window.stripeElementStyle = ${contents}`
    }]
    const head = doc.getElementsByTagName('head')[0]
    head.child.unshift(newScript)
  }
}
