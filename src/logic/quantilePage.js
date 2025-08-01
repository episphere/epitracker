import { EpiTrackerData } from "./utils/EpiTrackerData.js";
import { formatName } from "./utils/nameFormat.js";
import { State } from "./utils/State.js";
import { addPopperTooltip, round, createDropdown, downloadElementAsImage, downloadRowData, hookCheckbox, hookComboBox, hookSelect, minorPopup, plotDataTable, popup, retrieveElements } from "./utils/helper.js";
import { plotQuantileScatter } from "./quantilePlot.js";
import * as d3 from "d3";
import { COLORS, SYMBOLS } from "./utils/plotStyle.js";

// TODO: Title ***
// TODO: Filtering
// TODO: State change warnings
// TODO: County characteristic grouping


// === Constants and config ============================================================================================

const COMPARABLE_FIELDS = ["race", "sex"];
const DATA_YEARS = ["2018-2022"];
const QUANTILE_NUMBERS = ["4", "5", "10"];
const NUMERIC_MEASURES = [
  "age_adjusted_rate",
  "crude_rate",
  "age_adjusted_rate_ratio_ref_low",
  "age_adjusted_rate_ratio_ref_high",
  "crude_rate_ratio_ref_low",
  "crude_rate_ratio_ref_high",
];

const DEFAULT_STATE = {
  compareColor: "sex",
  compareFacet: "none",
  sex: "All",
  race: "All",
  year: "2018-2022",
  measure: "age_adjusted_rate",
  cause: "All",
  quantileField: "adult_smoking",
  quantileNumber: "4",
  quantileYear: "2022",
  showLines: true,
  startZero: true,
  filter: null,
  showCI: true,
};

const SELECT_CONFIGS = [
  { id: "select-compare-color", propertyName: "compareColor" },
  { id: "select-compare-facet", propertyName: "compareFacet" },
  { id: "select-select-race", propertyName: "race" },
  { id: "select-select-sex", propertyName: "sex" },
  { id: "combo-select-cause", propertyName: "cause" },
  { id: "select-measure", propertyName: "measure" },
  { id: "combo-quantile-field", propertyName: "quantileField" },
  { id: "select-quantile-number", propertyName: "quantileNumber" },
];

const CHECK_CONFIGS = [
  { id: "check-show-lines", propertyName: "showLines" },
  { id: "check-show-ci", propertyName: "showCI" },
  { id: "check-start-zero", propertyName: "startZero" },
]

// Specifies ideal order of fields in data rows.
const DATA_FIELDS = [
  "race","sex","cause",
  "quantile_field", "quantile", "quantile_range", 
  "deaths","population",
  "crude_rate","crude_rate_ci_lower","crude_rate_ci_upper",
  "age_adjusted_rate","age_adjusted_rate_ci_lower","age_adjusted_rate_ci_upper",
  "age_adjusted_rate_ratio_ref_low", "age_adjusted_rate_ratio_ref_low_ci_lower", "age_adjusted_rate_ratio_ref_low_ci_upper",
  "age_adjusted_rate_ratio_ref_high", "age_adjusted_rate_ratio_ref_high_ci_lower", "age_adjusted_rate_ratio_ref_high_ci_upper",
  "crude_rate_ratio_ref_low", "crude_rate_ratio_ref_low_ci_lower", "crude_rate_ratio_ref_low_ci_upper",
  "crude_rate_ratio_ref_high", "crude_rate_ratio_ref_high_ci_lower", "crude_rate_ratio_ref_high_ci_upper",
]

const PROPORTIONS_AS_PERCENTAGES = true;

//  ====================================================================================================================

class QuantileApp {
  constructor() {
    this.init();
  }

  async init() {
    this.dataManager = new DataManager();
    await this.dataManager.init();

    this.state = new StateManager(DEFAULT_STATE, Object.getOwnPropertyNames(DEFAULT_STATE));
    await this.initializeAppState(); 

    this.plotManager = new PlotManager();

    this.uiManager = new UIManager(this.state, this.plotManager); 
    this.uiManager.setInputsEnabled(true);

    this.initializeAppLogic();
  }

