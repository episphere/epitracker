import { filter } from "jszip";
import { plotDemographicsBar } from "./demographicsPlot.js";
import { EpiTrackerData } from "./utils/EpiTrackerData.js";
import { round, hookComboBox, hookSelect, retrieveElements, downloadRowData, minorPopup, createDropdown, hookCheckboxList, plotDataTable, downloadElementAsImage, hookCheckbox } from "./utils/helper";
import { formatName } from "./utils/nameFormat.js";
import { COLORS } from "./utils/plotStyle.js";
import { SetCoder, StateURL } from "./utils/StateURL";
import { demographicTableColumns } from "./utils/tableDefinitions.js";
import { data } from "autoprefixer";

const COMPARABLE_FIELDS = ["race", "sex", "age_group", "cause"];
const DATA_YEARS = ["2018-2022"];
const NUMERIC_MEASURES = [
  "age_adjusted_rate",
  "crude_rate",
];

const DEFAULT_STATE = {
  compareBar: "race",
  compareFacet: "none",
  areaState: "All",
  sex: "All",
  race: "All",
  year: "2018-2022",
  measure: "age_adjusted_rate", 
  age: "All",
  cause: "All",
  filter: null,
  compareBarFilter: null,
  compareFacetFilter: null,
  showCI: false,
};

const SELECT_CONFIGS = [
  { id: "select-compare-bar", propertyName: "compareBar" },
  { id: "select-compare-facet", propertyName: "compareFacet" },
  { id: "combo-select-state", propertyName: "areaState" },
  { id: "select-select-year", propertyName: "year" },
  { id: "select-select-race", propertyName: "race" },
  { id: "select-select-sex", propertyName: "sex" },
  { id: "select-select-age", propertyName: "age" },
  { id: "select-select-year", propertyName: "year" },
  { id: "combo-select-cause", propertyName: "cause" },
  { id: "select-measure", propertyName: "measure" },
];

const CHECK_CONFIGS = [
  { id: "check-show-ci", propertyName: "showCI" },
]

const AGE_GROUP_SORT = (a,b) => {
  return parseInt(a.split("-")[0]) - parseInt(b.split("-")[0]);
}

class DemographicsApp {
  constructor() {
    this.init();
  }

  async init() {
    this.dataManager = new DataManager();
    await this.initializeAppState(); 
    this.initializeAppLogic();
    this.uiManager = new UIManager(this.state, await this.dataManager.getDataDetails()); 
    this.uiManager.setInputsEnabled(true);
  }

