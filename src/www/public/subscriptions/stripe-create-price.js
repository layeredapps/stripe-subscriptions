window.addEventListener('load', (event) => {
  const tieredContainer = document.getElementById('tiered-container')
  tieredContainer.style.display = 'none'
  const recurringBillingContainer = document.getElementById('recurring-billing-container')
  recurringBillingContainer.style.display = 'none'
  const transformQuantityContainer = document.getElementById('transform-quantity-container')
  transformQuantityContainer.style.display = 'none'
  const unitAmountContainer = document.getElementById('unit-amount-container')
  unitAmountContainer.style.display = 'none'
  const billingSchemeSelect = document.getElementById('billing_scheme')
  billingSchemeSelect.onclick = billingSchemeSelect.onchange = () => {
    if (billingSchemeSelect.value === 'per_unit') {
      unitAmountContainer.style.display = 'grid'
      transformQuantityContainer.style.display = 'block'
      tieredContainer.style.display = 'none'
    } else if (billingSchemeSelect.value === 'tiered') {
      unitAmountContainer.style.display = 'none'
      transformQuantityContainer.style.display = 'none'
      tieredContainer.style.display = 'block'
    } else {
      unitAmountContainer.style.display = 'none'
      transformQuantityContainer.style.display = 'none'
      tieredContainer.style.display = 'none'
    }
  }
  billingSchemeSelect.onclick()
  const typeSelect = document.getElementById('type')
  typeSelect.onclick = typeSelect.onchange = () => {
    if (typeSelect.value === 'recurring') {
      recurringBillingContainer.style.display = 'block'
    } else if (typeSelect.value === 'one_time') {
      recurringBillingContainer.style.display = 'none'
    }
  }
  typeSelect.onclick()
  const tierTable = document.getElementById('tier-table')
  while (tierTable.rows.length > 2) {
    // if no prepopulated values
    tierTable.deleteRow(2)
  }
  const tierControls = document.getElementById('tier-controls')
  tierControls.style.display = 'block'
  const addButton = tierControls.children[0]
  addButton.onclick = (event) => {
    const tierNumber = tierTable.rows.length
    const row = tierTable.insertRow(tierTable.rows.length)
    const flatAmount = document.createElement('input')
    flatAmount.type = 'text'
    flatAmount.id = flatAmount.name = `tier${tierNumber}_flat_amount`
    const flatAmountCell = row.insertCell()
    flatAmountCell.appendChild(flatAmount)
    const unitAmount = document.createElement('input')
    unitAmount.type = 'text'
    unitAmount.id = unitAmount.name = `tier${tierNumber}_unit_amount`
    const unitAmountCell = row.insertCell()
    unitAmountCell.appendChild(unitAmount)
    const upto = document.createElement('input')
    upto.type = 'text'
    upto.id = upto.name = `tier${tierNumber}_up_to`
    upto.className = 'upto-input'
    upto.value = 'inf'
    const uptoCell = row.insertCell()
    uptoCell.appendChild(upto)
    const uptoInputs = document.getElementsByClassName('upto-input')
    for (let i = 0, len = uptoInputs.length; i < len; i++) {
      const input = uptoInputs[i]
      if (input.value === 'inf' && i < len - 1) {
        input.value = ''
      }
    }
    event.preventDefault()
    return false
  }
  const removeButton = tierControls.children[1]
  removeButton.onclick = (event) => {
    if (tierTable.rows.length === 2) {
      return
    }
    tierTable.deleteRow(tierTable.rows.length - 1)

    const uptoInputs = document.getElementsByClassName('upto-input')
    for (let i = 0, len = uptoInputs.length; i < len; i++) {
      const input = uptoInputs[i]
      if (input.value === '' && i === len - 1) {
        input.value = 'inf'
      }
    }

    event.preventDefault()
    return false
  }
})
