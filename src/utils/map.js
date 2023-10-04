import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";
import {
  hookDemographicInputs,
  syncDataDependentInputs,
  mapStateAndCounty,
  COMPARABLE_FIELDS,
  SELECTABLE_FIELDS,
} from "./demographicControls.js";
import { getQueryParams, sort } from "../shared.js";
import { State } from "./DynamicState2.js";
import { hookInputActivation, hookSelect, hookCheckbox } from "./input.js";
import { insertParamsToUrl } from "../shared.js";
import { addPopperTooltip, addTooltip, toggleSidebar, downloadStringAsFile } from "./helper.js";
import { createChoroplethPlot } from "./mapPlots.js";
import { colorRampLegendMeanDiverge, dataToTableData } from "./helper.js";
import { downloadHtmlAsImage } from "./download.js";
import { DataTable } from 'https://cdn.jsdelivr.net/npm/simple-datatables@8.0.0/+esm';



let state;
let params = getQueryParams(window.location.search);


// Static
const LEVELS = ["state", "county"];
const YEARS = ["2018", "2019", "2020", "2018-2020"];
const SEARCH_SELECT_INPUT_QUERIES = [
  {
    key: "#causeSelectSelect",
    options: {
      sorter: sort
    },
  },
  {
    key: "#stateSelectSelect",
    options: {
      sorter: sort
    },
  },
  {
    key: "#countySelectSelect",
    options: {
      sorter: (items = []) => {
        const groupBy = (input, key) => input.reduce((acc, currentValue) => {
            (acc[currentValue[key]] ??= []).push(currentValue);
            return acc;
        }, {})
        const groupByDisabledItems = groupBy(items, 'disabled')

        return [...sort(groupByDisabledItems['false']), ...sort(groupByDisabledItems['true'])]
      },
    },
  }
];

export async function start() {
  toggleLoading(true);


  state = new State();
  state.defineDynamicProperty("data", []);
  state.defineDynamicProperty("mapZoom", 1);

  hookInputs();
  await initialDataLoad();

  state.comparePrimaryOptions = COMPARABLE_FIELDS;


  state.addListener(() => {
    loadData(state.selectYear);
    insertParamsToUrl("year", state.selectYear);
  }, "selectYear");

  state.addListener(() => {
    queryData();
    update();
  }, "data");

  state.addListener(() => {
    update();
  }, "scheme");

  state.addListener(
    () => {
      // state.selectState = "all";
      // state.selectCounty = "all";
      // if (getQueryParams(window.location.search).state) {
      //   state.selectState = getQueryParams(window.location.search).state;
      // }
      // $("#stateSelectSelect").val("all").trigger("change");
      // if (state.level === "county") {
      //   $("#countySelectSelect").val("all").trigger("change");
      // }

      // const countySelectElement = document.querySelector("#county-wrapper");
      // if (countySelectElement) {
      //   countySelectElement.style.display =
      //     state.level === "county" ? "block" : "none";
      // }

      queryData();
      syncDataDependentInputs(state);
      update();
    },
    "comparePrimary",
    "compareSecondary",
    "selectCause",
    "selectSex",
    "selectRace",
    "measure",
    "level"
  );

  // state.addListener(
  //   () => {
  //     if (state.comparePrimary == "race") {
  //       console.log(" === Update Compare Primary Race ===")
  //       state.selectRace = "all"
  //     }
  //   },
  //   "comparePrimary",
  //   "compareSecondary",
  // );

  state.addListener(() => {
    const { selectState, countyGeo, selectCounty } = state;
    queryData(selectState);
    if (state.level === "county") {
      $("#countySelectSelect").val("all").trigger("change");
    }

    const counties =
      selectState === "all"
        ? countyGeo.features
        : countyGeo.features.filter(
            (county) => county.state?.id === selectState
          );

      const countyOptions = [{
        text: 'All',
        value: 'all'
      }, ...counties.map((feature) => {
          const hasData = state.countySet.has(feature.id)
          const stateName = typeof feature.state?.name !== 'undefined' ? feature.state.name : '-'
          return {
            text: feature.properties.name + ', ' + stateName,
            value: feature.id,
            hasData: !!hasData
          }
        })]
    state.countyGeoMap = countyOptions;
    state.selectCountyOptions = countyOptions;

    update();
    state.plotHighlight = selectState !== "all" ? selectState : null;

    // Zoom to area
    if (state.selectState != "all") {
      const targetElement = d3
        .select(state.choroplethPlot)
        .select("#area-" + state.selectState)
        .node();

      if (targetElement) {
        zoomToElement(state.pz, state.choroplethPlot, targetElement, 0.6);
      }
    }
    insertParamsToUrl("state", state.selectState);
  }, "selectState");

  state.addListener(() => {
    const { selectCounty, selectState } = state;
    queryData(selectState, selectCounty);
    update();
    //updateMapTitle();
    state.plotHighlight =
      selectCounty !== "all"
        ? selectCounty
        : selectState !== "all"
        ? selectState
        : null;

    if (state.selectCounty != "all") {
      const targetElement = d3
        .select(state.choroplethPlot)
        .select("#area-" + state.selectCounty)
        .node();

      if (targetElement) {
        zoomToElement(state.pz, state.choroplethPlot, targetElement, 0.2);
      }
    }
    insertParamsToUrl("county", selectCounty);
  }, "selectCounty");

  state.inputsActive = true;
  state.comparePrimary = "race";
  if (params.comparePrimary) {
    state.comparePrimary = params.comparePrimary;
  }

  toggleSidebar();
  addGroupDownloadButton(document.getElementById("group-download-container"), {data: state.mapData}, false)
}

