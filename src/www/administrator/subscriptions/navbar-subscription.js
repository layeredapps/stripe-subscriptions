module.exports = {
  setup: (doc, subscription, coupon) => {
    const removeElements = []
    if (subscription.status !== 'active') {
      removeElements.push('navbar-apply-coupon-link', 'navbar-revoke-coupon-link', 'navbar-delete-subscription-link')
    } else {
      if (subscription.discount && subscription.discount.coupon && subscription.discount.coupon.id) {
        removeElements.push('navbar-apply-coupon-link')
      } else {
        removeElements.push('navbar-revoke-coupon-link')
      }
    }
    const template = doc.getElementById('navbar')
    for (const id of removeElements) {
      const element = template.getElementById(id)
      element.parentNode.removeChild(element)
    }
  }
}
