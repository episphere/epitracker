import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import panzoom from 'https://cdn.jsdelivr.net/npm/panzoom@9.4.3/+esm';

import { State } from "./DynamicState2.js";
import {
  hookDemographicInputs,
  syncDataDependentInputs,
  mapStateAndCounty,
  COMPARABLE_FIELDS,
  SELECTABLE_FIELDS,
} from "./demographicControls.js";
import { hookInputActivation, hookSelect, hookCheckbox } from "./input.js";
import {
  createChoroplethPlot,
  createDemographicsPlot,
  createHistogramPlot,
} from "./mapPlots.js";
import { addPopperTooltip, addTooltip, toggleSidebar } from "./helper.js";
import { paginationHandler, dataPagination } from "../components/pagination.js";
import { renderTable } from "../components/table.js";
import { sort } from "../shared.js";
import { downloadGraph, downloadFiles } from "./download.js";
import { zoomSVG } from "./svgZoom.js";

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
      sorter: sort
    },
  }
];

// Note: Using standard object properties unless listeners required

let state;

function changeMapZoomRange() {
  const element = document.querySelector('#plot-map-zoom')
  if (!element) return;

  // element.addEventListener('change', (e) => console.log('range changed: ', {e}))
  element.onchange = ({target}) => {
    const parentElement = target.parentElement
    const labelElement = parentElement.querySelector('strong')
    labelElement.innerText = target.value
  }
}

function zoomToElement(pz, svg, targetElement, scale=.9) {
  const bbox = svg.getBBox()
  const svgCentroid = [bbox.x+bbox.width/2, bbox.y+bbox.height/2]
  const maxSvgDim = bbox.height//Math.max(bbox.width, bbox.height)
  
  const targetBbox = targetElement.getBBox()
  const targetMaxDim = targetBbox.height//Math.max(targetBbox.width, targetBbox.height)
  const pos = [targetBbox.x+targetBbox.width/2, targetBbox.y+targetBbox.height/2]
  pz.zoomAbs(0,0,1)
  pz.moveTo(0,0)
  pz.moveTo(svgCentroid[0]-pos[0], svgCentroid[1]-pos[1])
  pz.zoomAbs(bbox.width/2,bbox.height/2,maxSvgDim/targetMaxDim * scale)
}

