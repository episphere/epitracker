/**
 * @file The input and basic control logic for the demograpics page.
 * @author Lee Mason <masonlk@nih.gov>
 */

import { EpiTrackerData } from "../utils/EpiTrackerData.js";
import { State } from "../utils/State.js";
import {
  createDropdownDownloadButton,
  createOptionSorter,
  formatCauseName,
  formatName,
} from "../utils/helper.js";
import choices from "https://cdn.jsdelivr.net/npm/choices.js@10.2.0/+esm";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.8.5/+esm";
import { hookCheckbox, hookSelectChoices } from "../utils/input2.js";
import { plotDemographicPlots } from "../utils/demographicPlots.js";

window.onload = async () => {
  init();
};

/**
 * Defining some of the necessary configuration options and default values.
 */
const COMPARABLE_FIELDS = ["race", "sex", "age_group"];
const DATA_YEARS = ["2018", "2019", "2020", "2018-2020"];
const NUMERIC_MEASURES = ["crude_rate", "age_adjusted_rate"];

// The default state, shown if no URL params.
const INITIAL_STATE = {
  compareBar: "race",
  compareFacet: "none",
  sex: "All",
  race: "All",
  year: "2020",
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
  elements = {
    barContainer: document.getElementById("plot-container"),
    sidebar: document.getElementById("sidebar"),
    title: document.getElementById("plot-title"),
  };

  elements.barContainer.style.height = elements.barContainer.style.maxHeight;
  console.log("Set height", elements.barContainer.style.maxHeight);
  initializeState();
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
  for (const compareProperty of ["compareBar", "compareFacet"]) {
    state.subscribe(compareProperty, () => {
      let measureOptions = null;
      let measure = state.measure;
      if (["compareBar", "compareFacet"].some((d) => state[d] == "age_group")) {
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
  ]);
  state.defineProperty("legendCheckValues", null, "query");
  state.defineProperty("mortalityData", null, ["query"]);
  state.defineJointProperty("plotConfig", [
    "mortalityData",
    "query",
    "measure",
    "startZero",
  ]);

  for (const param of Object.keys(initialState)) {
    if (state.hasProperty(param)) {
      state.subscribe(param, updateURLParam);
    }
  }

  for (const inputSelectConfig of [
    { id: "#select-compare-bar", propertyName: "compareBar" },
    { id: "#select-compare-facet", propertyName: "compareFacet" },
    { id: "#select-select-race", propertyName: "race" },
    { id: "#select-select-sex", propertyName: "sex" },
    { id: "#select-select-state", propertyName: "areaState", searchable: true },
    { id: "#select-select-cause", propertyName: "cause", searchable: true },
    { id: "#select-select-year", propertyName: "year", forceEnd: "2018-2020" },
    { id: "#select-select-age", propertyName: "ageGroup" },
    { id: "#select-measure", propertyName: "measure" },
  ]) {
    const sorter = createOptionSorter(
      ["All", "None"],
      inputSelectConfig.propertyName == "year" ? ["2018-2020"] : []
    );

    choices[inputSelectConfig.id] = hookSelectChoices(
      inputSelectConfig.id,
      state,
      inputSelectConfig.propertyName,
      inputSelectConfig.propertyName + "Options",
      (d) => d,
      inputSelectConfig.searchable,
      sorter
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
  state.compareBarOptions = [...COMPARABLE_FIELDS].map((field) => ({
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
  if (query.compareBar == "age_group" || query.compareFacet == "age_group") {
    choices["#select-select-age"].disable();
  } else {
    choices["#select-select-age"].enable();
  }

  const dataQuery = {
    year: query.year,
    cause: query.cause,
    race: query.race,
    sex: query.sex,
    age_group: query.ageGroup,
    state_fips: query.areaState,
  };

  if (query.compareBar != "none") dataQuery[query.compareBar] = "*";
  if (query.compareFacet != "none") dataQuery[query.compareFacet] = "*";

  let mortalityData = await dataManager.getDemographicMortalityData(dataQuery, {
    includeTotals: false,
  });
  state.mortalityData = mortalityData;
  updateTitle();
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
    label: formatName(names, "fields", state.compareBar),
  };
  const fxOptions = {
    tickFormat: tickFormat,
    label: formatName(names, "fields", state.compareFacet),
  };

  let ageDomain = null;
  if (state.compareBar == "age_group" || state.compareFacet == "age_group") {
    const ageGroups = [...new Set(state.mortalityData)].map((d) => d.age_group);
    ageDomain = sortAgeGroups(ageGroups);
    const options = state.compareBar == "age_group" ? xOptions : fxOptions;
    options.domain = ageDomain;
  }

  const barContainer = elements.barContainer;
  plotDemographicPlots(barContainer, state.mortalityData, {
    compareBar: state.compareBar != "none" ? state.compareBar : null,
    compareFacet: state.compareFacet != "none" ? state.compareFacet : null,
    measure: state.measure,
    plotOptions: {
      x: xOptions,
      fx: fxOptions,
      y: { label: formatName(names, "measures", state.measure) },
    },
    yStartZero: state.startZero,
  });
}

function updateURLParam(value, param) {
  if (INITIAL_STATE[param] != value) {
    url.searchParams.set(param, value);
  } else {
    url.searchParams.delete(param);
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
  ]);
  groupDownloadContainer.appendChild(downloadButton);
}

function updateTitle() {
  const level =
    state.spatialLevel == "county" ? "US county-level" : "US state-level";
  let compareString = [state.compareBar, state.compareFacet]
    .filter((d) => d != "none")
    .map((d) => names.fields[d].toLowerCase())
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
  ].toLowerCase()} ${compareString}. </br> ${selectsString}`;
  elements.title.innerHTML = title;
}

function downloadMortalityData() {}

function downloadGraph() {}
