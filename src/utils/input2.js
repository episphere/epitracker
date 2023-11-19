// export function hookSelect(select) {
  
//   function setOptions(options) {
//     select.innerHTML = ``
//     for (let option of options) {
//       if (typeof option == "string") {
//         option = {label: option, value: option}
//       } 

//       if (option.label == null) {
//         option.label = option.value
//       }
      
//       const optionElement = document.createElement("option")
//       optionElement.value = option.value 
//       optionElement.innerHTML = option.label 
//       if (option.selected) {
//         optionElement.setAttribute("selected", "")
//       }
      
//       select.appendChild(optionElement)
//     }
//   }

//   const options$ = new bc.Bus()
//   const value$ = new bc.Bus()

//   options$.onValue(options => {
//     setOptions(options)
//     value$.push(select.value)
//   })

//   value$.onValue(value => select.value = value)

//   bc.fromEvent(select, "change").onValue(event => value$.push(event.target.value))

//   return [options$, value$]
// }

export function hookSelectChoices(selector, state, valueProperty, optionsProperty, format=d => d, searchEnabled=false,
  sorter=(a,b)=>0) {
  const select = document.querySelector(selector)
  if (select == null) {
    throw new Error(`No element found for ${selector}`)
  }

  const choices = new Choices(select, {allowHTML: false, itemSelectText: "", searchEnabled, sorter})

  function setOptions() {
    if (state[optionsProperty]) {
      const options = state[optionsProperty].map(d => typeof d == "string" ? {label: d, value: d} : d)
      choices.setChoices(options, "value", "label", true)
      if (state[valueProperty]) {
        choices.setChoiceByValue([state[valueProperty]])
      }
    }
  }

  state.subscribe(optionsProperty, () => {
    setOptions()
  })

  state.subscribe(valueProperty, () => {   
    choices.setChoiceByValue([state[optionsProperty]])
  })

  select.addEventListener("change", () => {
    state[valueProperty] = select.value 
  })

  setOptions()

  return choices
}

export function hookSelect(selector, state, valueProperty, optionsProperty, format = d => d) {
  
  const select = document.querySelector(selector)
  if (select == null) {
    throw new Error(`No element found for ${selector}`)
  }

  function setOptions(options) {

    const selectOptions = []
    select.innerHTML = ``

    if (options) {
      for (let option of options) {
        if (typeof option == "string") {
          option = { value: option, label: format(option) }
        }
        selectOptions.push(option)
        const optionElement = document.createElement("option")
        optionElement.value = option.value
        optionElement.innerText = option.label
        
        if (option.value == state[valueProperty]) {
          optionElement.selected = true
          select.value = option.value
        }
        select.appendChild(optionElement)
      }
    }
  }

  state.subscribe(optionsProperty, () => {
    setOptions(state[optionsProperty])
    state[valueProperty] = select.value
  })

  state.subscribe(valueProperty, () => {   
    for (const option of select.options) {
      if (option.value == state[valueProperty]) {
        option.selected = true 
      } else {
        option.selected = false
      }
    }
  })

  select.addEventListener("change", () => {
    state[valueProperty] = select.value 
  })
  setOptions(state[optionsProperty])

  // if (select.value != "") {
  //   state[valueProperty] = select.value
  // }
}

export function setDisabled(element, disabled) {
  console.log(element,disabled)
  if (disabled) {
    element.setAttribute("disabled", "")
  } else {
    element.removeAttribute("disabled")
  }
}