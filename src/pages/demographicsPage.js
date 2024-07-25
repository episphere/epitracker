/**
 * @file The input and basic control logic for the demograpics page.
 * @author Lee Mason <masonlk@nih.gov>
 */

import { DataTable } from "https://cdn.jsdelivr.net/npm/simple-datatables@8.0.0/+esm";
import { toSvg } from "https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/+esm"
import { EpiTrackerData } from "../utils/EpiTrackerData.js";
import { State } from "../utils/State.js";
import {COLORS} from '../utils/color.js'
import {
  createDropdownDownloadButton,
  createOptionSorter,
  formatCauseName,
  formatName,
  dataToTableData,
  CAUSE_SEX_MAP,
  grayOutSexSelectionBasedOnCause,
  plotDataTable
} from "../utils/helper.js";
import choices from "https://cdn.jsdelivr.net/npm/choices.js@10.2.0/+esm";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.8.5/+esm";
import { hookCheckbox, hookSelectChoices } from "../utils/input2.js";
import { plotDemographicPlots } from "../plots/demographicPlots.js";
import { downloadElementAsImage } from "../utils/download.js";
import { demographicTableColumns } from "../utils/tableDefinitions.js";
import { checkableLegend } from "../utils/checkableLegend.js";

window.onload = async () => {
  init();
};

/**
 * Defining some of the necessary configuration options and default values.
 */
const COMPARABLE_FIELDS = ["race", "sex", "age_group"];
const DATA_YEARS = ["2018", "2019", "2020", "2021", "2022", "2018-2022"];
const NUMERIC_MEASURES = ["crude_rate", "age_adjusted_rate"];

// The default state, shown if no URL params.
const INITIAL_STATE = {
  compareBar: "race",
  compareFacet: "age_group",
  sex: "All",
  race: "All",
  year: "2022",
  ageGroup: "All",
  measure: "age_adjusted_rate",
  cause: "All",
  areaState: "All",
  startZero: true,
};

let state, dataManager;
let elements, url, names;

export function init() {
  state = new State();
  dataManager = new EpiTrackerData();

  initializeState();

  elements = {
    barContainer: document.getElementById("demographic-container"),
    sidebar: document.getElementById("sidebar"),
    title: document.getElementById("plot-title"),
    tableContainer: document.getElementById("table-container"),
    graphNavLink: document.getElementById("graph-nav-link"),
    tableNavLink: document.getElementById("table-nav-link"),
  };

  elements.barContainer.style.height = elements.barContainer.style.maxHeight;

  const selectSexElement = document.getElementById("select-select-sex");

  if (selectSexElement) {
    elements.selectChoicesListSex =
      selectSexElement.parentNode.nextSibling.lastChild;
  }

  elements.selectSex = document.getElementById("select-select-sex");
  elements.tableNavLink.addEventListener("click", () => changeView("table"));
  elements.graphNavLink.addEventListener("click", () => changeView("plot"));
}

