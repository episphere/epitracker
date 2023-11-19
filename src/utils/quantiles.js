import { State } from "./DynamicState2.js"
import { hookSelect, hookCheckbox, hookInputActivation } from "./input.js"
import { createQuantilePlot } from "./quantilePlots.js"
import { hookDemographicInputs, syncDataDependentInputs, COMPARABLE_FIELDS, SELECTABLE_FIELDS } from "./demographicControls.js"
import {paginationHandler, dataPagination} from '../components/pagination.js'
import {renderTable} from '../components/table.js'
import {downloadGraph, downloadFiles} from './download.js'
import { initSidebar, sort, addPopperTooltip, addProximityHover, capitalizeFirstWord } from "./helper.js"
import { checkableLegend } from "./checkableLegend.js"
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";


// ===== Global stuff =====

// Static
const YEARS = ["2018", "2019", "2020", "2018-2020"]
const SEARCH_SELECT_INPUT_QUERIES = [
  {
    key: '#causeSelectSelect',
    options: {
      sorter: (items) => sort(items, 'text')
    }
  },
  {
    key: '#quantileFieldSelect',
    options: {
      sorter: (items) => sort(items, 'text')
    }
  }
]

// Note: Using standard object properties unless listeners required
let state;

export async function start() {

  state = new State()
  state.defineDynamicProperty("data", null)
  state.defineDynamicProperty("displayColorValues", null)

  hookInputs()
  await initialDataLoad()

  state.comparePrimaryOptions = COMPARABLE_FIELDS
  state.comparePrimary = "none"

  state.downloadGraphRef = {
    graphButton: null, 
    graphCallback: null,
  }

  update()

  state.addListener(() => {
    loadData(state.selectYear)
  }, "selectYear")

  state.addListener(() => {
    queryData()
    update()

  }, "data")

  state.addListener(() => {
      queryData()
      syncDataDependentInputs(state)
      update()
  }, "comparePrimary", "compareSecondary", "selectCause", "selectSex", "selectRace", 
        "measure", "quantileField", "quantileNum")

//   state.addListener(() => {
//     updateQuantileTitle()
// }, "quantileField")

  state.addListener(() => {
    updateQuantilePlot()
  }, "displayColorValues", "showLines", "startZero")

  state.comparePrimary = "race"

  initSidebar()

}

function hookInputs() {
  hookDemographicInputs(state, SEARCH_SELECT_INPUT_QUERIES)

  state.defineDynamicProperty("showLines", true)
  state.defineDynamicProperty("startZero", true)
  state.defineDynamicProperty("quantileField", "unemployment")
  state.defineDynamicProperty("measure", "age_adjusted_rate")
  
  hookSelect("#measureSelect", state, "measureOptions", "measure")
  hookSelect("#quantileFieldSelect", state, "quantileFieldOptions", "quantileField", true)
  hookSelect("#quantileNumSelect", state, "quantileNumOptions", "quantileNum")
  hookCheckbox("#showLinesCheck", state, "showLines")
  hookCheckbox("#startZeroCheck", state, "startZero")
  // hookCheckbox("#showTableCheck", state, "showTable")

  hookInputActivation(["#comparePrimarySelect", "#compareSecondarySelect", "#causeSelectSelect", "#sexSelectSelect",
   "#raceSelectSelect", "#yearSelectSelect", "#measureSelect", "#quantileFieldSelect", "#quantileNumSelect"], state, 
   "inputsActive")

   const graphNavLink = document.getElementById("graph-nav-link")
   const tableNavLink = document.getElementById("table-nav-link")
 
   state.defineDynamicProperty("plotMode", "graph")
   state.addListener(() => {
     if (state.plotMode == "graph") {
       tableNavLink.classList.remove("active")
       graphNavLink.classList.add("active")
       document.getElementById("graph-container").style.display = "grid"
       document.getElementById("table-container").style.display = "none"
 
       if (state.deferPlotFunction) {
         state.deferPlotFunction()
         state.deferPlotFunction = null
       }
     } else if (state.plotMode == "table") {
      graphNavLink.classList.remove("active")
       tableNavLink.classList.add("active")
       document.getElementById("graph-container").style.display = "none"
       document.getElementById("table-container").style.display = "block"
     }
   }, "plotMode")
 
 
 
   graphNavLink.addEventListener("click", () => {
     state.plotMode = "graph"
   })
 
   tableNavLink.addEventListener("click", () => {
     state.plotMode = "table"
   })

  // state.addListener(() => {
  //   document.getElementById("quantile-table-wrapper").style.display = state.showTable ? "block" : "none"
  // }, "showTable")
}