  async initializeAppState() {

    // --- Define default values for the Select options in the UI ---

    const comparableFieldOptions = ["none", ...COMPARABLE_FIELDS].map((field) => ({
      value: field, label: formatName("fields", field)
    }));

    const defaultSelectOptions = { 
      ...await this.dataManager.getDataDetails(),

      compareColor: comparableFieldOptions,
      compareFacet: comparableFieldOptions,

      measure: NUMERIC_MEASURES.map(field => {
        let label = formatName("measures", field);
        if (typeof label == "object") label = label.name;
        return { value: field, label };
      }),

      quantileNumber: QUANTILE_NUMBERS
    };

    // 'year' and 'quantileYear' are currently not configurable, but we're keeping them in for the future.
    this.state.defineProperty("year");
    this.state.defineProperty("quantileYear");


    // --- Define state properties required for input elements in the UI ---

    for (const selectConfig of SELECT_CONFIGS) {
      const options = defaultSelectOptions[selectConfig.propertyName];

      this.state.defineProperty(selectConfig.propertyName);
      this.state.defineProperty(selectConfig.propertyName + "Options", options);
    }

    for (const selectConfig of CHECK_CONFIGS) {
      this.state.defineProperty(selectConfig.propertyName);
    }

    // --- Define additional inter-dependant state properties --- 

    this.state.defineJointProperty("query", [
      "compareColor",
      "compareFacet",
      "cause",
      "race",
      "sex",
      "year",
      "quantileField",
      "quantileNumber",
      "quantileYear",
    ]);

    this.state.defineProperty("colorShow", null, ["query"]);
    this.state.defineProperty("currentData", null, ["query"]);
    this.state.defineProperty("quantileDetails", null, ["query"]);

    this.state.defineJointProperty("plotConfig", [
      "query",
      "measure",
      "showLines",
      "showCI",
      "startZero",
      "colorShow",
    ]);


    // --- Define inter-dependent state logic ---

    // The values for the selections are dependent on the chosen comparison fields.
    for (const compareProperty of ["compareColor", "compareFacet"]) {
      this.state.subscribe(compareProperty, () => {
        if (COMPARABLE_FIELDS.includes(this[compareProperty])) {
          this[this[compareProperty]] = "All";
        }
      });
    }

    // The compareColor and compareFacet properties can't be the same value (unless they are 'none').
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

    // Prostate cancer is 'Male' only. 
    this.state.subscribe("cause", () => {
      if (this.state.cause == "Prostate") {
        this.state.sexOptions = ["Male"];
      } else {
        this.state.sexOptions = this.state.dataFieldDetails.sex;
      }
    });
  }

  initializeAppLogic() {
    this.state.subscribe("query", async (query) => {
      this.state.currentData = await this.dataManager.query(query);
      this.state.quantileDetails = this.dataManager.getQuantileDetails(query);
    });

    this.state.subscribe("plotConfig", (plotConfig) => {
      this.plotManager.updatePlot(this.state.currentData, plotConfig);
      this.plotManager.updateTable(this.state.currentData);
      this.uiManager.redrawPlot();
    });

    this.state.trigger("query");
  }




  // async init() {
  //   this.state = new StateManager();

  //   this.plotManager = new PlotManager();
  //   this.uiManager = new UIManager(this.state, this.plotManager); 


  //   this.uiManager.setInputsEnabled(true);

  //   this.state.subscribe("plotConfig", (query) => this.listenPlotConfigUpdated(query));
  //   this.state.trigger("query");
  // }

  async loadQuantileDetails() {
    return await d3.json("../../data/quantile/quantile_details.json");
  }



  async listenPlotConfigUpdated(plotConfig) {
    this.plotManager.updatePlot(this.state.currentData, plotConfig);
    this.plotManager.updateTable(this.state.currentData);
    this.uiManager.redrawPlot();
  }

}



// ============================================================
// - urlStateManager.js ---------------------------------------
// ============================================================


/**
 * The StateManager is responsible for defining the state, informing subscribers when updates occur, and maintaining 
 * the serialized state URL parameters. 
 * The StateManager class does NOT handle any special state logic. 
 */
class StateManager extends State {
  constructor (defaults = {}, urlProperties = []) {
    super();
    this.defaults = defaults;
    this.url = new URL(window.location.href);
    this.urlProperties = new Set(urlProperties);
  }