function initializeState() {
  const initialState = { ...INITIAL_STATE };

  url = new URL(window.location.href);
  for (const [paramName, paramValue] of url.searchParams) {
    initialState[paramName] = paramValue;
  }

  state.defineProperty("compareBar", initialState.compareBar);
  state.defineProperty("compareBarOptions", null);
  state.defineProperty("compareFacet", initialState.compareFacet);
  state.defineProperty("compareFacetOptions", null);
  state.defineProperty("year", initialState.year);
  state.defineProperty("yearOptions", DATA_YEARS);
  state.defineProperty("cause", initialState.cause);
  state.defineProperty("causeOptions", null);
  state.defineProperty("ageGroup", initialState.ageGroup);
  state.defineProperty("ageGroupOptions", null);
  state.defineProperty("areaState", initialState.areaState);
  state.defineProperty("areaStateOptions", null);
  state.defineProperty("raceMappings", null);

  // The compareBar and compareFacet properties can't be the same value (unless they are 'none'), handle that logic here.
  for (const [childProperty, parentProperty] of [
    ["compareBar", "compareFacet"],
    ["compareFacet", "compareBar"],
  ]) {
    state.linkProperties(childProperty, parentProperty);
    state.subscribe(parentProperty, () => {
      if (
        state[parentProperty] == state[childProperty] &&
        state[childProperty] != "none"
      ) {
        state[childProperty] = "none";
      }
    });
  }

  // The values for the selections are dependent on the compares (e.g. if we are comparing by race, then the race select
  // must be equal to "all").
  state.defineProperty("race", initialState.race, [
    "compareBar",
    "compareFacet",
  ]);
  state.defineProperty("raceOptions", []);
  state.defineProperty("sex", initialState.sex, ["compareBar", "compareFacet"]);
  state.defineProperty("sexOptions", []);
  for (const compareProperty of ["compareBar", "compareFacet"]) {
    state.subscribe(compareProperty, () => {
      if (COMPARABLE_FIELDS.includes(state[compareProperty])) {
        state[state[compareProperty]] = "All";
      }
    });
  }

  state.defineProperty("measureOptions", null, ["compareBar", "compareFacet"]);
  for (const compareProperty of ["compareBar", "compareFacet", "ageGroup"]) {
    state.subscribe(compareProperty, () => {
      let measureOptions = null;
      let measure = state.measure;
      if (["compareBar", "compareFacet"].some((d) => state[d] == "age_group" || state["ageGroup"] != 'All')) {
        measureOptions = ["crude_rate"];
        measure = "crude_rate";
      } else {
        measureOptions = NUMERIC_MEASURES;
      }
      state.measureOptions = measureOptions.map((field) => ({
        value: field,
        label: names.measures[field],
      }));
      state.measure = measure;
    });
  }
  state.defineProperty("measure", initialState.measure, ["measureOptions"]);

  state.defineProperty("startZero", initialState.startZero);

  state.defineJointProperty("query", [
    "compareBar",
    "compareFacet",
    "areaState",
    "cause",
    "race",
    "sex",
    "year",
    "ageGroup",
    "measure"
  ]);
  state.defineProperty("legendCheckValues", null, "query");
  state.defineProperty("mortalityData", null, ["query"]);
  state.defineJointProperty("plotConfig", [
    "mortalityData",
    "query",
    "measure",
    "startZero",
    "legendCheckValues",
  ]);

  for (const param of Object.keys(initialState)) {
    if (state.hasProperty(param)) {
      state.subscribe(param, updateURLParam);
    }
  }
const causeFormat = (d) => ({ 
    label: d === 'All' ? 'All cancers' : d, 
    value: d 
  })
  for (const inputSelectConfig of [
    { id: "#select-compare-bar", propertyName: "compareBar" },
    { id: "#select-compare-facet", propertyName: "compareFacet" },
    { id: "#select-select-race", propertyName: "race" },
    { id: "#select-select-sex", propertyName: "sex" },
    { id: "#select-select-state", propertyName: "areaState", searchable: true },
    { id: "#select-select-cause", propertyName: "cause", searchable: true, format: causeFormat  },
    { id: "#select-select-year", propertyName: "year", forceEnd: "2018-2022" },
    { id: "#select-select-age", propertyName: "ageGroup" },
    { id: "#select-measure", propertyName: "measure" },
  ]) {
    const sorter = createOptionSorter(
      ["All", "None"],
      inputSelectConfig.propertyName == "year" ? ["2018-2022"] : []
    );

    choices[inputSelectConfig.id] = hookSelectChoices(
      inputSelectConfig.id,
      state,
      inputSelectConfig.propertyName,
      inputSelectConfig.propertyName + "Options",
      inputSelectConfig.searchable,
      sorter,
      inputSelectConfig.format
    );
  }

  hookCheckbox("#check-start-zero", state, "startZero");

  state.subscribe("query", queryUpdated);
  state.subscribe("plotConfig", plotConfigUpdated);

  // Load the data
  Promise.all([
    d3.json("../data/conceptMappings.json"),
    dataManager.getDemographicMortalityData({ year: state.year }),
  ]).then(([nameMappings, mortalityData]) => {
    initialDataLoad(mortalityData, nameMappings);
  });
}