function plotTable() {
  const tableContainer = document.getElementById("table-container")
  tableContainer.innerHTML = ``
  new DataTable(tableContainer, {
    data: dataToTableData(state.mapData),
    perPage: 20,
    perPageSelect: [20, 40, 60, 80, 100, ["All", -1]]
  })
    
}

function update() {
  toggleLoading(false);

  state.featureCollection = state.level == "county" ? state.countyGeo : state.stateGeo;

  // For the map plotting, defer if the map grid is not currently being show (to ensure layout is correct).
  const plotFunction = () => plotMapGrid(state.mapData, state.comparePrimary != "none" ? state.comparePrimary : null, 
    state.compareSeconday != "none" ? state.compareSecondary : null)
  if (state.plotMode == "map") {
    plotFunction()
  } else {
    state.deferPlotFunction = plotFunction
  }

  plotTable()

  // let valuesPrimary = null;
  // let valuesSecondary = null; 

  // if (state.comparePrimary) {
  //   valuesPrimary = [...new Set(state.mapData.map(d => d[state.comparePrimary]))]
  // }
  // if (state.compareSecondary) {
  //   valuesSecondary = [...new Set(state.mapData.map(d => d[state.compareSecondary]))]
  // }

  // const mapsContainer = document.getElementById("maps-container")

  // console.log(state.comparePrimary, state.mapData, valuesPrimary)
  // if (valuesPrimary) {
  //   for (const value of valuesPrimary) {
  //     const subMapData = state.mapData.filter(d => d[state.comparePrimary] == value)
  //     console.log("Draw map", value, subMapData, state.featureCollection, {
  //       indexField:  state.level + "_fips",
  //       measureField: state.measure,
  //       scheme: state.scheme,
  //       overlayFeatureCollection: state.stateGeo,
  //     })

  //     const {plot} = createChoroplethPlot(
  //       subMapData,
  //       state.featureCollection,
  //       {
  //         indexField:  state.level + "_fips",
  //         measureField: state.measure,
  //         scheme: state.scheme,
  //         overlayFeatureCollection: state.stateGeo,
  //       }
  //     );

  //     mapsContainer.appendChild(plot);
  //   }
  // }
}

function generateCombinations(arr1, arr2, varName1, varName2) {
  const combinations = [];

  for (let i = 0; i < arr1.length; i++) {
    for (let j = 0; j < arr2.length; j++) {
      const obj = {};
      obj[`${varName1}Value`] = arr1[i];
      obj[`${varName1}Index`] = i;
      obj[`${varName2}Value`] = arr2[j];
      obj[`${varName2}Index`] = j;
      combinations.push(obj);
    }
  }

  return combinations;
}

