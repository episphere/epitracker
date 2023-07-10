import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";

import { DynamicState } from "./DynamicState.js";
import { configureSelect } from "./input.js";
import { addTooltip } from "./helper.js";
import { downloadFiles } from "../pages/dictionary.js";
import {paginationHandler, dataPagination} from '../components/pagination.js'
import {renderTable} from '../components/table.js'
import { colorRampLegendMeanDiverge, toggleSidebar } from "./helper.js";
import { downloadHtmlAsImage }  from "./download.js"

const COMPARABLE_FIELDS = ["none", "sex", "race"];
const SELECTABLE_FIELDS = ["cause", "sex", "race"];
//const MEASURES = ["count", "population", "crude_rate", "age_adjusted_rate"]
const MEASURES = ["crude_rate", "age_adjusted_rate"];
const LEVELS = ["county", "state"];
const PLOT_DIAGRAM_SIZE = {
  width: 440,
  height: 360
}

function stateName(operation, field) {
  return operation + field[0].toUpperCase() + field.slice(1);
}

// Global state fields
let data = null;
let countyGeo = null;
let stateGeo = null;
let dictionary = null;
let causeDict = null;

let tab = "map"; // TODO: Implement proper tab switching structure. For now, just loading new page.
// let maplastData = { current: null };
function l(word, sub = null) {
  if (sub == null) {
    for (const key of Object.keys(dictionary)) {
      if (dictionary[key][word]) {
        return dictionary[key][word];
      }
    }
  } else {
    if (dictionary[sub][word]) {
      return dictionary[sub][word];
    }
  }

  return word;
}

const dataOptionsState = new DynamicState({
  selectCause: null,
  selectSex: null,
  selectRace: null,

  comparePrimary: null,
  compareSecondary: null,
});

const otherOptions = new DynamicState({
  geoLevel: "county",
  measureField: "age_adjusted_rate",
});

dataOptionsState.addListener((field, value) => {
  update();
});

otherOptions.addListener((field, value) => {
  update();
});

let spatialData = null;
let demographicData = null;

function update() {
  spatialData = getSpatialData(data, dataOptionsState, otherOptions.geoLevel);
  spatialData = spatialData.filter((row) =>
    Number.isFinite(row[otherOptions.measureField])
  );

  demographicData = getDemographicData(data, dataOptionsState);
  // maplastData.current = spatialData;
  const headers = Object.keys(spatialData[0]);
  downloadFiles(spatialData, headers, "first_data", true);
  renderTable("map-table", dataPagination(0, 200, spatialData), headers);
  paginationHandler(spatialData, 200, headers);
  plotChoropleth(spatialData);
  plotHistogram(spatialData);
  plotDemographic(demographicData);
}

// === Data handling ===

function getSpatialData(data, dataState, level) {
  let spatialData = data.filter(
    (d) =>
      d.cause == dataState.selectCause &&
      d.sex == dataState.selectSex &&
      d.race == dataState.selectRace &&
      d.state_fips != "All"
  );

  if (level == "county") {
    spatialData = spatialData.filter((d) => d.county_fips != "All");
  } else {
    spatialData = spatialData.filter((d) => d.county_fips == "All");
  }

  // TODO: Remove outliers

  return spatialData;
}

function getDemographicData(data, dataState, highlight = null) {
  let stateFips = "All";
  let countyFips = "All";
  if (highlight) {
    if (highlight.length == 2) {
      stateFips = highlight;
    } else {
      countyFips = highlight;
    }
  }

  let demographicData = data.filter(
    (d) => d.state_fips == stateFips && d.county_fips == countyFips
  );

  const stratifySet = new Set(
    [dataState.comparePrimary, dataState.compareSecondary].filter(
      (d) => d != "none"
    )
  );
  SELECTABLE_FIELDS.forEach((field) => {
    if (stratifySet.has(field)) {
      demographicData = demographicData.filter((row) => row[field] != "All");
    } else {
      demographicData = demographicData.filter(
        (row) => row[field] == dataState[stateName("select", field)]
      );
    }
  });

  return demographicData;
}

// === Plotting ===

