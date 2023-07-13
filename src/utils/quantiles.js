import { State } from "./DynamicState2.js"
import { hookSelect, hookCheckbox, hookInputActivation } from "./input.js"
import { createQuantilePlot } from "./quantilePlots.js"
import { hookDemographicInputs, syncDataDependentInputs, COMPARABLE_FIELDS, SELECTABLE_FIELDS } from "./demographicControls.js"
import {paginationHandler, dataPagination} from '../components/pagination.js'
import {downloadFiles} from '../pages/dictionary.js'
import {renderTable} from '../components/table.js'
import {downloadGraph} from './download.js'
import { toggleSidebar } from "./helper.js"

// ===== Global stuff =====

// Static
const MEASURES = ["crude_rate", "age_adjusted_rate"]

// Note: Using standard object properties unless listeners required
const state = new State()


export async function start() {
  hookInputs()
  await loadData()

  state.comparePrimaryOptions = COMPARABLE_FIELDS
  state.comparePrimary = "none"

  state.downloadGraphRef = {
    pngFigureOneButton: null, 
    pngFigureOneCallback: null,
  }

  update()

  // We have to define this after data is loaded, or it will run multiple times on set-up
  state.addListener(() => {
      queryData()
      syncDataDependentInputs(state)
      update()
  }, "comparePrimary", "compareSecondary", "selectCause", "selectSex", "selectRace", 
        "measure", "quantileField", "quantileNum")

  state.comparePrimary = "race"
  document.getElementById("loader-container").setAttribute("class", "d-none")

  toggleSidebar('plot-quantiles')

}

function hookInputs() {
  hookDemographicInputs(state)

  state.defineDynamicProperty("showLines", true)
  state.defineDynamicProperty("quantileField", "unemployment")
  state.defineDynamicProperty("measure", "age_adjusted_rate")
  
  hookSelect("#measureSelect", state, "measureOptions", "measure")
  hookSelect("#quantileFieldSelect", state, "quantileFieldOptions", "quantileField")
  hookSelect("#quantileNumSelect", state, "quantileNumOptions", "quantileNum")
  hookCheckbox("#showLinesCheck", state, "showLines")
  hookCheckbox("#showTableCheck", state, "showTable")

  hookInputActivation(["#comparePrimarySelect", "#compareSecondarySelect", "#causeSelectSelect", "#sexSelectSelect",
   "#raceSelectSelect","#measureSelect", "#quantileFieldSelect", "#quantileNumSelect"], state, "inputsActive")

  state.addListener(() => {
    update()
  }, "showLines")

  state.addListener(() => {
    document.getElementById("quantile-table-wrapper").style.display = state.showTable ? "block" : "none"
  }, "showTable")
}

function queryData() {
  let plotData = state.data.filter(d => d.quantile_field == state.quantileField)
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
  const colorField = state.comparePrimary == "none" ? "slateblue" : state.comparePrimary

  const quantileDetails = state.quantileDetailsMap.get(state.quantileField)
  const xTicks = quantileDetailsToTicks(quantileDetails)
  const xTickFormat = (_,i) => xTicks[i]

  const xLabel = state.quantileField + " (quantile)"
  const yLabel = state.valueField

  const plotContainer = document.getElementById("plot-quantiles")
  const plot = createQuantilePlot(state.plotData, {
    valueField: state.measure,
    intervalFields: [state.measure+"_low", state.measure+"_high"],
    facet: state.compareSecondary != "none" ? state.compareSecondary : null,
    drawLines: state.showLines,
    xTickFormat: xTickFormat, 
    xLabel, yLabel, color: colorField,

  })
  plotContainer.innerHTML = ''
  plotContainer.appendChild(plot)

  const headers = Object.keys(state.plotData[0])
  downloadFiles(state.plotData, headers, "first_data", true)
  downloadQuantileGraphs()
  renderTable("quantile-table", dataPagination(0, 200, state.plotData), headers)
  paginationHandler(state.plotData, 200, headers)
  updateQuantileTable(state.plotData)
}

async function loadData() {

  // Load files and put processed data into state 
 
  const data = await d3.csv("data/quantile_data_2020.csv")
  data.sort((a,b) => a.quantile - b.quantile)
  data.forEach(row => MEASURES.forEach(measure => row[measure] = parseFloat(row[measure])))
  data.forEach(row => {
    for (const measure of ["crude_rate", "age_adjusted_rate"]) {
      const se = row[measure] / Math.sqrt(row.deaths)
      row[measure+"_low"] = row[measure] - 1.96*se 
      row[measure+"_high"] = row[measure] + 1.96*se 
    }
  })
  state.data = data 
  
  const causeDictData = await d3.csv("data/icd10_39recode_dict.csv")
  state.causeMap = new Map([["All", "All"],  ...causeDictData.map(row => [row.code, row.name])])
  
  const quantileDetails = await d3.json("data/quantile_details.json")
  state.quantileDetailsMap = d3.index(quantileDetails, d => d.field)


  //  Update the input state 
  state.measureOptions = MEASURES
  state.quantileFieldOptions = unique(quantileDetails, d => d.field)
  state.quantileNumOptions = unique(quantileDetails, d => String(d.n))

  queryData()
  syncDataDependentInputs(state)
  //toggleInputActivation(true)
  state.inputsActive = true 

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
  if (state.downloadGraphRef.pngFigureOneButton) {
    state.downloadGraphRef.pngFigureOneButton.removeEventListener('click', state.downloadGraphRef.pngFigureOneCallback)
  }
}

function downloadQuantileGraphs() {
  removeDownloadGraphEventListeners()
  const downloadFigureOnePNG = () => downloadGraph('plot-quantiles', 'quantile')
  const downloadFigureOneButton = document.getElementById(
    "downloadFigureOnePNG"
  );
  if (downloadFigureOneButton) {
    downloadFigureOneButton.addEventListener("click", downloadFigureOnePNG);
    state.downloadGraphRef.pngFigureOneButton = downloadFigureOneButton
    state.downloadGraphRef.pngFigureOneCallback = downloadFigureOnePNG
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