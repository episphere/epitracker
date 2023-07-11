import { State } from "./DynamicState2.js"
import { hookSelect, hookCheckbox } from "./input2.js"
import { quantilePlot } from "./quantilePlots.js"
import {paginationHandler, dataPagination} from '../components/pagination.js'
import {downloadFiles} from '../pages/dictionary.js'
import {renderTable} from '../components/table.js'

// ===== Global stuff =====

// Static
const COMPARABLE_FIELDS = ["none", "sex", "race"]
const SELECTABLE_FIELDS = ["cause", "sex", "race"]
const MEASURES = ["crude_rate", "age_adjusted_rate"]

// Note: Using standard object properties unless listeners required
const state = new State()


export async function start() {
  hookInputs()
  await loadData()

  state.comparePrimaryOptions = COMPARABLE_FIELDS
  state.comparePrimary = "none"

  update()

  // We have to define this after data is loaded, or it will run multiple times on set-up
  state.addListener(() => {
      queryData()
      syncDataDependentInputs()
      update()
  }, "comparePrimary", "compareSecondary", "selectCause", "selectSex", "selectRace", 
        "measure", "quantileField", "quantileNum")

  state.comparePrimary = "race"
  document.getElementById("loader-container").setAttribute("class", "d-none")
}

function hookInputs() {
  state.defineDynamicProperty("comparePrimaryOptions", COMPARABLE_FIELDS)

  state.defineDynamicProperty("comparePrimary", null)//"none")
  state.defineDynamicProperty("compareSecondary", null)//"none")
  state.defineDynamicProperty("selectCause", "All")
  state.defineDynamicProperty("selectRace", "All")
  state.defineDynamicProperty("selectSex", "All")
  state.defineDynamicProperty("showLines", true)

  hookSelect("#comparePrimarySelect", state, "comparePrimaryOptions", "comparePrimary")
  hookSelect("#compareSecondarySelect", state, "compareSecondaryOptions", "compareSecondary")
  hookSelect("#causeSelectSelect", state, "selectCauseOptions", "selectCause")
  hookSelect("#sexSelectSelect", state, "selectSexOptions", "selectSex")
  hookSelect("#raceSelectSelect", state, "selectRaceOptions", "selectRace")
  hookSelect("#measureSelect", state, "measureOptions", "measure")
  hookSelect("#quantileFieldSelect", state, "quantileFieldOptions", "quantileField")
  hookSelect("#quantileNumSelect", state, "quantileNumOptions", "quantileNum")
  hookCheckbox("#showLinesCheck", state, "showLines")
  hookCheckbox("#showTableCheck", state, "showTable")


  state.addListener(() => {
    state.compareSecondaryOptions = unique(["none", ...COMPARABLE_FIELDS.filter(d => d != state.comparePrimary)])
    state.comparePrimaryOptions = unique(["none", ...COMPARABLE_FIELDS.filter(d => d != state.compareSecondary)])

    for (const field of SELECTABLE_FIELDS) {
      const element = document.getElementById(field + "SelectSelect")
      if (state.comparePrimary == field || state.compareSecondary == field) {
        element.setAttribute("disabled", "")
      } else {
        element.removeAttribute("disabled")
      }
    }
  }, "comparePrimary", "compareSecondary")
  
  state.addListener(() => {
    update()
  }, "showLines")

  state.addListener(() => {
    document.getElementById("quantile-table-wrapper").style.display = state.showTable ? "block" : "none"
  }, "showTable")
}

function syncDataDependentInputs() {
  state.selectCauseOptions = unique(state.data.filter(d => d.sex == state.selectSex &&  d.race == state.selectRace),
    d => d.cause) 
  state.selectSexOptions = unique(state.data.filter(d => d.cause == state.selectCause &&  d.race == state.selectRace),
    d => d.sex) 
  state.selectRaceOptions = unique(state.data.filter(d => d.sex == state.selectSex &&  d.cause == state.selectCause),
    d => d.race) 
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
  const plot = quantilePlot(state.plotData, {
    valueField: state.measure,
    facet: state.compareSecondary != "none" ? state.compareSecondary : null,
    drawLines: state.showLines,
    xTickFormat: xTickFormat, 
    xLabel, yLabel, color: colorField,

  })
  plotContainer.innerHTML = ''
  plotContainer.appendChild(plot)

  const headers = Object.keys(state.plotData[0])
  downloadFiles(state.plotData, headers, "first_data", true)
  renderTable("quantile-table", dataPagination(0, 200, state.plotData), headers)
  paginationHandler(state.plotData, 200, headers)
  updateQuantileTable(state.plotData)
}

async function loadData() {

  // Load files and put processed data into state 
 
  const data = await d3.csv("data/quantile_data_2020.csv")
  data.sort((a,b) => a.quantile - b.quantile)
  data.forEach(row => MEASURES.forEach(measure => row[measure] = parseFloat(row[measure])))
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
  syncDataDependentInputs()
  toggleInputActivation(true)

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


function toggleInputActivation(active) {
  const ids =  ["comparePrimarySelect", "compareSecondarySelect", "causeSelectSelect",
  "sexSelectSelect", "raceSelectSelect","measureSelect", "quantileFieldSelect", "quantileNumSelect"]
  for (const id of ids) {
    if (active) {
      document.getElementById(id).removeAttribute("disabled")
    } else {
      document.getElementById(id).setAttribute("disabled", "")
    }
    
  }
}


// ===== Helper methods =====

function unique(data, accessor=d=>d) {
  return [...new Set(data.map(accessor))]
}

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
