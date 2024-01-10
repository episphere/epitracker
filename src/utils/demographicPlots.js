import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";
import { deepMerge } from "./helper.js";

export function plotDemographicPlots(container, mortalityData, options = {}) {
  const containerWidth = container.getBoundingClientRect().width
  const height = container.getBoundingClientRect().height
  options = deepMerge(options, {
    maxWidth: containerWidth,
    plotOptions: {height,  ...options.plotOptions},
  })
  const plot = plotBar(mortalityData, options)

  container.innerHTML = ``
  container.appendChild(plot)
  return plot
}

function plotBar(data, options={}) {

  options = {
    maxWidth: 640,
    minWidth: 480,
    minFacetWidth: 150,
    minBarWidth: 25,
    maxBarWidth: 80,
    yStartZero: true, // TODO: Finish implenting.
    ...options
  }
  
  const CHAR_SIZE = 7.0
  const BASE_LABEL_WIDTH = 70
  
  let nBars = 1
  let nFacets = 1 
  if (options.compareBar) nBars = new Set(data.map(d => d[options.compareBar])).size
  if (options.compareFacet) nFacets = new Set(data.map(d => d[options.compareFacet])).size

  const xFormat = options.plotOptions.x.tickFormat ? options.plotOptions.x.tickFormat : d => d
  const facetFormat = options.plotOptions.fx.tickFormat ? options.plotOptions.fx.tickFormat : d => d

  // Estimate label width
  const labelWidth = d3.max([...new Set(data.map(d => d[options.compareBar]))].map(d => xFormat(d).length))*CHAR_SIZE + BASE_LABEL_WIDTH
  const facetLabelWidth = options.compareFacet ? 
    d3.max([...new Set(data.map(d => d[options.compareFacet]))].map(d => facetFormat(d).length))*CHAR_SIZE + BASE_LABEL_WIDTH : BASE_LABEL_WIDTH

  // Label box size
  const labelBox = labelWidth * Math.sin(Math.PI/4)
  const facetLabelBox = facetLabelWidth * Math.sin(Math.PI/4)

  const estFacetWidth = Math.max(options.minFacetWidth, nBars * options.minBarWidth)
  let estPlotWidth = Math.max(nFacets * estFacetWidth, options.maxWidth)

  // TODO: Better logic for max bar width
  let estBarWidth = estPlotWidth / (nBars * nFacets)
  estBarWidth = Math.min(options.maxBarWidth, estBarWidth)
  estPlotWidth =  estBarWidth * (nBars * nFacets)

  const plotWidth = estPlotWidth + 50 + labelBox


  const barOptions = {
    y: options.measure,
    x: options.compareBar,
    fill: "#1eb8d0",
    tip: true,
  }

  if (options.compareFacet) {
    barOptions.fx = options.compareFacet
  }

  const domain = d3.extent(data, d => d[options.measure])

  let plotOptions = {
    style: {
      fontSize: 15
    },
    fx: {tickRotate: 45},
    height: 640,
    width: plotWidth,
    marginBottom: labelBox,
    marginRight: labelBox,
    marginLeft: 50,
    marginTop: facetLabelBox,
    y: {domain: options.yStartZero ? [0, domain[1]] : domain, grid: true}
  }

  const rule = options.yStartZero ? 0 : domain[0]

  plotOptions.x = {tickRotate: 45, type: "band"}
  plotOptions.marks = [
    Plot.frame({ strokeOpacity: 0.1 }),
    Plot.barY(data, barOptions),
    Plot.ruleY([rule])
  ]

  plotOptions = deepMerge(plotOptions, options.plotOptions)

  //plotOptions.x.tickFormat =

  const plot = Plot.plot(plotOptions)
  plot.removeAttribute("viewBox")
  plot.style.width = `${plotWidth}px`
  plot.style.maxWidth = `${plotWidth}px`
  // plot.style.overflowX = `scroll`
  // plot.style.maxWidth = `100%`
  // plot.style.boxSizing = "border-box"
  // plot.style.flex = `0 0 ${estPlotWidth}px`
  return plot
}