function initialDataLoad(mortalityData, nameMappings) {
  names = nameMappings;

  // Initialise the input state from the data
  state.compareBarOptions = ["none", ...COMPARABLE_FIELDS].map((field) => ({
    value: field,
    label: names.fields[field],
  }));
  state.compareFacetOptions = ["none", ...COMPARABLE_FIELDS].map((field) => ({
    value: field,
    label: names.fields[field],
  }));
  state.causeOptions = [...new Set(mortalityData.map((d) => d.cause))];
  state.areaStateOptions = [
    ...new Set(mortalityData.map((d) => d.state_fips)),
  ].map((stateCode) => ({
    value: stateCode,
    label: nameMappings.states[stateCode]?.name,
  }));
  state.raceMappings = names['race']
  state.sexOptions = [...new Set(mortalityData.map((d) => d.sex))];
  state.raceOptions = [...new Set(mortalityData.map((d) => d.race))];
  state.ageGroupOptions = [...new Set(mortalityData.map((d) => d.age_group))];
  state.measureOptions = NUMERIC_MEASURES.map((field) => ({
    value: field,
    label: nameMappings.measures[field],
  }));

  setInputsEnabled();
  state.trigger("race");

  let resizeTimeout;
  const resizeObserver = new ResizeObserver((resizeWrapper) => {
    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
    }

    resizeTimeout = setTimeout(() => {
      state.trigger("plotConfig");
    }, 25);
  });
  resizeObserver.observe(elements.barContainer);

  addDownloadButton();
}

async function queryUpdated(query) {
  if (query.compareBar == "race" || query.compareFacet == "race") {
    choices["#select-select-race"].disable();
  } else {
    choices["#select-select-race"].enable();
  }
  if (query.compareBar == "sex" || query.compareFacet == "sex") {
    choices["#select-select-sex"].disable();
  } else {
    choices["#select-select-sex"].enable();
  }

  // if (query.compareBar == "age_group" || query.compareFacet == "age_group") {
  //   choices["#select-select-age"].disable();
  // } else {
  //   choices["#select-select-age"].enable();
  // }

  // if ((query.compareBar !== "age_group" && query.compareFacet !== "age_group") && state.measure == "age_adjusted_rate" ) {
  //   choices["#select-select-age"].disable();
  // } else {
  //   choices["#select-select-age"].enable();
  // }

  const dataQuery = {
    year: query.year,
    cause: query.cause,
    race: query.race,
    sex:  query.sex,
    age_group: query.ageGroup,
    state_fips: query.areaState,
  };

  if (query.compareBar != "none") dataQuery[query.compareBar] = "*";
  if (query.compareFacet != "none") dataQuery[query.compareFacet] = "*";

  let mortalityData = await dataManager.getDemographicMortalityData(dataQuery, {
    includeTotals: false,
  });

  grayOutSexSelectionBasedOnCause(query, elements)

  state.mortalityData = mortalityData;
  updateTitle();

  updateLegend(mortalityData, query);
}

function sortAgeGroups(ageGroups) {
  const groups = ageGroups.map((d) => ({
    raw: d,
    first: parseInt(d.split("-")[0]),
  }));
  groups.sort((a, b) => a.first - b.first);
  return groups.map((d) => d.raw);
}

function plotConfigUpdated() {
  if (!state.mortalityData) {
    return;
  }

  const xFormat = (d) => formatName(names, state.compareBar, d);
  const tickFormat = (d) => formatName(names, state.compareFacet, d);

  const xOptions = {
    tickFormat: xFormat,
    label: '',
  };
  const fxOptions = {
    tickFormat: tickFormat,
    label: '',
  };

  let ageDomain = null;
  if (state.compareBar == "age_group" || state.compareFacet == "age_group") {
    const ageGroups = [...new Set(state.mortalityData)].map((d) => d.age_group);
    ageDomain = sortAgeGroups(ageGroups);
    // const options = state.compareBar == "age_group" ? xOptions : fxOptions;
    // options.domain = ageDomain;
  }

  let data = state.mortalityData;
  console.log({compareBar: state.query.compareBar, tt: state.legendCheckValues})
  if (state.query.compareBar === "race") {
    const legendCheckSet = new Set(state.legendCheckValues);
    data = state.mortalityData.filter((d) =>
      legendCheckSet.has(d[state.query.compareBar])
    );
  }

  if (state.mortalityData.length == 0) {
    elements.barContainer.innerHTML =
      "<i> There is no data for this selection. </i>";
    elements.tableContainer.innerHTML =
      "<i> There is no data for this selection. </i>";
  } else {
    const barContainer = elements.barContainer;
    const isActiveTable = elements.tableNavLink.classList.contains("active");
    if (isActiveTable) {
      plotTable()

    } else {
      console.log({state});
      plotDemographicPlots(barContainer, data, {
        compareBar: state.compareBar != "none" ? state.compareBar : null,
        compareFacet: state.compareFacet != "none" ? state.compareFacet : null,
        measure: state.measure,
        plotOptions: {
          x: xOptions,
          fx: fxOptions,
          y: { label: formatName(names, "measures", state.measure) },
        },
        yStartZero: state.startZero,
        valueField: state.measure,
        tooltipFields: [
          state.compareFacet,
          state.compareBar,
        ].filter((d) => d != "none"),
        raceMappings: state.raceMappings
      });
    }
  }

  
}

