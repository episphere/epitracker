/**
 * @file The input and basic control logic for the quantiles page.
 * @author Lee Mason <masonlk@nih.gov>
 */

import { EpiTrackerData } from "./EpiTrackerData.js";
import { State } from "./State.js";
import { checkableLegend } from "./checkableLegend.js";
import { downloadElementAsImage } from "./download.js";
import { createDropdownDownloadButton, createOptionSorter, dataToTableData, downloadMortalityData, formatCauseName, initSidebar } from "./helper.js";
import { hookSelectChoices, hookCheckbox } from "./input2.js";
import {  plotQuantileScatter } from "./quantilePlots.js";

import { DataTable } from 'https://cdn.jsdelivr.net/npm/simple-datatables@8.0.0/+esm';


/**
 * Defining some of the necessary configuration options and default values.
 */
const COMPARABLE_FIELDS = ["race", "sex"]
const DATA_YEARS = ["2018", "2019", "2020"] //, "2018-2020"] // TODO: Re-add grouped year
const QUANTILE_NUMBERS  = ["8 (octiles)"]
const NUMERIC_MEASURES = ["crude_rate", "age_adjusted_rate"]

// The default state, shown if no URL params. 
const INITIAL_STATE = {
  compareColor: "sex",
  compareFacet: "none",
  sex: "All",
  race: "All",
  year: "2020",
  measure: "age_adjusted_rate",
  cause: "All",
  quantileField: "adult_smoking", 
  quantileNumber: "8 (octiles)",
  showLines: true,
  startZero: true, 
}

let state, dataManager
let elements, choices, staticData 

export function init() {
  toggleLoading(true)
  
  state = new State()
  dataManager = new EpiTrackerData() 

  elements = {}
  choices = {}
  staticData = {}

  initializeState()
  addDownloadButton()

  elements.selectSex = document.getElementById("select-select-sex")
  elements.selectRace = document.getElementById("select-select-race")
  elements.graphNavLink = document.getElementById("graph-nav-link")
  elements.tableNavLink = document.getElementById("table-nav-link")
  elements.graphContainer = document.getElementById("graph-container")
  elements.plotContainer = document.getElementById("plot-quantiles")
  elements.tableContainer = document.getElementById("table-container")
  elements.colorLegend = document.getElementById("color-legend")
  elements.tableNavLink.addEventListener("click", () => changeView("table"))
  elements.graphNavLink.addEventListener("click", () => changeView("plot"))
  elements.groupDownloadButton = document.querySelector('#group-download-container button');
  elements.graphTitle = document.getElementById("graph-title")

  Promise.all([
    d3.json("data/conceptMappings.json"),
    d3.json("data/quantile/quantile_details.json"),
    dataManager.getQuantileMortalityData({year: "2020"})
  ]).then(([nameMappings, quantileDetails, mortalityData]) => {
    intitialDataLoad(mortalityData, quantileDetails, nameMappings)
  })

  initSidebar()
}