function plotDemographic(data, highlightData = null) {
  const mainField =
    dataOptionsState.compareSecondary != "none"
      ? dataOptionsState.compareSecondary
      : dataOptionsState.comparePrimary;
  const otherField =
    dataOptionsState.compareSecondary != "none"
      ? dataOptionsState.comparePrimary
      : "none";

  if (!highlightData) {
    highlightData = data;
  } 

  let checkbox = document.getElementById("show-hide-table");                    
  checkbox.addEventListener('change', (event) => {
    const isChecked = event.target.checked
    const tableWrapper = document.querySelector('#map-table-wrapper')
    if (tableWrapper) {
        tableWrapper.style.display = isChecked ? 'block' : 'none'
    }
  })  

  const domainValues = data.map((d) => d[mainField]);
  const facetDomainValues = data.map((d) => d[otherField]);
  const colorScheme = d3
    .scaleOrdinal()
    .domain(domainValues)
    .range(d3.schemeTableau10);

  const extent = d3.extent(data, (d) => d[otherOptions.measureField]);
  let tickFormat = (d) => d;
  if (extent.some((d) => Math.abs(d) >= 100000)) {
    tickFormat = (d) => d.toExponential();
  }
  
  const highlightExtent = d3.extent(highlightData, (d) => d[otherOptions.measureField]);
  const maxValue = Math.max(highlightExtent[1], extent[1])

  // Make missing data explicitx
  const missingData = []
  const keys = otherField != "none" ? [mainField, otherField] : [mainField]
  const presentKeys = new Set(highlightData.map(row => keys.map(key => row[key]).join("_")))
  for (const mainValue of new Set(domainValues)) {
    for (const otherValue of new Set(facetDomainValues)) {
      const key = [mainValue,otherValue].filter(d => d != null).join("_")
      if (!presentKeys.has(key)) {
        missingData.push({[mainField]: mainValue, [otherField]: otherValue})
      }
    }
  }
  const textPos = maxValue/2

  const barOptions = {
    x: mainField, 
    y: otherOptions.measureField, 
    fill: (d) => colorScheme(d[mainField])
  }
  const refTickOptions = {
    x: mainField,
    y: otherOptions.measureField,
    strokeWidth: 2,
    strokeDasharray: "3,2",
  }
  const missingBarOptions = {
    x: mainField, 
    y: maxValue,
    fill: "#f5f5f5"
  }
  const textOptions = {
    x: mainField, 
    y: () => textPos, 
    text: () => "N/A", 
    fontSize: 14, 
    fill: "#dedede", 
    pointerEvents: "none"
  }

  if (otherField != "none") {
    barOptions.fx = otherField
    refTickOptions.fx = otherField
    missingBarOptions.fx = otherField
    textOptions.fx = otherField
  }

  const options = {
    ...PLOT_DIAGRAM_SIZE,
    //y: {grid: true, label: valueLabel, axis: "right"},
    marginTop: 40,
    marginRight: 60,
    y: {
      grid: true,
      axis: "right",
      label: otherOptions.measureField + " ↑",
      tickFormat: tickFormat,
    },
    x: { domain: domainValues, tickFormat: (d) => l(d) },
    fx: { tickFormat: (d) => l(d) },
    marks: [
      Plot.barY(missingData, missingBarOptions),
      Plot.text(missingData, textOptions),
      Plot.barY(highlightData, barOptions),
      Plot.tickY(data, refTickOptions),
    ],
  };
  

  //return plotOptions
  const div = document.getElementById("plot-demographic");
  const plot = Plot.plot(options);
  div.innerHTML = "";
  div.appendChild(plot);
}