function updateURLParam(value, param) {
  if (INITIAL_STATE[param] != value) {
    url.searchParams.set(param, value);
  } else {
    url.searchParams.delete(param);
    if (param === 'measure' && value == INITIAL_STATE["measure"]) {
      state.ageGroup = 'All'
    }
  }

  if (CAUSE_SEX_MAP[value]) {
    state.sex = CAUSE_SEX_MAP[value]
  }
  history.replaceState({}, "", url.toString());
}

function setInputsEnabled(enabled) {
  for (const input of [
    "select-compare-bar",
    "select-compare-facet",
    "select-select-race",
    "select-select-sex",
    "select-select-cause",
    "select-select-year",
    "select-select-age",
    "select-measure",
  ]) {
    const element = document.getElementById(input);
    if (enabled) {
      element.removeAttribute("disabled");
    } else {
      element.setAttribute("disabled", "");
    }
  }

  for (const choice of Object.values(choices)) {
    choice.enable();
  }
}

function addDownloadButton() {
  const baseFilename = "epitracker_data";

  const groupDownloadContainer = document.getElementById("download-container");
  const downloadButton = createDropdownDownloadButton(false, [
    {
      label: "Download data (CSV)",
      listener: () =>
        downloadMortalityData(state.mortalityData, baseFilename, "csv"),
    },
    {
      label: "Download data (TSV)",
      listener: () =>
        downloadMortalityData(state.mortalityData, baseFilename, "tsv"),
    },
    {
      label: "Download data (JSON)",
      listener: () =>
        downloadMortalityData(state.mortalityData, baseFilename, "json"),
    },
    { label: "Download plot (PNG)", listener: downloadGraph },
    { label: "Download plot (SVG)", listener: downloadGraphSVG },
  ]);
  groupDownloadContainer.appendChild(downloadButton);
}

function downloadGraphSVG() {
  const sourceElement = document.getElementById('plot-source')
  if (sourceElement) {
    sourceElement.style.display = 'block'
  }
  return toSvg(document.getElementById("plots")).then((data) => {
    if (sourceElement) {
      sourceElement.style.display = 'none'
    }
    const link = document.createElement('a')
    link.download = 'plot-svg';
    link.href = data;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  })
}

function downloadGraph() {
  const temporaryContainer = elements.barContainer.cloneNode(true);
  // const temporaryLegend = elements.plotLegend.cloneNode(true);
  const temporaryTitle = elements.title.cloneNode(true);

  // const legendChecks = temporaryLegend.querySelectorAll(".legend-check");
  // legendChecks.forEach((check) => {
  //   if (!check.hasAttribute("checked")) {
  //     check.style.display = "none";
  //   }
  // });

  // const checkPaths = temporaryLegend.querySelectorAll(".legend-check path");
  // checkPaths.forEach((path) => (path.style.visibility = "hidden"));

  const wrapperElement = document.createElement("div");
  // wrapperElement.appendChild(temporaryLegend);
  wrapperElement.appendChild(temporaryTitle);
  wrapperElement.appendChild(temporaryContainer);
  const sourceDiv = document.createElement('div')
  sourceDiv.innerText = 'the source...'
  wrapperElement.appendChild(sourceDiv);
  return downloadElementAsImage(wrapperElement, "demograpic-plot");
}