function plotMapGrid(data, rowField, columnField) {

  // let currentData;
  // if (state.selectCounty != "All") {
  //   currentData = data.filter(d => d.county_fips == state.selectCounty)
  // } else if (state.selectState != "All") {
  //   //currentData = data.filter(d => d.county_fips.startsWith())
  // }

  let valuesRow = ["All"]
  let valuesColumn = ["All"]

  if (rowField) {
    valuesRow = [...new Set(data.map(d => d[rowField]))]
  }
  if (columnField) {
    valuesColumn = [...new Set(data.map(d => d[columnField]))]
  }

  const mapConfigs = generateCombinations(valuesRow, valuesColumn, "row", "column")
  mapConfigs.forEach(config => {
    config.rowIndex = config.rowIndex + 1 
    config.columnIndex = config.columnIndex + 1
    config.data = data.filter(d => 
      (d[rowField] == config.rowValue || !rowField) && 
      (d[columnField] == config.columnValue || !columnField))
  })

  const nRows = Math.max(valuesColumn.length, 1)
  const nColumns = Math.max(valuesColumn.length, 1)

  const mapsContainer = document.getElementById("maps-container")
  state.mapsContainer = mapsContainer
  mapsContainer.innerHTML = ``
  //mapsContainer.style.display = 'grid';
  mapsContainer.style.gridTemplateRows = `repeat(${rowField ? nRows + 1 : nRows}, auto)`; 
  mapsContainer.style.gridTemplateColumns = `repeat(${columnField ? nColumns + 1 : nColumns}, auto)`;

  if (rowField != "none") {
    valuesRow.forEach((value,i) => {
      const label = document.createElement("div")
      label.classList.add("map-grid-label")
      label.classList.add("map-grid-cell")
      label.innerText = value 
      label.style.gridRow = `${i+2}`
      label.style.gridColumn = `1`
      mapsContainer.appendChild(label)
    })
  }

  if (columnField  != "none") {
    valuesColumn.forEach((value,i) => {
      const label = document.createElement("div")
      label.classList.add("map-grid-label")
      label.classList.add("map-grid-cell")
      label.innerText = value 
      label.style.gridColumn = `${i+2}`
      label.style.gridRow = ``
      mapsContainer.appendChild(label)
    })
  }

  const bbox = mapsContainer.getBoundingClientRect()
  const mapWidth = 0.9 * bbox.width / nColumns

  const mean = d3.mean(data, d => d[state.measure])
  const domain = d3.extent(data, d => d[state.measure])

  const baseHistogramConfig = {
    options: {
      width: 140,
      height: 60,
      margin: 15,
      x: {ticks: domain, label: null, tickSize:0, tickPadding: 4},
      y: {ticks: [], label: null, margin: 0},
      style: {
        background: 'none',
        color: 'black',
      }
    },
    marks: [
      Plot.rectY(data, Plot.binX({y: "count"}, {x: state.measure, thresholds: 16, fill: "#c3d1c0"})),
    ]
  }

  let sharedColorLegend = colorRampLegendMeanDiverge(
    data.map(d => d[state.measure]), state.scheme, state.measure, null, true)

  let mainFeatureCollection = state.featureCollection; 
  let overlayFeatureCollection = state.stateGeo;
  if (state.selectCounty != "all") {
    mainFeatureCollection = 
      {type: "FeatureCollection", features: state.featureCollection.features.filter(d => d.id == state.selectCounty)}
    overlayFeatureCollection = 
      {type: "FeatureCollection", features: state.featureCollection.features.filter(d => d.id == state.selectCounty)}
  } else if (state.selectState != "all") {
    mainFeatureCollection = 
      {type: "FeatureCollection", features: state.featureCollection.features.filter(d => d.id.slice(0,2) == state.selectState)}
    overlayFeatureCollection = 
      {type: "FeatureCollection", features: state.stateGeo.features.filter(d => d.id == state.selectState)}
  }
  
  

  for (const config of mapConfigs) {
    const mapDiv = document.createElement("div")
    mapDiv.style.position = "relative"

    mapDiv.classList.add("map-grid-cell")
    //mapDiv.innerText = `[${config.rowValue}, ${config.columnValue}]`
    mapDiv.style.gridRow = `${(config.rowIndex ?? 1)+1} `
    mapDiv.style.gridColumn = `${(config.columnIndex ?? 1)+1}`

    // const plotToolbar = document.createElement("div")
    // plotToolbar.style.position = "absolute"
    // plotToolbar.style.top = "5px"
    // plotToolbar.style.right = "5px"
    // const downloadDropdown = document.createElement("div")
    // downloadDropdown.classList.add("dropdown")
    // plotToolbar.appendChild(downloadDropdown)
    // const downloadButton = document.createElement("button")
    // downloadButton.innerHTML = "Download"
    // downloadButton.className = "transparent-btn form-control dropdown-toggle dropdown-btn"
    // downloadDropdown.appendChild(downloadButton)

    const {plot, colorLegend} = createChoroplethPlot(
      config.data,
      mainFeatureCollection,
      {
        indexField:  state.level + "_fips",
        measureField: state.measure,
        scheme: state.scheme,
        overlayFeatureCollection: overlayFeatureCollection,
        width: mapWidth,
        color: {pivot:mean, domain}
      }
    );

    mapDiv.appendChild(plot);
    addIndividualDownloadButton(mapDiv, config)
    mapsContainer.appendChild(mapDiv)

    addChoroplethInteractivity(plot, mapDiv, config, baseHistogramConfig, mainFeatureCollection)
  }

  const legendDiv = document.createElement("div")
  legendDiv.classList.add("legend-wrapper")
  legendDiv.appendChild(sharedColorLegend)
  // sharedColorLegend.style.border = "1px solid grey"
  // sharedColorLegend.style.borderRadius = "3px"
  // sharedColorLegend.style.background = "white"
  // sharedColorLegend.style.padding = "10px"
  document.getElementById("color-legend").style.top = "5px"
  document.getElementById("color-legend").innerHTML = ``
  document.getElementById("color-legend").appendChild(legendDiv)


}