  async initializeAppState() {
    const stateOptions = [
      {value: "All", label: "All"}, 
      ...Object.entries(formatName("states", null)).map(([id, {name}]) => ({value: id, label: name}))
    ];
    stateOptions.sort((a, b) => {
      if (a.value === 'All') return -1;
      if (b.value === 'All') return 1;  
      return a.label.localeCompare(b.label);  
    });

    this.state = new StateURL(DEFAULT_STATE, Object.getOwnPropertyNames(DEFAULT_STATE), {
      compareBarFilter: SetCoder,
      compareFacetFilter: SetCoder,
    });

    // ------ Define default values for the Select options in the UI ---------------------------------------------------

    const comparableFieldOptions = ["none", ...COMPARABLE_FIELDS].map((field) => ({
      value: field, label: formatName("fields", field)
    }));

    this.defaultSelectOptions = {
      ...await this.dataManager.getDataDetails(),

      compareBar: comparableFieldOptions,
      compareFacet: comparableFieldOptions,

      measure: NUMERIC_MEASURES.map(field => {
        let label = formatName("measures", field);
        if (typeof label == "object") label = label.name;
        return { value: field, label };
      }),

      areaState: stateOptions,
    };

     // ------ Define state properties required for input elements in the UI --------------------------------------------

    for (const selectConfig of SELECT_CONFIGS) {
      const options = this.defaultSelectOptions[selectConfig.propertyName];
      this.state.defineProperty(selectConfig.propertyName);
      this.state.defineProperty(selectConfig.propertyName + "Options", options);
    }

    for (const selectConfig of CHECK_CONFIGS) {
      this.state.defineProperty(selectConfig.propertyName);
    }


    // ------ Define additional inter-dependant state properties --------------------------------------------------------

    // Bundle all properties that trigger a query when updated.
    this.state.defineJointProperty("query", [
      "compareBar",
      "compareFacet",
      "cause",
      "race",
      "sex",
      "age",
      "year",
      "areaState"
    ]);


    this.state.defineProperty("compareBarFilterOptions", null);
    this.state.defineProperty("compareFacetFilterOptions", null);

    // Bundle all properties that update the display, but do not require a data query. 
    this.state.defineJointProperty("displayConfig", [
      "measure", "showCI",
      "compareBarFilter", "compareFacetFilter"
    ]);

    this.state.defineProperty("currentData", null, ["query"]);

    this.state.defineJointProperty("renderablePlot", [
      "query",
      "currentData",
      "displayConfig"
    ]);

    // ------ Define inter-dependent state logic ------------------------------------------------------------------------

    // The values for the selections are dependent on the chosen comparison fields.
    for (const compareProperty of ["compareBar", "compareFacet"]) {
      this.state.subscribe(compareProperty, () => {
        if (COMPARABLE_FIELDS.includes(this.state[compareProperty])) {
          this.state[this.state[compareProperty]] = "All";
        }
      });
    }

    // The compareColor and compareFacet properties can't be the same value (unless they are 'none').
    for (const [childProperty, parentProperty] of [
      ["compareBar", "compareFacet"],
      ["compareFacet", "compareBar"],
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

    // Measure can't be AA rate if comparing by age.
    this.state.defineJointProperty("compares", ["compareBar", "compareFacet"]);
    this.state.subscribe("compares", ({compareBar, compareFacet}) => {
      let measures = [];
      if (compareBar == "age_group" || compareFacet == "age_group") {
        measures = ["crude_rate"];
        this.state.measure = "crude_rate";
      } else {
        measures = NUMERIC_MEASURES;
      }
      this.state.measureOptions=measures.map(field => {
        let label = formatName("measures", field);
        if (typeof label == "object") label = label.name;
        return { value: field, label };
      });
    });

    this.state.subscribe("age", (age) => {
      let measures = [];
      if (age != "All" ) {
        measures = ["crude_rate"];
        this.state.measure = "crude_rate";
      } else {
        measures = NUMERIC_MEASURES;
      }
      this.state.measureOptions=measures.map(field => {
        let label = formatName("measures", field);
        if (typeof label == "object") label = label.name;
        return { value: field, label };
      });
    });
    
  }

  /**
   * Initializes the application's query logic.
   */
  initializeAppLogic() {
    this.state.subscribe("query", async (query) => {
      this.state.currentData = await this.dataManager.query(query);
    });
    this.state.trigger("query");
  }
}

class DataManager {
  constructor() {
    this.dataManager = new EpiTrackerData();
  }

  async getDataDetails() {
    if (this.dataDetails) return this.dataDetails;

    const initialData = await this.dataManager.getDemographicMortalityData({ 
      year: "2018-2022", 
    });

    this.dataDetails = {
      cause: [...new Set(initialData.map((d) => d.cause))].map(d => d),
      race:  [...new Set(initialData.map((d) => d.race))].map(d => d),
      sex: [...new Set(initialData.map((d) => d.sex))].map(d => d),
      age: [...new Set(initialData.map((d) => d.age_group))].map(d => d).sort(AGE_GROUP_SORT),
      areaState: [...new Set(initialData.map((d) => d.state_fips))].map(d => d),
      year: DATA_YEARS,
    }

    return this.dataDetails;
  }

  /**
   * The main method to query and process data based on user selections.
   * It ensures initialization is complete, fetches raw data, and then processes it.
   * @param {object} query - The query object.
   */
  async query(query) {
    await this.initialization;
    const data = this.processData(await this.rawQuery(query));

    return { data };
  }

  processData(data) {
    // Add confidence intervals (using a basic method)
    for (const row of data) {
      for (const measure of ["crude_rate", "age_adjusted_rate"]) {
        const se = row[measure] / Math.sqrt(row.deaths);
        row[measure + "_ci_lower"] = round(row[measure]-1.96 * se, 2);
        row[measure + "_ci_upper"] = round(row[measure]+1.96 * se, 2);
      }
      row.state = formatName("states", row.state_fips);
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
      age_group: query.age,
      state_fips: query.areaState,
    };

    if (query.compareBar != "none") dataQuery[query.compareBar] = "*";
    if (query.compareFacet != "none") dataQuery[query.compareFacet] = "*";

    return this.dataManager.getDemographicMortalityData(dataQuery, {
      includeTotals: false,
    });
  }
}

class UIManager {
  constructor(state, dataDetails) {
    this.state = state;
    this.dataDetails = dataDetails;
    this.plotDrawer = new PlotDrawer(dataDetails);
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
      filterCompareBar: "#filter-compare-bar",
      filterCompareFacet: "#filter-compare-facet",
      filterCompareBarContainer: "#filter-compare-bar-container",
      filterCompareFacetContainer: "#filter-compare-facet-container",
    });

    this.state.subscribe("renderablePlot", (renderablePlot) => {
      const { query, currentData, displayConfig } = renderablePlot;
      const plotConfig = { query, ...displayConfig};
      // TODO: Add filter
      const currentDataAug = {data: this.getFilteredData()};
      // const currentDataAug = {data: currentData.data};
      this.plotDrawer.updatePlot(currentDataAug, plotConfig);
      // this.plotDrawer.updateTable(currentDataAug);
      this.plotDrawer.drawPlot(this.elems.plotElement);
    });

    this.hookInputs();
    this.hookMenuButtons();
    this.hookTableView();
    this.hookPlotRedraw();
    this.hookTitle();
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

    hookCheckbox("#check-show-ci", this.state, "showCI");
  }

