import { EpiTrackerData } from "./utils/EpiTrackerData.js";
import { formatName } from "./utils/nameFormat.js";
import {  round, createDropdown, downloadElementAsImage, 
  downloadRowData, hookCheckbox, hookComboBox, hookSelect, 
  minorPopup, plotDataTable, retrieveElements, 
  hookCheckboxList} from "./utils/helper.js";
import { plotQuantileScatter } from "./quantilePlot.js";
import * as d3 from "d3";
import { COLORS, SYMBOLS } from "./utils/plotStyle.js";
import { SetCoder, StateURL } from "./utils/StateURL.js";


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
  compareColorFilter: null,
  compareFacetFilter: null,
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

const PROPORTIONS_AS_PERCENTAGES = true;

//  ====================================================================================================================



/**
 * @class QuantileApp
 * @description The high-level controller for the quantile visualization application. This class orchestrates the
 * initialization and coordination of the state, data manager, and UI manager. It defines the state and initializes
 * the logic between state properties.
 */
class QuantileApp {
  constructor() {
    this.init();
  }

  async init() {
    this.dataManager = new DataManager();
    await this.dataManager.init();

    await this.initializeAppState(); 

    this.uiManager = new UIManager(this.state); 
    this.uiManager.setInputsEnabled(true);

    this.initializeAppLogic();
  }

