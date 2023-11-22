import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";
import { checkableLegend } from "./checkableLegend.js";
import { addPopperTooltip, addProximityHover } from "./helper.js";

export function plotQuantileScatter(container, data, options={}) {
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
    ...options 
  }

  if (options.color == null) {
    options.color = () => "slateblue"
  }

  options.yLabel = options.yLabel != null ? options.yLabel : options.valueField

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
  
  const colorOpt = {}
  if (options.colorDomain) {
    colorOpt.domain = options.colorDomain
  }

  const yDomain = [
    options.yStartZero ? 0 : d3.min(data, d => d[options.intervalFields[0]]),
    d3.max(data, d => d[options.intervalFields[1]])
  ]

  const plotOptions = {
    width: 820,
    height: 640,
    style: {fontSize: "14px"},
    color: colorOpt,
    x: {type: "point", label: options.xLabel, tickFormat: options.xTickFormat, tickRotate: -45},
    y: {ticks: 8, grid: true, label: options.yLabel, domain: yDomain},
    marginLeft: 80,
    marginTop: 50,
    marginBottom: 110,
    width: 900,
    height: 720,
    marks: marks
  }

  if (options.facet) {
    plotOptions.facet = {data, x: options.facet}
  }


  const plot = Plot.plot(plotOptions)

  container.innerHTML = `` 
  container.appendChild(plot) 

  addInteractivity(container, plot, data, options.valueField, options.tooltipFields)


  return {plot}
}

function addInteractivity(container, plot, plotData, measure, tooltipFields) {
  
  const tooltip = addPopperTooltip(container)

  const plotSelect = d3.select(plot)
  const dotSelect = plotSelect.selectAll("circle")
  addProximityHover(dotSelect, plotSelect, (i,element,prevElement) => {
    if (i == null) {
      tooltip.hide()
    } else {
      const index = d3.select(element).data()[0]
      const row = plotData[index]

      d3.select(element).attr("r", 6)
     
      let text = ``
      tooltipFields.forEach(field => text += `<b>${row[field]}</b> </br>`)
      text += `${row[measure]}`
      tooltip.show(element, text)
    }
    d3.select(prevElement).attr("r", 4)
  }, 20)
}