function createMapDownloadButton() {

  const buttonElement = createDownloadButton(true)
  buttonElement.style.position = "absolute"

  
  buttonElement.style.top = "5px"
  buttonElement.style.right = "5px"

  return buttonElement

}

function createDownloadButton(small=true){ 
  const template = /*html*/`<div class="dropdown d-flex justify-content-end">
  <button id="download-button" class="btn ${small ? "btn-sm" : ""} btn-outline-secondary dropdown-toggle" 
    type="button" data-bs-toggle="dropdown" aria-expanded="false">
    ${small ? "" : "<span class='me-1'>Download</span>"}
    <span class="download-icon">
      <i class="fas fa-download" style="color:#000000 !important"></i>
    </span>
  </button>
  <ul class="dropdown-menu dropdown-menu-end">
      <li><a id="download-data-csv" class="dropdown-item download-item">Download Data (CSV)</a></li>
      <li><a id="download-plot-png" class="dropdown-item download-item">Download Plot (PNG)</a></li>
      <!--<li><a id="download-plot-svg" class="dropdown-item download-item">Download Plot (SVG)</a></li>-->
  </ul>
</div>`

const tempDiv = document.createElement("div")
tempDiv.innerHTML = template
const buttonElement = tempDiv.firstChild

return buttonElement 

  //element.style.paddingTop = "20px"


}

function addIndividualDownloadButton(element, config) {
  const buttonElement = createMapDownloadButton(true) 

  const baseFilename = ["epitracker_map_data", config.rowValue, config.columnValue].filter(d => d).join("_")

  buttonElement.querySelector("#download-data-csv").addEventListener("click", () => {
    const filename = baseFilename + ".csv"
    const content = d3.csvFormat(prepareDataForDownload(config.data))
    downloadStringAsFile(content, filename, "text/csv")
  })

  buttonElement.querySelector("#download-plot-png").addEventListener("click", () => {
    const filename = baseFilename + ".png"
    const downloadElement = prepareMapElementForDownload(element, config)

    const tempWrapper = document.createElement("div")
    tempWrapper.style.opacity = "0"
    tempWrapper.style.position = "absolute"
    tempWrapper.appendChild(downloadElement)
    state.mapsContainer.appendChild(tempWrapper)

    downloadHtmlAsImage(downloadElement, filename)
  })

  element.appendChild(buttonElement)
}