  /**
   * Defines a state property, optionally initializing it from a URL search parameter, and subscribes it to URL updates.
   * @param {string} property - The name of the property to define.
   * @param {*} [value] - The default value of the property. If not provided, it will check the URL.
   * @param {string[]} [parentProperties] - An array of parent property names.
   */
  defineProperty(property, value, parentProperties) {
    if (!value && this.url.searchParams.has(property)) {
      value = this.url.searchParams.get(property);
    } else if (this.defaults[property]) {
      value = this.defaults[property];
    }
    super.defineProperty(property, value, parentProperties);
    if (this.urlProperties.has(property)) {
      this.subscribe(property, (value, property) => this.updateURLParam(value, property));
    }
  }

   /**
   * Updates a URL search parameter based on a property's value.
   * If the value is the initial default, the parameter is removed.
   * @param {*} value - The new value for the parameter.
   * @param {string} param - The URL search parameter to update.
   */
  updateURLParam(value, param) {
    const url = this.url;
    if (this.defaults[param] != value) {
      url.searchParams.set(param, value);
    } else {
      url.searchParams.delete(param);
    }
    history.replaceState({}, "", this.url.toString());
  }
}



class DataManager {
  constructor() {
    this.dataManager = new EpiTrackerData();
    this.initialization = this.init();
  }

  async init() {
    // TODO: Handle initial data query here too

    const allQuantileDetails = await d3.json("../../data/quantile/quantile_details.json");
    if (PROPORTIONS_AS_PERCENTAGES) {
      for (const quantileDetails of allQuantileDetails) {
        if (quantileDetails.unit = "Proportion") {
          quantileDetails.unit = "Percentage";
          // The rounding here defeats the purpose of the smart rounding in the quantile file, but FP rounding errors 
          // occur every time if I don't do it. Annoying!
          quantileDetails.quantileRanges = quantileDetails.quantileRanges.map(
            range => range.map(d => parseFloat((100*d).toFixed(2))));
        }
      }
    }

    this.quantileDetailsMap = d3.index(allQuantileDetails, d => d.year, d => d.nQuantiles, d => d.field);
    this.quantileNameMap = new Map(allQuantileDetails.map(d => [d.field, d.name]));
  }


  async getDataDetails() {
    await this.initialization;

    const initialData = await this.dataManager.getQuantileMortalityData({ 
      year: "2018-2022", 
      quantile_year: "2022",
      num_quantiles: 4 
    });


    return {
      cause: [...new Set(initialData.map((d) => d.cause))].map(d => d),
      race:  [...new Set(initialData.map((d) => d.race))].map(d => d),
      sex: [...new Set(initialData.map((d) => d.sex))].map(d => d),
      quantileField: [...this.quantileDetailsMap.get("2022").get("4").values()].map(d => ({
        value: d.field, label: d.name}))
    }
  }

  getQuantileDetails(query) {
    console.log(query, this.quantileDetailsMap
      .get(query.quantileYear)
      .get(query.quantileNumber)
      .get(query.quantileField))
    return this.quantileDetailsMap
      .get(query.quantileYear)
      .get(query.quantileNumber)
      .get(query.quantileField);
  }

  async query(query) {
    await this.initialization;

    const quantileDetails = this.getQuantileDetails(query);

    const data = this.processData(await this.rawQuery(query), query, quantileDetails);

    return { data,  quantileDetails };
  }

