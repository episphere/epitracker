/**
 * @file The input and basic control logic for the map page.
 * @author Lee Mason <masonlk@nih.gov>
 */
import { toSvg } from "https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/+esm"
import { start } from "../../main.js";
import { EpiTrackerData } from "../utils/EpiTrackerData.js";
import { State } from "../utils/State.js";
import { hookCheckbox, hookSelectChoices } from "../utils/input2.js";
import { plotMortalityMapGrid } from "../plots/mapPlots.js";
import {
  dataToTableData,
  downloadMortalityData,
  createDropdownDownloadButton,
  formatCauseName,
  createOptionSorter,
  sortCompare,
  addPopperTooltip,
  scaleGradient,
  CAUSE_SEX_MAP,
  grayOutSexSelectionBasedOnCause,
  plotDataTable
} from "../utils/helper.js";
import { downloadElementAsImage } from "../utils/download.js";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.8.5/+esm";
import { mapTableColumns } from "../utils/tableDefinitions.js";

window.onload = async () => {
  await start();
  init();
};

/**
 * Defining some of the necessary configuration options and default values.
 */
const COMPARABLE_FIELDS = ["race", "sex"];
const DATA_YEARS = ["2018", "2019", "2020", "2021", "2022", "2018-2022"];
const NUMERIC_MEASURES = [
  "crude_rate",
  "age_adjusted_rate",
  "deaths",
  "population",
];
const SPATIAL_LEVELS = ["county", "state"];

// The default state, shown if no URL params.
const INITIAL_STATE = {
  compareRow: "sex",
  compareColumn: "none",
  sex: "All",
  race: "All",
  year: "2022",
  measure: "age_adjusted_rate",
  cause: "All",
  spatialLevel: "county",
  areaState: "All",
  areaCounty: "All",
  scheme: "RdYlBu",
  colorReverse: true,
  colorCenterMean: true,
  colorExcludeOutliers: true,
  outlierCutoff: 3,
};

let state, dataManager;
let staticData, elements, choices, names;

/**
 * Setting up the properties in the state object. These will be used to control the logic of the page and connect the
 * HTML elements to the current state of the system. The values will be populated and modified when the data is loaded.
 */
