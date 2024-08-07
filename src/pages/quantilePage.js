import {
  Tabulator,
  FrozenColumnsModule,
  SortModule,
} from "https://cdn.jsdelivr.net/npm/tabulator-tables@6.2.1/+esm";
import { toSvg } from "https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/+esm";
import { start } from "../../main.js";
import { EpiTrackerData } from "../utils/EpiTrackerData.js";
import { State } from "../utils/State.js";
import { checkableLegend } from "../utils/checkableLegend.js";
import { downloadElementAsImage } from "../utils/download.js";
import {
  createDropdownDownloadButton,
  createOptionSorter,
  downloadMortalityData,
  formatCauseName,
  grayOutSexSelectionBasedOnCause,
  CAUSE_SEX_MAP,
  plotDataTable,
  addPopperTooltip
} from "../utils/helper.js";
import { hookSelectChoices, hookCheckbox } from "../utils/input2.js";
import { plotQuantileScatter } from "../plots/quantilePlots.js";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.8.5/+esm";
import { quantileTableColumns } from "../utils/tableDefinitions.js";

Tabulator.registerModule([FrozenColumnsModule, SortModule]);

window.onload = async () => {
  await start();
  init();
};

/**
 * Defining some of the necessary configuration options and default values.
 */
const COMPARABLE_FIELDS = ["race", "sex"];
const DATA_YEARS = ["2018", "2019", "2020", "2021", "2022", "2018-2022"];
const QUANTILE_NUMBERS = ["4", "5", "10"];
// TODO: here...
const NUMERIC_MEASURES = [
  "age_adjusted_rate",
  "crude_rate",
  "age_adjusted_rate_ratio (ref=low)",
  "age_adjusted_rate_ratio (ref=high)",
  "crude_rate_ratio(ref=low)",
  "crude_rate_ratio (ref=high)",
];

// The default state, shown if no URL params.
const INITIAL_STATE = {
  compareColor: "none",
  compareFacet: "none",
  sex: "All",
  race: "All",
  year: "2022",
  measure: "age_adjusted_rate",
  cause: "All",
  quantileField: "adult_smoking",
  quantileNumber: "4",
  showLines: true,
  startZero: true,
};

let state, dataManager;
let elements, choices, staticData, names;

export function init() {
  toggleLoading(true);

  state = new State();
  dataManager = new EpiTrackerData();

  elements = {};
  choices = {};
  staticData = {};

  initializeState();
  addDownloadButton();
  const selectSexElement = document.getElementById("select-select-sex");
  if (selectSexElement) {
    elements.selectChoicesListSex =
      selectSexElement.parentNode.nextSibling.lastChild;
  }
  elements.selectSex = document.getElementById("select-select-sex");
  elements.selectRace = document.getElementById("select-select-race");
  elements.graphNavLink = document.getElementById("graph-nav-link");
  elements.tableNavLink = document.getElementById("table-nav-link");
  elements.graphContainer = document.getElementById("plot-container");
  elements.plotContainer = document.getElementById("plot-quantiles");
  elements.tableContainer = document.getElementById("table-container");
  elements.plotLegend = document.getElementById("plot-legend");
  elements.tableNavLink.addEventListener("click", () => changeView("table"));
  elements.graphNavLink.addEventListener("click", () => changeView("plot"));
  elements.groupDownloadButton = document.querySelector(
    "#group-download-container button"
  );
  elements.graphTitle = document.getElementById("plot-title");

  Promise.all([
    d3.json("../data/conceptMappings.json"),
    d3.json("../data/quantile/quantile_details.json"),
    dataManager.getQuantileMortalityData({ year: "2022", num_quantiles: 4 }),
  ]).then(([nameMappings, quantileDetails, mortalityData]) => {
    intitialDataLoad(mortalityData, quantileDetails, nameMappings);
  });
}

