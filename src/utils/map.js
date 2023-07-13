import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

import { State } from "./DynamicState2.js"
import { hookDemographicInputs, syncDataDependentInputs, COMPARABLE_FIELDS, SELECTABLE_FIELDS } from "./demographicControls.js"
import { hookInputActivation, hookSelect, hookCheckbox } from "./input.js"
import { createChoroplethPlot, createDemographicsPlot, createHistogramPlot } from "./mapPlots.js"
import { addTooltip, toggleSidebar } from "./helper.js";
import {paginationHandler, dataPagination} from '../components/pagination.js'
import {renderTable} from '../components/table.js'
import { downloadGraph }  from "./download.js"
import { downloadFiles } from "../pages/dictionary.js";

// Static
const MEASURES = ["crude_rate", "age_adjusted_rate"]
const LEVELS = ["state", "county"]

// Note: Using standard object properties unless listeners required

const state = new State

export async function start() {
  hookInputs()
  await loadData()

  state.comparePrimaryOptions = COMPARABLE_FIELDS

  state.downloadGraphRef = {
    pngFigureOneButton: null, 
    pngFigureOneCallback: null,
    pngFigureTwoButton: null, 
    pngFigureTwoCallback: null,
    pngFigureThreeButton: null, 
    pngFigureThreeCallback: null
  }

  state.addListener(() => {
    queryData()
    syncDataDependentInputs(state)
    update()
  }, "comparePrimary", "compareSecondary", "selectCause", "selectSex", "selectRace", "measure", "level")
  
  state.inputsActive = true
  state.comparePrimary = "race"

  toggleSidebar('plot-map')

  document.getElementById("plots-container").setAttribute("class", "d-flex flex-row")
  document.getElementById("loader-container").setAttribute("class", "d-none")

}

function hookInputs() {
  state.defineDynamicProperty("level", "county")

  hookDemographicInputs(state)
  hookInputActivation(["#comparePrimarySelect", "#compareSecondarySelect", "#causeSelectSelect", "#sexSelectSelect", 
    "#raceSelectSelect","#measureSelect", "#levelSelect"], state, "inputsActive")

  hookSelect("#measureSelect", state, "measureOptions", "measure")
  hookSelect("#levelSelect", state, "levelOptions", "level")
  
  hookCheckbox("#showTableCheck", state, "showTable")

  state.addListener(() => {
    document.getElementById("map-table-wrapper").style.display = state.showTable ? "block" : "none"
  }, "showTable")
}

function queryData() {


  //  Get data for map

  let mapData = state.data.filter(
    (d) =>
      d.cause == state.selectCause &&
      d.sex == state.selectSex &&
      d.race == state.selectRace &&
      d.state_fips != "All"
  );

  if (state.level == "county") {
    mapData = mapData.filter((d) => d.county_fips != "All");
  } else {
    mapData = mapData.filter((d) => d.county_fips == "All");
  }
  mapData = mapData.filter(row => Number.isFinite(row[state.measure]))

  state.mapData = mapData


  // Get data for demographic plot
 
  state.demographicData = getDemographicData()

} 

function getDemographicData(highlight=null) {
  let stateFips = "All";
  let countyFips = "All";
  if (highlight) {
    if (highlight.length == 2) {
      stateFips = highlight;
    } else {
      countyFips = highlight;
    }
  }

  let demographicData = state.data.filter(
    (d) => d.state_fips == stateFips && d.county_fips == countyFips
  );

  const stratifySet = new Set(
    [state.comparePrimary, state.compareSecondary].filter(
      (d) => d != "none"
    )
  );
  SELECTABLE_FIELDS.forEach((field) => {
    if (stratifySet.has(field)) {
      demographicData = demographicData.filter((row) => row[field] != "All");
    } else {
      demographicData = demographicData.filter(
        (row) => row[field] == state[statePropertyName("select", field)]
      );
    }
  });

  return demographicData
}

function addPlotInteractivity() {
  const indexField = state.level + "_fips"
  const spatialDataMap = d3.index(state.mapData, (d) => d[indexField]);

  const plotSelect = d3.select(state.choroplethPlot)

  const gSelect = d3
    .select(plotSelect.selectAll("g[aria-label='geo'").nodes()[0])

  const geoSelect = gSelect
    .selectAll("path")

  const tooltip = addTooltip(plotSelect)

  const previousStroke = null
  gSelect.on("mouseleave.interact", () => {
    state.plotHighlight = null
    tooltip.hide()
  })

  geoSelect
    .on("mouseover.interact", (e, d) => {
      const feature = state.featureCollection.features[d]
      state.plotHighlight = feature.id
      d3.select(e.target)
        .attr("stroke", "mediumseagreen")
        .attr("stroke-width", 4)
        .raise();

      const bbox = e.target.getBBox();
      const centroid = [bbox.x + bbox.width / 2, bbox.y + bbox.height / 2];

      const row = spatialDataMap.get(feature.id)
      const text = `
        ${feature.properties.name}</br>
        ${row[state.measure].toFixed(2)}
      `

      tooltip.show(text, ...centroid)

    })
    .on("mouseleave.interact", (e, d) => {
      d3.select(e.target)
        .attr("stroke", previousStroke)
        .attr("stroke-width", 0.5)
        .raise();

    });

  state.defineDynamicProperty("plotHighlight")
  state.addListener(() => {
    updateSidePlots()
  }, "plotHighlight")
}

