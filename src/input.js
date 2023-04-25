export function configureSelect(selector, options, changeListener, value=null) {
    if (typeof options[0] == "string") {
        options = options.map(d => ({value: d, label: d}))
    }

    const select = document.querySelector(selector)   
    removeAllChildNodes(select)
    updateSelect(select, options)

    select.addEventListener("change", () => changeListener(select.value)) 

    if (value) {
        select.value = value
    }
    return select   
}

export function updateSelect(select, options) {
    removeAllChildNodes(select)
    select.removeAttribute("disabled")
    for (const optionDetail of options) {
        const option = document.createElement("option")
        option.setAttribute("value", optionDetail.value)
        option.setAttribute("label", optionDetail.label)
        select.appendChild(option)
    }
}

function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}