import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm"
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

import { DynamicState } from "./DynamicState.js"
import { configureSelect } from './input.js'
import { addTooltip } from "./helper.js";
 
console.log('loadData: 1')
const COMPARABLE_FIELDS = ["none", "sex", "race"]
const SELECTABLE_FIELDS = ["cause", "sex", "race"]
const MEASURES = ["crude_rate", "age_adjusted_rate"]

function stateName(operation, field) {
  return operation + field[0].toUpperCase() + field.slice(1)
}

const dataOptionsState = new DynamicState({
  selectCause: null, 
  selectSex: null, 
  selectRace: null,

  comparePrimary: null,
  compareSecondary: null, 
})

const otherOptions = new DynamicState({
  measureField: "age_adjusted_rate",
  quantileField: "unemployment",
  nQuantiles: 8
})

// Global state fields 
let data = null 


dataOptionsState.addListener((field, value) => {
  update()
})

otherOptions.addListener((field, value) => {
   update()
})

function update() {
  const dataState = dataOptionsState

  let quantileData = data.filter(d => d.quantile_field == otherOptions.quantileField)
  const stratifySet = new Set([dataState.comparePrimary, dataState.compareSecondary].filter(d => d != "none"))

  SELECTABLE_FIELDS.forEach(field => {
    if (stratifySet.has(field)) {
      quantileData = quantileData.filter(row => row[field] != "All")
    } else {
      quantileData = quantileData.filter(row => row[field] == dataState[stateName("select", field)])
    }
  })

  quantileData = quantileData.map(d => ({...d}))
  quantileData.forEach(row => {
    const se = row.age_adjusted_rate / Math.sqrt(row.count)
    row.age_adjusted_low = row.age_adjusted_rate - 1.96*se 
    row.age_adjusted_high = row.age_adjusted_rate + 1.96*se 
  })

  plotQuantilePlot(quantileData) 
}

function plotQuantilePlot(data) {
  const dataState = dataOptionsState

  const colorField = dataState.comparePrimary == "none" ? "slateblue" : dataState.comparePrimary

  const marks = []
  if (otherOptions.measureField == "age_adjusted_rate") {
    marks.push(Plot.areaY(data,
       {x: "quantile", y1: "age_adjusted_low", y2: "age_adjusted_high", fill: colorField, fillOpacity: 0.2}))
    
  }

  marks.push(Plot.lineY(data, {x: "quantile", y: otherOptions.measureField, stroke: colorField}))
  marks.push(Plot.dot(data, {x: "quantile", y: otherOptions.measureField, stroke: colorField, r:10, fill: "white",
  title: (d) => {
    const display = Object.entries(d).reduce((pv, cv, ci) => {
      return (ci ? `${pv}\n` : pv) + `${cv[0]}: ${cv[1]}`
    }, '')
    return display
  }
}))
 
  const options = {
    style: {fontSize: "14px"},
    color: {legend: true},
    x: {type: "point"},
    y: {ticks: 8, grid: true, label: otherOptions.measureField + " ↑"},
    marginLeft: 80,
    marginTop: 50,
    marginBottom: 50,
    width: 820,
    height: 520,
    marks: marks
  }

  if (dataState.compareSecondary != "none") {
    options.facet = {
      data: data, 
      x: dataState.compareSecondary
    }
  }

  const plot = Plot.plot(options)
  
  // TODO: Re-add tooltip. 
  // const plotSelect = d3.select(plot)
  // const tooltip = addTooltip(plotSelect)
  // const dots = plotSelect.selectAll("circle")
  // dots.on("mouseover", (e,d) => {
  //   const bbox = e.target.getBBox()
  //   const centroid = [bbox.x + bbox.width/2, bbox.y+bbox.height/2]
  //   const row = data[d]
  //   const message = [row.age_adjusted_rate.toFixed(2)].join("</br>")
  //   tooltip.show(message, centroid[0], centroid[1])
  // })
  // dots.on("mouseleave", (e,d) => {
  //   tooltip.hide()
  // })

  const div = document.getElementById("plot-quantiles")
  div.innerHTML = '' 
  div.appendChild(plot)
}


export async function loadData() {
  const data = await d3.csv("data/quantile_test_data_morecauses.csv")
  const causeDictData = await d3.csv("data/icd10_39recode_dict.csv")
  console.log('loadData: ', {data, causeDictData})
  return [data, causeDictData] 
}

export function dataLoaded(loadedData, causeDictData) {
  data = loadedData
  data.forEach(row => {

    row.age_adjusted_rate = parseFloat(row.age_adjusted_rate)
    row.crude_rate = parseFloat(row.crude_rate)
  })

  let diseases = unique(data, d => d.cause)
  const sexes = unique(data, d => d.sex)
  const races = unique(data, d => d.race)

  const quantileFields = unique(data, d => d.quantile_field)
  const quantileNums = unique(data, d => d.quantile_count)

  const icd10Map = new Map([["All", "All"],  ...causeDictData.map(row => [row.code, row.name])])
  diseases = ["All", ...diseases.sort().filter(d => d != "All")]
  const diseaseOptions = diseases.map(d => ({value: d, label: icd10Map.get(d)}))
  const diseaseSelect = configureSelect("#causeSelectSelect", diseaseOptions, d => dataOptionsState.selectCause = d)
  
  const sexSelect = configureSelect("#sexSelectSelect", sexes, d => dataOptionsState.selectSex = d)
  const raceSelect = configureSelect("#raceSelectSelect", races,d => dataOptionsState.selectRace = d)

  const comparePrimarySelect = configureSelect("#comparePrimarySelect", COMPARABLE_FIELDS, d => dataOptionsState.comparePrimary = d, "race")
  const compareSecondarySelect = configureSelect("#compareSecondarySelect", COMPARABLE_FIELDS, d => dataOptionsState.compareSecondary = d)

  const measureSelect = configureSelect("#measureSelect", MEASURES, d => otherOptions.measureField = d, "age_adjusted_rate")
  const quantileFieldSelect = configureSelect("#quantileFieldSelect", quantileFields, d => otherOptions.quantileField = d, "unemployment")  
  const quantileNumSelect = configureSelect("#quantileNumSelect", quantileNums, d => otherOptions.quantileNum = d)

  dataOptionsState.silentSet("selectCause", diseaseSelect.value)
  dataOptionsState.silentSet("selectSex", sexSelect.value)
  dataOptionsState.silentSet("selectRace", raceSelect.value)
  dataOptionsState.silentSet("comparePrimary", comparePrimarySelect.value)
  dataOptionsState.silentSet("compareSecondary", compareSecondarySelect.value)

  otherOptions.silentSet("quantileField", quantileFieldSelect.value)

  dataOptionsState.selectCause = diseaseSelect.value // TODO: Fix hack

  document.getElementById("loader-container").setAttribute("class", "d-none")
  document.getElementById("plots-container").setAttribute("class", "d-flex flex-row")
}

function unique(data, accessor) {
  return [...new Set(data.map(accessor))]
}