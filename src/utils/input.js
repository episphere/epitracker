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
  
      const selected = state[valueProperty] == option.value
      select.appendChild(new Option(option.text, option.value, null, selected))
    }
  }

  state.addListener(() => {
    setOptions()
    state[valueProperty] = select.value
  }, optionsProperty)

  state.addListener(() => {
    select.value = state[valueProperty]
  }, valueProperty)

  if (isSelect2) {
    const select = $(query);
    select.on("change", ({target}) => {
      state[valueProperty] = target.value
    });
  } else {
    select.addEventListener("change", () => {
      console.log({select, valueProperty, value: select.value})
      state[valueProperty] = select.value
    })
  }

  setOptions()
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