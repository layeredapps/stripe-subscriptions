module.exports = {
  setup: (doc) => {
    if (global.viewSubscriptionPlans === false) {
      const plansLink = doc.getElementById('navbar-plans-link')
      plansLink.parentNode.removeChild(plansLink)
    }
  }
}