function queryData() {  
  let plotData = state.data.filter(d => d.quantile_field == state.quantileField.replaceAll(' ', '_').toLowerCase())
  const stratifySet = new Set([state.comparePrimary, state.compareSecondary].filter(d => d != "none"))

  SELECTABLE_FIELDS.forEach(field => {
    if (stratifySet.has(field)) {
      plotData = plotData.filter(row => row[field] != "All")
    } else {
      plotData = plotData.filter(row => row[field] == state[statePropertyName("select", field)])
    }
  })
  state.plotData = plotData 
}

function update() {
  updateQuantilePlot()
  updateLegend()

  const headers = Object.keys(state.plotData[0])
  downloadFiles(state.plotData, "first_data")
  downloadQuantileGraphs()
  renderTable("quantile-table", dataPagination(0, 200, state.plotData), headers)
  paginationHandler(state.plotData, 200, headers)
  updateQuantileTable(state.plotData)
  toggleLoading(false)
}

function updateLegend() {
  const colorField = state.comparePrimary == "none" ? "sex" : state.comparePrimary
  
  let colorValues = null 
  const legendContainer = document.getElementById("plot-legend")
  legendContainer.innerHTML = ``

  if (state.comparePrimary != "none") {
    colorValues = [...new Set(state.plotData.map(d => d[colorField]))]
    colorValues.sort()
    state.displayColorValues = colorValues.filter(d => state.displayColorValues.includes(d))
    if (state.displayColorValues.length == 0) {
      state.displayColorValues = colorValues
    }
    const legend = checkableLegend(colorValues, d3.schemeTableau10, state.displayColorValues)
    legendContainer.appendChild(legend)

    legend.addEventListener("change", () => {
      state.displayColorValues = legend.getValues()
    })
  } else {
    colorValues = [...new Set(state.plotData.map(d => d[colorField]))]// ['All']
    state.displayColorValues = colorValues 
  }

}

function updateQuantilePlot() {
  const colorField = state.comparePrimary == "none" ? "sex" : state.comparePrimary

  let colorValues = [...new Set(state.plotData.map(d => d[colorField]))] 
  colorValues.sort()

  if (state.displayColorValues == null) {
    state.displayColorValues = colorValues
  }

  const quantileDetails = state.quantileDetailsMap.get(state.quantileField)
  const xTicks = quantileDetailsToTicks(quantileDetails)
  const xTickFormat = (_,i) => xTicks[i]

  const xLabel = updateQuantileTitle()
  const yLabel = state.valueField

  let filteredPlotData = state.plotData 
  if (state.comparePrimary != "none") {
    filteredPlotData = state.plotData.filter(d => state.displayColorValues.includes(d[colorField]))
  }
  state.filteredPlotData = filteredPlotData

  const plotContainer = document.getElementById("plot-quantiles")
  const {plot} = createQuantilePlot(filteredPlotData, {
    valueField: state.measure,
    intervalFields: [state.measure+"_low", state.measure+"_high"],
    facet: state.compareSecondary != "none" ? state.compareSecondary : null,
    drawLines: state.showLines,
    yStartZero: state.startZero,
    xTickFormat: xTickFormat, 
    xLabel, 
    yLabel, 
    color: d => d[colorField],
    colorDomain: colorValues
  })
  state.quantilePlot = plot
  plotContainer.innerHTML = ''
  plotContainer.appendChild(plot)

  console.log({plotData: state.plotData, filteredPlotData});

  addPlotInteractivity()
  downloadFiles(state.plotData, "first_data")
  downloadQuantileGraphs()
  renderTable("quantile-table", dataPagination(0, 200, state.plotData))
  paginationHandler(state.plotData, 200)
  updateQuantileTable(state.plotData)
}

function addPlotInteractivity() {
  const tooltip = addPopperTooltip(document.getElementById("plot-quantiles"))

  const plotSelect = d3.select(state.quantilePlot)
  const dotSelect = plotSelect.selectAll("circle")
  addProximityHover(dotSelect, plotSelect, (i,element,prevElement) => {
    if (i == null) {
      tooltip.hide()
    } else {
      const index = d3.select(element).data()[0]
      const row = state.filteredPlotData[index]

      d3.select(element).attr("r", 6)

      const activeCompares = [state.comparePrimary, state.compareSecondary].filter(d => d != "none")
      let text = ``
      activeCompares.forEach(compare => text += `<b>${row[compare]}</b> </br>`)
      text += `${row[state.measure]}`
      tooltip.show(element, text)
    }
    d3.select(prevElement).attr("r", 4)
  }, 20)

  //console.log(plotSelect, gSelect)
}