  processData(data, query, quantileDetails) {
    // Add confidence intervals (using a basic method)
    for (const row of data) {
      for (const measure of ["crude_rate", "age_adjusted_rate"]) {
        const se = row[measure] / Math.sqrt(row.deaths);
        row[measure + "_ci_lower"] = round(row[measure]-1.96 * se, 2);
        row[measure + "_ci_upper"] = round(row[measure]+1.96 * se, 2);
      }
    }

    // Add rate ratios relative to the rates for the lowest and highest quantile entries.
    data.sort((a,b) => a.quantile - b.quantile);
    for (const [,,rows] of d3.flatGroup(data, d => d[query.compareColor], d => d[query.compareFacet])) {
      for (const measure of ["crude_rate", "age_adjusted_rate"]) {
        const refLow = rows[0][measure];
        const refHigh = rows.at(-1)[measure];
        
        for (const measureSuffix of ["", "_ci_lower", "_ci_upper"]) {
          const field = measure + measureSuffix;

          for (const row of rows) {
            row[measure.replace(measureSuffix, "") + "_ratio_ref_low" + measureSuffix] = round(row[field] / refLow, 2);
            row[measure.replace(measureSuffix, "") + "_ratio_ref_high" + measureSuffix] = round(row[field] / refHigh, 2);
          }
        }
      }
    }


    // Add / modify data for human readability
    for (const row of data) {
      row.quantile_range = quantileDetails.quantileRanges[row.quantile-1].join(" - ");
      row.quantile_field_name = quantileDetails.name;
      if (row.cause == "All") {
        row.cause_name = "All cancers";
      }
    }

    return data;
  }


  rawQuery(query) {
    const dataQuery = {
      year: query.year,
      sex: query.sex,
      cause: query.cause,
      race: query.race,
      quantile_year: query.quantileYear,
      quantile_field: query.quantileField,
      num_quantiles: query.quantileNumber,
    };

    if (query.compareColor != "none") dataQuery[query.compareColor] = "*";
    if (query.compareFacet != "none") dataQuery[query.compareFacet] = "*";

    return this.dataManager.getQuantileMortalityData(dataQuery, {
      includeTotals: false,
    });
  }



  /**
   * Get ticks for x-axis of quantile plot. Ticks are formatted so that if any number has a string length larger than
   * a fixed number, then all ticks are converted to scientific notation. Precision is set to fixed number.
   */
  // quantileDetailsToTicks(quantileDetails, measureDetails) {
  //   // TODO: Automatically find an appropriate value for precision.
  
  //   // Get ticks for x-axis of quantile plot. Ticks are formatted so that if any number has a string length larger than
  //   // a fixed number, then all ticks are converted to scientific notation. Precision is set to fixed number.
  //   if (quantileDetails) {
  //     let ranges = quantileDetails.quantileRanges.map((range) => {
  //       // Convert proportions to percentages
  //       if (measureDetails.unit == "Proportion") {
  //         range = range.map(d => d * 100);
  //       }
  //       return range.map((d) => Number(d.toPrecision(2)).toString())
  //     });

  //     const exp = d3.merge(ranges).some((d) => d.length > 6);
  //     for (let i = 0; i < ranges.length; i++) {
  //       if (exp) {
  //         ranges[i] = ranges[i].map((d) => parseFloat(d));
  //       } else {
  //         ranges[i] = ranges[i].map((d) =>
  //           parseFloat(d).toLocaleString("en-US", { maximumFractionDigits: 8 })
  //         );
  //       }
  //     }
  //     return ranges.map((d) => d.join(" - "));
  //   }
  // }
}

class UIManager {
  constructor(state, plotManager) {
    this.state = state;
    this.plotManager = plotManager;
    this.init();
  }

  init() {
    this.comboBoxes = [];
    this.elems = retrieveElements({
      plotContainerContainer: "#plot-container-container",
      plotContainer: "#plot-container",
      buttonTable: "#button-table",
      body: "#main-content",
      title: "#title",
      tablePopupOverlay: "#table-popup-overlay",
      tablePopup: "#table-popup",
      tablePopupContent: "#table-popup-content",
      tablePopupClose: "#table-popup-close",
      tableContainer: "#table-container",
      tableTitle: "#table-title",
      imageTemplate: "#img-template",
      imagePlot: "#img-plot",
      imageTitle: "#img-title",
    });

    this.hookInputs();
    this.hookMenuButtons();
    this.hookTableView();
    this.hookPlotRedraw();
    this.hookTitle();
  }