  /**
   * Asynchronously initializes the application's state. This configures default options for UI controls, defines all 
   * state properties, and establishes their inter-dependencies.
   */
  async initializeAppState() {

    this.state = new StateURL(DEFAULT_STATE, Object.getOwnPropertyNames(DEFAULT_STATE), {
      compareFacetFilter: SetCoder,
      compareColorFilter: SetCoder,
    });

    // ------ Define default values for the Select options in the UI ---------------------------------------------------

    const comparableFieldOptions = ["none", ...COMPARABLE_FIELDS].map((field) => ({
      value: field, label: formatName("fields", field)
    }));

    this.defaultSelectOptions = { 
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



    // ===== Define state properties required for input elements in the UI ---------------------------------------------

    for (const selectConfig of SELECT_CONFIGS) {
      const options = this.defaultSelectOptions[selectConfig.propertyName];

      this.state.defineProperty(selectConfig.propertyName);
      this.state.defineProperty(selectConfig.propertyName + "Options", options);
    }

    for (const selectConfig of CHECK_CONFIGS) {
      this.state.defineProperty(selectConfig.propertyName);
    }



    // ===== Define additional inter-dependant state properties --------------------------------------------------------

    // Bundle all properties that trigger a query when updated.
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

    this.state.defineProperty("compareColorFilterOptions", null);
    this.state.defineProperty("compareFacetFilterOptions", null);

    // Bundle all properties that update the display, but do not require a data query. 
    this.state.defineJointProperty("displayConfig", [
      "measure", "showLines", "showCI", "startZero", 
      "compareColorFilter", "compareFacetFilter"
    ]);

    this.state.defineProperty("currentData", null, ["query"]);
    this.state.defineProperty("quantileDetails", null, ["query"]);

    this.state.defineJointProperty("renderablePlot", [
      "query",
      "currentData",
      "displayConfig"
    ]);



    // ===== Define inter-dependent state logic ------------------------------------------------------------------------

    // The values for the selections are dependent on the chosen comparison fields.
    for (const compareProperty of ["compareColor", "compareFacet"]) {
      this.state.subscribe(compareProperty, () => {
        if (COMPARABLE_FIELDS.includes(this.state[compareProperty])) {
          this.state[this.state[compareProperty]] = "All";
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
        this.state.sexOptions = this.defaultSelectOptions.sex;
      }
    });
  }

  /**
   * Initializes the application's query logic.
   */
  initializeAppLogic() {
    this.state.subscribe("query", async (query) => {
      this.state.currentData = await this.dataManager.query(query);
    });
    // this.state.subscribe("filters", async (filters) => {
    //   let filteredData = this.state.currentData.data; 
    //   if (this.state.query.compareColor != "none" && filters.compareColorFilter != null) {
    //     filteredData = filteredData.filter(d => filters.compareColorFilter.has(d[this.state.query.compareColor]));
    //   }
      
    //   // if (plotConfig.query.compareFacet != "none" && plotConfig.compareFacetFilter != null) {
    //   //   filteredData = filteredData.filter(d => plotConfig.compareFacetFilter.has(d[plotConfig.query.compareFacet]));
    //   // }
    // });
    this.state.trigger("query");
  }
}


/**
 * @class DataManager
 * @description Manages data fetching and processing.
 */
class DataManager {
  constructor() {
    this.dataManager = new EpiTrackerData();
    this.initialization = this.init();
  }

  /**
   * Asynchronously loads and prepares the initial quantile details data.
   */
  async init() {
    // TODO: Handle initial data query here too

    const allQuantileDetails = await this.dataManager.getAllQuantileDetails();
    if (PROPORTIONS_AS_PERCENTAGES) {
      for (const quantileDetails of allQuantileDetails) {
        if (quantileDetails.unit == "Proportion") {
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


  /**
   * Retrieves details required to populate UI controls, such as dropdown menus.
   * It fetches an initial data sample to derive available options for causes, races, etc.
   */
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

  /**
   * Retrieves the quantile details for a specific county measure field based on a query object.
   * @param {object} query - The query object.
   */
  getQuantileDetails(query) {
    return this.quantileDetailsMap
      .get(query.quantileYear)
      .get(query.quantileNumber)
      .get(query.quantileField);
  }

  /**
   * The main method to query and process data based on user selections.
   * It ensures initialization is complete, fetches raw data, and then processes it.
   * @param {object} query - The query object.
   */
  async query(query) {
    await this.initialization;
    const quantileDetails = this.getQuantileDetails(query);
    const data = this.processData(await this.rawQuery(query), query, quantileDetails);
    return { data,  quantileDetails };
  }

  
  /**
   * Enriches the raw data with calculated fields for analysis and display.
   * This includes confidence intervals, rate ratios, and human-readable labels.
   * @param {object[]} data - The raw data array from the query.
   * @param {object} query - The query object.
   * @param {object} quantileDetails - The quantile details for the selected county measure field.
   * @returns {object[]} The processed and enriched data array.
   */
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

  /**
   * Fetches the raw mortality data.
   * @param {object} query - The user-defined query object.
   * @returns {Promise<object[]>} A promise that resolves to the raw data array.
   */
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
}


/**
 * @class 
 * @description Contains logic to maintain consistency between the UI and the applications state. Also handles responses
 * to UI based events (such as downloading data or displaying the table). Orchestrates plot drawing through PlotDrawer.
 */
class UIManager {
  constructor(state, plotManager) {
    this.state = state;
    this.plotDrawer = new PlotDrawer();
    this.init();
  }

  init() {
    this.comboBoxes = [];
    this.elems = retrieveElements({
      plotContainerContainer: "#plot-container-container",
      plotContainer: "#plot-container",
      plotElement: "#plot",
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
      filterCompareColor: "#filter-compare-color",
      filterCompareFacet: "#filter-compare-facet",
      filterCompareColorContainer: "#filter-compare-color-container",
      filterCompareFacetContainer: "#filter-compare-facet-container",
    });

    this.state.subscribe("renderablePlot", (renderablePlot) => {
      const { query, currentData, displayConfig } = renderablePlot;
      const plotConfig = { query, ...displayConfig};
      const currentDataAug = {...currentData, data: this.getFilteredData()};
      this.plotDrawer.updatePlot(currentDataAug, plotConfig);
      this.plotDrawer.updateTable(currentDataAug);
      this.redrawPlot();
    });

    this.hookInputs();
    this.hookMenuButtons();
    this.hookTableView();
    this.hookPlotRedraw();
    this.hookTitle();
  }


  /**
   * Initialize the logic which updates the title in response to state changes.
   */
  hookTitle() {
    this.state.subscribe("renderablePlot", (renderablePlot) => {
      const measureName = formatName("measures", renderablePlot.displayConfig.measure, "verbose").toLowerCase();
      const quantileName = formatName("quantiles", renderablePlot.query.quantileNumber);
      const quantileFieldName = this.state.currentData.quantileDetails.name.toLowerCase();
      let title = `US ${measureName} by ${quantileName} of county-level ${quantileFieldName}`;

      let filterElements = [
        renderablePlot.query.year,
        renderablePlot.query.cause == "All" ? null : renderablePlot.query.cause,
        renderablePlot.query.race == "All" ? null : renderablePlot.query.race,
        renderablePlot.query.sex == "All" ? null : renderablePlot.query.sex,
      ].filter(d => d).map(d => d.toLowerCase());
    
      if (filterElements.length > 0) {
        title += `, ${filterElements.join(", ")}`;
      }

      this.elems.title.innerText = title;
    });
  }

  /**
   * Initialize the logic which maintains consistency between the UI inputs and the state.
   */
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

  /**
   * Set-up UI dropdowns.
   */
  hookMenuButtons() {
    const mainElement = document.getElementById("main-content");

    const buttonOptionsElement = document.getElementById("button-options");
    const graphSettingsElement = document.getElementById("graph-settings-dropdown-content");
    minorPopup(mainElement, buttonOptionsElement, graphSettingsElement, "Graph Settings");
    
    const buttonFilterElement = document.getElementById("button-filter");
    const filterElement = document.getElementById("filter-dropdown-content");
    minorPopup(mainElement, buttonFilterElement, filterElement, "Filter");
    this.state.subscribe("currentData", () => {
      if (this.state.currentData.data) {
        this.updateFilterMenu();
      }
    })

    hookCheckboxList(this.elems.filterCompareColor, this.state, "compareColorFilter", "compareColorFilterOptions");
    hookCheckboxList(this.elems.filterCompareFacet, this.state, "compareFacetFilter", "compareFacetFilterOptions");


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

   /**
   * Handle table popup events.
   */
  hookTableView() {
    this.elems.tablePopupClose.addEventListener("click", () => {
      this.elems.tablePopupOverlay.style.display = "none";
    });

    this.elems.buttonTable.addEventListener("click", () => {
      this.elems.tablePopupOverlay.style.display = "block";
      this.plotDrawer.drawTable(this.elems.tableContainer);
    });
  }

  /**
   * Initialize the logic which updates the plot in response to size changes.
   */
  hookPlotRedraw() {
    let resizeTimeout;
    let previousSize = [-1, -1];
    const resizeObserver = new ResizeObserver(() => {
      const rect = this.elems.plotElement.getBoundingClientRect();

      if (rect.width != previousSize[0] || rect.height != previousSize[1]) {
        if (resizeTimeout) {
          clearTimeout(resizeTimeout);
        }

        this.elems.plotElement.innerHTML = '';
        resizeTimeout = setTimeout(() => {
          this.redrawPlot();
        }, 300);
        previousSize = [rect.width, rect.height]
      }
    });
    resizeObserver.observe(this.elems.plotElement);
  }

  updateFilterMenu() {
    if (this.state.currentData) {
      if (this.state.compareColor != "none") {
        this.elems.filterCompareColorContainer.style.display = "flex";
        const values = [...new Set(this.state.currentData.data.map(d => d[this.state.compareColor]))];
        this.state.compareColorFilterOptions = values;
      } else {
        this.elems.filterCompareColorContainer.style.display = "none";
      }
      if (this.state.compareFacet != "none") {
        this.elems.filterCompareFacetContainer.style.display = "flex";
        const values = [...new Set(this.state.currentData.data.map(d => d[this.state.compareFacet]))];
        this.state.compareFacetFilterOptions = values;
      } else {
        this.elems.filterCompareFacetContainer.style.display = "none";
      }
    }
  }

  getFilteredData() {
    if (!this.state.currentData) {
      return null;
    }

    const { compareColorFilter, compareFacetFilter } = this.state;
    let filteredData = this.state.currentData.data; 
    if (this.state.query.compareColor != "none" && compareColorFilter != null) {
      filteredData = filteredData.filter(d => compareColorFilter.has(d[this.state.query.compareColor]));
    }
    if (this.state.query.compareFacet != "none" && compareFacetFilter != null) {
      filteredData = filteredData.filter(d => compareFacetFilter.has(d[this.state.query.compareFacet]));
    }
    return filteredData;
  }

  /**
   * Generates and downloads the current quantile graph as an image.
   * @param {'png' | 'svg'} format The desired image format for the download.
   */
  downloadGraph(format) {
    this.plotDrawer.drawPlot(this.elems.imagePlot);
    this.elems.imageTitle.innerText = document.getElementById("title").innerText;
    downloadElementAsImage(this.elems.imageTemplate, "epitracker-quantile-graph", format);
  }

  /**
   * Enables and disables the input elements of the UI.
   * @param {*}  A boolean indicating whether to enable (`true`) or disable (`false`) the input elements.
   */
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
    this.plotDrawer.drawPlot(this.elems.plotElement);
  }
}


/**
 * @class UIManager
 * @description  Manages the configuration and rendering of the quantile scatter plot and its corresponding data table.
 * This class prepares drawing functions based on user-selected configurations and data.
 */
class PlotDrawer {

  /**
   * Configures the plot options and prepares the `drawPlot` method for rendering.
   * This method sets up all visual aspects of the scatter plot, including axes, labels, etc.
   * It then reassigns `this.drawPlot` to a new function that will render the plot in a given container.
   *
   * @param {object} currentData - The data object for the plot.
   * @param {Array<object>} currentData.data - The dataset to be plotted.
   * @param {object} currentData.quantileDetails - Quantile details about the county measure.
   * @param {object} plotConfig - The configuration object for the plot.
   * @param {string} plotConfig.measure - The primary measure to plot on the y-axis.
   * @param {boolean} plotConfig.showCI - Flag to show/hide confidence intervals.
   * @param {boolean} plotConfig.showLines - Flag to show/hide connecting lines.
   * @param {boolean} plotConfig.startZero - Flag to start the y-axis at zero.
   * @param {object} plotConfig.query - The user query object defining faceting and coloring.
   */
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

  /**
   * Configures and prepares the `drawTable` method for rendering the data in a tabular format.
   * This method reassigns `this.drawTable` to a new function that will render the data table
   * in a given container.
   *
   * @param {object} currentData - The data object for the table.
   * @param {Array<object>} currentData.data - The dataset to be displayed.
   */
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