function initializeState() {
  const initialState = { ...INITIAL_STATE };

  staticData.url = new URL(window.location.href);
  for (const [paramName, paramValue] of staticData.url.searchParams) {
    initialState[paramName] = paramValue;
  }

  state.defineProperty("compareRow", initialState.compareRow);
  state.defineProperty("compareRowOptions", null);
  state.defineProperty("compareColumn", initialState.compareColumn);
  state.defineProperty("compareColumnOptions", null);
  state.defineProperty("year", initialState.year);
  state.defineProperty("yearOptions", DATA_YEARS);
  state.defineProperty("cause", initialState.cause);
  state.defineProperty("causeOptions", null);
  state.defineProperty("measure", initialState.measure);
  state.defineProperty("measureOptions", NUMERIC_MEASURES);
  state.defineProperty("spatialLevel", initialState.spatialLevel);
  state.defineProperty("spatialLevelOptions", SPATIAL_LEVELS);
  state.defineProperty("areaState", initialState.areaState);
  state.defineProperty("areaStateOptions");
  state.defineProperty("areaCounty", initialState.areaCounty, ["areaState"]);
  state.defineProperty("areaCountyOptions", null, ["areaState"]);
  state.defineProperty("scheme", initialState.scheme);
  state.defineProperty("schemeOptions");
  state.defineProperty("colorReverse", initialState.colorReverse);
  state.defineProperty("colorReverseOptions");
  state.defineProperty("colorCenterMean", initialState.colorCenterMean);
  state.defineProperty("colorCenterMeanOptions");
  state.defineProperty("colorExcludeOutliers", INITIAL_STATE.outlierCutoff);
  state.defineProperty("outlierCutoff", INITIAL_STATE.outlierCutoff);

  // The compareRow and compareColumn properties can't be the same value (unless they are 'none'), handle that logic here.
  for (const [childProperty, parentProperty] of [
    ["compareRow", "compareColumn"],
    ["compareColumn", "compareRow"],
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
    "compareRow",
    "compareColumn",
  ]);
  state.defineProperty("raceOptions", []);
  state.defineProperty("sex", initialState.sex, [
    "compareRow",
    "compareColumn",
  ]);
  state.defineProperty("sexOptions", []);
  for (const compareProperty of ["compareRow", "compareColumn"]) {
    state.subscribe(compareProperty, () => {
      if (COMPARABLE_FIELDS.includes(state[compareProperty])) {
        state[state[compareProperty]] = "All";
      }
    });
  }

  state.defineJointProperty("query", [
    "compareRow",
    "compareColumn",
    "cause",
    "race",
    "sex",
    "year",
    "spatialLevel",
    "areaState",
    "areaCounty",
  ]);
  state.defineProperty("mortalityData", null, ["query"]);
  state.defineJointProperty("plotConfig", [
    "mortalityData",
    "query",
    "measure",
    "scheme",
    "colorReverse",
    "colorCenterMean",
    "colorExcludeOutliers",
    "outlierCutoff",
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
    { id: "#select-compare-row", propertyName: "compareRow" },
    { id: "#select-compare-column", propertyName: "compareColumn" },
    { id: "#select-select-race", propertyName: "race" },
    { id: "#select-select-sex", propertyName: "sex" },
    { id: "#select-select-cause", propertyName: "cause", searchable: true ,  format: causeFormat },
    { id: "#select-select-year", propertyName: "year", forceEnd: "2018-2022" },
    { id: "#select-measure", propertyName: "measure" },
    { id: "#select-level", propertyName: "spatialLevel" },
    { id: "#select-select-state", propertyName: "areaState", searchable: true },
    { id: "#select-color-scheme", propertyName: "scheme", searchable: true },
    {
      id: "#select-select-county",
      propertyName: "areaCounty",
      searchable: true,
    },
    // {id: "#select-scheme", propertyName: "scheme", searchable: true},
  ]) {
    const sorter =
      inputSelectConfig.propertyName !== "areaCounty"
        ? createOptionSorter(
            ["All", "None"],
            inputSelectConfig.propertyName == "year" ? ["2018-2022"] : []
          )
        : undefined;

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

  hookCheckbox("#check-reverse-color", state, "colorReverse");
  hookCheckbox("#check-center-mean-color", state, "colorCenterMean");
  hookCheckbox("#check-exclude-outliers", state, "colorExcludeOutliers");

  const outlierCutoffRange = document.getElementById("outlier-cutoff-range");
  const outlierCutoffRangeText = document.getElementById(
    "outlier-cutoff-range-text"
  );
  outlierCutoffRange.addEventListener("input", () => {
    state.outlierCutoff = outlierCutoffRange.value;
    outlierCutoffRangeText.innerText = "±" + outlierCutoffRange.value + "σ";
  });
  outlierCutoffRange.value = state.outlierCutoff;
  outlierCutoffRangeText.innerText = "±" + state.outlierCutoff + "σ";
}

export function init() {
  toggleLoading(true);

  state = new State();
  dataManager = new EpiTrackerData();

  staticData = {};
  elements = {};
  choices = {};

  initializeState();

  addGroupDownloadButton();

  const selectCountyElement = document.getElementById("select-select-county");
  if (selectCountyElement) {
    elements.selectChoicesListCounty =
      selectCountyElement.parentNode.nextSibling.lastChild;
    elements.selectChoicesListCounty.classList.add("text-secondary");
  }
  const selectSexElement = document.getElementById("select-select-sex");
  if (selectSexElement) {
    elements.selectChoicesListSex =
      selectSexElement.parentNode.nextSibling.lastChild;
  }
  elements.selectSex = document.getElementById("select-select-sex");
  elements.selectRace = document.getElementById("select-select-race");
  elements.mapNavLink = document.getElementById("map-nav-link");
  elements.tableNavLink = document.getElementById("table-nav-link");
  elements.mapsContainer = document.getElementById("plot-container");
  elements.mapGrid = document.getElementById("map-grid");
  elements.tableContainer = document.getElementById("table-container");
  elements.colorLegend = document.getElementById("color-legend");
  elements.mapTitle = document.getElementById("plot-title");
  elements.tableNavLink.addEventListener("click", () => {
    setTimeout(() => changeView("table"), 0);
  });
  elements.mapNavLink.addEventListener("click", () => changeView("plot"));
  elements.groupDownloadButton = document.querySelector(
    "#download-container button"
  );
  elements.outlierCutoffRange = document.getElementById("outlier-cutoff-range");

  state.subscribe("query", queryUpdated);
  state.subscribe("plotConfig", plotConfigUpdated);

  Promise.all([
    d3.json("../data/states.json"),
    d3.json("../data/geograpy/us_counties_simplified_more.json"),
    d3.json("../data/conceptMappings.json"),
    dataManager.getCountyMortalityData({ year: state.year }),
  ]).then(([stateGeoJSON, countyGeoJSON, nameMappings, mortalityData]) => {
    staticData.stateGeoJSON = stateGeoJSON;
    staticData.countyGeoJSON = countyGeoJSON;
    staticData.nameMappings = nameMappings;
    names = nameMappings;
    initialDataLoad(mortalityData, stateGeoJSON, countyGeoJSON, nameMappings);
  });
}

// =================================
// Primary state logic handlers
// =================================

function initialDataLoad(
  mortalityData,
  stateGeoJSON,
  countyGeoJSON,
  nameMappings
) {
  const fipsMap = new Map([["All", "All"]]);
  stateGeoJSON.features.forEach((d) => fipsMap.set(d.id, d.properties.name));
  countyGeoJSON.features.forEach((d) => fipsMap.set(d.id, d.properties.name));

  // Initialise the input state from the data
  state.compareRowOptions = ["none", ...COMPARABLE_FIELDS].map((field) => ({
    value: field,
    label: nameMappings.fields[field],
  }));
  state.compareColumnOptions = ["none", ...COMPARABLE_FIELDS].map((field) => ({
    value: field,
    label: nameMappings.fields[field],
  }));
  state.causeOptions = [...new Set(mortalityData.map((d) => d.cause))];
  state.sexOptions = [...new Set(mortalityData.map((d) => d.sex))];
  state.raceOptions = [...new Set(mortalityData.map((d) => d.race))];

  state.measureOptions = NUMERIC_MEASURES.map((field) => ({
    value: field,
    label: nameMappings.measures[field],
  }));
  state.spatialLevelOptions = SPATIAL_LEVELS.map((level) => ({
    value: level,
    label: nameMappings.fields[level],
  }));

  const areaStateSet = [
    ...new Set(mortalityData.map((d) => d.state_fips)),
  ].sort(sortCompare);
  const areaCountySet = [
    ...new Set(mortalityData.map((d) => d.county_fips)),
  ].sort();

  const areaStateOptions = areaStateSet.map((d) => ({
    value: d,
    label: fipsMap.get(d),
  }));

  const areaCountyOptions = areaCountySet.map((d) => ({
    value: d,
    label:
      d == "All"
        ? "All"
        : fipsMap.get(d) + ", " + nameMappings.states[d.slice(0, 2)].short,
  }));

  const groupedAreaCountyOptions = areaStateSet.map((d) => ({
    value: d,
    label: fipsMap.get(d),
    choices: areaCountySet
      .filter((i) => i.startsWith(d))
      .map((i) => ({
        value: i,
        label:
          fipsMap.get(i) +
          (d !== "All" ? ", " + nameMappings.states[d].short : ""),
      }))
      .sort((a, b) => sortCompare(a, b, "name")),
  }));

  state.areaStateOptions = areaStateOptions;
  state.subscribe("areaState", (areaState) => {
    if (areaState != "All") {
      state.areaCountyOptions = [
        "All",
        ...areaCountyOptions.filter((d) => d.value.startsWith(areaState)),
      ];
    } else {
      state.areaCountyOptions = groupedAreaCountyOptions;
    }
    state.areaCounty = "All";
  });

  state.schemeOptions = Object.entries(nameMappings.colorSchemes).map(
    ([k, name]) => {
      const colorScale = d3.scaleSequential(d3["interpolate" + k]);
      const div = document.createElement("div");
      const labelSpan = document.createElement("span");
      labelSpan.innerText = name;
      div.appendChild(scaleGradient(colorScale, 6, 100));
      div.appendChild(labelSpan);
      div.value = name;
      return { value: k, label: div.outerHTML };
    }
  );

  setInputsEnabled(true);

  state.trigger("areaState"); // Updates the county options and also triggers the initial query.

  initializeResetQuery();
}

function initializeResetQuery() {
  const resetButton = document.getElementById("reset-query");
  if (resetButton) {
    resetButton.onclick = () => {
      const { measure, scheme, ...restInitialState } = INITIAL_STATE;

      for (const [key, value] of Object.entries(restInitialState)) {
        if (state.hasProperty(key)) {
          state[key] = value;
        }
      }
    };
  }
}

function updateURLParam(value, param) {
  const url = staticData.url;
  if (INITIAL_STATE[param] != value) {
    url.searchParams.set(param, value);
  } else {
    url.searchParams.delete(param);
  }

  if (CAUSE_SEX_MAP[value]) {
    state.sex = CAUSE_SEX_MAP[value]
  }

  history.replaceState({}, "", staticData.url.toString());
}

function updateDisableResetQueryButton() {
  const queryParams = staticData.url.search;
  const resetButton = document.getElementById("reset-query");
  if (resetButton) {
    resetButton.disabled = !queryParams;
  }
}

async function queryUpdated(query) {
  toggleLoading(true);

  updateDisableResetQueryButton();

  if (query.compareRow == "race" || query.compareColumn == "race") {
    choices["#select-select-race"].disable();
  } else {
    choices["#select-select-race"].enable();
  }
  if (query.compareRow == "sex" || query.compareColumn == "sex") {
    choices["#select-select-sex"].disable();
  } else {
    choices["#select-select-sex"].enable();
  }

  if (query.spatialLevel == "state") {
    choices["#select-select-county"].disable();
  } else {
    choices["#select-select-county"].enable();
  }

  const dataQuery = {
    year: query.year,
    cause: query.cause,
    race: query.race,
    sex: query.sex,
    state_fips: query.areaState != "All" ? query.areaState : "*",
    county_fips: query.areaCounty,
  };

  if (query.spatialLevel == "county" && query.areaCounty == "All") {
    dataQuery.county_fips = "*";
  } else if (query.spatialLevel == "state") {
    dataQuery.state_fips = "*";
    dataQuery.county_fips = "All";
  }

  if (query.compareRow != "none") dataQuery[query.compareRow] = "*";
  if (query.compareColumn != "none") dataQuery[query.compareColumn] = "*";

  let mortalityData = await dataManager.getCountyMortalityData(dataQuery, {
    includeTotals: false,
    counties: state.areaCountyOptions,
    states: state.areaStateOptions,
  });

  grayOutSexSelectionBasedOnCause(query, elements)

  state.mortalityData = mortalityData; //.filter(d => )

  //  TODO: Whatever this is, it probably needs to go. 
  // if (elements.selectChoicesListCounty) {
  //   // NOTE: This is for changes choices option color
  //   const mortalityDataWithCounties = await dataManager.getCountyMortalityData(
  //     dataQuery,
  //     { includeTotals: false, includeCountyFips: true }
  //   );
  //   const uniqueCountiesData = [
  //     ...new Set(mortalityDataWithCounties.map((d) => d.county_fips)),
  //   ];

  //   uniqueCountiesData.forEach((county) => {
  //     const elementCountyItem = elements.selectChoicesListCounty.querySelector(
  //       `[data-value='${county}']`
  //     );
  //     if (elementCountyItem) {
  //       elementCountyItem.classList.add("text-dark");
  //     }
  //   });
  // }
}

function plotConfigUpdated(plotConfig) {
  toggleLoading(true);

  let primaryGeoJSON =
    plotConfig.query.spatialLevel == "county"
      ? staticData.countyGeoJSON
      : staticData.stateGeoJSON;
  let overlayGeoJSON =
    plotConfig.query.spatialLevel == "county" ? staticData.stateGeoJSON : null;

  if (plotConfig.query.areaCounty != "All") {
    primaryGeoJSON = {
      type: "FeatureCollection",
      features: primaryGeoJSON.features.filter(
        (d) => d.id == plotConfig.query.areaCounty
      ),
    };
    overlayGeoJSON = null;
  } else if (plotConfig.query.areaState != "All") {
    primaryGeoJSON = {
      type: "FeatureCollection",
      features: primaryGeoJSON.features.filter((d) =>
        d.id.startsWith(plotConfig.query.areaState)
      ),
    };
    overlayGeoJSON = null;
  }

  if (plotConfig.colorExcludeOutliers) {
    elements.outlierCutoffRange.removeAttribute("disabled");
  } else {
    elements.outlierCutoffRange.setAttribute("disabled", "");
  }
  const legendContainer = document.getElementById("color-legend");

  const featureNameFormat = (feature) => {
    let name = feature.properties.name;
    if (feature.id.length == "5") {
      // If the feature is a county, add the corresponding state's short name to the end of the name.
      name +=
        ", " + staticData.nameMappings["states"][feature.id.slice(0, 2)].short;
    }
    return name;
  };

  //if (elements.)

  if (!state.onSettingsClick) {
    const plotsElement = document.getElementById("plots");
    const colorSettingsTooltip = addPopperTooltip(plotsElement);
    const colorSettingsElement = document.getElementById(
      "color-settings-dropdown"
    );
    const colorSettingsClose = document.getElementById("color-settings-close");

    let tooltipShown = false;
    state.onSettingsClick = (settingsButton) => {
      colorSettingsElement.style.display = "flex";
      if (tooltipShown) {
        colorSettingsTooltip.hide();
      } else {
        colorSettingsTooltip.show(settingsButton, colorSettingsElement);
      }
      tooltipShown = !tooltipShown;
    };

    colorSettingsClose.addEventListener("click", () => {
      tooltipShown = !tooltipShown;
      colorSettingsTooltip.hide();
    });
  }

  if (plotConfig.mortalityData.length == 0) {
    elements.mapGrid.innerHTML =
      "<i> There is no data for this selection. </i>";
    elements.tableContainer.innerHTML =
      "<i> There is no data for this selection. </i>";
    elements.colorLegend.innerHTML = "";
    elements.groupDownloadButton.setAttribute("disabled", "");
  } else {
    const isActiveTable = elements.tableNavLink.classList.contains("active");
    if (isActiveTable) {
      plotTable();
    } else {
      plotMortalityMapGrid(
        elements.mapGrid,
        legendContainer,
        plotConfig.mortalityData,
        primaryGeoJSON,
        {
          state,
          overlayFeatureCollection: overlayGeoJSON,
          rowField: plotConfig.query.compareRow,
          columnField: plotConfig.query.compareColumn,
          level: plotConfig.query.spatialLevel,
          measureField: plotConfig.measure,
          measureLabel: staticData.nameMappings["measures"][plotConfig.measure],
          scheme: plotConfig.scheme,
          featureNameFormat,
          outlierThreshold: state.colorExcludeOutliers
            ? state.outlierCutoff
            : null,
          reverseColorScheme: plotConfig.colorReverse,
          centerColorMean: plotConfig.colorCenterMean,
          onSettingsClick: state.onSettingsClick,
        }
      );
    }

    elements.groupDownloadButton.removeAttribute("disabled");
  }

  initMapCellResize();
  updateMapTitle();

  toggleLoading(false);
}

// =================================
// Other inputs
// =================================

function changeView(view) {
  toggleLoading(true);
  // TODO: Improve user experience by redrawing only on change. Use deferred drawing model from previous code.

  setTimeout(() => {
    if (view == "plot") {
      elements.tableNavLink.classList.remove("active");
      elements.mapNavLink.classList.add("active");
      elements.mapsContainer.style.display = "block";
      elements.tableContainer.style.display = "none";
      elements.colorLegend.style.display = "block";

      state.trigger("plotConfig"); // Trigger a redraw so sizing is correct.
    } else if (view == "table") {
      elements.mapNavLink.classList.remove("active");
      elements.tableNavLink.classList.add("active");
      elements.mapsContainer.style.display = "none";
      elements.tableContainer.style.display = "block";
      elements.colorLegend.style.display = "none";

      if (state.mortalityData.length > 0) {
        plotTable();
      }
    }

    toggleLoading(false);
  }, 10);
}

// =================================
// Helper functions
// =================================

function addGroupDownloadButton() {
  // TODO: More detailed filename based on inputs
  const baseFilename = "epitracker_spatial";

  // TODO: Resume, try callbacks for
  const groupDownloadContainer = document.getElementById("download-container");
  const downloadButton = createDropdownDownloadButton(false, [
    {
      label: "Download data (CSV)",
      listener: (callback) => {
        downloadMortalityData(state.mortalityData, baseFilename, "csv");
      },
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
    { label: "Download maps (PNG)", listener: downloadMapGrid },
    { label: "Download maps (SVG)", listener: downloadMapSVG },
  ]);
  groupDownloadContainer.appendChild(downloadButton);
}

function initMapCellResize() {
  const previousSizes = new Map();

  const mapGrid = document.getElementById("map-grid");
  for (const child of mapGrid.children) {
    if (
      child.classList.contains("map-grid-cell") &&
      !child.classList.contains("map-grid-label")
    ) {
      const clientRect = child.getBoundingClientRect();
      previousSizes.set(child, [clientRect.width, clientRect.height]);
      const resizeObserver = new ResizeObserver(() => {
        resizeMap(child, previousSizes.get(child));
        const clientRect = child.getBoundingClientRect();
        previousSizes.set(child, [clientRect.width, clientRect.height]);
      });
      resizeObserver.observe(child);
    }
  }
}

// TODO: Continue with resizing. Will require some thought because if the SVG is scaled up, the cell won't know what
// size it should be when scaled back down. Perhaps reference to size of the wider map container...?
function resizeMap(mapCellElement, previousSize) {
  // const svg = mapCellElement.querySelector("svg")
  // const cellWidth = mapCellElement.getBoundingClientRect().width
  // const scalingFactor = cellWidth / previousSize[0]
  // const svgWidth = svg.getAttribute("width")
  // // console.log(cellHeight, svgHeight)
  // svg.setAttribute("width", svgWidth*scalingFactor)
  // console.log(cellWidth, previousSize[0])
}

function downloadMapSVG() {
  const plotsElement = document.getElementById("plots")
  const legendButtonsElement = plotsElement.getElementsByClassName("legend-buttons")[0]
  if (legendButtonsElement) {
    legendButtonsElement.style.display = "none"
  }
  const sourceElement = document.getElementById('plot-source')
  if (sourceElement) {
    sourceElement.style.display = 'block'
  }
  return toSvg(plotsElement)
  .then((data) => {
    if (sourceElement) {
      sourceElement.style.display = 'none'
    }
    const link = document.createElement('a')
    link.download = 'map-svg';
    link.href = data;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    legendButtonsElement.style.display = "flex"
  })
}

function downloadMapGrid() {
  const mapGrid = document.getElementById("map-grid");
  const temporaryGrid = mapGrid.cloneNode();

  for (const child of mapGrid.children) {
    if (
      child.classList.contains("map-grid-cell") &&
      !child.classList.contains("map-grid-label")
    ) {
      let mapSvg = child.querySelector("svg");
      if (mapSvg) {
        mapSvg = mapSvg.cloneNode(true);
        const clonedCell = child.cloneNode(false);
        clonedCell.appendChild(mapSvg);
        temporaryGrid.appendChild(clonedCell);
      }
    } else {
      temporaryGrid.appendChild(child.cloneNode(true));
    }
  }

  temporaryGrid.style.width = "fit-content";

  const legend = elements.colorLegend
    .querySelector(".legend-wrapper svg")
    .cloneNode(true);
  legend.style.backgroundColor = "white";

  const temporaryDiv = document.createElement("div");
  temporaryDiv.className = "d-flex flex-column gap-2 p-3";
  temporaryDiv.appendChild(
    document.getElementById("plot-title").cloneNode(true)
  );
  temporaryDiv.appendChild(legend);
  temporaryDiv.appendChild(temporaryGrid);
  const sourceDiv = document.createElement('div')
  sourceDiv.innerText = 'the source...'
  temporaryDiv.appendChild(sourceDiv);
  return downloadElementAsImage(temporaryDiv, "epitracker-map");
}

function updateMapTitle() {
  const level =
    state.spatialLevel == "county" ? "US county-level" : "US state-level";
  let compareString = [state.compareRow, state.compareColumn]
    .filter((d) => d != "none")
    .map((d) => names.fields[d].toLowerCase())
    .join(" and ");

  if (compareString != "") {
    compareString = " by " + compareString;
  }
  const compareSet = new Set([state.compareRow, state.compareColumn]);
  const selects = [
    { name: "Year", value: state.year },
    {
      name: "Location",
      value: (() => {
        // TODO: Name counties
        if (state.areaCounty != "All") {
          return state.areaCounty;
        } else {
          return state.areaState == "All"
            ? "US"
            : staticData.nameMappings.states[state.areaState].name;
        }
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
  ];
  const selectsString = selects
    .filter((d) => !d.exclude)
    .map((d) => `${d.name}: ${d.value}`)
    .join("&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp");

  const title = `${level} ${staticData.nameMappings.measures[
    state.measure
  ].toLowerCase()} ${compareString}. </br> ${selectsString}`;
  elements.mapTitle.innerHTML = title;
}

function plotTable() {
  plotDataTable(state.mortalityData, elements.tableContainer, {
    columns: mapTableColumns
  }) //, ["state_fips"])//["cause", "race", "sex", "state", "county"])
}

function setInputsEnabled(enabled) {
  for (const input of [
    "select-compare-row",
    "select-compare-column",
    "select-select-race",
    "select-select-sex",
    "select-select-cause",
    "select-select-year",
    "select-measure",
    "select-level",
    "select-select-state",
    "select-select-county",
    // "select-scheme",
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

function toggleLoading(loading, soft = false) {
  // TODO: Reimplement

  if (loading) {
    document.getElementById("plot-container").style.opacity = soft
      ? "0.5"
      : "0";
    document.getElementById("plot-title").style.opacity = soft ? "0.5" : "0";
    document.getElementById("color-legend").style.opacity = soft ? "0.5" : "0";
    document.getElementById("loader-container").style.visibility = "visible";
    document.getElementById("table-container").style.visibility = "hidden";
  } else {
    document.getElementById("plot-container").style.opacity = "1";
    document.getElementById("plot-title").style.opacity = "1";
    document.getElementById("color-legend").style.opacity = "1";
    document.getElementById("loader-container").style.visibility = "hidden";
    document.getElementById("table-container").style.visibility = "visible";
  }

  // if (loading) {
  //   document.getElementById("plots-container").style.opacity = soft ? "0.5" : "0";
  //   document.getElementById("loader-container").style.visibility = "visible";
  // } else {
  //   document.getElementById("plots-container").style.opacity = "1";
  //   document.getElementById("loader-container").style.visibility = "hidden";
  // }
}