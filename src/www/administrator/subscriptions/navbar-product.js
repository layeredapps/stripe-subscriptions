module.exports = {
  setup: (doc, product) => {
    const removeElements = []
    if (!product.active) {
      removeElements.push('navbar-edit-link', 'navbar-deactivate-link')
    } else {
      removeElements.push('navbar-activate-link')
    }
    const template = doc.getElementById('navbar')
    for (const id of removeElements) {
      const element = template.getElementById(id)
      element.parentNode.removeChild(element)
    }
  }
}