export async function start() {
  toggleLoading(true);
  changeMapZoomRange()

  state = new State();
  state.defineDynamicProperty("data", []);
  state.defineDynamicProperty("mapZoom", 1);

  hookInputs();
  await initialDataLoad();

  state.comparePrimaryOptions = COMPARABLE_FIELDS;

  state.downloadGraphRef = {
    pngFigureOneButton: null,
    pngFigureOneCallback: null,
    pngFigureTwoButton: null,
    pngFigureTwoCallback: null,
    pngFigureThreeButton: null,
    pngFigureThreeCallback: null,
    pngAllFiguresButton: null,
    pngAllFiguresCallback: null,
  };

  state.addListener(() => {
    loadData(state.selectYear);
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
      state.selectState = 'all'
      state.selectCounty = 'all'
      $("#stateSelectSelect").val('all').trigger('change');
      if (state.level === 'county') {
        $("#countySelectSelect").val('all').trigger('change');
      }

      const countySelectElement = document.querySelector('#county-wrapper')
      if (countySelectElement) {
        countySelectElement.style.display = state.level === 'county' ? 'block' : 'none';
      }


      queryData();
      syncDataDependentInputs(state);
      update();
      updateMapTitle();
      
      
    },
    "comparePrimary",
    "compareSecondary",
    "selectCause",
    "selectSex",
    "selectRace",
    "measure",
    "level"
  );

  state.addListener(() => {
    const {selectState, countyGeo, selectCounty} = state
    queryData(selectState);
    if (state.level === 'county') {
      $("#countySelectSelect").val('all').trigger('change');
    }
    
    const counties = selectState === 'all' ? 
      countyGeo.features : 
      countyGeo.features.filter(county => county.state?.id === selectState)

    const countyOptions = [{
      text: 'All',
      value: 'all'
    }, ...counties.map((feature) => {
      const hasData = state.mapData.find(item => item.county_fips === feature.id)
      const stateName = typeof feature.state?.name !== 'undefined' ? feature.state.name : '-'
      return {
        text: feature.properties.name + ', ' + stateName,
        value: feature.id,
        hasData: !!hasData
      }
    })]
    state.countyGeoMap = countyOptions
    state.selectCountyOptions = countyOptions


    
    update();
    updateMapTitle();
    state.plotHighlight = selectState !== 'all' ? selectState : null

    // Zoom to area
    if (state.selectState != "all") {
    const targetElement = d3.select(state.choroplethPlot)
        .select("#area-"+state.selectState).node()

      if (targetElement) {
        zoomToElement(state.pz, state.choroplethPlot, targetElement, .6)
      }
    }
  }, 'selectState')

  state.addListener(() => {
    const {selectCounty, selectState} = state
    queryData(selectState, selectCounty);
    update();
    updateMapTitle();
    state.plotHighlight = selectCounty !== 'all' ? selectCounty : selectState !== 'all' ? selectState : null

    if (state.selectCounty != "all") {
      const targetElement = d3.select(state.choroplethPlot)
        .select("#area-"+state.selectCounty).node()

      if (targetElement) {
        zoomToElement(state.pz, state.choroplethPlot, targetElement, .2)
      }
    }
  }, 'selectCounty')


  state.inputsActive = true;
  state.comparePrimary = "race";

  toggleSidebar("plot-map");

  const driver = window.driver.js.driver;
  const driverObj = driver({
    overlayColor: 'rgba(0,0,0,0)'
  });
  driverObj.highlight({
    element: "#plot-map",
    popover: {
      title: "Map",
      description: "This is a map visualization",
      side: "top",
      align: 'center'
    }
  });
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

function updateMapTitle() {
  if (!state?.properties) return;

  const mapSelectionElements = document.querySelectorAll("[data-map-item]");

  mapSelectionElements.forEach((element) => {
    const { mapItem, optionsKey } = element.dataset;
    let mapItemValue = state.properties[mapItem];
    if (optionsKey) {
      const options = state.properties[optionsKey];
      const selectedOption = options.find(
        (option) => option.value === mapItemValue
      );
      if (selectedOption) {
        mapItemValue = selectedOption.text;
      }
    }

    element.innerHTML = mapItemValue;
  });
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
  hookSelect("#stateSelectSelect", state, "selectStateOptions", "selectState", true)
  hookSelect("#countySelectSelect", state, "selectCountyOptions", "selectCounty", true)
  

  hookCheckbox("#showTableCheck", state, "showTable");
  state.addListener(() => {
    document.getElementById("map-table-wrapper").style.display = state.showTable
      ? "block"
      : "none";
  }, "showTable");
}

function queryData(stateFips, countyFips) {
  //  Get data for map

  let mapData = [...state.data].filter(
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
  mapData = mapData.filter((row) => Number.isFinite(row[state.measure]));
  if (stateFips && stateFips !== 'all') {
    mapData = mapData.filter((row) => row[`state_fips`] === stateFips)
  }

  if (countyFips && countyFips !== 'all') {
    mapData = mapData.filter((row) => row[`county_fips`] === countyFips)
  }
  
  state.mapData = [...mapData];
  // Get data for demographic plot

  state.demographicData = getDemographicData();
}

function getDemographicData(highlight = null) {
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
    [state.comparePrimary, state.compareSecondary].filter((d) => d != "none")
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

  return demographicData;
}

function addPlotInteractivity() {
  const indexField = state.level + "_fips";
  const spatialDataMap = d3.index(state.mapData, (d) => d[indexField]);

  const plotSelect = d3.select(state.choroplethPlot);

  const gSelect = d3.select(
    plotSelect.selectAll("g[aria-label='geo'").nodes()[0]
  );

  const geoSelect = gSelect.selectAll("path");

  const tooltip = addPopperTooltip(document.getElementById("plot-map"));

  const previousStroke = null;
  gSelect.on("mouseleave.interact", () => {
    if (!state.isSelectedStateCounty) {
      state.plotHighlight = state.selectCounty !== 'all' ? 
        state.selectCounty : 
        state.selectState !== 'all' ? 
          state.selectState : 
          null;
    }
    tooltip.hide();
  });

  // TODO: it called after right click on map
  // geoSelect.on("contextmenu.interact", (e, d) => {
  //   console.log('click clicked', {e, d, fc: state.featureCollection.features[d]})
  // })

  geoSelect
    .on("mouseover.interact", (e, d) => {
      const feature = state.featureCollection.features[d];
      state.plotHighlight = feature.id;
      d3.select(e.target)
        .attr("stroke", "mediumseagreen")
        .attr("stroke-opacity", 0.6)
        .attr("stroke-width", 3)
        .raise();

      const row = spatialDataMap.get(feature.id);
      const text = `
        <b>${feature.properties.name}, ${
        state.conceptMappings.states[feature.id.slice(0, 2)].short
      }</b></br>
        ${row[state.measure].toFixed(2)}
      `;

      tooltip.show(e.target, text);
    })
    .on("mouseleave.interact", (e, d) => {
      d3.select(e.target)
        .attr("stroke", previousStroke)
        .attr("stroke-width", 0.5)
        .raise();
    });

  state.defineDynamicProperty("plotHighlight");
  state.addListener(() => {
    updateSidePlots();
  }, "plotHighlight");
}

function update() {
  const indexField = state.level + "_fips";

  state.featureCollection =
    state.level == "county" ? state.countyGeo : state.stateGeo;
  const choroplethFigure = createChoroplethPlot(
    state.mapData,
    state.featureCollection,
    {
      indexField,
      measureField: state.measure,
      scheme: state.scheme,
      overlayFeatureCollection: state.stateGeo,
    }
  );
  const choropleth = choroplethFigure.plot;
  const figure = choroplethFigure.figure;

  state.pz = panzoom(choroplethFigure.plot)

  const mapPlotContainer = document.getElementById("plot-map");
  mapPlotContainer.innerHTML = "";
  mapPlotContainer.appendChild(figure);

  state.choroplethPlot = choropleth;
  updateSidePlots(indexField);

  addPlotInteractivity();

  downloadMapGraphs();

  downloadFiles(state.mapData, "first_data");
  renderTable("map-table", dataPagination(0, 200, state.mapData));
  paginationHandler(state.mapData, 200);

  updateMapTitle();

  toggleLoading(false);

  // const svgImage = document.querySelector('#plot-map > figure > svg:last-of-type')
  // const svgContainer = document.querySelector('#plot-map')
  // console.log({svgContainer, svgImage});
  // zoomSVG(svgImage, svgContainer)
}

function updateSidePlots() {
  const spatialIndexField = state.level + "_fips";

  const demographicHighlightData = getDemographicData(state.plotHighlight);
  const demographicsPlot = createDemographicsPlot(demographicHighlightData, {
    referenceData: state.demographicData,
    measureField: state.measure,
    comparePrimary: state.comparePrimary,
    compareSecondary: state.compareSecondary,
    xTickFormat: (d) => l(d),
    facetTickFormat: (d) => l(d),
  });

  const demographicsPlotContainer = document.getElementById("plot-demographic");
  demographicsPlotContainer.innerHTML = "";
  demographicsPlotContainer.appendChild(demographicsPlot);

  const highlightRow = state.mapData
    .filter((d) => d[spatialIndexField] == state.plotHighlight)
    .slice(0, 1);
  const histogramPlot = createHistogramPlot(state.mapData, {
    measureField: state.measure,
    markLine: highlightRow,
  });

  const histogramPlotContainer = document.getElementById("plot-histogram");
  histogramPlotContainer.innerHTML = "";
  histogramPlotContainer.appendChild(histogramPlot);

  state.demographicsPlot = demographicsPlot;
  state.histogramPlot = histogramPlot;
}

async function initialDataLoad() {
  state.conceptMappings = await d3.json("data/conceptMappings.json");
  const stateGeo = await d3.json("data/states.json");
  const countyGeo = await d3.json("data/counties.json");

  
  state.stateGeo = stateGeo
  state.countyGeo = countyGeo

  await loadData("2020");

  state.countyGeoMap = [{
    text: 'All',
    value: 'all'
  }, ...countyGeo.features.map((feature) => {
    const hasData = state.data.find(item => item.county_fips === feature.id)
    const stateName = typeof feature.state?.name !== 'undefined' ? feature.state.name : '-';

    return {
      text: feature.properties.name + ', ' + stateName, 
      value: feature.id,
      hasData: !!hasData
    }
  })]
  state.stateGeoMap = [{
    text: 'All',
    value: 'all'
  }, ...stateGeo.features.map((feature) => ({text: feature.properties.name, value: feature.id  }))]

  

  const causeDictData = await d3.csv("data/icd10_39recode_dict.csv");

  state.dictionary = await d3.json("data/dictionary.json");
  state.causeMap = new Map([
    ["All", "All"],
    ...causeDictData.map((row) => [row.code, row.abbr]),
  ]);

  //  Update the input state
  state.measureOptions = state.conceptMappings.measureOptions;
  state.levelOptions = LEVELS;
  state.selectYearOptions = YEARS;
  state.selectStateOptions = state.stateGeoMap
  state.selectCountyOptions = state.countyGeoMap
  state.isSelectedStateCounty = false
  state.scheme = "RdYlBu";
  state.schemeOptions = [
    ...Object.entries(state.conceptMappings.colorSchemes),
  ].map(([k, v]) => ({ text: v, value: k }));
}

async function loadData(year) {
  toggleLoading(true);
  const {measureOptions} = state.conceptMappings

  let data = await d3.csv(`data/mortality_data/age_adjusted_data_${year}.csv`);
  data = data.map((row) => {
    measureOptions.forEach((field) => (row[field.name] = parseFloat(row[field.name])));
    const { stateName, countyName } = mapStateAndCounty(
      row["state_fips"],
      row["county_fips"],
      state
    );

    return { ...row, state: stateName, county: countyName };
  });

  state.data = [...data] || [];
  return data;
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
    state.downloadGraphRef.pngFigureOneButton.removeEventListener(
      "click",
      state.downloadGraphRef.pngFigureOneCallback
    );
  }

  if (state.downloadGraphRef.pngFigureTwoButton) {
    state.downloadGraphRef.pngFigureTwoButton.removeEventListener(
      "click",
      state.downloadGraphRef.pngFigureTwoCallback
    );
  }

  if (state.downloadGraphRef.pngFigureTreeButton) {
    state.downloadGraphRef.pngFigureTreeButton.removeEventListener(
      "click",
      state.downloadGraphRef.pngFigureTreeCallback
    );
  }
};
function downloadMapGraphs() {
  removeDownloadGraphEventListeners();

  const downloadFigureOnePNG = () => {
    console.log("Downloading 1");
    downloadGraph("plot-map-container", "map", "map-loading");
  };
  const downloadFigureTwoPNG = () =>
    downloadGraph("plot-histogram-container", "histogram", "map-loading");
  const downloadFigureThreePNG = () =>
    downloadGraph("plot-demographic-container", "histogram", "map-loading");

  const downloadAllFiguresPNG = () =>
    downloadGraph("plots-container", "all-figures", "map-loading");

  const downloadFigureOneButton = document.getElementById(
    "downloadFigureOnePNG"
  );

  if (downloadFigureOneButton) {
    downloadFigureOneButton.addEventListener("click", downloadFigureOnePNG);
    state.downloadGraphRef.pngFigureOneButton = downloadFigureOneButton;
    state.downloadGraphRef.pngFigureOneCallback = downloadFigureOnePNG;
  }

  const downloadFigureTwoButton = document.getElementById(
    "downloadFigureTwoPNG"
  );

  if (downloadFigureTwoButton) {
    downloadFigureTwoButton.addEventListener("click", downloadFigureTwoPNG);
    state.downloadGraphRef.pngFigureTwoButton = downloadFigureTwoButton;
    state.downloadGraphRef.pngFigureTwoCallback = downloadFigureTwoPNG;
  }

  const downloadFigureThreeButton = document.getElementById(
    "downloadFigureThreePNG"
  );

  if (downloadFigureThreeButton) {
    downloadFigureThreeButton.addEventListener("click", downloadFigureThreePNG);
    state.downloadGraphRef.pngFigureThreeButton = downloadFigureThreeButton;
    state.downloadGraphRef.pngFigureThreeCallback = downloadFigureThreePNG;
  }

  const downloadAllFiguresButton = document.getElementById(
    "downloadAllFiguresPNG"
  );

  if (downloadAllFiguresButton) {
    downloadAllFiguresButton.addEventListener("click", downloadAllFiguresPNG);
    state.downloadGraphRef.pngAllFiguresButton = downloadAllFiguresButton;
    state.downloadGraphRef.pngAllFiguresCallback = downloadAllFiguresPNG;
  }
}

function statePropertyName(operation, field) {
  return operation + field[0].toUpperCase() + field.slice(1);
}
