/**
 * @file The input and basic control logic for the demograpics page.
 * @author Lee Mason <masonlk@nih.gov>
 */

import { DataTable } from "https://cdn.jsdelivr.net/npm/simple-datatables@8.0.0/+esm";
import { toSvg } from "https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/+esm"
import { EpiTrackerData } from "../utils/EpiTrackerData.js";
import { State } from "../utils/State.js";
import { COLORS } from '../utils/color.js'
import {
  createDropdownDownloadButton,
  createOptionSorter,
  formatCauseName,
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
import { formatName } from '../utils/nameFormat.js';

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
  compareFacet: "sex",
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
  // Initialize state and data manager
  state = new State();
  dataManager = new EpiTrackerData();

  // Set up the initial state
  initializeState();

  // Cache references to frequently used DOM elements
  elements = {
    barContainer: document.getElementById("demographic-container"),
    sidebar: document.getElementById("sidebar"),
    title: document.getElementById("plot-title"),
    tableContainer: document.getElementById("table-container"),
    graphNavLink: document.getElementById("graph-nav-link"),
    tableNavLink: document.getElementById("table-nav-link"),
  };

  // Adjust the bar container's height
  elements.barContainer.style.height = elements.barContainer.style.maxHeight;

  // Handle the 'select-sex' dropdown element
  const selectSexElement = document.getElementById("select-select-sex");

  if (selectSexElement) {
    // Access the sibling's last child for choices list
    elements.selectChoicesListSex =
      selectSexElement.parentNode.nextSibling.lastChild;
  }

  // Store the select-sex element reference
  elements.selectSex = selectSexElement;

  // Add event listeners for navigation links
  elements.tableNavLink.addEventListener("click", () => changeView("table"));
  elements.graphNavLink.addEventListener("click", () => changeView("plot"));
}
function initializeState() {
  // Clone the initial state
  const initialState = { ...INITIAL_STATE };

  // Parse URL parameters and update the initial state
  url = new URL(window.location.href);
  for (const [paramName, paramValue] of url.searchParams) {
    initialState[paramName] = paramValue;
  }

  // Define initial state properties
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
  state.defineProperty("nameMappings", null);

  // Ensure compareBar and compareFacet are not equal unless set to 'none'
  for (const [childProperty, parentProperty] of [
    ["compareBar", "compareFacet"],
    ["compareFacet", "compareBar"],
  ]) {
    state.linkProperties(childProperty, parentProperty);

    state.subscribe(parentProperty, () => {
      state.compareBarOptions = state.compareBarOptions.map((field) => ({
        ...field,
        disabled: field.value === "none" || state["compareFacet"] === field.value,
      }));

      state.compareFacetOptions = state.compareFacetOptions.map((field) => ({
        ...field,
        disabled: state["compareBar"] === field.value,
      }));
    });
  }

  // Handle dependent selections (e.g., 'race' and 'sex') based on comparisons
  state.defineProperty("race", initialState.race, ["compareBar", "compareFacet"]);
  state.defineProperty("raceOptions", []);
  state.defineProperty("sex", initialState.sex, ["compareBar", "compareFacet"]);
  state.defineProperty("sexOptions", []);

  for (const compareProperty of ["compareBar", "compareFacet"]) {
    state.subscribe(compareProperty, () => {
      if (COMPARABLE_FIELDS.includes(state[compareProperty])) {
        const compareValue =
          state[compareProperty] === "age_group" ? "ageGroup" : state[compareProperty];
        state[compareValue] = "All";
      }
    });
  }

  // Define measure options and synchronize with related properties
  state.defineProperty("measureOptions", null, ["compareBar", "compareFacet"]);
  for (const compareProperty of ["compareBar", "compareFacet", "ageGroup"]) {
    state.subscribe(compareProperty, () => {
      let measureOptions = null;
      let measure = state.measure;

      if (
        ["compareBar", "compareFacet"].some(
          (d) => state[d] === "age_group" || state["ageGroup"] !== "All"
        )
      ) {
        measureOptions = ["crude_rate"];
        measure = "crude_rate";
      } else {
        measureOptions = NUMERIC_MEASURES;
      }

      state.measureOptions = measureOptions.map((field) => ({
        value: field,
        label: formatName("measures", field),
      }));
      state.measure = measure;
    });
  }
  state.defineProperty("measure", initialState.measure, ["measureOptions"]);
  state.defineProperty("startZero", initialState.startZero);

  // Define a joint query property dependent on multiple fields
  state.defineJointProperty("query", [
    "compareBar",
    "compareFacet",
    "areaState",
    "cause",
    "race",
    "sex",
    "year",
    "ageGroup",
    "measure",
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

  // Update URL parameters when state properties change
  for (const param of Object.keys(initialState)) {
    if (state.hasProperty(param)) {
      state.subscribe(param, updateURLParam);
    }
  }

  // Configure dropdowns and selections
  const causeFormat = (d) => ({
    label: d === "All" ? "All cancers" : d,
    value: d,
  });

  for (const inputSelectConfig of [
    { id: "#select-compare-bar", propertyName: "compareBar" },
    { id: "#select-compare-facet", propertyName: "compareFacet" },
    { id: "#select-select-race", propertyName: "race" },
    { id: "#select-select-sex", propertyName: "sex" },
    { id: "#select-select-state", propertyName: "areaState", searchable: true },
    { id: "#select-select-cause", propertyName: "cause", searchable: true, format: causeFormat },
    { id: "#select-select-year", propertyName: "year", forceEnd: "2018-2022" },
    { id: "#select-select-age", propertyName: "ageGroup" },
    { id: "#select-measure", propertyName: "measure" },
  ]) {
    const sorter = createOptionSorter(
      ["All", "None"],
      inputSelectConfig.propertyName === "year" ? ["2018-2022"] : []
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

  // Hook the start-zero checkbox
  hookCheckbox("#check-start-zero", state, "startZero");

  // Subscribe to query and plot configuration updates
  state.subscribe("query", queryUpdated);
  state.subscribe("plotConfig", plotConfigUpdated);

  // Load initial data
  Promise.all([
    dataManager.getDemographicMortalityData({ year: state.year }),
  ]).then(([mortalityData]) => {
    initialDataLoad(mortalityData);
  });
}
function initialDataLoad(mortalityData) {
  // Initialize state options from the data
  state.compareBarOptions = ["none", ...COMPARABLE_FIELDS].map((field) => ({
    value: field,
    label: formatName("fields", field),
    disabled: field === "none" || state.compareFacet === field,
  }));

  state.compareFacetOptions = ["none", ...COMPARABLE_FIELDS].map((field) => ({
    value: field,
    label: formatName("fields", field),
    disabled: state.compareBar === field,
  }));

  state.causeOptions = [...new Set(mortalityData.map((d) => d.cause))];

  state.areaStateOptions = [
    ...new Set(mortalityData.map((d) => d.state_fips)),
  ].map((stateCode) => ({
    value: stateCode,
    label: formatName("states", stateCode),
  }));

  state.nameMappings = names;

  state.sexOptions = [...new Set(mortalityData.map((d) => d.sex))];
  state.raceOptions = [...new Set(mortalityData.map((d) => d.race))];
  state.ageGroupOptions = [...new Set(mortalityData.map((d) => d.age_group))];

  state.measureOptions = NUMERIC_MEASURES.map((field) => ({
    value: field,
    label: formatName("measures", field),
  }));

  // Enable input controls and trigger initial updates
  setInputsEnabled();
  state.trigger("race");

  // Add resize observer to handle plot resizing
  let resizeTimeout;
  const resizeObserver = new ResizeObserver(() => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => state.trigger("plotConfig"), 25);
  });
  resizeObserver.observe(elements.barContainer);

  // Add a download button for the data visualization
  addDownloadButton();
}
async function queryUpdated(query) {
  // Disable or enable race, sex, and age selection based on compareBar and compareFacet
  if (query.compareBar === "race" || query.compareFacet === "race") {
    choices["#select-select-race"].disable();
  } else {
    choices["#select-select-race"].enable();
  }

  if (query.compareBar === "sex" || query.compareFacet === "sex") {
    choices["#select-select-sex"].disable();
  } else {
    choices["#select-select-sex"].enable();
  }

  if (query.compareBar === "age_group" || query.compareFacet === "age_group") {
    choices["#select-select-age"].disable();
  } else {
    choices["#select-select-age"].enable();
  }

  // Prepare the data query based on the provided query parameters
  const dataQuery = {
    year: query.year,
    cause: query.cause,
    race: query.race,
    sex: query.sex,
    age_group: query.ageGroup,
    state_fips: query.areaState,
  };

  // Add compareBar and compareFacet to dataQuery if not 'none'
  if (query.compareBar !== "none") dataQuery[query.compareBar] = "*";
  if (query.compareFacet !== "none") dataQuery[query.compareFacet] = "*";

  // Fetch mortality data asynchronously
  const mortalityData = await dataManager.getDemographicMortalityData(dataQuery, {
    includeTotals: false,
  });

  // Update the UI and state with the fetched mortality data
  grayOutSexSelectionBasedOnCause(query, elements);
  state.mortalityData = mortalityData;
  updateTitle();
  updateLegend(mortalityData, query);
}
function sortAgeGroups(ageGroups) {
  return ageGroups
    .map(d => ({
      raw: d,
      first: parseInt(d.split("-")[0], 10),  // Ensure it's parsed as a decimal number
    }))
    .sort((a, b) => a.first - b.first)  // Sort by the first part of the age range
    .map(d => d.raw);  // Return the original age group values
}
function plotConfigUpdated() {
  if (!state.mortalityData) return;

  const xFormat = (d) => formatName(state.compareBar, d, "short");
  const tickFormat = (d) => formatName(state.compareFacet, d, "short");

  const xOptions = { tickFormat: xFormat, label: '' };
  const fxOptions = { tickFormat: tickFormat, label: '' };

  // Determine age domain if age_group is selected
  let ageDomain = null;
  if (state.compareBar === "age_group" || state.compareFacet === "age_group") {
    const ageGroups = [...new Set(state.mortalityData.map(d => d.age_group))];
    ageDomain = sortAgeGroups(ageGroups);
  }

  // Filter data based on legend check values
  let data = state.mortalityData;
  if (state.query.compareBar !== "none") {
    const legendCheckSet = new Set(state.legendCheckValues);
    data = state.mortalityData.filter(d => legendCheckSet.has(d[state.query.compareBar]));
  }

  // Handle case where no data is available
  if (state.mortalityData.length === 0) {
    elements.barContainer.innerHTML = "<i> There is no data for this selection. </i>";
    elements.tableContainer.innerHTML = "<i> There is no data for this selection. </i>";
  } else {
    const isActiveTable = elements.tableNavLink.classList.contains("active");

    if (isActiveTable) {
      plotTable();
    } else {
      plotDemographicPlots(elements.barContainer, data, {
        compareBar: state.compareBar !== "none" ? state.compareBar : null,
        compareFacet: state.compareFacet !== "none" ? state.compareFacet : null,
        measure: state.measure,
        plotOptions: {
          x: xOptions,
          fx: fxOptions,
          y: { label: formatName("measures", state.measure) },
        },
        yStartZero: state.startZero,
        valueField: state.measure,
        tooltipFields: [state.compareFacet, state.compareBar].filter(d => d !== "none"),
        nameMappings: state.nameMappings
      });
    }
  }
}
function updateURLParam(value, param) {
  // Update URL parameter if the value differs from the initial state
  if (INITIAL_STATE[param] !== value) {
    url.searchParams.set(param, value);
  } else {
    url.searchParams.delete(param);
    // Reset age group if the measure is reverted to its initial state
    if (param === 'measure' && value === INITIAL_STATE["measure"]) {
      state.ageGroup = 'All';
    }
  }

  // Update sex based on the value if a matching mapping exists
  if (CAUSE_SEX_MAP[value]) {
    state.sex = CAUSE_SEX_MAP[value];
  }

  // Replace the current history state with the updated URL
  history.replaceState({}, "", url.toString());
}
function setInputsEnabled(enabled) {
  // List of input element IDs to enable or disable
  const inputIds = [
    "select-compare-bar",
    "select-compare-facet",
    "select-select-race",
    "select-select-sex",
    "select-select-cause",
    "select-select-year",
    "select-select-age",
    "select-measure",
  ];

  // Loop through the input IDs and enable or disable elements accordingly
  inputIds.forEach((inputId) => {
    const element = document.getElementById(inputId);
    element.disabled = !enabled; // Simplified toggling of the 'disabled' attribute
  });

  // Enable all choices using the choices object
  Object.values(choices).forEach((choice) => choice.enable());
}
function addDownloadButton() {
  const baseFilename = "epitracker_data";

  const downloadOptions = [
    { label: "Download CSV", format: "csv" },
    { label: "Download TSV", format: "tsv" },
    { label: "Download JSON", format: "json" },
    { label: "Download PNG)", format: "png" },
    { label: "Download SVG", format: "svg" }
  ];

  const groupDownloadContainer = document.getElementById("download-container");

  const downloadButton = createDropdownDownloadButton(false, downloadOptions.map(({ label, format }) => ({
    label,
    listener: format ? () => downloadMortalityData(state.mortalityData, baseFilename, format) : (format === 'png' || format === 'svg') ? downloadGraph : downloadGraphSVG
  })));

  groupDownloadContainer.appendChild(downloadButton);
}
function downloadGraphSVG() {
  const sourceElement = document.getElementById('plot-source');
  const plotElement = document.getElementById('plots');

  if (sourceElement) {
    sourceElement.style.display = 'block';
  }

  return toSvg(plotElement).then((data) => {
    if (sourceElement) {
      sourceElement.style.display = 'none';
    }

    const link = document.createElement('a');
    link.download = 'plot-svg';
    link.href = data;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}
function downloadGraph() {
  const temporaryContainer = elements.barContainer.cloneNode(true);
  const temporaryTitle = elements.title.cloneNode(true);

  const wrapperElement = document.createElement("div");
  wrapperElement.appendChild(temporaryTitle);
  wrapperElement.appendChild(temporaryContainer);

  const sourceDiv = document.createElement('div');
  sourceDiv.innerText = 'the source...';
  wrapperElement.appendChild(sourceDiv);

  return downloadElementAsImage(wrapperElement, "demographic-plot");
}
function updateTitle() {
  const level = state.spatialLevel === "county" ? "US county-level" : "US state-level";

  let compareString = [state.compareBar, state.compareFacet]
    .filter((d) => d !== "none")
    .map((d) => formatName("fields", d))
    .join(" and ");

  compareString = compareString ? ` by ${compareString}` : "";

  const compareSet = new Set([state.compareBar, state.compareFacet]);

  const selects = [
    { name: "Year", value: state.year },
    {
      name: "Location",
      value: state.areaState === "All" ? "US" : formatName("states", state.areaState),
    },
    { name: "Cause of death", value: formatCauseName(state.cause) },
    {
      name: formatName("fields", "sex"),
      value: state.sex,
      exclude: compareSet.has("sex"),
    },
    {
      name: formatName("fields", "race"),
      value: state.race,
      exclude: compareSet.has("race"),
    },
    {
      name: formatName("fields", "age_group"),
      value: state.ageGroup,
      exclude: compareSet.has("age_group"),
    },
  ];

  const selectsString = selects
    .filter((d) => !d.exclude)
    .map((d) => `${d.name}: ${d.value}`)
    .join("&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp");

  const title = `${level} ${formatName("measures", state.measure)}${compareString}. <br /> ${selectsString}`;
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
  const data = mortalityData; // Prepare the data if needed
  let str;

  if (format === "csv") {
    str = d3.csvFormat(data);
  } else if (format === "tsv") {
    str = d3.tsvFormat(data);
  } else {
    str = JSON.stringify(data, null, 2);
  }

  downloadStringAsFile(str, `${filename}.${format}`, `text/${format}`);
}
function plotTable() {
  const { compareBar, compareFacet, ageGroup } = state.query;

  let tableColumns = [...demographicTableColumns];

  if (compareBar === "age_group" || compareFacet === "age_group" || ageGroup !== "All") {
    tableColumns = tableColumns.filter(column => column.field !== "age_adjusted_rate");
  }

  plotDataTable(state.mortalityData, elements.tableContainer, { columns: tableColumns });
}
function changeView(view) {
  const isPlotView = view === "plot";
  const isTableView = view === "table";

  if (isPlotView) {
    elements.tableNavLink.classList.remove("active");
    elements.graphNavLink.classList.add("active");
    elements.barContainer.style.display = "block";
    elements.tableContainer.style.display = "none";
    elements.title.style.display = "block";

    state.trigger("plotConfig"); // Trigger a redraw for correct sizing.
  } else if (isTableView) {
    elements.graphNavLink.classList.remove("active");
    elements.tableNavLink.classList.add("active");
    elements.barContainer.style.display = "none";
    elements.tableContainer.style.display = "block";
    elements.title.style.display = "none";

    if (state.mortalityData.length > 0) {
      plotTable();
    }
  }
}
function updateLegend(data, query) {
  const legendContainer = document.getElementById("plot-legend");
  legendContainer.innerHTML = "";

  if (query.compareBar !== "none") {
    const colorDomainValues = [...new Set(data.map(d => d[query.compareBar]))].sort();
    const checkedValueSet = new Set(state.legendCheckValues);
    let selectedValues = colorDomainValues.filter(d => checkedValueSet.has(d));

    if (selectedValues.length === 0) {
      selectedValues = colorDomainValues;
    }

    const colorTickFormat = query.compareColor === "race"
      ? (d) => formatName("race", d)
      : (d) => d;

    const legend = checkableLegend(
      colorDomainValues,
      COLORS[query.compareBar],
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