import * as Plot from "@observablehq/plot";
// import { addPopperTooltip, addProximityHover } from "../utils/helper.js";
import * as d3 from "d3";
import { addPopperTooltip, addProximityHover, approximateTextBBox, swatchColorLegend } from "./utils/helper.js";
import { formatName } from "./utils/nameFormat.js";


export function plotQuantileScatter(container,  data, options = {}) {
  options = {
    valueField: null,
    intervalFields: null,
    color: () => "slateblue",
    symbol: () => "circle",
    colorLegend: false,
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
    // colorTickFormat: d => d,
    minHeight: 450,
    ...options
  }

  const legendSize = 60;

  if (options.color == null) {
    options.color = () => "slateblue"
  }

  options.yLabel = options.yLabel != null ? options.yLabel : options.valueField

  container.innerHTML = ``

  // The offset is needed  to prevent the SVG from resizing the flex box incorrectly.
  const height = Math.max(options.minHeight, container.getBoundingClientRect().height - 1) - (options.colorLegend ? legendSize : 0);

  const marks = []

  if (options.drawLines) {
    marks.push(Plot.line(data, {
      x: "quantile", y: options.valueField, stroke: "black",
      stroke: options.color, strokeDasharray: "2,6"
    }))
  }


  marks.push(Plot.dot(data, {
    x: "quantile", y: options.valueField,
    stroke: options.color, fill: options.color, r: 3, strokeWidth: 3,
    symbol: options.symbol,
  }))

  if (options.intervalFields) {
    marks.push(Plot.link(data, {
      x: "quantile", y1: options.intervalFields[0], y2: options.intervalFields[1],
      stroke: options.color, strokeWidth: 2, opacity: .7,
    }))
  }

  const colorOpt = {
    // colorTickFormat: options.colorTickFormat,
    type: "categorical",
    scheme: "Tableau10",
  }
  if (options.colorDomain) {
    colorOpt.domain = options.colorDomain
  }

  const yDomain = options.intervalFields ? [
    d3.min(data, d => d[options.intervalFields[0]]),
    d3.max(data, d => d[options.intervalFields[1]])
  ] : d3.extent(data, d => d[options.valueField]);
  if (options.yStartZero) {
    yDomain[0] = 0;
  }

  let sizePerFacet = container.getBoundingClientRect().width
  let nFacets = 1
  if (options.facet) {
    const facetDomain = options.facetDomain ? options.facetDomain : [...new Set(data.map(d => d[options.facet]))];
    nFacets = facetDomain.length;
    sizePerFacet = sizePerFacet / nFacets;
  }
  sizePerFacet = Math.min(Math.max(300, sizePerFacet), 800)

  const fx = { tickFormat: options.facetTickFormat, labelOffset: 45 };
  if (options.facetDomain) {
    fx.domain = options.facetDomain;
  }

  const labelsMaxHeight = d3.max(
    [...new Set(data.map(d => options.xTickFormat(d.quantile)))].map(d => approximateTextBBox(d)[1]));

  const marginTop =  options.facet ? 80 : 50;

  const plotOptions = {
    // width: (sizePerFacet > 125 ? sizePerFacet * nFacets : 125 * nFacets) || 900,
    width: sizePerFacet * nFacets,
    height,
    style: { fontSize: "16px" },
    color: colorOpt,
    x: { type: "point", label: options.xLabel, tickFormat: options.xTickFormat, tickRotate: -45, labelOffset: 30 + labelsMaxHeight },
    y: {
      ticks: 8, grid: true, label: options.yLabel,
      domain: yDomain, nice: true, labelAnchor: "center", labelArrow: "none",
      labelOffset: 70
    },
    fx,
    marginLeft: 90,
    marginTop,
    // marginBottom: 20 + labelsMaxHeight + marginTop,
    marginBottom: 50 + labelsMaxHeight,
    marks: marks
  }

  if (options.facet) {
    plotOptions.facet = { data, x: options.facet }
    if (options.facetLabel) {
      plotOptions.facet.label = options.facetLabel
    }
  }

  const plot = Plot.plot(plotOptions);
  plot.style.minWidth = 300 * nFacets;
  plot.style.flexGrow = 1;
  plot.style.flexShrink = 0;

  // container.appendChild(plot);

  const plotContainer = document.createElement("div");
  plotContainer.style.width = "100%";
  plotContainer.style.display = "flex";
  plotContainer.style.flexDirection = "column";


  container.style.minHeight = options.minHeight + 60 + "px"
  container.style.flexShrink = 0;

  if (options.colorLegend?.position == "bottom") {
    plotContainer.appendChild(plot);
  }

  if (options.colorLegend) {
    const legend = document.createElement("div");
    legend.style.height = legendSize + "px";
    legend.style.display = "flex";
    legend.style.alignItems = "center";
    legend.style.paddingLeft = "10px";
    legend.style.flexShrink = 0;
    legend.appendChild(swatchColorLegend(options.colorLegend));
    plotContainer.appendChild(legend);
  }

  if (!(options.colorLegend?.position == "bottom")) {
    plotContainer.appendChild(plot);
  }

  container.appendChild(plotContainer);

  addInteractivity(container, plot, data, options.valueField, options.tooltipFields, options.nameMappings)

  plot.removeAttribute("viewBox")

  // plot.style.setProperty("background-color", "green")

  return { plot }
}


function addInteractivity(container, plot, plotData, measure, tooltipFields) {

  const tooltip = addPopperTooltip(container)
  tooltip.tooltipElement.setAttribute("id", "map-tooltip")

  const plotSelect = d3.select(plot)
  const dotSelect = plotSelect.selectAll("g[aria-label='dot'] path")
  addProximityHover(dotSelect, plotSelect, (i, element, j, prevElement) => {  
    if (i == null) {
      tooltip.hide()
    } else {
      const index = d3.select(element).data()[0]
      const row = plotData[index]

      let transformAttr = d3.select(element).attr("transform");
      transformAttr = transformAttr + " " + "scale(1.2)";
      d3.select(element).attr("transform", transformAttr);
    
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
      let transformAttr = d3.select(prevElement).attr("transform");
      transformAttr = transformAttr.split(" ")[0];
      d3.select(prevElement).attr("transform", transformAttr);
      // d3.select(prevElement).attr("r", 4)
    }
  }, 20)
}