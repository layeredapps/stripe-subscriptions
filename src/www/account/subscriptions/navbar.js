module.exports = {
  setup: (doc) => {
    if (global.viewSubscriptionPlans === false) {
      const startLink = doc.getElementById('navbar-start-link')
      startLink.parentNode.removeChild(startLink)
      const plansLink = doc.getElementById('navbar-plans-link')
      plansLink.parentNode.removeChild(plansLink)
    }
  }
}
