import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";
import { colorRampLegendMeanDiverge } from "./helper.js";

const dic = {
  crude_rate: 'Crude Rate', age_adjusted_rate:'Age Adjsuted Rate' 
}


// Just the static plot.
export function createChoroplethPlot(spatialData, featureCollection, options={}) {
  // indexField, measureField , drawBorders
  const {
    zoom,
    ...restOptions
  } = options


  options = {
    drawBorders: false,
    scheme: "RdYlBu",
    ...restOptions
  }

  const spatialDataMap = d3.index(spatialData, d => d[options.indexField])

  const meanValue = d3.mean(spatialData, (d) => d[options.measureField])
  // const maxValue = d3.max(spatialData, (d) => d[options.measureField])
  const color = {
    scheme: options.scheme,
    pivot: meanValue,
    symmetric: true,
    reverse: true,
    label: options.measureField,
  }

  const marks = []
  marks.push(
    Plot.geo(featureCollection, {
      stroke: (d) => options.drawBorders ? "lightgrey" : spatialDataMap.get(d.id)?.[options.measureField],
      fill: (d) => spatialDataMap.get(d.id)?.[options.measureField],
      strokeWidth: 0.5,
    }),
    // Plot.geo(featureCollection, {
    // r: (d) => 2,
    // fill: "red",
    // fillOpacity: 0.2,
    //   stroke: "red",
    // title: (d) => {
    //   console.log('test: ', {d})
    //   return d
    // },
    //   href: (d) => {
    //     console.log('test: ', {d})
    //     return d.properties.name
    //   },
    //   target: "_blank"
    // })
  )

  if (options.overlayFeatureCollection) {
    marks.push(
      Plot.geo(options.overlayFeatureCollection, {
        stroke: "grey", fill: "none", strokeWidth: 1,
      })
    )
  }

  const {innerWidth: windowWidth} = window
  const baseWidthSize = windowWidth * 750 / 1680;
  const baseHeightSize = 640;

  console.log({windowWidth, baseWidthSize});

  const plotOptions = {
    projection: "albers-usa",
    width: baseWidthSize * zoom, 
    height: baseHeightSize * zoom,
    color: color,
    marks: marks,
  }

  const colorLegend = colorRampLegendMeanDiverge(
    spatialData.map((d) => d[options.measureField]), 
    options.scheme, options.measureField, null, true)
  const figure = document.createElement("figure")
  const plot = Plot.plot(plotOptions)
  colorLegend && figure.appendChild(colorLegend)
  figure.appendChild(plot)
  figure.style.width = `${baseWidthSize}px`
  figure.style.height = `${baseHeightSize}px`
  figure.style.overflow = 'auto'
  plot.style.maxWidth = 'initial'
  return {figure,plot}
}

export function createDemographicsPlot(data, options = {}) {
  options = {
    width: 440, 
    height: 360,
    xTickFormat: d => d,
    ...options 
  }

  if (!options.referenceData) {
    options.referenceData = data
  }

  const mainField =
    options.compareSecondary != "none"
      ? options.compareSecondary
      : options.comparePrimary;
  const otherField =
    options.compareSecondary != "none"
      ? options.comparePrimary
      : "none";

  const domainValues = options.referenceData.map((d) => d[mainField]);
  const facetDomainValues = options.referenceData.map((d) => d[otherField]);
  const colorScheme = d3
    .scaleOrdinal()
    .domain(domainValues)
    .range(d3.schemeTableau10);

  const extent = d3.extent(options.referenceData, (d) => d[options.measureField]);
  let tickFormat = (d) => d;
  if (extent.some((d) => Math.abs(d) >= 100000)) {
    tickFormat = (d) => d.toExponential();
  }

  const highlightExtent = d3.extent(data, (d) => d[options.measureField]);
  const maxValue = Math.max(highlightExtent[1], extent[1])

  // Make missing data explicitx
  const missingData = []
  const keys = otherField != "none" ? [mainField, otherField] : [mainField]
  const presentKeys = new Set(data.map(row => keys.map(key => row[key]).join("_")))
  for (const mainValue of new Set(domainValues)) {
    for (const otherValue of new Set(facetDomainValues)) {
      const key = [mainValue,otherValue].filter(d => d != null).join("_")
      if (!presentKeys.has(key)) {
        missingData.push({[mainField]: mainValue, [otherField]: otherValue})
      }
    }
  }
  const textPos = maxValue/2

  const barOptions = {
    x: mainField, 
    y: options.measureField, 
    fill: (d) => colorScheme(d[mainField]),
    title: (d) => {
      return d[mainField]
    }
  }
  const refTickOptions = {
    x: mainField,
    y: options.measureField,
    strokeWidth: 2,
    strokeDasharray: "3,2",
  }
  const missingBarOptions = {
    x: mainField, 
    y: maxValue,
    fill: "#f5f5f5", 
    title: () => 'sahar'
  }
  const textOptions = {
    x: mainField, 
    y: () => textPos, 
    text: () => "N/A", 
    fontSize: 14, 
    fill: "#dedede", 
    pointerEvents: "none"
  }
  if (otherField != "none") {
    barOptions.fx = otherField
    refTickOptions.fx = otherField
    missingBarOptions.fx = otherField
    textOptions.fx = otherField
  }


  const plotOptions = {
    width: options.width, height: options.height,
    marginTop: 40,
    marginRight: 60,
    y: {
      grid: true,
      axis: "right",
      // label: options.measureField + " ↑",
      label: 'Mortality rate per 100,000',
      tickFormat: tickFormat,
    },
    x: { domain: domainValues, tickFormat: options.xTickFormat },
    fx: { tickFormat: (d) => options.facetTickFormat(d) },
    marks: [
      Plot.barY(missingData, missingBarOptions),
      Plot.text(missingData, textOptions),
      Plot.barY(data, barOptions),
      Plot.tickY(options.referenceData, refTickOptions),
    ],
  };

  return Plot.plot(plotOptions);
}

export function createHistogramPlot(data, options={}) {

  options = {
    width: 440, 
    height: 360,
    markLine: [],
    ...options
  }

  const meanValue = d3.mean(data, (d) => d[options.measureField]);

  const extent = d3.extent(data, (d) => d[options.measureField]);
  let tickFormat = (d) => d;
  if (extent.some((d) => Math.abs(d) >= 100000)) {
    tickFormat = (d) => d.toExponential();
  }

  
  const plot = Plot.plot({
    width: options.width, height: options.height,
    color: {
      scheme: "rdylbu",
      type: "diverging",
      pivot: meanValue,
      symmetric: true,
      reverse: true,
    },
    marginBottom: 40,
    x: { label: dic[options.measureField] + " →", tickFormat: tickFormat },
    y: { label: 'number of counties' },
    marks: [
      Plot.rectY(
        data,
        Plot.binX(
          { y: "count" },
          { x: options.measureField, stroke: null, fill: "lightblue" }
        )
      ),
      Plot.ruleX(options.markLine, {
        x: (d) => d[options.measureField],
        stroke: "red",
        strokeWidth: 2,
      }),
      Plot.text(options.markLine, {
        x: (d) => d[options.measureField],
        text: (d) => d[options.measureField].toFixed(0),
        textAnchor: "start",
        dx: 3,
      }),
    ],
  });

  return plot
}