function plotChoropleth(spatialData) {
  const div = document.getElementById("plot-map");

  const indexField =
    otherOptions.geoLevel == "county" ? "county_fips" : "state_fips";
  const spatialDataMap = d3.index(spatialData, (d) => d[indexField]);

  const meanValue = d3.mean(spatialData, (d) => d[otherOptions.measureField]);
  const maxValue = d3.max(spatialData, (d) => d[otherOptions.measureField]);
  const color = {
    scheme: "rdylbu",
    //type: "diverging",
    pivot: meanValue,
    symmetric: true,
    reverse: true,
    //domain: [0,maxValue*2],
    //legend: "ramp",
    label: otherOptions.measureField,
  };
  //const color = {scheme: "rdylbu", type: "diverging"}//, pivot: meanValue, symmetric: true, reverse: true}

  const marks = [];
  if (otherOptions.geoLevel == "county") {
    //marks.push(Plot.geo(countyGeo, {stroke: "grey", strokeWidth: 0.5, fill: d => spatialDataMap.get(d.id)?.[plotOptions.measureField]}))
    marks.push(
      Plot.geo(countyGeo, {
        stroke: (d) => spatialDataMap.get(d.id)?.[otherOptions.measureField],
        strokeWidth: 0.5,
        fill: (d) => spatialDataMap.get(d.id)?.[otherOptions.measureField],
      })
    );
    marks.push(
      Plot.geo(stateGeo, { stroke: "slategrey", strokeWidth: 1, fill: "none" })
    );
  } else {
    marks.push(
      Plot.geo(stateGeo, {
        stroke: "black",
        strokeWidth: 1,
        fill: (d) => spatialDataMap.get(d.id)?.[otherOptions.measureField],
      })
    );
  }

  const options = {
    projection: "albers-usa",
    width: 800, // TODO: Make dynamic,
    color: color,
    marks: marks,
  };

  const colorLegend = colorRampLegendMeanDiverge(spatialData.map((d) => d[otherOptions.measureField]), 
    "RdYlBu", otherOptions.measureField, null, true)

  const figure = document.createElement("figure")
  const plot = Plot.plot(options);
  figure.appendChild(colorLegend)
  figure.appendChild(plot)

  const mainGeo = otherOptions.geoLevel == "county" ? countyGeo : stateGeo;
  const plotSelect = d3.select(d3.select(figure).selectAll("svg").nodes().at(-1));
  const geoSelect = d3
    .select(plotSelect.selectAll("g[aria-label='geo'").nodes()[0])
    .selectAll("path");


  // TODO: Re-add when I find out how to get the browser to ignore default title display
  const tooltip = addTooltip(plotSelect);
  geoSelect.on("mouseover", (e, d) => {
    const bbox = e.target.getBBox();
    const centroid = [bbox.x + bbox.width / 2, bbox.y + bbox.height / 2];
    const stateId = mainGeo.features[d].id;
    const currentState = spatialDataMap.get(stateId);
    const display = Object.entries(currentState).reduce((pv, cv, ci) => {
      return (ci ? `${pv}<br/>` : pv) + `${cv[0]}: ${cv[1]}`;
    }, `${mainGeo.features[d].properties.name}<br/>`);
    tooltip.show(display, centroid[0], centroid[1]);
  });
  geoSelect.on("mouseleave", (e, d) => {
    tooltip.hide();
  });
  plotSelect.on("mouseleave", (e, d) => {
    tooltip.hide();
  });

  d3.select(plotSelect.selectAll("g[aria-label='geo'").nodes()[0]).on(
    "mouseleave",
    (e, d) => {
      plotDemographic(demographicData);
      plotHistogram(spatialData);
    }
  );

  geoSelect
    .on("mouseover.stroke", (e, d) => {
      d3.select(e.target)
        .attr("stroke", "green")
        .attr("stroke-width", 2)
        .raise();
      plotHistogram(spatialData, [spatialDataMap.get(mainGeo.features[d].id)]);
      plotDemographic(
        demographicData,
        getDemographicData(data, dataOptionsState, mainGeo.features[d].id)
      );
    })
    .on("mouseleave.stroke", (e, d) => {
      d3.select(e.target)
        .attr(
          "stroke",
          (d) => spatialDataMap.get(d.id)?.[otherOptions.measureField]
        )
        .attr("stroke-width", 0.5)
        .raise();
    });

  //plot.legend("color", {label: "All Cause Mortality"})

  div.innerHTML = "";
  div.appendChild(figure);
}

