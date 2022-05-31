module.exports = {
  setup: (doc) => {
    if (global.viewSubscriptionprices === false) {
      const template = doc.getElementById('navbar')
      const startLink = template.getElementById('navbar-start-link')
      startLink.parentNode.removeChild(startLink)
      const pricesLink = template.getElementById('navbar-prices-link')
      pricesLink.parentNode.removeChild(pricesLink)
    }
  }
}
