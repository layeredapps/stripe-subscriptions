module.exports = {
  setup: (doc) => {
    if (global.viewSubscriptionPlans === false) {
      const template = doc.getElementById('navbar')
      const startLink = template.getElementById('navbar-start-link')
      startLink.parentNode.removeChild(startLink)
      const plansLink = template.getElementById('navbar-plans-link')
      plansLink.parentNode.removeChild(plansLink)
    }
  }
}
