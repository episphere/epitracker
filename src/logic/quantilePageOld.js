import { hookComboBox, hookSelect, retrieveElements } from "./utils/helper.js";
import { State } from "./utils/State.js";
import { EpiTrackerData } from "./utils/EpiTrackerData.js";
import { formatName } from "./utils/nameFormat.js";

// import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.8.5/+esm";
import * as d3 from "d3";




// ------ Constants and configuration ----------------------------------------------------------------------------------

const SELECT_CONFIGS = [
  { id: "select-compare-color", propertyName: "compareColor" },
  { id: "select-compare-facet", propertyName: "compareFacet" },
  { id: "select-select-race", propertyName: "race" },
  { id: "select-select-sex", propertyName: "sex" },
  { id: "combo-select-cause", propertyName: "cause", searchable: true, unselectedValue: "All"
    // format: causeFormat 
  },
  { id: "select-measure", propertyName: "measure" },
  { id: "combo-quantile-field", propertyName: "quantileField", searchable: true, unselectedValue: "All" },
  { id: "select-quantile-number", propertyName: "quantileNumber" },
]

const COMPARABLE_FIELDS = ["race", "sex"];
const DATA_YEARS = ["2018-2022"];
const QUANTILE_NUMBERS = ["4", "5", "10"];
const NUMERIC_MEASURES = [
  "age_adjusted_rate",
  "crude_rate",
  "age_adjusted_rate_ratio_ref-low",
  "age_adjusted_rate_ratio_ref-high",
  "crude_rate_ratio_ref-low",
  "crude_rate_ratio_ref-high",
];

// The default state, shown if no URL params.
const INITIAL_STATE = {
  compareColor: "none",
  compareFacet: "none",
  sex: "All",
  race: "All",
  year: "2018-2022",
  measure: "age_adjusted_rate",
  cause: "All",
  quantileField: "adult_smoking",
  quantileNumber: "4",
  showLines: true,
  startZero: true,
  filter: null,
};

// ---------------------------------------------------------------------------------------------------------------------


class QuantileApplication {
  staticData = {};

  constructor() {
    this.init();
  }

  async init() {
    this.initializeState();

    this.dataManager = new EpiTrackerData();
    await this.initialDataLoad();

    this.hookInputs();

    this.setInputsEnabled(true);
  }

  async initialDataLoad() {
    const quantileDetails = await d3.json("../../data/quantile/quantile_details.json");
    const mortalityData = await this.dataManager.getQuantileMortalityData({ year: "2018-2022", num_quantiles: 4 });
    
    this.staticData.quantileDetails = d3.index(
        quantileDetails,
        (d) => d.year,
        (d) => d.nQuantiles,
        (d) => d.field
      ); 
    
    // Initialise the input state from the data
    this.state.compareColorOptions = ["none", ...COMPARABLE_FIELDS].map((field) => ({
      value: field,
      label: formatName("fields", field)
    }));
    this.state.compareFacetOptions = ["none", ...COMPARABLE_FIELDS].map((field) => ({
      value: field,
      label: formatName("fields", field)
    }));
    this.state.causeOptions = [...new Set(mortalityData.map((d) => d.cause))];
    this.state.sexOptions = [...new Set(mortalityData.map((d) => d.sex))];
    this.state.raceOptions = [...new Set(mortalityData.map((d) => d.race))];
    this.state.measureOptions = NUMERIC_MEASURES.map((field, i) => {
      let label = formatName("measures", field)
      if (typeof label == "object") label = label.name
      return { value: field, label }
    });
  
    this.state.quantileFieldOptions = [
      ...new Set(mortalityData.map((d) => d.quantile_field)),
    ].map((field, i) => {
      const fieldDetails = formatName("quantile_fields", field, "all");
      return {
        value: field,
        label: fieldDetails.name,
        group: fieldDetails.group,
      };
    });

  }

  hookInputs() {
    for (const selectConfig of SELECT_CONFIGS) {
      const element = document.getElementById(selectConfig.id);
      if (element.nodeName == "SELECT") {
        hookSelect(element, this.state, selectConfig.propertyName, selectConfig.propertyName + "Options");
      } else if (element.classList.contains("usa-combo-box")) {
        hookComboBox(element, this.state, selectConfig.propertyName, selectConfig.propertyName + "Options");
      } 
    }
  }