async function loadData(year) {
  toggleLoading(true)
  const {measureOptions} = state.conceptMappings
  const data = await d3.csv(`data/quantile_data/quantile_data_${year}.csv`)
  data.sort((a,b) => a.quantile - b.quantile)

  // TODO: These should be merged and call mapStateAndCounty function
  data.forEach(row => measureOptions.forEach(measure => row[measure.name] = parseFloat(row[measure.name])))
  data.forEach(row => {
    for (const measure of measureOptions) {
      const se = row[measure.name] / Math.sqrt(row.deaths)
      row[measure.name+"_low"] = row[measure.name] - 1.96*se 
      row[measure.name+"_high"] = row[measure.name] + 1.96*se 
    }
  })
  state.data = data 
  
}

async function initialDataLoad() {

  // Load files and put processed data into state 
  state.conceptMappings = await d3.json("data/conceptMappings.json");
  state.dictionary = await d3.json("data/dictionary.json");

  await loadData("2020")
  
  const causeDictData = await d3.csv("data/icd10_39recode_dict.csv")
  state.causeMap = new Map([["All", "All"],  ...causeDictData.map(row => [row.code, row.abbr])])
  
  const quantileDetails = await d3.json("data/quantile_details.json")
  state.quantileDetailsMap = d3.index(quantileDetails, d => `${capitalizeFirstWord(d.field.replaceAll('_', ' '))}`)

  //  Update the input state 
  state.measureOptions = state.conceptMappings.measureOptions
  const quantileFieldOptions = unique(quantileDetails, d => d.field)
  state.quantileFieldOptions = quantileFieldOptions.map(item => `${capitalizeFirstWord(item.replaceAll('_', ' '))}`)
  state.quantileNumOptions = unique(quantileDetails, d => String(d.n))
  state.selectYearOptions = YEARS
  
  queryData()
  syncDataDependentInputs(state)
  // updateQuantileTitle()
  //toggleInputActivation(true)
  state.inputsActive = true 

}

function toggleLoading(loading) {
  if (loading) {
    document.getElementById("plots-container").style.visibility = "hidden"
    document.getElementById("loader-container").style.visibility = "visible"

  } else {
    document.getElementById("plots-container").style.visibility = "visible"
    document.getElementById("loader-container").style.visibility = "hidden"
  }
}

const updateQuantileTable = (data) => {
  if (!data.length) return

  const dataTableEl = document.querySelector('#quantile-table')
  if (dataTableEl) {
    const headerEl = dataTableEl.querySelector('thead > tr')
    const bodyEl = dataTableEl.querySelector('tbody')
    const headers = Object.keys(data[0])
    headerEl.innerHTML = ''
    bodyEl.innerHTML = ''
    headers.forEach(item => {
      headerEl.innerHTML += `<th scope="col">${item}</th>`
    })

    data.forEach(item => {
      let rowData = ''
      headers.forEach(key => {
        rowData += `<td>${item[key]}</td>`
      })
      bodyEl.innerHTML += `<tr>${rowData}</tr>`
    })
  }
} 

const removeDownloadGraphEventListeners = () => {
  if (state.downloadGraphRef.graphButton) {
    state.downloadGraphRef.graphButton.removeEventListener('click', state.downloadGraphRef.graphCallback)
  }
}

function downloadQuantileGraphs() {
  removeDownloadGraphEventListeners()
  const downloadGraphFunction = () => downloadGraph('plot-quantiles', 'quantile')
  const downloadGraphButton = document.getElementById(
    "downloadGraph"
  );
  if (downloadGraphButton) {
    downloadGraphButton.addEventListener("click", downloadGraphFunction);
    state.downloadGraphRef.graphButton = downloadGraphButton
    state.downloadGraphRef.graphCallback = downloadGraphFunction
  }
}


// ===== Helper methods =====

function statePropertyName(operation, field) {
  return operation + field[0].toUpperCase() + field.slice(1)
}

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

function unique(data, accessor=d=>d) {
  return [...new Set(data.map(accessor))]
}

function updateQuantileTitle() {
  if (!state?.properties) return;

  const {quantile_fields} = state.dictionary
  const {quantileField} = state.properties
  const key = quantileField.replaceAll(' ', '_').toLowerCase()
  return quantile_fields[key].description
}