  hookTitle() {
    this.state.subscribe("plotConfig", (plotConfig) => {
      const measureName = formatName("measures", plotConfig.measure, "verbose").toLowerCase();
      const quantileName = formatName("quantiles", plotConfig.query.quantileNumber);
      const quantileFieldName = this.state.quantileDetails.name.toLowerCase();
      let title = `US ${measureName} by ${quantileName} of county-level ${quantileFieldName}`;

      let filterElements = [
        plotConfig.query.year,
        plotConfig.query.cause == "All" ? null : plotConfig.query.cause,
        plotConfig.query.race == "All" ? null : plotConfig.query.race,
        plotConfig.query.sex == "All" ? null : plotConfig.query.sex,
      ].filter(d => d).map(d => d.toLowerCase());
    
      if (filterElements.length > 0) {
        title += `, ${filterElements.join(", ")}`;
      }

      this.elems.title.innerText = title;
    });
  }

  hookInputs() {
    const selects = {};

    for (const selectConfig of SELECT_CONFIGS) {
      const element = document.getElementById(selectConfig.id);
      if (element.nodeName == "SELECT") {
        hookSelect(element, this.state, selectConfig.propertyName, selectConfig.propertyName + "Options");
        selects[selectConfig.id] = element;
      } else if (element.classList.contains("usa-combo-box")) {
        const comboBox = hookComboBox(element, this.state, 
          selectConfig.propertyName, selectConfig.propertyName + "Options");
        this.comboBoxes.push(comboBox);
        selects[selectConfig.id] = comboBox;
      } 

    }

    this.state.subscribe("query", (query) => {
      if (query.compareColor == "race" || query.compareFacet == "race") {
        selects["select-select-race"].setAttribute("disabled", "");
      } else {
        selects["select-select-race"].removeAttribute("disabled");
      }
      if (query.compareColor == "sex" || query.compareFacet == "sex") {
        selects["select-select-sex"].setAttribute("disabled", "");
      } else {
        selects["select-select-sex"].removeAttribute("disabled");
      }
    });

    hookCheckbox("#check-show-lines", this.state, "showLines");
    hookCheckbox("#check-show-ci", this.state, "showCI");
    hookCheckbox("#check-start-zero", this.state, "startZero");
  }

  hookMenuButtons() {
    const mainElement = document.getElementById("main-content");

    const buttonOptionsElement = document.getElementById("button-options");
    const graphSettingsElement = document.getElementById("graph-settings-dropdown-content");
    minorPopup(mainElement, buttonOptionsElement, graphSettingsElement, "Graph Settings");

    const downloadData = (format) => {
      const filename = "epitracker_quantile_data";
      downloadRowData(this.state.currentData.data, filename, format);
    }

    const buttonDownloadElement = document.getElementById("button-download");
    createDropdown(mainElement, buttonDownloadElement, [
      { label: "Download data (.csv)", action: () => downloadData("csv")},
      { label: "Download data (.tsv)", action: () => downloadData("tsv") },
      { label: "Download data (.json)",  action: () => downloadData("json"), separatorAfter: true },
      { label: "Download graph (.png)", action: () => this.downloadGraph("png") },
      { label: "Download graph (.svg)", action: () => this.downloadGraph("svg") },
    ]);

    const buttonDataDownloadElement = document.getElementById("button-download-data");
    createDropdown(this.elems.tablePopup, buttonDataDownloadElement, [
      { label: "Download data (.csv)", action: () => downloadData("csv")},
      { label: "Download data (.tsv)", action: () => downloadData("tsv") },
      { label: "Download data (.json)",  action: () => downloadData("json")},
    ]);
  }

  hookTableView() {
    this.elems.tablePopupClose.addEventListener("click", () => {
      this.elems.tablePopupOverlay.style.display = "none";
    });

    this.elems.buttonTable.addEventListener("click", () => {
      this.tablePopup();
    });

  }

  tablePopup() {
    this.elems.tablePopupOverlay.style.display = "block";
    this.plotManager.drawTable(this.elems.tableContainer);
  }


  hookPlotRedraw() {
    let resizeTimeout;
    let previousSize = [-1, -1];
    const resizeObserver = new ResizeObserver(() => {
      const rect = this.elems.plotContainer.getBoundingClientRect();

      if (rect.width != previousSize[0] || rect.height != previousSize[1]) {
        if (resizeTimeout) {
          clearTimeout(resizeTimeout);
        }

        this.elems.plotContainer.innerHTML = '';
        resizeTimeout = setTimeout(() => {
          this.redrawPlot();
        }, 300);
        previousSize = [rect.width, rect.height]
      }
    });
    // resizeObserver.observe(elements.quantileContainer);
    resizeObserver.observe(this.elems.plotContainer);
  }