  initializeState() {
    this.state = new State();
    const initialState = { ...INITIAL_STATE };
  
    this.staticData.url = new URL(window.location.href);
    for (const [paramName, paramValue] of this.staticData.url.searchParams) {
      initialState[paramName] = paramValue;
    }
  
    this.state.defineProperty("compareColor", initialState.compareColor);
    this.state.defineProperty("compareColorOptions", null);
    this.state.defineProperty("compareFacet", initialState.compareFacet);
    this.state.defineProperty("compareFacetOptions", null);
    this.state.defineProperty("year", initialState.year);
    this.state.defineProperty("yearOptions", DATA_YEARS);
    this.state.defineProperty("cause", initialState.cause);
    this.state.defineProperty("causeOptions", null);
    this.state.defineProperty("measure", initialState.measure);
    this.state.defineProperty("measureOptions", NUMERIC_MEASURES);
    this.state.defineProperty("quantileField", initialState.quantileField);
    this.state.defineProperty("quantileFieldOptions", null);
    this.state.defineProperty("quantileNumber", initialState.quantileNumber);
    this.state.defineProperty("quantileNumberOptions", QUANTILE_NUMBERS);
    this.state.defineProperty("quantileRanges", null);
    this.state.defineProperty("facetShow", null);
    this.state.defineProperty("filter", initialState.filter);
  
    // The compareColor and compareFacet properties can't be the same value (unless they are 'none'), handle that logic here.
    for (const [childProperty, parentProperty] of [
      ["compareColor", "compareFacet"],
      ["compareFacet", "compareColor"],
    ]) {
      this.state.linkProperties(childProperty, parentProperty);
      this.state.subscribe(parentProperty, () => {
        if (
          this.state[parentProperty] == this.state[childProperty] &&
          this.state[childProperty] != "none"
        ) {
          this.state[childProperty] = "none";
        }
      });
    }
  
    // The values for the selections are dependent on the compares (e.g. if we are comparing by race, then the race select
    // must be equal to "all").
    this.state.defineProperty("race", initialState.race, [
      "compareColor",
      "compareFacet",
    ]);
    this.state.defineProperty("raceOptions", []);
    this.state.defineProperty("sex", initialState.sex, [
      "compareColor",
      "compareFacet",
    ]);
    this.state.defineProperty("sexOptions", []);
    for (const compareProperty of ["compareColor", "compareFacet"]) {
      this.state.subscribe(compareProperty, () => {
        if (COMPARABLE_FIELDS.includes(this.state[compareProperty])) {
          this.state[this.state[compareProperty]] = "All";
        }
      });
    }
  
    this.state.defineProperty("showLines", initialState.showLines);
    this.state.defineProperty("startZero", initialState.startZero);
  
    this.state.defineJointProperty("query", [
      "compareColor",
      "compareFacet",
      "cause",
      "race",
      "sex",
      "year",
      "quantileField",
      "quantileNumber",
    ]);
    this.state.defineProperty("legendCheckValues", null, "query");
    this.state.defineProperty("mortalityData", null, ["query"]);
    this.state.defineJointProperty("plotConfig", [
      "mortalityData",
      "query",
      "measure",
      "showLines",
      "startZero",
      "legendCheckValues",
      "facetShow",
    ]);
  
    for (const param of Object.keys(initialState)) {
      if (this.state.hasProperty(param)) {
        this.state.subscribe(param, () => this.updateURLParam());
      }
    }
  
    // this.state.subscribe("query", queryUpdated);
    // this.state.subscribe("plotConfig", (d) => plotConfigUpdated(d));
  }

  

  updateURLParam(value, param) {
    const url = this.staticData.url;
    if (INITIAL_STATE[param] != value) {
      url.searchParams.set(param, value);
    } else {
      url.searchParams.delete(param);
    }
  
    history.replaceState({}, "", this.staticData.url.toString());
  }

  setInputsEnabled(enabled) {
    for (const element of document.querySelectorAll("select")) {
      if (enabled) {
        element.removeAttribute("disabled");
      } else {
        element.setAttribute("disabled", "");
      }
    }
    for (const element of document.querySelectorAll(".usa-combo-box")) {
      const subElements = [".usa-combo-box__input", ".usa-combo-box__clear-input", ".usa-combo-box__toggle-list"]
        .map(d => element.querySelector(d));
      for (const subElement of subElements) {
        if (enabled) {
          subElement.removeAttribute("disabled");
        } else {
          subElement.setAttribute("disabled", "");
        }
      }
    }
  }
}

new QuantileApplication();