function addGroupDownloadButton(element) {
  const buttonElement = createDownloadButton(false) 

  const baseFilename = "epitracker_map_data"

  buttonElement.querySelector("#download-data-csv").addEventListener("click", () => {
    const filename = baseFilename + ".csv"
    const content = d3.csvFormat(prepareDataForDownload(state.mapData))
    downloadStringAsFile(content, filename, "text/csv")
  })

  buttonElement.querySelector("#download-plot-png").addEventListener("click", () => {
    const filename = baseFilename + ".png"

    const maps = document.getElementById("maps-container")
    
    console.log({maps});
    // const downloadElement = document.createElement("div")
    // downloadElement.appendChild(maps)
    // downloadElement.appendChild(element.cloneNode(true))

    // const tempWrapper = document.createElement("div")
    // tempWrapper.style.opacity = "0"
    // tempWrapper.style.position = "absolute"
    // tempWrapper.appendChild(downloadElement)
    // state.mapsContainer.appendChild(downloadElement)

    downloadHtmlAsImage(maps, filename)
    
  })

  // TODO: Remove when dashboard PNG feature is implemented
  // buttonElement.querySelector("#download-plot-png").classList.add("disabled")
  
  element.appendChild(buttonElement)
}

function toggleLoading(loading) {
  if (loading) {
    document.getElementById("plots-container").style.visibility = "hidden";
    document.getElementById("loader-container").style.visibility = "visible";
  } else {
    document.getElementById("plots-container").style.visibility = "visible";
    document.getElementById("loader-container").style.visibility = "hidden";
  }
}

async function initialDataLoad() {
  if (params.race) {
    state.selectRace = params.race;
  }
  if (params.sex) {
    state.selectSex = params.sex;
  }
  if (params.cause) {
    state.selectCause = params.cause;
  }

  state.conceptMappings = await d3.json("data/conceptMappings.json");
  const stateGeo = await d3.json("data/states.json");
  const countyGeo = await d3.json("data/counties.json");

  state.stateGeo = stateGeo;
  state.countyGeo = countyGeo;

  await loadData("2020");

  state.countySet = new Set(state.data.map((item) => item.county_fips));
  state.countyGeoMap = [
    {
      text: "All",
      value: "all",
    },
    ...countyGeo.features.map((feature) => {
      const hasData = state.countySet.has(feature.id);
      const stateName =
        typeof feature.state?.name !== "undefined" ? feature.state.name : "-";

      return {
        text: feature.properties.name + ", " + stateName,
        value: feature.id,
        hasData: hasData,
      };
    }),
  ];
  state.stateGeoMap = [
    {
      text: "All",
      value: "all",
    },
    ...stateGeo.features.map((feature) => ({
      text: feature.properties.name,
      value: feature.id,
    })),
  ];

  const causeDictData = await d3.csv("data/icd10_39recode_dict.csv");

  state.dictionary = await d3.json("data/dictionary.json");
  state.causeMap = new Map([
    ["All", "All"],
    ...causeDictData.map((row) => [row.code, row.abbr]),
  ]);

  if (params.measure) {
    state.measure = params.measure;
  }

  if (params.level) {
    state.level = params.level;
  }

  //  Update the input state
  state.measureOptions = state.conceptMappings.measureOptions;
  state.levelOptions = LEVELS;
  state.selectYearOptions = YEARS;
  state.selectStateOptions = state.stateGeoMap;
  state.selectCountyOptions = state.countyGeoMap;
  state.isSelectedStateCounty = false;
  state.scheme = "RdYlBu";
  state.schemeOptions = [
    ...Object.entries(state.conceptMappings.colorSchemes),
  ].map(([k, v]) => ({ text: v, value: k }));
}

