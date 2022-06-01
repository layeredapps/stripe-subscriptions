module.exports = {
  setup: (doc, taxRate) => {
    const template = doc.getElementById('navbar')
    if (taxRate.active) {
      const element = template.getElementById('navbar-activate-link')
      element.parentNode.removeChild(element)      
    } else {
      const element = template.getElementById('navbar-deactivate-link')
      element.parentNode.removeChild(element)
    }
  }
}
