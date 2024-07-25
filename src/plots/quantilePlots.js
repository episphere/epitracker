import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";
import { checkableLegend } from "../utils/checkableLegend.js";
import { addPopperTooltip, addProximityHover } from "../utils/helper.js";
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.8.5/+esm';


export function plotQuantileScatter(container, settingLegend, data, options={}) {
  options = {
    valueField: null,
    intervalFields: null,
    color: () => "slateblue",
    tooltipFields: [],
    facet: null,
    drawLines: true,
    xTickFormat: d => d,
    xLabel: "quantile",
    yLabel: null,
    colorDomain: null,
    yStartZero: true,
    facetTickFormat: d => d,
    colorTickFormat: d => d,
    minHeight: 400,
    ...options 
  }

  if (options.color == null) {
    options.color = () => "slateblue"
  }

  options.yLabel = options.yLabel != null ? options.yLabel : options.valueField

  //const containerWidth = container.getBoundingClientRect().width
  const height = Math.max(options.minHeight, container.getBoundingClientRect().height*.95) // The .95 multiplier is needed 
                                                                                           // to prevent the SVG from resizing 
                                                                                           // the flex box incorrectly.
                                                                                           

  
  const marks = []
  if (options.valueFieldLow != null && options.valueFieldHigh != null) {
    marks.push(Plot.link(data, {
      x: "quantile", y1: options.valueFieldLow, y2: options.valueFieldHigh, 
      stroke: options.color, strokeWidth: 2
    }))
  }

  if (options.drawLines) {
    marks.push(Plot.line(data, {
      x: "quantile", y: options.valueField, stroke: "black",
      stroke: options.color, strokeDasharray: "2,6"
    }))
  }
  

  marks.push(Plot.dot(data, {
    x: "quantile", y: options.valueField, 
    stroke: options.color, fill: options.color, r:4, strokeWidth:3,
  }))

  if (options.intervalFields) {
    marks.push(Plot.link(data, {
      x: "quantile", y1: options.intervalFields[0], y2: options.intervalFields[1], 
      stroke: options.color, strokeWidth: 2
    }))
  }
  
  const colorOpt = {
    colorTickFormat: options.colorTickFormat,
    type: "categorical",
    scheme: "Tableau10"
  }
  if (options.colorDomain) {
    colorOpt.domain = options.colorDomain
  }

  const yDomain = [
    options.yStartZero ? 0 : d3.min(data, d => d[options.intervalFields[0]]),
    d3.max(data, d => d[options.intervalFields[1]])
  ]

  let sizePerFacet = container.getBoundingClientRect().width
  let nFacets = 1
  if (options.facet) {
    const facetDomain = new Set(data.map(d => d[options.facet]))
    nFacets = facetDomain.size
    sizePerFacet = sizePerFacet / nFacets
  }
  sizePerFacet = Math.min(900, sizePerFacet)
  console.log({sizePerFacet, nFacets});

  const plotOptions = {
    width: sizePerFacet > 125 ? sizePerFacet * nFacets : 125 * nFacets,
    height,
    style: {fontSize: "14px"},
    color: colorOpt,
    x: {type: "point", label: options.xLabel, tickFormat: d => {
      const xTickFormat = options.xTickFormat(undefined, d - 1)
      console.log({d, aaa: options.quantileFieldUnit, xTickFormat})
      const {quantileFieldUnit} = options
      const isPercentOrProportion = quantileFieldUnit.toLowerCase() === 'percent' || quantileFieldUnit.toLowerCase() === 'proportion' 
      
      return xTickFormat.split(' - ').map(i => {
        return (i.trim().replaceAll(',', '') * (isPercentOrProportion ? 100 : 1)).toFixed(2)}).join(' - ')
    }, tickRotate: -45},
    y: {ticks: 8, grid: true, label: options.yLabel, domain: yDomain, nice: true},
    fx: {tickFormat: options.facetTickFormat},
    marginLeft: 80,
    marginTop: 80,
    marginBottom: 110,
    marks: marks
  }

  if (options.facet) {
    plotOptions.facet = {data, x: options.facet}
    if (options.facetLabel) {
      plotOptions.facet.label = options.facetLabel
    }
  }

  const plot = Plot.plot(plotOptions)
  plot.style.minWidth = '900px'

  container.innerHTML = `` 
  container.appendChild(plot) 

  addInteractivity(container, plot, data, options.valueField, options.tooltipFields)

  plot.removeAttribute("viewBox")

  const settingsButton = document.createElement("i");
  settingsButton.className = "fa-solid fa-gear";

  settingsButton.addEventListener("click", () => options.onSettingsClick(settingsButton))

  settingLegend.innerHTML = ``;
  settingLegend.appendChild(settingsButton);


  return {plot}
}

function addInteractivity(container, plot, plotData, measure, tooltipFields) {
  
  const tooltip = addPopperTooltip(container)
  tooltip.tooltipElement.setAttribute("id", "map-tooltip")

  const plotSelect = d3.select(plot)
  const dotSelect = plotSelect.selectAll("circle")
  addProximityHover(dotSelect, plotSelect, (i,element,j,prevElement) => {
    if (i == null) {
      tooltip.hide()
    } else {
      const index = d3.select(element).data()[0]
      const row = plotData[index]

      d3.select(element).attr("r", 6)
     
      let text = ``
      tooltipFields.forEach(field => text += `<div style="display: flex; justify-content: space-between;"><b style="margin-right: 10px">${field}</b>${row[field]}</div>`)
      text += `<div style="display: flex; justify-content: space-between;"><b style="margin-right: 10px">${measure}</b>${row[measure]}</div>`
      tooltip.show(element, text)
    }

    if (prevElement) {
      d3.select(prevElement).attr("r", 4)
    }
  }, 20)
}