import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";
import { addPopperTooltip, deepMerge } from "../utils/helper.js";
import {COLORS} from '../utils/color.js'

export function plotDemographicPlots(container, mortalityData, options = {}) {
  const containerWidth = container.getBoundingClientRect().width
  const height = container.getBoundingClientRect().height
  options = deepMerge(options, {
    targetWidth: containerWidth,
    plotOptions: {height,  ...options.plotOptions},
  })
  const mappedMortalityData = mortalityData.map(i => {
    const raceMappings = options.nameMappings['race']
    return {...i, shortRace: raceMappings[i['race']]?.short || 'All'}
  })
  const plot = plotBar(mappedMortalityData, options)

  container.innerHTML = ``
  container.appendChild(plot)

  addChoroplethInteractivity(
    plot,
    container,
    mortalityData,
    options.measure,
    options.compareBar,
    options.nameMappings
    // options.measureField,
    // baseHistogramConfig,
    // mainFeatureCollection,
    // {
    //   featureNameFormat: options.featureNameFormat,
    //   valueFormat: options.valueFormat,
    //   xDomain: domain,
    // }
  );

  return plot
}

function plotBar(data, options={}) {

  options = {
    targetWidth: 640,
    minBarWidth: 25,
    maxBarWidth: 100,
    minBarHeight: 360,
    yStartZero: true, // TODO: Finish implenting.
    ...options
  }
  
  const CHAR_SIZE = 6.6
  const BASE_LABEL_WIDTH = 70

  const barDomain = [...new Set(data.map(d =>{
    const raceMappings = options.nameMappings['race']
    const shortName = raceMappings[d[options.compareBar]]?.short || 'All'
    return options.compareBar === 'race' ? shortName : d[options.compareBar]}))].sort()
  const facetDomain = [...new Set(data.map(d => d[options.compareFacet]))].sort()

  if (options.compareBar == "age_group") {
    barDomain.sort((a,b) => {
      return parseInt(a.split("-")[0]) - parseInt(b.split("-")[0])
    })
  } 
  if (options.compareFacet == "age_group") {
    facetDomain.sort((a,b) => parseInt(a.split("-")[0]) - parseInt(b.split("-")[0]))
  }
  
  let nBars = 1
  let nFacets = 1 
  if (options.compareBar) nBars = barDomain.length
  if (options.compareFacet) nFacets = facetDomain.length

  const xFormat = options.plotOptions.x.tickFormat ? options.plotOptions.x.tickFormat : d => d
  const facetFormat = options.plotOptions.fx.tickFormat ? options.plotOptions.fx.tickFormat : d => d

  // data.forEach(d =>  {
  //   const ageGroup = d.ageGroup.split("-")
  //   ageGroup[0] = ageGroup[0].padStart(2, "0")
  //   d.ageG
  // })


  // Estimate label width
  const labelWidth = options.compareBar ? 
    d3.max([...new Set(data.map(d => d[options.compareBar]))].map(d => xFormat(d).length))*CHAR_SIZE + BASE_LABEL_WIDTH : BASE_LABEL_WIDTH
  const facetLabelWidth = options.compareFacet ? 
    d3.max([...new Set(data.map(d => d[options.compareFacet]))].map(d => facetFormat(d).length))*CHAR_SIZE + BASE_LABEL_WIDTH : BASE_LABEL_WIDTH
  // Label box size
  const labelBox = labelWidth * Math.sin(Math.PI/4)
  const facetLabelBox = facetLabelWidth * Math.sin(Math.PI/4)

  // Estimate the bar width at the target plot width.
  const marginWidth = labelBox + 50
  const infoWidth = options.targetWidth - marginWidth
  const estFacetWidth = infoWidth / nFacets
  const estBarWidth = estFacetWidth / nBars
  // Correct the bar width
  const barWidth = Math.max(Math.min(estBarWidth, options.maxBarWidth), options.minBarWidth)
  // Calculate the final plot width
  const plotWidth = barWidth * nBars * nFacets + marginWidth

  const barOptions = {
    y: options.measure,
    x: options.compareBar !== 'race' ? options.compareBar : 'shortRace',
    fill: (d) => {
      const selectedCompare = (options.compareBar ? options.compareBar : options.compareFacet) || 'race'
      const color = COLORS[selectedCompare] || {}
      console.log('query.fill', {selectedCompare, color})
      return color[d[selectedCompare]] || '#777'
    },
  }

  if (options.compareFacet) {
    barOptions.fx = options.compareFacet
  }

  const domain = d3.extent(data, d => d[options.measure])

  let plotOptions = {
    style: {
      fontSize: 15,
    },
    fx: {tickRotate: 45, domain: facetDomain},
    height: 640,
    width: plotWidth,
    marginBottom: labelBox,
    marginRight: labelBox,
    marginLeft: 50,
    marginTop: facetLabelBox,
    y: {
      domain: options.yStartZero ? [0, domain[1]] : [domain[0], domain[1]], grid: true, nice:true,
    }
  }

  const rule = options.yStartZero ? 0 : domain[0]

  plotOptions.x = {tickRotate: 45, type: "band", domain: barDomain}
  plotOptions.marks = [
    Plot.frame({ strokeOpacity: 0.1 }),
    Plot.barY(data, barOptions),
    Plot.ruleY([rule])
  ]

  plotOptions = deepMerge(plotOptions, options.plotOptions)

  plotOptions.height = Math.max(plotOptions.height, options.minBarHeight + labelBox + facetLabelBox)

  const plot = Plot.plot(plotOptions)
  plot.removeAttribute("viewBox")
  plot.style.width = `${plotWidth}px`
  plot.style.maxWidth = `${plotWidth}px`
  // plot.style.minWidth = `${900}px`
  
  return plot
}

function addChoroplethInteractivity(
  plot,
  plotContainer,
  mortalityData,
  measure,
  compareBar,
  nameMappings
) {
  const plotSelect = d3.select(plot);

  const barSelect = d3.select(
    plotSelect.selectAll("g[aria-label='bar'").nodes()[0]
  );

  console.log({mortalityData, measure, compareBar});

  const rectSelect = barSelect.selectAll("rect");
  console.log({plotSelect, barSelect, rectSelect});

  const tooltip = addPopperTooltip(plotContainer);
  tooltip.tooltipElement.setAttribute("id", "map-tooltip")

  barSelect.on("mouseleave.interact", () => {
    tooltip.hide();
  });

  rectSelect
    .on("mouseover.interact", (e, d) => {
      d3.select(e.target).raise();

      const div = document.createElement("div");
      div.style.display = "flex";
      div.style.flexDirection = "column";
      div.style.justifyContent = "space-between";

      const infoDiv = document.createElement("div");
      infoDiv.style.display = "flex";
      infoDiv.style.alignItems = "flex-start";
      infoDiv.style.flexDirection = "column";
      infoDiv.style.gap = "10px";
      const measureLabel = nameMappings['measures'][measure]
      infoDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between;"><b style="margin-right: 10px">${measureLabel}</b>${mortalityData[d][measure]}</div>
      `;

      if (compareBar)  {
        const fieldLabel = nameMappings['fields'][compareBar]
        infoDiv.innerHTML += `<div style="display: flex; justify-content: space-between;"><b style="margin-right: 10px">${fieldLabel}</b>${mortalityData[d][compareBar]}</div>`
      }

      div.appendChild(infoDiv);

      tooltip.show(e.target, div);
    })
}