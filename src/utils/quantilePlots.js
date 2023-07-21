import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";
import { checkableLegend } from "./checkableLegend.js";

export function createQuantilePlot(data, options={}) {
  options = {
    valueField: null,
    intervalFields: null,
    color: () => "slateblue",
    facet: null,
    drawLines: true,
    xTickFormat: d => d,
    xLabel: "quantile",
    yLabel: null,
    colorDomain: null,
    ...options 
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
    title: (d) => {
      const display = Object.entries(d).reduce((pv, cv, ci) => {
        return (ci ? `${pv}\n` : pv) + `${cv[0]}: ${cv[1]}`
      }, '')
      return display
    }
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

  const plotOptions = {
    width: 820,
    height: 640,
    style: {fontSize: "14px"},
    color: colorOpt,
    x: {type: "point", label: options.xLabel, tickFormat: options.xTickFormat, tickRotate: -45},
    y: {ticks: 8, grid: true, label: options.yLabel},
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
  return {plot}
}