function initializeState() {
  const initialState = {...INITIAL_STATE}

  staticData.url = new URL(window.location.href)
  for (const [paramName, paramValue] of staticData.url.searchParams) {
    initialState[paramName] = paramValue
  }

  state.defineProperty("compareColor", initialState.compareColor)
  state.defineProperty("compareColorOptions", null)
  state.defineProperty("compareFacet", initialState.compareFacet)
  state.defineProperty("compareFacetOptions", null)
  state.defineProperty("year", initialState.year)
  state.defineProperty("yearOptions", DATA_YEARS)
  state.defineProperty("cause", initialState.cause)
  state.defineProperty("causeOptions", null)
  state.defineProperty("measure", initialState.measure)
  state.defineProperty("measureOptions", NUMERIC_MEASURES)
  state.defineProperty("quantileField", initialState.quantileField)
  state.defineProperty("quantileFieldOptions", null)
  state.defineProperty("quantileNumber", initialState.quantileNumber)
  state.defineProperty("quantileNumberOptions", null)

  // The compareRow and compareColumn properties can't be the same value (unless they are 'none'), handle that logic here.
  for (const [childProperty, parentProperty] of [["compareColor", "compareFacet"], ["compareFacet", "compareColor"]]) {
    state.linkProperties(childProperty, parentProperty)
    state.subscribe(parentProperty, () => {
      if (state[parentProperty] == state[childProperty] && state[childProperty] != "none") {
        state[childProperty] = "none"
      } 
    })
  }

  // The values for the selections are dependent on the compares (e.g. if we are comparing by race, then the race select
  // must be equal to "all"). 
  state.defineProperty("race", initialState.race, ["compareColor", "compareFacet"])
  state.defineProperty("raceOptions", []) 
  state.defineProperty("sex", initialState.sex, ["compareColor", "compareFacet"])
  state.defineProperty("sexOptions", []) 
  for (const compareProperty of ["compareColor", "compareFacet"]) {
    state.subscribe(compareProperty, () => {
      if (COMPARABLE_FIELDS.includes(state[compareProperty])) {
        state[state[compareProperty]] = "All"
      } 
    })
  }

  state.defineProperty("showLines", initialState.showLines)
  state.defineProperty("startZero", initialState.startZero)

  state.defineJointProperty("query", ["compareColor", "compareFacet", "cause", "race", "sex", "year", "quantileField"])
  state.defineProperty("legendCheckValues", null, "query")
  state.defineProperty("mortalityData", null, ["query"])
  state.defineJointProperty("plotConfig", ["mortalityData", "query", "measure", "showLines", "startZero", "legendCheckValues"])
  
  for (const param of Object.keys(initialState)) {
    if (state.hasProperty(param)) {
      state.subscribe(param, updateURLParam)
    }
  }

  for (const inputSelectConfig of [
    {id: "#select-compare-color", propertyName: "compareColor"},
    {id: "#select-compare-facet", propertyName: "compareFacet"},
    {id: "#select-select-race", propertyName: "race"},
    {id: "#select-select-sex", propertyName: "sex"},
    {id: "#select-select-cause", propertyName: "cause", searchable: true},
    {id: "#select-select-year", propertyName: "year", forceEnd: "2018-2020"},
    {id: "#select-measure", propertyName: "measure"},
    {id: "#select-quantile-field", propertyName: "quantileField", searchable: true},
    {id: "#select-quantile-number", propertyName: "quantileNumber"},
  ]) {
    const sorter = createOptionSorter(["All", "None"], inputSelectConfig.propertyName == "year" ? ["2018-2020"] : [])

    choices[inputSelectConfig.id] = hookSelectChoices(inputSelectConfig.id, state, 
      inputSelectConfig.propertyName, inputSelectConfig.propertyName + "Options", d => d, inputSelectConfig.searchable, sorter)
  }

  hookCheckbox("#check-show-lines", state, "showLines")
  hookCheckbox("#check-start-zero", state, "startZero")

  state.subscribe("query", queryUpdated)
  state.subscribe("plotConfig", plotConfigUpdated)
}


// =================================
// Primary state logic handlers
// =================================

function intitialDataLoad(mortalityData, quantileDetails, nameMappings) {
  staticData.nameMappings = nameMappings
  staticData.quantileDetails = quantileDetails

  // Initialise the input state from the data
  state.compareColorOptions = ["none", ...COMPARABLE_FIELDS]
    .map(field => ({value: field, label: nameMappings.fields[field]}))
  state.compareFacetOptions = ["none", ...COMPARABLE_FIELDS]
    .map(field => ({value: field, label: nameMappings.fields[field]}))
  state.causeOptions = [...new Set(mortalityData.map(d => d.cause))]
  state.sexOptions = [...new Set(mortalityData.map(d => d.sex))]
  state.raceOptions = [...new Set(mortalityData.map(d => d.race))]
  state.measureOptions = NUMERIC_MEASURES
    .map(field => ({value: field, label: nameMappings.measures[field]}))

  state.quantileFieldOptions = [...new Set(mortalityData.map(d => d.quantile_field))]
    .map(field => ({value: field, label: nameMappings["quantile_fields"][field].measure}))
  state.quantileNumberOptions = QUANTILE_NUMBERS

  state.trigger("query")
  setInputsEnabled()

}

async function queryUpdated(query) {
  toggleLoading(true)

  if (query.compareColor == "race" || query.compareFacet == "race") {
    choices["#select-select-race"].disable()
  } else {
    choices["#select-select-race"].enable()
  }
  if (query.compareColor == "sex" || query.compareFacet == "sex") {
    choices["#select-select-sex"].disable()
  } else {
    choices["#select-select-sex"].enable()
  }

  const dataQuery = {
    year: query.year, 
    cause: query.cause,
    race: query.race, 
    sex: query.sex,
    quantile_field: query.quantileField
  }

  if (query.compareColor != "none") dataQuery[query.compareColor] = "*"
  if (query.compareFacet != "none") dataQuery[query.compareFacet] = "*"

  const data = await dataManager.getQuantileMortalityData(dataQuery, {includeTotals: false})
  data.forEach(row => {
    for (const measure of NUMERIC_MEASURES) {
      const se = row[measure] / Math.sqrt(row.deaths)
      row[measure+"_low"] = parseFloat((row[measure] - 1.96*se).toFixed(2))
      row[measure+"_high"] = parseFloat((row[measure] + 1.96*se).toFixed(2))
    }
  })

  state.mortalityData = data 
  
  updateLegend(data, query)
}