  downloadGraph(format) {
    this.plotManager.drawPlot(this.elems.imagePlot);
    this.elems.imageTitle.innerText = document.getElementById("title").innerText;
    downloadElementAsImage(this.elems.imageTemplate, "epitracker-quantile-graph", format);
  }

  setInputsEnabled(enabled) {
    for (const element of document.querySelectorAll("select")) {
      if (enabled) {
        element.removeAttribute("disabled");
      } else {
        element.setAttribute("disabled", "");
      }
    }
    for (const comboBox of this.comboBoxes) {
      if (enabled) {
        comboBox.enable();
      } else{
        comboBox.disable();
      }
    }
  }



  redrawPlot() {
    this.plotManager.drawPlot(this.elems.plotContainer);
  }
}


class PlotManager {

  updatePlot(currentData, plotConfig) {
    let { data, quantileDetails } = currentData;

    const xLabel = `${quantileDetails.name} (${quantileDetails.unit === "Proportion" ? "Percentage" : quantileDetails.unit})`;

    // Ensure quantile ticks are descriptive
    const xTickFormat = d => quantileDetails.quantileRanges[d-1].map(d => String(d)).join(" - ");

    const colorFunction = row => {
      if (plotConfig.query.compareColor != "none") {
        return COLORS[plotConfig.query.compareColor][row[plotConfig.query.compareColor]];
      } else {
        return COLORS.base;
      }
    };

    const symbolFunction = row => {
      if (plotConfig.query.compareColor != "none") {
        return SYMBOLS[plotConfig.query.compareColor][row[plotConfig.query.compareColor]];
      } else {
        return SYMBOLS.base;
      }
    };

    let legend = false;
    if (plotConfig.query.compareColor != "none") {
      const colorDomain = [...new Set(data.map(d => d[plotConfig.query.compareColor]))];
      const colorRange = colorDomain.map(d => colorFunction({[plotConfig.query.compareColor]: d}));
      const symbolRange = colorDomain.map(d => symbolFunction({[plotConfig.query.compareColor]: d}));
      legend = { domain: colorDomain, range: colorRange, symbolRange, position: "bottom", 
        tickFormat: d => formatName(plotConfig.query.compareColor , d, "formatted")
       };
    }

    const plotOptions = {
      valueField: plotConfig.measure,
      intervalFields: plotConfig.showCI ? [plotConfig.measure + "_ci_lower", plotConfig.measure + "_ci_upper"] : null,
      xTickFormat,
      xLabel,
      yLabel: formatName("measures", plotConfig.measure, "plot_label"),
      facetLabel:  formatName("fields", plotConfig.query.compareFacet),
      color: colorFunction,
      symbol: symbolFunction,
      facet: plotConfig.query.compareFacet != "none"? plotConfig.query.compareFacet : null,
      colorLegend: legend,
      drawLines: plotConfig.showLines,
      yStartZero: plotConfig.startZero,
      tooltipFields: [
        plotConfig.query.compareFacet,
        plotConfig.query.compareColor,
      ].filter((d) => d != "none")
    };


    this.drawPlot = (plotContainer) => {
      const { plot } = plotQuantileScatter(plotContainer, data, plotOptions);
      plot.style.marginLeft = "auto";
      plot.style.marginRight = "auto";
    }
  }

  updateTable(currentData) {
    this.drawTable = (tableContainer) => {
      const content = document.createElement("div");
      content.className = "table-popup-content";
  
      document.getElementById("table-title").innerText = document.getElementById("title").innerText;
  
      const fields = ["race", "sex", "cause", "quantile_field_name", "quantile", "quantile_range"]
        .map(d => ({ field: d, title: formatName("fields", d, "short") }));
      const measureFields = NUMERIC_MEASURES
        .map(d => ({ field: d, title: formatName("measures", d, "shortish") }));
      
      plotDataTable(currentData.data, tableContainer, {
        columns: [...fields, ...measureFields]
      });
    }
  }

  drawPlot() {
    console.warn("Attempting to draw plot, but PlotManager not ready.")
  }
}


// === Run =============================================================================================================

new QuantileApp();