function initializeState() {
  const initialState = { ...INITIAL_STATE };

  staticData.url = new URL(window.location.href);
  for (const [paramName, paramValue] of staticData.url.searchParams) {
    initialState[paramName] = paramValue;
  }

  state.defineProperty("compareColor", initialState.compareColor);
  state.defineProperty("compareColorOptions", null);
  state.defineProperty("compareFacet", initialState.compareFacet);
  state.defineProperty("compareFacetOptions", null);
  state.defineProperty("year", initialState.year);
  state.defineProperty("yearOptions", DATA_YEARS);
  state.defineProperty("cause", initialState.cause);
  state.defineProperty("causeOptions", null);
  state.defineProperty("measure", initialState.measure);
  state.defineProperty("measureOptions", NUMERIC_MEASURES);
  state.defineProperty("quantileField", initialState.quantileField);
  state.defineProperty("quantileFieldOptions", null);
  state.defineProperty("quantileNumber", initialState.quantileNumber);
  state.defineProperty("quantileNumberOptions", null);
  state.defineProperty("quantileRanges", null);
  state.defineProperty("nameMappings", null);

  // The compareRow and compareColumn properties can't be the same value (unless they are 'none'), handle that logic here.
  for (const [childProperty, parentProperty] of [
    ["compareColor", "compareFacet"],
    ["compareFacet", "compareColor"],
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
    "compareColor",
    "compareFacet",
  ]);
  state.defineProperty("raceOptions", []);
  state.defineProperty("sex", initialState.sex, [
    "compareColor",
    "compareFacet",
  ]);
  state.defineProperty("sexOptions", []);
  for (const compareProperty of ["compareColor", "compareFacet"]) {
    state.subscribe(compareProperty, () => {
      if (COMPARABLE_FIELDS.includes(state[compareProperty])) {
        state[state[compareProperty]] = "All";
      }
    });
  }

  state.defineProperty("showLines", initialState.showLines);
  state.defineProperty("startZero", initialState.startZero);

  state.defineJointProperty("query", [
    "compareColor",
    "compareFacet",
    "cause",
    "race",
    "sex",
    "year",
    "quantileField",
    "quantileNumber",
  ]);
  state.defineProperty("legendCheckValues", null, "query");
  state.defineProperty("mortalityData", null, ["query"]);
  state.defineJointProperty("plotConfig", [
    "mortalityData",
    "query",
    "measure",
    "showLines",
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
    { id: "#select-compare-color", propertyName: "compareColor" },
    { id: "#select-compare-facet", propertyName: "compareFacet" },
    { id: "#select-select-race", propertyName: "race" },
    { id: "#select-select-sex", propertyName: "sex" },
    { id: "#select-select-cause", propertyName: "cause", searchable: true, format: causeFormat },
    { id: "#select-select-year", propertyName: "year", forceEnd: "2018-2022" },
    { id: "#select-measure", propertyName: "measure" },
    {
      id: "#select-quantile-field",
      propertyName: "quantileField",
      searchable: true,
    },
    { id: "#select-quantile-number", propertyName: "quantileNumber" },
  ]) {
    const sorter =
      inputSelectConfig.propertyName !== "measure"
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

  hookCheckbox("#check-show-lines", state, "showLines");
  hookCheckbox("#check-start-zero", state, "startZero");

  state.subscribe("query", queryUpdated);
  state.subscribe("plotConfig", plotConfigUpdated);
}

// =================================
// Primary state logic handlers
// =================================

function intitialDataLoad(mortalityData, quantileDetails, nameMappings) {
  names = nameMappings;
  staticData.quantileDetails = d3.index(
    quantileDetails,
    (d) => d.year,
    (d) => d.nQuantiles,
    (d) => d.field
  ); //quantileDetails;

  // Initialise the input state from the data
  state.compareColorOptions = ["none", ...COMPARABLE_FIELDS].map((field) => ({
    value: field,
    label: nameMappings.fields[field],
  }));
  state.compareFacetOptions = ["none", ...COMPARABLE_FIELDS].map((field) => ({
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
  state.nameMappings = names

  state.quantileFieldOptions = [
    ...new Set(mortalityData.map((d) => d.quantile_field)),
  ].map((field) => ({
    value: field,
    label: nameMappings["quantile_fields"][field].measure,
    unit: nameMappings["quantile_fields"][field].unit,
  }));
  state.quantileNumberOptions = QUANTILE_NUMBERS;

  state.trigger("query");

  let resizeTimeout;
  const resizeObserver = new ResizeObserver(() => {
    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
    }

    resizeTimeout = setTimeout(() => {
      state.trigger("plotConfig");
    }, 25);
  });
  resizeObserver.observe(elements.plotContainer);

  setInputsEnabled();
}

async function queryUpdated(query) {
  toggleLoading(true);

  if (query.compareColor == "race" || query.compareFacet == "race") {
    choices["#select-select-race"].disable();
  } else {
    choices["#select-select-race"].enable();
  }
  if (query.compareColor == "sex" || query.compareFacet == "sex") {
    choices["#select-select-sex"].disable();
  } else {
    choices["#select-select-sex"].enable();
  }

  const dataQuery = {
    year: query.year,
    sex: query.sex,
    cause: query.cause,
    race: query.race,
    quantile_field: query.quantileField,
    num_quantiles: query.quantileNumber,
  };

  if (query.compareColor != "none") dataQuery[query.compareColor] = "*";
  if (query.compareFacet != "none") dataQuery[query.compareFacet] = "*";

  let data = await dataManager.getQuantileMortalityData(dataQuery, {
    includeTotals: false,
  });

  const year = query.year.split("-").at(-1);
  const quantileDetails = staticData.quantileDetails
    .get(year)
    .get(dataQuery.num_quantiles)
    .get(dataQuery.quantile_field);

  const xTicks = quantileDetailsToTicks(quantileDetails);
  state["quantileRanges"] = xTicks;

  data = data.map((row) => {
    row["quantile_range"] = xTicks[row.quantile - 1];

    const key =
      query.compareFacet !== "none"
        ? query.compareFacet
        : query.compareColor !== "none"
        ? query.compareColor
        : "sex";
    if (query.compareColor === "sex") {
      const filteredData =
        query.compareFacet === "race"
          ? data.filter(
              (i) =>
                i.race.toLowerCase() === row.race.toLowerCase() &&
                i.sex.toLowerCase() === row.sex.toLowerCase()
            )
          : data;
      getAgeAdjustedRateData(filteredData, row, key);
    } else if (query.compareColor === "race") {
      const filteredData =
        query.compareFacet === "sex"
          ? data.filter(
              (i) =>
                i.race.toLowerCase() === row.race.toLowerCase() &&
                i.sex.toLowerCase() === row.sex.toLowerCase()
            )
          : data;
      getAgeAdjustedRateData(filteredData, row, key);
    } else {
      getAgeAdjustedRateData(data, row, key);
    }

    for (const measure of NUMERIC_MEASURES) {
      const se = row[measure] / Math.sqrt(row.deaths);
      row[measure + "_low"] = parseFloat((row[measure] - 1.96 * se).toFixed(2));
      row[measure + "_high"] = parseFloat(
        (row[measure] + 1.96 * se).toFixed(2)
      );
    }
    const rowKeys = Object.keys(row);
    const temporaryKeys = [];
    const quantileKeyIndex = rowKeys.findIndex((key) => key === "quantile");
    if (quantileKeyIndex !== -1) {
      temporaryKeys.push(
        ...rowKeys.slice(0, quantileKeyIndex + 1),
        "quantile_range"
      );
      temporaryKeys.push(
        ...rowKeys
          .filter((i) => i !== "quantile_range")
          .slice(quantileKeyIndex + 1)
      );
    } else {
      temporaryKeys.push(...rowKeys);
    }

    return temporaryKeys.reduce((pv, cv) => {
      return { ...pv, [cv]: row[cv] };
    }, {});
  });
  grayOutSexSelectionBasedOnCause(query, elements);

  state.mortalityData = data;

  console.log({data})

  updateLegend(data, query);
}
function plotConfigUpdated(plotConfig) {
  const measureDetails = names.quantile_fields[plotConfig.query.quantileField];

  const xTickFormat = (_, i) => {
    return state["quantileRanges"][i]
  };

  const quantileFieldUnit = () => {
    const quantileField = state["quantileField"];
    return (
      state["quantileFieldOptions"].find((i) => i.value === quantileField)
        .unit ?? ""
    );
  };

  let data = plotConfig.mortalityData;
  if (plotConfig.query.compareColor != "none") {
    const legendCheckSet = new Set(plotConfig.legendCheckValues);
    data = plotConfig.mortalityData.filter((d) =>
      legendCheckSet.has(d[plotConfig.query.compareColor])
    );
  }

  const colorFunction =
    plotConfig.query.compareColor != "none"
      ? (d) => d[plotConfig.query.compareColor]
      : null;

  let colorDomainValues = null;
  if (colorFunction) {
    colorDomainValues = [
      ...new Set(plotConfig.mortalityData.map(colorFunction)),
    ];
    colorDomainValues.sort();
  }

  const formatRace = (d) => names.race[d]?.formatted;
  const facetTickFormat =
    plotConfig.query.compareFacet == "race" ? formatRace : (d) => d;
  const colorTickFormat =
    plotConfig.query.compareColor == "race" ? formatRace : (d) => d;

  const legendContainer = document.getElementById("setting-legend");

  if (!state.onSettingsClick) {
    const plotsElement = document.getElementById("plots");
    const settingsTooltip = addPopperTooltip(plotsElement);
    const settingsElement = document.getElementById(
      "settings-dropdown"
    );
    const settingsClose = document.getElementById("settings-close");

    let tooltipShown = false;
    state.onSettingsClick = (settingsButton) => {
      settingsElement.style.display = "flex";
      if (tooltipShown) {
        settingsTooltip.hide();
      } else {
        settingsTooltip.show(settingsButton, settingsElement);
      }
      tooltipShown = !tooltipShown;
    };

    settingsClose.addEventListener("click", () => {
      tooltipShown = !tooltipShown;
      settingsTooltip.hide();
    });
  }

  if (state.mortalityData.length == 0) {
    elements.plotContainer.innerHTML =
      "<i> There is no data for this selection. </i>";
    elements.tableContainer.innerHTML =
      "<i> There is no data for this selection. </i>";
  } else {
    const isActiveTable = elements.tableNavLink.classList.contains("active");

    if (isActiveTable) {
      plotTable();
    } else {
      // console.log("Plot height", elements.plotContainer.getBoundingClientRect().height)
      // elements.plotContainer.innerHTML = ''
      // elements.plotContainer.appendChild(Plot.plot({
      //   height: elements.plotContainer.getBoundingClientRect().height*.95,
      //   marks: [
      //     Plot.dot([{x:0, y:0}, {x:1, y:1}], {x: "x", y: "y"})
      //   ]
      // }))
      plotQuantileScatter(elements.plotContainer, legendContainer, data, {
        valueField: plotConfig.measure,
        facet:
          plotConfig.query.compareFacet != "none"
            ? plotConfig.query.compareFacet
            : null,
        intervalFields: [
          plotConfig.measure + "_low",
          plotConfig.measure + "_high",
        ],
        color: colorFunction,
        drawLines: state.showLines,
        yStartZero: state.startZero,
        xLabel: `${measureDetails.measure} (${
          measureDetails.unit === "Proportion"
            ? "Percentage"
            : measureDetails.unit
        })`,
        yLabel: names.measures[plotConfig.measure],
        facetLabel: names.fields[state.compareFacet],
        xTickFormat: xTickFormat,
        quantileFieldUnit: quantileFieldUnit(),
        tooltipFields: [
          plotConfig.query.compareFacet,
          plotConfig.query.compareColor,
        ].filter((d) => d != "none"),
        colorDomain: colorDomainValues,
        facetTickFormat,
        colorTickFormat,
        onSettingsClick: state.onSettingsClick,
        nameMappings: state.nameMappings
      });
    }
  }

  updateGraphTitle();
  toggleLoading(false);
}

// =================================
// Other inputs
// =================================

function updateLegend(data, query) {
  const legendContainer = document.getElementById("plot-legend");
  legendContainer.innerHTML = ``;

  if (query.compareColor != "none") {
    const colorDomainValues = [
      ...new Set(data.map((d) => d[query.compareColor])),
    ].sort();
    const checkedValueSet = new Set(state.legendCheckValues);
    let selectedValues = colorDomainValues.filter((d) =>
      checkedValueSet.has(d)
    );
    if (selectedValues.length == 0) selectedValues = colorDomainValues;

    const formatRace = (d) => names.race[d]?.formatted;
    const colorTickFormat =
      query.compareColor == "race" ? formatRace : (d) => d;
    const legend = checkableLegend(
      colorDomainValues,
      d3.schemeTableau10,
      selectedValues,
      colorTickFormat,
      true
    );
    legendContainer.appendChild(legend);

    legend.addEventListener("change", () => {
      state.legendCheckValues = legend.getValues();
    });

    state.legendCheckValues = legend.getValues();
  }
}

function changeView(view) {
  toggleLoading(true);

  if (view == "plot") {
    elements.tableNavLink.classList.remove("active");
    elements.graphNavLink.classList.add("active");
    elements.graphContainer.style.display = "flex";
    elements.tableContainer.style.display = "none";
    elements.plotLegend.style.display = "block";

    state.trigger("plotConfig"); // Trigger a redraw so sizing is correct.
  } else if (view == "table") {
    elements.graphNavLink.classList.remove("active");
    elements.tableNavLink.classList.add("active");
    elements.graphContainer.style.display = "none";
    elements.tableContainer.style.display = "block";
    elements.plotLegend.style.display = "none";

    if (state.mortalityData.length > 0) {
      plotTable();
    }
  }

  toggleLoading(false);
}

// =================================
// Helper functions
// =================================

function addDownloadButton() {
  const baseFilename = "epitracker_quantile";

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
    const link = document.createElement("a");
    link.download = "plot-svg";
    link.href = data;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}

function downloadGraph() {
  const temporaryContainer = elements.graphContainer.cloneNode(true);
  const temporaryLegend = elements.plotLegend.cloneNode(true);
  const temporaryTitle = elements.graphTitle.cloneNode(true);

  const sourceSvgElement = elements.graphContainer.getElementsByTagName('svg')[0]
  const sourceSvgElementHeight = sourceSvgElement.getBBox().height

  const svgElement = temporaryContainer.getElementsByTagName('svg')[0]
  svgElement.style.height = `${sourceSvgElementHeight}px`;

  const legendChecks = temporaryLegend.querySelectorAll(".legend-check");
  legendChecks.forEach((check) => {
    if (!check.hasAttribute("checked")) {
      check.style.display = "none";
    }
  });

  const checkPaths = temporaryLegend.querySelectorAll(".legend-check path");
  checkPaths.forEach((path) => (path.style.visibility = "hidden"));

  const wrapperElement = document.createElement("div");
  wrapperElement.appendChild(temporaryLegend);
  wrapperElement.appendChild(temporaryTitle);
  wrapperElement.appendChild(temporaryContainer);
  const sourceDiv = document.createElement('div')
  sourceDiv.innerText = 'the source...'
  wrapperElement.appendChild(sourceDiv);
  return downloadElementAsImage(wrapperElement, "epitracker-quantile-plot");
}

/**
 * Get ticks for x-axis of quantile plot. Ticks are formatted so that if any number has a string length larger than
 * a fixed number, then all ticks are converted to scientific notation. Precision is set to fixed number.
 * @param {*} quantileDetails
 * @returns
 */
function quantileDetailsToTicks(quantileDetails) {
  // TODO: Automatically find an appropriate value for precision.

  // Get ticks for x-axis of quantile plot. Ticks are formatted so that if any number has a string length larger than
  // a fixed number, then all ticks are converted to scientific notation. Precision is set to fixed number.
  if (quantileDetails) {
    let ranges = quantileDetails.quantileRanges.map((range) =>
      range.map((d) => Number(d.toPrecision(2)).toString())
    );
    const exp = d3.merge(ranges).some((d) => d.length > 6);
    for (let i = 0; i < ranges.length; i++) {
      if (exp) {
        ranges[i] = ranges[i].map((d) => parseFloat(d));
      } else {
        ranges[i] = ranges[i].map((d) =>
          parseFloat(d).toLocaleString("en-US", { maximumFractionDigits: 8 })
        );
      }
    }
    return ranges.map((d) => d.join(" - "));
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
    state.sex = CAUSE_SEX_MAP[value];
  }
  history.replaceState({}, "", staticData.url.toString());
}

function setInputsEnabled(enabled) {
  for (const input of [
    "select-compare-color",
    "select-compare-facet",
    "select-select-race",
    "select-select-sex",
    "select-select-cause",
    "select-select-year",
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

function plotTable() {
  const pin = [
    "cause",
    "race",
    "sex",
    "quantile_field",
    "quantile",
    "quantile_range",
  ].map((d) => ({ field: d, frozen: true }));
  plotDataTable(state.mortalityData, elements.tableContainer, {
    colDefinitions: pin,
    columns: quantileTableColumns,
  });
}

function toggleLoading(loading, soft = false) {
  if (loading) {
    document.getElementById("plot-container").style.opacity = soft
      ? "0.5"
      : "0";
    document.getElementById("plot-title").style.opacity = soft ? "0.5" : "0";
    document.getElementById("loader-container").style.visibility = "visible";
    document.getElementById("table-container").style.visibility = "hidden";
  } else {
    document.getElementById("plot-container").style.opacity = "1";
    document.getElementById("plot-title").style.opacity = "1";
    document.getElementById("loader-container").style.visibility = "hidden";
    document.getElementById("table-container").style.visibility = "visible";
  }
}
function updateGraphTitle() {
  let compareString = [state.compareColor, state.compareFacet]
    .filter((d) => d != "none")
    .map((d) => names.fields[d].toLowerCase())
    .join(" and ");
  if (compareString != "") {
    //compareString = "</br> Stratified by " + compareString;
  }
  const compareSet = new Set([state.compareColor, state.compareFacet]);
  const selects = [
    { name: "Year", value: state.year },
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

  //const title = `${names.measures[state.measure]} ${compareString}. </br> ${selectsString}`
  const quantileMeasure = names["quantile_fields"][state.quantileField].measure;
  let measureName = names.measures[state.measure].toLowerCase();
  measureName = measureName[0].toUpperCase() + measureName.slice(1);
  const isNoneCompares = state.compareColor === 'none' && state.compareFacet === 'none'
  const title = `${measureName} by ${compareString} and octile of US county characteristic: ${quantileMeasure} </br> ${selectsString}`;
  const noneTitle = `${measureName} by quantile of US county characteristic: ${quantileMeasure} </br> ${selectsString}`;
  console.log(isNoneCompares)
  elements.graphTitle.innerHTML = isNoneCompares ? noneTitle : title;
}

function getAgeAdjustedRateData(data, row, key) {
  const dataSortedByQuantile = data
    .filter((i) => i[key].toLowerCase() === row[key].toLowerCase())
    .sort((a, b) => Number(a.quantile) - Number(b.quantile));

  const lastIndex = dataSortedByQuantile.length - 1;
  const firstIndex = 0;

  if (dataSortedByQuantile.length) {
    row["age_adjusted_rate_ratio (ref=low)"] = +parseFloat(
      row.age_adjusted_rate / dataSortedByQuantile[firstIndex].age_adjusted_rate
    ).toFixed(2);
    row["age_adjusted_rate_ratio (ref=high)"] = +parseFloat(
      row.age_adjusted_rate / dataSortedByQuantile[lastIndex].age_adjusted_rate
    ).toFixed(2);
    row["crude_rate_ratio(ref=low)"] = +parseFloat(
      row.crude_rate / dataSortedByQuantile[firstIndex].crude_rate
    ).toFixed(2);
    row["crude_rate_ratio (ref=high)"] = +parseFloat(
      row.crude_rate / dataSortedByQuantile[lastIndex].crude_rate
    ).toFixed(2);
  }
}