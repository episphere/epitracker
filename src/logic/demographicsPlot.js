import * as Plot from "@observablehq/plot";
import * as d3 from "d3";
import { addPopperTooltip, addProximityHover, approximateTextBBox, swatchColorLegend } from "./utils/helper.js";
import { formatName } from "./utils/nameFormat.js";

// TODO: Add lollipop option
// TODO: Add CIs
export function plotDemographicsBar(container, data, options={}) {
  options = {
    valueField: null,
    intervalFields: null,
    xField: null,
    xDomain: null,
    color: () => "slateblue",
    tooltipFields: [],
    facet: null,
    facetDomain: null,
    // xTickFormat: d => d,
    xLabel: "",
    yLabel: null,
    // facetTickFormat: d => d,
    minHeight: 450,
    ...options
  };

  if (options.color == null) {
    options.color = () => "slateblue"
  }

  container.innerHTML = ``;

  // The offset is needed  to prevent the SVG from resizing the flex box incorrectly.
  const height = Math.max(options.minHeight, container.getBoundingClientRect().height - 1);

  const yDomain = options.intervalFields ? [
    0,
    d3.max(data, d => d[options.intervalFields[1]])
  ] : [0, d3.max(data, d => d[options.valueField])];

  const minFacetSize = Math.max(300, 300 * options.xDomain.length);
  const maxFacetSize = 80 * options.xDomain.length;

  let sizePerFacet = container.getBoundingClientRect().width
  let nFacets = 1
  if (options.facet) {
    const facetDomain = options.facetDomain ? options.facetDomain : [...new Set(data.map(d => d[options.facet]))];
    nFacets = facetDomain.length;
    sizePerFacet = sizePerFacet / nFacets;
  }

  sizePerFacet = Math.min(Math.max(minFacetSize, sizePerFacet), maxFacetSize);

  const fx = { tickFormat: options.facetTickFormat, labelOffset: 45 };
  if (options.facetDomain) {
    fx.domain = options.facetDomain;
  }

  const labelsMaxHeight = d3.max(
    [...new Set(data.map(d => options.xTickFormat(d[options.xField])))].map(d => approximateTextBBox(d)[1]));

  const marginTop =  options.facet ? 80 : 50;

  const marks = [];
  marks.push(Plot.barY(data, {
    x: options.xField, y: options.valueField,
    fill: options.color
  }));

  if (options.intervalFields) {
    marks.push(Plot.ruleX(data, {x: options.xField, y1: options.intervalFields[0],y2: options.intervalFields[1], fx: options.facet, stroke: "#121212", strokeWidth: 1}),);
    marks.push(Plot.tickY(data, {x: options.xField, y: options.intervalFields[0], fx: options.facet, stroke: "#121212", inset:10}));
    marks.push(Plot.tickY(data, {x: options.xField, y: options.intervalFields[1], fx: options.facet, stroke: "#121212", inset:10}));
    // marks.push();
  }

  const plotOptions = {
    width: sizePerFacet * nFacets + 110,
    height,
    style: { fontSize: "16px" },
    // color: colorOpt,
    x: { label: options.xLabel, tickFormat: options.xTickFormat, tickRotate: -45, labelOffset: 30 + labelsMaxHeight,
      domain:options.xDomain,
     },
    y: {
      grid: true, label: options.yLabel,
      domain: yDomain, nice: true, labelAnchor: "center", labelArrow: "none",
      labelOffset: 90
    },
    fx,
    marginLeft: Math.max(90, labelsMaxHeight),
    marginTop,
    marginBottom: 50 + labelsMaxHeight,
    // marginBottom: 50 + labelsMaxHeight + marginTop,
    // marginBottom: 200,
    marks: marks
  }

  if (options.facet) {
    plotOptions.facet = { data, x: options.facet }
    if (options.facetLabel) {
      plotOptions.facet.label = options.facetLabel
    }
  }

  const plot = Plot.plot(plotOptions);
  plot.style.minWidth = sizePerFacet * nFacets + 110;
  plot.style.flexGrow = 1;
  plot.style.flexShrink = 0;

  const plotContainer = document.createElement("div");
  plotContainer.style.width = "100%";
  plotContainer.style.display = "grid";
  plotContainer.style.gridTemplateRows = "1fr auto";
  plotContainer.appendChild(plot);

  container.style.minHeight = options.minHeight + 60 + "px"
  container.style.flexShrink = 0;

  container.appendChild(plotContainer);
  plot.removeAttribute("viewBox")
  
  return { plot }
}