async function loadData(year) {
  const urlQueryYear = getQueryParams(window.location.search).year;
  if (urlQueryYear) {
    state.selectYear = getQueryParams(window.location.search).year;
  }
  toggleLoading(true);
  const { measureOptions } = state.conceptMappings;

  let data = await d3.csv(`data/mortality_data/age_adjusted_data_${year}.csv`);
  data = data.map((row) => {
    measureOptions.forEach(
      (field) => (row[field.name] = parseFloat(row[field.name]))
    );
    const { stateName, countyName } = mapStateAndCounty(
      row["state_fips"],
      row["county_fips"],
      state
    );

    return { ...row, state: stateName, county: countyName };
  });

  state.data = [...data] || [];
  if (state.data) {
    state.dataMap = d3.group(
      state.data,
      (d) => d.state_fips,
      (d) => d.county_fips
    );
  }
  return data;
}

function hookInputs() {
  state.defineDynamicProperty("level", "county");

  hookDemographicInputs(state, SEARCH_SELECT_INPUT_QUERIES);
  hookInputActivation(
    [
      "#comparePrimarySelect",
      "#compareSecondarySelect",
      "#yearSelectSelect",
      "#causeSelectSelect",
      "#sexSelectSelect",
      "#raceSelectSelect",
      "#measureSelect",
      "#levelSelect",
      "#schemeSelect",
      "#stateSelectSelect",
      "#countySelectSelect",
    ],
    state,
    "inputsActive"
  );

  hookSelect("#measureSelect", state, "measureOptions", "measure");
  hookSelect("#levelSelect", state, "levelOptions", "level");
  hookSelect("#schemeSelect", state, "schemeOptions", "scheme");
  hookSelect(
    "#stateSelectSelect",
    state,
    "selectStateOptions",
    "selectState",
    true
  );
  hookSelect(
    "#countySelectSelect",
    state,
    "selectCountyOptions",
    "selectCounty",
    true
  );

  const mapNavLink = document.getElementById("map-nav-link")
  const tableNavLink = document.getElementById("table-nav-link")

  state.defineDynamicProperty("plotMode", "map")
  state.addListener(() => {
    if (state.plotMode == "map") {
      tableNavLink.classList.remove("active")
      mapNavLink.classList.add("active")
      document.getElementById("maps-container").style.display = "grid"
      document.getElementById("table-container").style.display = "none"

      if (state.deferPlotFunction) {
        state.deferPlotFunction()
        state.deferPlotFunction = null
      }
    } else if (state.plotMode == "table") {
      mapNavLink.classList.remove("active")
      tableNavLink.classList.add("active")
      document.getElementById("maps-container").style.display = "none"
      document.getElementById("table-container").style.display = "block"
    }
  }, "plotMode")



  mapNavLink.addEventListener("click", () => {
    state.plotMode = "map"
  })

  tableNavLink.addEventListener("click", () => {
    state.plotMode = "table"
  })

}

function queryData(stateFips, countyFips) {
  //  Get data for map

  let mapData = [...state.data]

  const stratifySet = new Set(
    [state.comparePrimary, state.compareSecondary].filter((d) => d != "none")
  );
  SELECTABLE_FIELDS.forEach((field) => {
    if (stratifySet.has(field)) {
      mapData = mapData.filter(
        (row) => row[field] != "All"
      );
    } else {
      mapData = mapData.filter(
        (row) => row[field] == state[statePropertyName("select", field)]
      );
    }
  });

  const geoField = state.level + "_fips"
  if (state.level == "county") {
    mapData = mapData.filter((d) => d.county_fips != "All");
    mapData = mapData.filter((d) => d.state_fips == "All");
  } else {
    mapData = mapData.filter((d) => d.county_fips == "All");
    mapData = mapData.filter((d) => d.state_fips != "All");
  }
  mapData = mapData.filter((row) => Number.isFinite(row[state.measure]));
  // if (stateFips && stateFips !== "All") {
  //   mapData = mapData.filter((row) => row[`state_fips`] === stateFips);
  // }
  // if (countyFips && countyFips !== "All") {
  //   mapData = mapData.filter((row) => row[`county_fips`] === countyFips);
  // }
 
  if (state.selectCounty != "all"){
    mapData = mapData.filter(d => d.county_fips == state.selectCounty)
  } else if (state.selectState != "all") {
    if (state.level == "county") {
      mapData = mapData.filter(d => d.county_fips.slice(0,2) == state.selectState)
    } else {
      mapData = mapData.filter(d => d.state_fips == state.selectState)
    }
  }
  
  state.mapData = mapData;
  state.mapDataGeoMap = d3.group(state.mapData, d => d[geoField])
}
  