function update() {

  const indexField = state.level + "_fips"

  state.featureCollection = state.level == "county" ? state.countyGeo : state.stateGeo
  const choroplethFigure = createChoroplethPlot(state.mapData, state.featureCollection, {
    indexField, measureField: state.measure,
    overlayFeatureCollection: state.level == "county" ? state.stateGeo : null
  })
  const choropleth = choroplethFigure.plot 
  const figure = choroplethFigure.figure

  const mapPlotContainer = document.getElementById("plot-map")
  mapPlotContainer.innerHTML = '' 
  mapPlotContainer.appendChild(figure)

  state.choroplethPlot = choropleth
  updateSidePlots(indexField)

  addPlotInteractivity()


  const headers = Object.keys(state.mapData[0])
  downloadFiles(state.mapData, headers, "first_data");
  downloadMapGraphs()
  renderTable("map-table", dataPagination(0, 200, state.mapData), headers);
  paginationHandler(state.mapData, 200, headers);
}

function updateSidePlots() {
  const spatialIndexField = state.level + "_fips"

  const demographicHighlightData = getDemographicData(state.plotHighlight)
  const demographicsPlot = createDemographicsPlot(demographicHighlightData, {
    referenceData: state.demographicData,
    measureField: state.measure, comparePrimary: state.comparePrimary, compareSecondary: state.compareSecondary,
    xTickFormat: d => l(d), facetTickFormat: d => l(d)
  })

  const demographicsPlotContainer = document.getElementById("plot-demographic")
  demographicsPlotContainer.innerHTML = ''
  demographicsPlotContainer.appendChild(demographicsPlot)

  const highlightRow = state.mapData.filter(d => d[spatialIndexField] == state.plotHighlight).slice(0,1)
  const histogramPlot = createHistogramPlot(state.mapData, {
    measureField: state.measure, markLine: highlightRow
  })

  const histogramPlotContainer = document.getElementById("plot-histogram");
  histogramPlotContainer.innerHTML = ''
  histogramPlotContainer.appendChild(histogramPlot)

  state.demographicsPlot = demographicsPlot
  state.histogramPlot = histogramPlot
}

async function loadData() {
  const data = await d3.csv("data/age_adjusted_data_2020.csv")
  data.forEach((row) => {
    MEASURES.forEach((field) => (row[field] = parseFloat(row[field])))
  })

  const causeDictData = await d3.csv("data/icd10_39recode_dict.csv")

  state.data = data 
  state.countyGeo =  await d3.json("data/counties.json")
  state.stateGeo = await d3.json("data/states.json") 
  state.dictionary = await d3.json("data/dictionary.json")
  state.causeMap = new Map([["All", "All"],  ...causeDictData.map(row => [row.code, row.name])])
  
  //  Update the input state 
  state.measureOptions = MEASURES
  state.levelOptions = LEVELS
}

function l(word, sub = null) {
  if (sub == null) {
    for (const key of Object.keys(state.dictionary)) {
      if (state.dictionary[key][word]) {
        return state.dictionary[key][word];
      }
    }
  } else {
    if (state.dictionary[sub][word]) {
      return state.dictionary[sub][word];
    }
  }

  return word;
}

const removeDownloadGraphEventListeners = () => {
  if (state.downloadGraphRef.pngFigureOneButton) {
    state.downloadGraphRef.pngFigureOneButton.removeEventListener('click', state.downloadGraphRef.pngFigureOneCallback)
  }

  if (state.downloadGraphRef.pngFigureTwoButton) {
    state.downloadGraphRef.pngFigureTwoButton.removeEventListener('click', state.downloadGraphRef.pngFigureTwoCallback)
  }

  if (state.downloadGraphRef.pngFigureTreeButton) {
    state.downloadGraphRef.pngFigureTreeButton.removeEventListener('click', state.downloadGraphRef.pngFigureTreeCallback)
  }
}

function downloadMapGraphs() {
  removeDownloadGraphEventListeners()

  const downloadFigureOnePNG = () => downloadGraph('plot-map', 'map')
  const downloadFigureTwoPNG = () => downloadGraph('plot-histogram', 'histogram')
  const downloadFigureThreePNG = () => downloadGraph('plot-demographic', 'histogram')

  const downloadFigureOneButton = document.getElementById(
    "downloadFigureOnePNG"
  );

  if (downloadFigureOneButton) {
    downloadFigureOneButton.addEventListener("click", downloadFigureOnePNG);
    state.downloadGraphRef.pngFigureOneButton = downloadFigureOneButton
    state.downloadGraphRef.pngFigureOneCallback = downloadFigureOnePNG
  }


  const downloadFigureTwoButton = document.getElementById(
    "downloadFigureTwoPNG"
  );

  if (downloadFigureTwoButton) {
    downloadFigureTwoButton.addEventListener("click", downloadFigureTwoPNG);
    state.downloadGraphRef.pngFigureTwoButton = downloadFigureTwoButton
    state.downloadGraphRef.pngFigureTwoCallback = downloadFigureTwoPNG
  }

  const downloadFigureThreeButton = document.getElementById(
    "downloadFigureThreePNG"
  );

  if (downloadFigureThreeButton) {
    downloadFigureThreeButton.addEventListener("click", downloadFigureThreePNG);
    state.downloadGraphRef.pngFigureThreeButton = downloadFigureThreeButton
    state.downloadGraphRef.pngFigureThreeCallback = downloadFigureThreePNG
  }
}

function statePropertyName(operation, field) {
  return operation + field[0].toUpperCase() + field.slice(1)
}