    /**
   * Initialize the logic which updates the title in response to state changes.
   */
  hookTitle() {
    this.state.subscribe("renderablePlot", (renderablePlot) => {
      const measureName = formatName("measures", renderablePlot.displayConfig.measure, "verbose").toLowerCase();
  
      const byString = [renderablePlot.query.compareBar, renderablePlot.query.compareFacet].filter(d => d != "none")
        .join(" and ");
      
      let title = `US ${measureName}`;

      const by = [renderablePlot.query.compareBar, renderablePlot.query.compareFacet].filter(d => d != "none");
      if (by.length > 0) {
        title += " by " + by.map(d => formatName("fields", d).toLowerCase()).join(" and ");
      }

      let filterElements = [
        renderablePlot.query.year,
        renderablePlot.query.cause == "All" ? null : renderablePlot.query.cause,
        renderablePlot.query.race == "All" ? null : renderablePlot.query.race,
        renderablePlot.query.sex == "All" ? null : renderablePlot.query.sex,
        renderablePlot.query.age_group == "All" ? null : renderablePlot.query.age_group,
      ].filter(d => d).map(d => d.toLowerCase());
    
      if (filterElements.length > 0) {
        title += ` | ${filterElements.join(", ")}`;
      }

      this.elems.title.innerText = title;
    });
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

    hookCheckboxList(this.elems.filterCompareBar, this.state, "compareBarFilter", "compareBarFilterOptions");
    hookCheckboxList(this.elems.filterCompareFacet, this.state, "compareFacetFilter", "compareFacetFilterOptions");

    const downloadData = (format) => {
      const filename = "epitracker_data";
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

  updateFilterMenu() {
    if (this.state.currentData) {
      if (this.state.compareBar != "none") {
        this.elems.filterCompareBarContainer.style.display = "flex";
        // const values = [...new Set(this.state.currentData.data.map(d => d[this.state.compareBar]))];
        // if (this.state.compareBar == "age_group") {
        //   values.sort(AGE_GROUP_SORT);
        // } else {
        //   values.sort();
        // }
        const values = this.dataDetails[this.state.compareBar == "age_group" ? "age" : this.state.compareBar];
        this.state.compareBarFilterOptions = values.filter(d => d != "All");
      } else {
        this.elems.filterCompareBarContainer.style.display = "none";
      }
      if (this.state.compareFacet != "none") {
        this.elems.filterCompareFacetContainer.style.display = "flex";
        const values = [...new Set(this.state.currentData.data.map(d => d[this.state.compareFacet]))];
        if (this.state.compareFacet == "age_group") {
          values.sort(AGE_GROUP_SORT);
        } else {
          values.sort();
        }
        this.state.compareFacetFilterOptions = values;
      } else {
        this.elems.filterCompareFacetContainer.style.display = "none";
      }
    }
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


  getFilteredData() {
    if (!this.state.currentData) {
      return null;
    }

    const { compareBarFilter, compareFacetFilter } = this.state;
    let filteredData = this.state.currentData.data; 
    if (this.state.query.compareBar != "none" && compareBarFilter != null) {
      filteredData = filteredData.filter(d => compareBarFilter.has(d[this.state.query.compareBar]));
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
    downloadElementAsImage(this.elems.imageTemplate, "epitracker-graph", format);
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
          this.plotDrawer.drawPlot(this.elems.plotElement);
        }, 300);
        previousSize = [rect.width, rect.height]
      }
    });
    resizeObserver.observe(this.elems.plotElement);
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
}

