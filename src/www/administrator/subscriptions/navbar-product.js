module.exports = {
  setup: (doc, product) => {
    const removeElements = []
    if (product.unpublishedAt) {
      removeElements.push('navbar-edit-link', 'navbar-publish-link', 'navbar-unpublish-link')
    } else if (product.publishedAt) {
      removeElements.push('navbar-publish-link')
    } else {
      removeElements.push('navbar-unpublish-link')
    }
    const template = doc.getElementById('navbar')
    for (const id of removeElements) {
      const element = template.getElementById(id)
      element.parentNode.removeChild(element)
    }
  }
}