function plotHistogram(data, highlight = []) {
  const div = document.getElementById("plot-histogram");

  const meanValue = d3.mean(data, (d) => d[otherOptions.measureField]);

  const extent = d3.extent(data, (d) => d[otherOptions.measureField]);
  let tickFormat = (d) => d;
  if (extent.some((d) => Math.abs(d) >= 100000)) {
    tickFormat = (d) => d.toExponential();
  }

  const plot = Plot.plot({
    ...PLOT_DIAGRAM_SIZE,
    color: {
      scheme: "rdylbu",
      type: "diverging",
      pivot: meanValue,
      symmetric: true,
      reverse: true,
    },
    marginBottom: 40,
    x: { label: otherOptions.measureField + " →", tickFormat: tickFormat },
    y: { label: null },
    marks: [
      Plot.rectY(
        data,
        Plot.binX(
          { y: "count" },
          { x: otherOptions.measureField, stroke: null, fill: "lightblue" }
        )
      ),
      Plot.ruleX(highlight, {
        x: (d) => d[otherOptions.measureField],
        stroke: "red",
        strokeWidth: 2,
      }),
      Plot.text(highlight, {
        x: (d) => d[otherOptions.measureField],
        text: (d) => d[otherOptions.measureField].toFixed(0),
        textAnchor: "start",
        dx: 3,
      }),
      //Plot.ruleY([0])
    ],
  });

  div.innerHTML = "";
  div.appendChild(plot);
}

// === Data loading ===

// TODO: Split the load data into separate functions, handle asycnhronously
export async function loadData() {
  //const data = await d3.csv("data/test_race5_sex_state_county_aa.csv");
  const data = await d3.csv("data/age_adjusted_data_2020.csv");
  data.forEach((row) => {
    MEASURES.forEach((field) => (row[field] = parseFloat(row[field])));
  });

  countyGeo = await d3.json("data/counties.json");
  stateGeo = await d3.json("data/states.json");

  dictionary = await d3.json("data/dictionary.json");
  causeDict = await d3.csv("data/icd10_39recode_dict.csv");

  return data;
}

export function dataLoaded(loadedData) {
  data = loadedData;

  let diseases = unique(data, (d) => d.cause);
  const sexes = unique(data, (d) => d.sex);
  const races = unique(data, (d) => d.race);

  const icd10Map = new Map([
    ["All", "All"],
    ...causeDict.map((row) => [row.code, row.name]),
  ]);
  diseases = ["All", ...diseases.sort().filter((d) => d != "All")];
  const diseaseOptions = diseases.map((d) => ({
    value: d,
    label: icd10Map.get(d),
  }));
  const diseaseSelect = configureSelect(
    "#causeSelectSelect",
    diseaseOptions,
    (d) => (dataOptionsState.selectCause = d)
  );

  const sexSelect = configureSelect(
    "#sexSelectSelect",
    sexes,
    (d) => (dataOptionsState.selectSex = d)
  );
  const raceSelect = configureSelect(
    "#raceSelectSelect",
    races,
    (d) => (dataOptionsState.selectRace = d)
  );

  const comparePrimarySelect = configureSelect(
    "#comparePrimarySelect",
    COMPARABLE_FIELDS,
    (d) => (dataOptionsState.comparePrimary = d),
    "race"
  );
  const compareSecondarySelect = configureSelect(
    "#compareSecondarySelect",
    COMPARABLE_FIELDS,
    (d) => (dataOptionsState.compareSecondary = d)
  );

  const measureSelect = configureSelect(
    "#measureSelect",
    MEASURES,
    (d) => (otherOptions.measureField = d),
    "age_adjusted_rate"
  );
  const levelSelect = configureSelect(
    "#levelSelect",
    LEVELS,
    (d) => (otherOptions.geoLevel = d)
  );

  dataOptionsState.silentSet("selectCause", diseaseSelect.value);
  dataOptionsState.silentSet("selectSex", sexSelect.value);
  dataOptionsState.silentSet("selectRace", raceSelect.value);
  dataOptionsState.silentSet("comparePrimary", comparePrimarySelect.value);
  dataOptionsState.silentSet("compareSecondary", compareSecondarySelect.value);

  otherOptions.silentSet("geoLevel", levelSelect.value);

  dataOptionsState.selectCause = diseaseSelect.value; // TODO: Fix hack

  document.getElementById("loader-container").setAttribute("class", "d-none");
  document
    .getElementById("plots-container")
    .setAttribute("class", "d-flex flex-row");

  let checkbox = document.getElementById("show-hide-table");                    
  checkbox.addEventListener('change', (event) => {
    const isChecked = event.target.checked
    const tableWrapper = document.querySelector('#map-table-wrapper')
    if (tableWrapper) {
        tableWrapper.style.display = isChecked ? 'block' : 'none'
    }
  }) 

  toggleSidebar('plot-map')
}

// === Helper ===

function unique(data, accessor) {
  return [...new Set(data.map(accessor))];
}