class PlotDrawer {

  constructor(dataDetails) {
    this.dataDetails = dataDetails;
  }

  updatePlot(currentData, plotConfig) {
    this.currentData = currentData;
    this.plotConfig = plotConfig;

    // TODO: implement
    let xTickFormat = d => d;
    if (plotConfig.query.compareBar == "race" || plotConfig.query.compareBar == "sex") {
      xTickFormat = d => formatName(plotConfig.query.compareBar, d, "short");
    }

    const colorFunction = row => {
      if (plotConfig.query.compareBar != "none" && plotConfig.query.compareBar != "age_group" && plotConfig.query.compareBar != "cause") {
        return COLORS[plotConfig.query.compareBar][row[plotConfig.query.compareBar]];
      } else {
        return COLORS.base;
      }
    };

    // const xDomain = [...new Set(currentData.data.map(d => d[plotConfig.query.compareBar]))];
    // if (plotConfig.query.compareBar == "age_group") {
    //   xDomain.sort(AGE_GROUP_SORT);
    // } else {
    //   xDomain.sort();
    // }
    let xDomain = this.dataDetails[plotConfig.query.compareBar == "age_group" ? "age" : plotConfig.query.compareBar];
    xDomain = xDomain.filter(d => d != "All");
    if (plotConfig.compareBarFilter != null) {
      xDomain = xDomain.filter(d => plotConfig.compareBarFilter.has(d));
    }

    const facetDomain = [...new Set(currentData.data.map(d => d[plotConfig.query.compareFacet]))];
    if (plotConfig.query.compareFacet == "age_group") {
      facetDomain.sort(AGE_GROUP_SORT);
    } else {
      facetDomain.sort();
    }

    this.plotOptions = {
      valueField: plotConfig.measure,
      intervalFields: plotConfig.showCI ? [plotConfig.measure + "_ci_lower", plotConfig.measure + "_ci_upper"] : null,
      xTickFormat,
      xLabel: formatName("fields", plotConfig.query.compareBar),
      xDomain,
      xField: plotConfig.query.compareBar,
      yLabel: formatName("measures", plotConfig.measure, "plot_label"),
      facetLabel:  formatName("fields", plotConfig.query.compareFacet),
      facetDomain,
      color: colorFunction,
      facet: plotConfig.query.compareFacet != "none"? plotConfig.query.compareFacet : null,
      // tooltipFields: [
      //   plotConfig.query.compareFacet,
      //   plotConfig.query.compareColor,
      // ].filter((d) => d != "none")
    };
  }
  
  drawPlot(plotContainer) {
    if (!this.currentData) return;

    const data = this.currentData.data;

    if (data.length == 0) {
      const messageDiv = document.createElement("div");
      messageDiv.innerText = "No data available for current selection.";
      messageDiv.className = "grid-row flex-align-center flex-justify-center height-full";
      plotContainer.replaceChildren(messageDiv);
    } else {
      const { plot } = plotDemographicsBar(plotContainer, data, this.plotOptions);
      plot.style.marginLeft = "auto";
      plot.style.marginRight = "auto";
    }
  }


  drawTable(tableContainer) {
    if (!this.currentData) return;
    const content = document.createElement("div");
    content.className = "table-popup-content";

    document.getElementById("table-title").innerText = document.getElementById("title").innerText;

    let columns = demographicTableColumns;
    if (this.plotConfig.query.compareBar == "age_group" || this.plotConfig.query.compareFacet == "age_group") {
      columns = columns.filter(d => d.field != "age_adjusted_rate");
    }

  
    plotDataTable(this.currentData.data, tableContainer, {
      columns
    });
  }
}

new DemographicsApp();