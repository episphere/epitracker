import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";
import { checkableLegend } from "../utils/checkableLegend.js";
import { addPopperTooltip, addProximityHover } from "../utils/helper.js";
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.8.5/+esm';
import { formatName } from "../utils/nameFormat.js";


export function plotQuantileScatter(container, settingLegend, data, options = {}) {
  options = {
    valueField: null,
    intervalFields: null,
    color: () => "slateblue",
    tooltipFields: [],
    facet: null,
    facetDomain: null,
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

  container.innerHTML = ``

  //const containerWidth = container.getBoundingClientRect().width
  const height = Math.max(options.minHeight, container.getBoundingClientRect().height * .98) // The multiplier is needed 
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
    stroke: options.color, fill: options.color, r: 4, strokeWidth: 3,
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
    const facetDomain = options.facetDomain ? options.facetDomain : [...new Set(data.map(d => d[options.facet]))];
    nFacets = facetDomain.length;
    sizePerFacet = sizePerFacet / nFacets;
  }
  sizePerFacet = Math.min(Math.max(300, sizePerFacet), 800)

  const fx = { tickFormat: options.facetTickFormat };
  if (options.facetDomain) {
    fx.domain = options.facetDomain;
  }

  const plotOptions = {
    // width: (sizePerFacet > 125 ? sizePerFacet * nFacets : 125 * nFacets) || 900,
    width: sizePerFacet * nFacets,
    height,
    style: { fontSize: "16px" },
    color: colorOpt,
    x: { type: "point", label: options.xLabel, tickFormat: options.xTickFormat, tickRotate: -45 },
    y: {
      ticks: 8, grid: true, label: options.yLabel,
      domain: yDomain, nice: true, labelAnchor: "center", labelArrow: "none",
    },
    fx,
    marginLeft: 80,
    marginTop: 80,
    marginBottom: 120,
    marks: marks
  }

  if (options.facet) {
    plotOptions.facet = { data, x: options.facet }
    if (options.facetLabel) {
      plotOptions.facet.label = options.facetLabel
    }
  }

  const plot = Plot.plot(plotOptions)
  plot.style.minWidth = 300 * nFacets;

  container.appendChild(plot)

  addInteractivity(container, plot, data, options.valueField, options.tooltipFields, options.nameMappings)

  plot.removeAttribute("viewBox")


  return { plot }
}

function addInteractivity(container, plot, plotData, measure, tooltipFields) {

  const tooltip = addPopperTooltip(container)
  tooltip.tooltipElement.setAttribute("id", "map-tooltip")

  const plotSelect = d3.select(plot)
  const dotSelect = plotSelect.selectAll("circle")
  addProximityHover(dotSelect, plotSelect, (i, element, j, prevElement) => {
    if (i == null) {
      tooltip.hide()
    } else {
      const index = d3.select(element).data()[0]
      const row = plotData[index]

      d3.select(element).attr("r", 6)


      let text = ``
      tooltipFields.forEach(field => {
        const fieldLabel = formatName("fields", field)
        let fieldValue = row[field];
        if (field == "race") {
          fieldValue = formatName("race", fieldValue, "short");
        }
        return text += `<div style="display: flex; justify-content: space-between;"><b style="margin-right: 10px">${fieldLabel}</b>${fieldValue}</div>`
      })

      const measureLabel = formatName("measures", measure, "short")
      text += `<div style="display: flex; justify-content: space-between;"><b style="margin-right: 10px">${measureLabel}</b>${row[measure]}</div>`
      tooltip.show(element, text)
    }

    if (prevElement) {
      d3.select(prevElement).attr("r", 4)
    }
  }, 20)
}