function statePropertyName(operation, field) {
  return operation + field[0].toUpperCase() + field.slice(1);
}

function addChoroplethInteractivity(plot, plotContainer, config, baseHistogramConfig, featureCollection) {
  const indexField = state.level + "_fips";
  const spatialDataMap = d3.index(config.data, (d) => d[indexField]);

  const plotSelect = d3.select(plot);

  const gSelect = d3.select(
    plotSelect.selectAll("g[aria-label='geo'").nodes()[0]
  );

  const geoSelect = gSelect.selectAll("path");

  const tooltip = addPopperTooltip(plotContainer);

  const previousStroke = null;
  gSelect.on("mouseleave.interact", () => {
    if (!state.isSelectedStateCounty) {
      state.plotHighlight =
        state.selectCounty !== "all"
          ? state.selectCounty
          : state.selectState !== "all"
          ? state.selectState
          : null;
    }
    tooltip.hide();
  });

  geoSelect
    .on("mouseover.interact", (e, d) => {
      const feature = featureCollection.features[d];
      state.plotHighlight = feature.id;
      d3.select(e.target)
        .attr("stroke", "mediumseagreen")
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", 3)
        .raise();

      const row = spatialDataMap.get(feature.id);

      const div = document.createElement('div')
      div.style.display = "flex"
      div.style.flexDirection = "column"
      div.style.justifyContent = "space-between"
      
      const infoDiv =  document.createElement('div')
      infoDiv.style.display = "flex"
      infoDiv.style.justifyContent = "space-between"
      infoDiv.style.gap = "10px"
      infoDiv.innerHTML = `<b>${feature.properties.name}, 
      ${state.conceptMappings.states[feature.id.slice(0, 2)].short}</b>${row[state.measure].toFixed(2)}`
      
      div.appendChild(infoDiv)
      
      const histogramOptions = baseHistogramConfig.options
      histogramOptions.marks = [...baseHistogramConfig.marks]

      const otherRows = state.mapDataGeoMap.get(feature.id).filter(d => d != row)
      histogramOptions.marks.push(Plot.dot(otherRows, {
        x: state.measure, y: 0, stroke: "red", r:2, strokeWidth: 1}))
      //histogramOptions.marks.push(Plot.ruleX(state.mapDataGeoMap.get(feature.id).map(d => d[state.measure]), {stroke: "pink", strokeWidth: 1}))
      histogramOptions.marks.push(Plot.ruleX([row[state.measure]], {stroke: "red", strokeWidth: 1.5}))
      div.appendChild(Plot.plot(histogramOptions))

      tooltip.show(e.target, div);
    })
    .on("mouseleave.interact", (e, d) => {
      d3.select(e.target)
        .attr("stroke", previousStroke)
        .attr("stroke-width", 0.5)
        .raise();
    });

  state.defineDynamicProperty("plotHighlight");
}

function prepareDataForDownload(data) {
  // More readable, appropriate data for download. // TODO: Finish.


  const outputData = []
  for (const row of data) {
    const outputRow = {...row}
    for (const geoField of ["state", "state_fips", "county", "county_fips"]) {
      if (outputRow[geoField] == "All") {
        delete outputRow[geoField]
      }
    }
    outputData.push(outputRow)
  }

  return outputData
}

function prepareMapElementForDownload(element, config) {
  // TODO: Better mapping to human readable names for a cleaner title.

  const legend = document.getElementById("color-legend").cloneNode(true)

  const stratifications = [config.rowValue, config.columnValue].filter(d => d)
  const cause = state.selectCause == "All" ? "All Cancers" : state.selectCause
  const title = `${state.measure} | ${stratifications.join(", ")} | ${cause}`
  const titleDiv = document.createElement("div")
  titleDiv.innerText = title
  
  const div = document.createElement("div")
  div.appendChild(titleDiv)
  div.appendChild(legend)
  div.appendChild(element.querySelector("svg").cloneNode(true))

  return div 
}