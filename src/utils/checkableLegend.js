import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import { LightenDarkenColor as recolor } from  'https://cdn.skypack.dev/lighten-darken-color@1.0.0?min'

export function checkableLegend(values, colors, checkedList=null, labelFormat=d=>d, isQuantile=true) {
  const div = document.createElement("div")
  div.style.display = "flex"
  div.style.gap = "25px"

  if (checkedList == null) {
    checkedList = [...values]
  }

  let value = null
  function setValue() {
    const checked = []
    checks.forEach(d => {
      if (d.hasAttribute("checked")) {
        checked.push(d.getAttribute("value"))
      }
    })
    value = checked
  }

  const checks = []
  values.forEach((value,i) => {
    const color = colors[isQuantile ? i : value]
    const check = legendCheck(color, labelFormat(value),checkedList.includes(value), 25)
    check.setAttribute("value", value)
    check.addEventListener("change", e => {
      const checked = []
      setValue()
      div.dispatchEvent(new Event("change"))
    })
    checks.push(check)
    div.appendChild(check)
  })

  setValue()

  div.getValues = () => value 
  
  return div
}

function legendCheck(color, label, checked=true, size=25) {
  const svg = d3.create("svg")
    .attr("width", size)
    .attr("height", size) 

  const rect = svg.append("rect")
    .attr("width", size-4) 
    .attr("height", size-4)
    .attr("rx", size/7)
    .attr("fill", checked ? color : "white")
    .attr("stroke", color)
    .attr("stroke-width", 2)
    .style("cursor", "pointer")
    .attr("transform", "translate(2 2)")

  const scale = (3/5)*(size/78)
  const translate = 78/3

  const check = svg.append("path")
    .attr("d", `M78.049,19.015L29.458,67.606c-0.428,0.428-1.121,0.428-1.548,0L0.32,40.015c-0.427-0.426-0.427-1.119,0-1.547l6.704-6.704
    c0.428-0.427,1.121-0.427,1.548,0l20.113,20.112l41.113-41.113c0.429-0.427,1.12-0.427,1.548,0l6.703,6.704
    C78.477,17.894,78.477,18.586,78.049,19.015z`)
    .attr("fill", "white")
    .attr("transform", `scale(${scale}) translate(${translate} ${translate})`)
    .style("pointer-events", "none")

  const div = document.createElement("div")
  div.className = "legend-check"
  if (checked) {
    div.setAttribute("checked", "")
  } else {
    div.removeAttribute("checked")
  }
  
  const lighterColor = recolor(color, 20)
  svg.on("mouseover", () => {
    rect.attr("fill",  checked ? lighterColor : "white")
    rect.attr("stroke",  lighterColor)
  })
  svg.on("mouseleave", () => {
    rect.attr("fill", checked ? color : "white")
    rect.attr("stroke", color)
  })
  svg.on("click", (e) => {
    e.preventDefault()
    checked = !checked 

    if (checked) {
      div.setAttribute("checked", "")
    } else {
      div.removeAttribute("checked")
    }
    
    check.attr("visibility", checked ? "visible" : "hidden")
    rect.attr("fill", checked ? lighterColor : "white")
    div.dispatchEvent(new Event("change"))
  })
  
  svg.style.userSelect = "none"

  div.style.display = "inline-flex"
  div.style.alignItems = "center"
  div.style.gap = "8px"
  const labelElement = document.createElement("label")
  labelElement.innerText = label
  labelElement.style.fontFamily = "sans-serif"
  labelElement.style.fontSize = "0.8em"
  labelElement.style.pointerEvents = "none"
  labelElement.style.userSelect = "none"
  labelElement.style.maxWidth = "140px"
  labelElement.style.textAlign = "center"
  labelElement.style.flex = "1"
  
  
  div.appendChild(svg.node())
  div.appendChild(labelElement)

  return div
}