function updateTitle() {
  const level =
    state.spatialLevel == "county" ? "US county-level" : "US state-level";
  let compareString = [state.compareBar, state.compareFacet]
    .filter((d) => d != "none")
    .map((d) => names.fields[d])
    .join(" and ");

  if (compareString != "") {
    compareString = " by " + compareString;
  }
  const compareSet = new Set([state.compareBar, state.compareFacet]);
  const selects = [
    { name: "Year", value: state.year },
    {
      name: "Location",
      value: (() => {
        return state.areaState == "All"
          ? "US"
          : names.states[state.areaState].name;
      })(),
    },
    { name: "Cause of death", value: formatCauseName(state.cause) },
    {
      name: names.fields.sex,
      value: state.sex,
      exclude: compareSet.has("sex"),
    },
    {
      name: names.fields.race,
      value: state.race,
      exclude: compareSet.has("race"),
    },
    {
      name: names.fields.age_group,
      value: state.ageGroup,
      exclude: compareSet.has("age_group"),
    },
  ];
  const selectsString = selects
    .filter((d) => !d.exclude)
    .map((d) => `${d.name}: ${d.value}`)
    .join("&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp");

  const title = `${level} ${names.measures[
    state.measure
  ]} ${compareString}. <br /> ${selectsString}`;
  elements.title.innerHTML = title;
}

export function downloadStringAsFile(content, filename, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.target = "_blank";
  a.click();
  window.URL.revokeObjectURL(url);
}

function downloadMortalityData(mortalityData, filename, format) {
  const data = mortalityData; //prepareMortalityDataForDownload(mortalityData)
  let str = null;
  if (format == "csv") {
    str = d3.csvFormat(data);
  } else if (format == "tsv") {
    str = d3.tsvFormat(data);
  } else {
    str = JSON.stringify(data, null, 2);
  }
  downloadStringAsFile(str, filename + "." + format, "text/" + format);
}

function plotTable() {
  // const pin = ["state_fips", "race", "sex", "cause", "age_group"].map(d => ({field: d, frozen: true, formatter: "plaintext", minWidth: 100}))
  const {compareBar, compareFacet, ageGroup} = state.query

  let tableColumns = [...demographicTableColumns]

  if (compareBar == "age_group" || compareFacet == "age_group" || ageGroup !== 'All') {
    tableColumns = demographicTableColumns.filter(column => column.field !== 'age_adjusted_rate')
  }
  
  plotDataTable(state.mortalityData, elements.tableContainer, {
    columns: tableColumns
  })
}

function changeView(view) {
  // toggleLoading(true);

  if (view == "plot") {
    elements.tableNavLink.classList.remove("active");
    elements.graphNavLink.classList.add("active");
    elements.barContainer.style.display = "block";
    elements.tableContainer.style.display = "none";
    elements.title.style.display = "block";

    state.trigger("plotConfig"); // Trigger a redraw so sizing is correct.
  } else if (view == "table") {
    elements.graphNavLink.classList.remove("active");
    elements.tableNavLink.classList.add("active");
    elements.barContainer.style.display = "none";
    elements.tableContainer.style.display = "block";
    elements.title.style.display = "none";

    if (state.mortalityData.length > 0) {
      plotTable();
    }
  }

  // toggleLoading(false);
}

function updateLegend(data, query) {
  const legendContainer = document.getElementById("plot-legend");
  legendContainer.innerHTML = ``;

  if (query.compareBar === "race") {
    const colorDomainValues = [
      ...new Set(data.map((d) => d[query.compareBar])),
    ].sort();
    const checkedValueSet = new Set(state.legendCheckValues);

    let selectedValues = colorDomainValues.filter((d) =>
      checkedValueSet.has(d)
    );
    if (selectedValues.length == 0) selectedValues = colorDomainValues;

    const formatRace = (d) => names.race[d]?.short;
    const colorTickFormat =
      query.compareColor == "race" ? formatRace : (d) => d;

    const legend = checkableLegend(
      colorDomainValues,
      COLORS.race,
      selectedValues,
      colorTickFormat,
      false
    );
    legendContainer.appendChild(legend);

    legend.addEventListener("change", () => {
      state.legendCheckValues = legend.getValues();
    });

    state.legendCheckValues = legend.getValues();
  }
}