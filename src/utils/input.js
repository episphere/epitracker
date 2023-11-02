export function hookSelect(query, state, optionsProperty, valueProperty, isSelect2) {
  const select = document.querySelector(query) 
  select.innerHTML = ''
  state.defineDynamicProperty(optionsProperty, [])
  state.defineDynamicProperty(valueProperty, null) 

  function setOptions() {
    
   select.innerHTML = ``
  
    for (let option of state[optionsProperty]) {

      if (typeof option == "string") {
          option = {text: option, value: option}
      } 
      
      const optionKeys = Object.keys(option)
      if (typeof option == "object" && optionKeys.includes('name') && optionKeys.includes('label')) {
        option = {text: option.label, value: option.name}
      }

      const selected = state[valueProperty] == option.value
      const newOption = new Option(option.text, option.value, null, selected)
      if (typeof option?.hasData === 'boolean' && !option?.hasData) {
        newOption.disabled = true
      }
      select.appendChild(newOption)
    }
    

    if (isSelect2) {
      const choicesId = query.replace('#', '')
      const choicesInstance = state.choicesInstances[choicesId]
      choicesInstance.clearChoices();
      choicesInstance.setChoices(state[optionsProperty], 'value', 'text', true)
      const hasAllOption = state[optionsProperty].find(item => item.value === 'All')
      // choicesInstance.setChoiceByValue(hasAllOption ? 'All' : state[optionsProperty][0].value);
      console.log('setOptions', {optionsProperty, query, choicesInstance, options: state[optionsProperty]})
    }
  }


  state.addListener(() => {
    setOptions()
    state[valueProperty] = select.value
  }, optionsProperty)

  state.addListener(() => {
    !isSelect2 && (select.value = state[valueProperty])
  }, valueProperty)

  if (isSelect2 && state[optionsProperty]?.length) {
    const choicesId = query.replace('#', '')
    const choicesInstance = state.choicesInstances[choicesId]
    choicesInstance.passedElement.element.addEventListener(
      'choice',
      function(event) {
        state[valueProperty] = event.detail.value
      },
      false,
    );
  } else {
    select.addEventListener("change", () => {
      state[valueProperty] = select.value
    })
  }
}

export function hookCheckbox(query, state, checkedProperty) {
  const element = document.querySelector(query) 
  state.defineDynamicProperty(checkedProperty, element.checked)
  element.checked = state[checkedProperty]
  element.addEventListener("click", () => state[checkedProperty] = element.checked)
  state.defineDynamicProperty(() => {
    element.checked = state[checkedProperty]
  }, checkedProperty)
}

export function hookInputActivation(inputQueries, state, activeProperty) {
  state.defineDynamicProperty(activeProperty) 

  state.addListener(() => {
    for (const query of inputQueries) {
      if (state[activeProperty]) {
        document.querySelector(query).removeAttribute("disabled")
      } else {
        document.querySelector(query).setAttribute("disabled", "")
      }
    }
  }, activeProperty)
}