function plotConfigUpdated(plotConfig) {

  const year = plotConfig.query.year.split("-").at(-1)

  const measureDetails = staticData.nameMappings.quantile_fields[plotConfig.query.quantileField]
  const quantileDetails = staticData.quantileDetails[year]["8"][plotConfig.query.quantileField]
  
  const xTicks = quantileDetailsToTicks(quantileDetails)
  const xTickFormat = (_,i) => xTicks[i]

  let data = plotConfig.mortalityData
  if (plotConfig.query.compareColor != "none") {
    const legendCheckSet = new Set(plotConfig.legendCheckValues)
    data = plotConfig.mortalityData.filter(d => legendCheckSet.has(d[plotConfig.query.compareColor]))
  }

  const colorFunction = plotConfig.query.compareColor != "none" ? d => d[plotConfig.query.compareColor] : null

  let colorDomainValues = null 
  if (colorFunction) {
    colorDomainValues = [...new Set(plotConfig.mortalityData.map(colorFunction))] 
    colorDomainValues.sort()
  }
  
  plotQuantileScatter(elements.plotContainer, data, {
    valueField: plotConfig.measure,
    facet: plotConfig.query.compareFacet != "none" ? plotConfig.query.compareFacet : null,
    intervalFields: [plotConfig.measure+"_low", plotConfig.measure+"_high"],
    color: colorFunction,
    drawLines: state.showLines, 
    yStartZero: state.startZero,
    xLabel: `${measureDetails.measure} (${measureDetails.unit})`,
    yLabel: staticData.nameMappings.measures[plotConfig.measure],
    xTickFormat: xTickFormat,
    tooltipFields: [plotConfig.query.compareFacet, plotConfig.query.compareColor].filter(d => d != "none"),
    colorDomain: colorDomainValues
  })

  updateGraphTitle()
  toggleLoading(false)
}


// =================================
// Other inputs
// =================================

function updateLegend(data, query) {
  const legendContainer = document.getElementById("plot-legend")
  legendContainer.innerHTML = ``

  if (query.compareColor != "none") {
    const colorDomainValues = [...new Set(data.map(d => d[query.compareColor]))].sort()
    const checkedValueSet = new Set(state.legendCheckValues)
    let selectedValues = colorDomainValues.filter(d => checkedValueSet.has(d))
    if (selectedValues.length == 0) selectedValues = colorDomainValues

    const legend = checkableLegend(colorDomainValues, d3.schemeTableau10, selectedValues)
    legendContainer.appendChild(legend)

    legend.addEventListener("change", () => {
      state.legendCheckValues = legend.getValues()
    })

    state.legendCheckValues = legend.getValues()
  }
}

function changeView(view) {
  toggleLoading(true)

  if (view == "plot") {
    elements.tableNavLink.classList.remove("active")
    elements.graphNavLink.classList.add("active")
    elements.graphContainer.style.display = "flex"
    elements.tableContainer.style.display = "none"

    state.trigger("plotConfig") // Trigger a redraw so sizing is correct.
  } else if (view == "table") {
    elements.graphNavLink.classList.remove("active")
    elements.tableNavLink.classList.add("active")
    elements.graphContainer.style.display = "none"
    elements.tableContainer.style.display = "block"

    if (state.mortalityData.length > 0) {
      plotTable()
    }
  }

  toggleLoading(false)
}


// =================================
// Helper functions
// =================================

function addDownloadButton() {
  const baseFilename = "epitracker_quantile"

  const groupDownloadContainer = document.getElementById("download-container")
  createDropdownDownloadButton
  const downloadButton = createDropdownDownloadButton(false, [
    {label: "Download data (CSV)", listener: () => downloadMortalityData(state.mortalityData, baseFilename, "csv")},
    {label: "Download data (TSV)", listener: () => downloadMortalityData(state.mortalityData, baseFilename, "tsv")},
    {label: "Download data (JSON)", listener: () => downloadMortalityData(state.mortalityData, baseFilename,  "json")},
    {label: "Download plot (PNG)", listener:  downloadGraph},
  ])
  groupDownloadContainer.appendChild(downloadButton)
}


function downloadGraph() {
  const temporaryContainer = elements.graphContainer.cloneNode(true)
  const legend = temporaryContainer.querySelector("#plot-legend")

  const legendChecks = temporaryContainer.querySelectorAll(".legend-check")
  legendChecks.forEach(check => {
    if (!check.hasAttribute("checked")) {
      check.style.display = "none"
    }
  })

  const checkPaths = legend.querySelectorAll(".legend-check path")
  checkPaths.forEach(path => path.style.visibility = "hidden")
  return downloadElementAsImage(temporaryContainer, "epitracker-quantile-plot")
}

/**
 * Get ticks for x-axis of quantile plot. Ticks are formatted so that if any number has a string length larger than
 * a fixed number, then all ticks are converted to scientific notation. Precision is set to fixed number.
 * @param {*} quantileDetails 
 * @returns 
 */
function quantileDetailsToTicks(quantileDetails) {
  // TODO: Automatically find an appropriate value for precision.

  // Get ticks for x-axis of quantile plot. Ticks are formatted so that if any number has a string length larger than
  // a fixed number, then all ticks are converted to scientific notation. Precision is set to fixed number.

  let ranges = quantileDetails.quantileRanges.map(range => range.map(d => Number(d.toPrecision(2)).toString()))
  const exp = d3.merge(ranges).some(d => d.length > 6)
  for (let i = 0; i < ranges.length; i++) {
    if (exp) {
      ranges[i] = ranges[i].map(d => parseFloat(d).toExponential())
    } else {
      ranges[i] = ranges[i].map(d => parseFloat(d).toLocaleString("en-US", { maximumFractionDigits: 8}))
    }
  }
  return ranges.map(d => d.join(" - "))
}

function updateURLParam(value, param) {
  const url = staticData.url 
  if (INITIAL_STATE[param] != value) {
    url.searchParams.set(param, value)
  } else {
    url.searchParams.delete(param) 
  }
  history.replaceState({}, '', staticData.url.toString())
}

function setInputsEnabled(enabled) {
  for (const input of [
    "select-compare-color",
    "select-compare-facet",
    "select-select-race",
    "select-select-sex", 
    "select-select-cause", 
    "select-select-year", 
    "select-measure",
  ]) {
    const element = document.getElementById(input)
    if (enabled) {
      element.removeAttribute("disabled")
    } else {
      element.setAttribute("disabled", "")
    }
  }

  for (const choice of Object.values(choices)) {
    choice.enable()
  }
}

function plotTable() {
  elements.tableContainer.innerHTML = ``
  
  new DataTable(elements.tableContainer, {
    data: dataToTableData(state.mortalityData),
    perPage: 20,
    perPageSelect: [20, 40, 60, 80, 100, ["All", -1]]
  })  
}

function toggleLoading(loading, soft=false) {
  if (loading) {
    document.getElementById("plots-container").style.opacity = soft ? "0.5" : "0";
    document.getElementById("loader-container").style.visibility = "visible";
  } else {
    document.getElementById("plots-container").style.opacity = "1";
    document.getElementById("loader-container").style.visibility = "hidden";
  }
}

function updateGraphTitle() {
  let compareString = [state.compareColor, state.compareFacet].filter(d => d != "none").join(" and ")
  if (compareString != "") {
    compareString = "</br> Stratified by " + compareString
  }
  const compareSet = new Set([state.compareColor, state.compareFacet])
  const selects = [
    {name: "Year", value: state.year},
    {name: "Cause of death", value: formatCauseName(state.cause)}, 
    {name: "Sex", value: state.sex, exclude: compareSet.has("sex")},
    {name: "Race", value: state.race, exclude: compareSet.has("race")}
  ]
  const selectsString = selects
    .filter(d => !d.exclude)
    .map(d => `${d.name}: ${d.value}`)
    .join("&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp")


  //const title = `${staticData.nameMappings.measures[state.measure]} ${compareString}. </br> ${selectsString}`
  const quantileMeasure = staticData.nameMappings["quantile_fields"][state.quantileField].measure
  let measureName = staticData.nameMappings.measures[state.measure].toLowerCase()
  measureName = measureName[0].toUpperCase() + measureName.slice(1)
  const title = `${measureName} by octile of US county characteristic: ${quantileMeasure.toLowerCase()}${compareString}  </br> ${selectsString}`
  elements.graphTitle.innerHTML = title
}