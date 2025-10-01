import { EpiTrackerData } from "./utils/EpiTrackerData.js";
import { Gridette } from "./utils/Gridette.js";
import { addPopperTooltip, colorRampLegendPivot, createDropdown, downloadElementAsImage, downloadRowData, hookCheckbox, hookComboBox, hookSelect, initializePopup, makeSvgZoomable, minorPopup, plotDataTable, popup, retrieveElements, scaleGradient } from "./utils/helper.js";
import { formatName } from "./utils/nameFormat.js";
import { ObjectCoder, StateURL } from "./utils/StateURL.js";
import * as d3 from "d3";
import { mapTableColumns } from "./utils/tableDefinitions.js";
import { addMapHoverInteraction, addMapTooltip, createChoroplethPlot, createTooltipHistogram } from "./mapPlot.js";
import Range from "@uswds/uswds/js/usa-range";


// TODO: Add proper state dependencies, and a tree print for debugging.
// TODO: (structural) put table column definitions and other set-up stuff in specific files for each document.
// TODO: Add select config information to DOM, data attributes
// TODO: Add proper config for stuff like filepaths
// TODO: Fix selects searchable in edit card popup
// TODO: Fix population display
// TODO: Move shared state conditionals (and expand to more cancers, e.g. cervical can't be male, etc.).

const STATES_GEOJSON_FILEPATH = "../data/geography/states.geojson";
const COUNTIES_GEOJSON_FILEPATH = "../data/geography/counties.geojson";
const NATION_GEOJSON_FILEPATH = "../data/geography/nation.geojson"


const DEFAULT_STATE = {
  cards: [
    {
      x: 1, y: 1, 
      state: {
        year: "2018-2022",
        sex: "All",
        cause: "All",
        race: "Asian",
        areaCounty: "All",
        areaState: "All",
        spatialLevel: "county",
      }
    },
    {
      x: 2, y: 1,
      state: { blank: true }
    },
  ],
  
  sex: "All",
  race: "All",
  year: "2018-2022",
  areaCounty: "All",
  areaState: "All",
  spatialLevel: "county",
  cause: "All",

  measure: "age_adjusted_rate",

  colorScheme: "RdYlBu",
  colorReverse: true,
  colorCenterMean: true,
  colorExcludeExtremes: true,
  colorExtremeCutoff: 3,

  showOutlineCounty: false,
  showOutlineState: true,
  showOutlineMap: true,
}

const DATA_YEARS = ["2018-2022"]; // TODO: Add other years

const SPATIAL_LEVELS = ["county", "state"];

const CARD_FIELDS = ["year", "cause", "race", "sex", "areaCounty", "areaState", "spatialLevel"];
const PLOT_SETTINGS = [
  "colorScheme", "colorReverse", "colorCenterMean", "colorExcludeExtremes", "colorExtremeCutoff", 
  "measure", "showOutlineCounty", "showOutlineState", "showOutlineMap"
]
const URL_PROPERTIES = ["cards", ...PLOT_SETTINGS];

const NUMERIC_MEASURES = [
  "age_adjusted_rate",
  "crude_rate",
  "deaths",
  "population",
];

const SELECT_CONFIGS = [
  { id: "select-select-year", propertyName: "year" },
  { id: "select-select-race", propertyName: "race", dataDependent: true },
  { id: "select-select-sex", propertyName: "sex", dataDependent: true },
  { id: "combo-select-cause", propertyName: "cause", dataDependent: true },
  { id: "select-select-level", propertyName: "spatialLevel" },
  { id: "combo-select-state", propertyName: "areaState", dataName: "state_fips", dataDependent: true },
  // { id: "select-select-county", propertyName: "areaCounty", dataName: "county_fips" },

  { id: "select-measure", propertyName: "measure" },
  { id: "combo-color-scheme", propertyName: "colorScheme" }
];

const CARD_TITLE_FORMATTERS = {
  sex: d => d == "All" ? "All sexes" : d,
  race: d => d == "All" ? "All races" : d,
  cause: d => d == "All" ? "All cancers" : d,
  areaState: d => d == "All" ? "US" : formatName("states", d),
  // areaCounty: d => `${this.countyNameMap.get(d)} (${formatName("states", d.slice(0, 2), "short")})`
}

const CARDS_CODER = {
  encode: (cards) => {
    return cards.map(card => {
      let encodedCardState = ["-"];
      if (!card.state.blank) {
        encodedCardState = CARD_FIELDS.map(field => card.state[field]);
      }

      const encoded = JSON.stringify([
        card.x,
        card.y,
        ...encodedCardState,
      ])
      return encoded;
    }).join("+");
  },
  decode: (value) => {
    const cardStrings = value.split("+");

    if (!value) {
      return [];
    }

    return cardStrings.map(cardString => {
      const cardValues = JSON.parse(cardString);
      const cardState = {};
      if (cardValues[2] == "-") {
        cardState.blank = true;
      } else {
        CARD_FIELDS.forEach((field, i) => {
          cardState[field] = cardValues[i+2];
        });
      }
      const decodedCard = {x: cardValues[0], y: cardValues[1], state: cardState};
      return decodedCard;
    });
  }
};

class MapApp {
  constructor() {
    this.init();
  }

  async init() {

    this.state = new StateURL(DEFAULT_STATE, URL_PROPERTIES, { cards: CARDS_CODER });

    this.dataManager = new DataManager(this.state);
    await this.initializeAppState();

    this.state.subscribe("cards", () => {
      this.updatedCards()
      this.state.colorConfig = this.#calculateColorConfig();
    });

    let previousMeasure = this.state.measure;
    this.state.subscribe("plotSettings", () => {
      // Population is a special case, not just a field in the dataset, and this slightly hack-y logic handles that 
      // by clearing the data cache and forcing a full card update.
      if ((previousMeasure != "population" && this.state.measure == "population")
        || (previousMeasure == "population" && this.state.measure != "population")) {
          previousMeasure = this.state.measure;
          this.dataManager.clearCache();
          this.state.trigger("cards");
        }

      this.state.colorConfig = this.#calculateColorConfig();
    });

    this.uiManager = new UIManager(this.state, this.dataManager);
    this.uiManager.setInputsEnabled(true);
    this.uiManager.on("rowDeleted", (...params) => this.deleteRow(...params));
    this.uiManager.on("columnDeleted",(...params) => this.deleteColumn(...params));
    this.uiManager.on("rowAdded", (...params) => this.addRow(...params));
    this.uiManager.on("columnAdded",(...params) => this.addColumn(...params));
    this.uiManager.on("gridCellsSwapped",(...params) => this.swapGridCells(...params));

    this.state.trigger("cards");
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

    this.defaultSelectOptions = { 
      ...await this.dataManager.getDataDetails(),

      measure: NUMERIC_MEASURES.map(field => {
        let label = formatName("measures", field);
        if (typeof label == "object") label = label.name;
        return { value: field, label: label };
      }),
      
      areaState: stateOptions,

      year: DATA_YEARS,
      spatialLevel: SPATIAL_LEVELS.map(d => ({
        value: d, label: formatName("levels", d)
      })),
      

      colorScheme: Object.entries(formatName("colorSchemes")).map(
        ([k, name]) => {
          const colorScale = d3.scaleSequential(d3["interpolate" + k]);
          const div = document.createElement("div");
          const labelSpan = document.createElement("span");
          labelSpan.innerText = name;
          div.appendChild(scaleGradient(colorScale, 6, 100));
          div.appendChild(labelSpan);
          div.value = name;
          return { value: k, label: name, element: div };
        })
    };

    for (const selectConfig of SELECT_CONFIGS) {
      let options = this.defaultSelectOptions[selectConfig.propertyName];
      // options = options.map(option => typeof option == "string" ? ({ value: option, label: option}) : option);
      // options.forEach(option => option.baseLabel = option.label);
      this.state.defineProperty(selectConfig.propertyName);
      this.state.defineProperty(selectConfig.propertyName + "Options", options);
    }

    const dataDependentProperties = SELECT_CONFIGS.filter(d => d.dataDependent).map(d => d.propertyName);
    this.state.defineJointProperty("dataDependent", dataDependentProperties);
    this.state.subscribe("dataDependent", () => this.#updatedDataDependent());

    this.state.defineJointProperty("plotSettings", PLOT_SETTINGS);
    this.state.defineProperty("title", null);
    this.state.defineProperty("colorConfig", null, ["cards", "plotSettings"]);
    this.state.defineProperty("cardDataMap", null, ["cards"]);
    this.state.defineProperty("cardTitleMap", null, ["cards"]);

    // Prostate cancer is 'Male' only.
    // Cervix Uteri, Corpus and Uterus, and Ovary are 'Female' only.
    // Breast can be either, but should default to 'Female'.
    this.state.subscribe("cause", () => {
      // TODO: Move this logic to a shared file (it also applies on the other pages).

      if (this.state.cause == "Prostate") {
        this.state.sexOptions = ["Male"];
      } else if (["Cervix Uteri", "Corpus and Uterus", "Ovary"].includes(this.state.cause)) {
        this.state.sexOptions = ["Female"];
      } else if (this.state.cause == "Breast") {
        this.state.sexOptions = ["All", "Male", "Female"];
        this.state.sex = "Female";
      } else {
        this.state.sexOptions = this.defaultSelectOptions.sex;
      }
    });
  }

  updatedCards() {
    // Always have at least one blank card.
    if (this.state.cards.length == 0) {
      this.state.cards = [{x: 1, y: 1, state: {blank: true}}];
    }

    this.nRows = d3.max(this.state.cards, d => d.y);
    this.nCols = d3.max(this.state.cards, d => d.x);

    this.sharedState = this.#calculateSharedState();
    this.state.title = this.#calculateTitle();
    this.state.cardTitleMap = this.#calculateCardTitles();

    const cardDataMap = new Map();
    for (const card of this.state.cards) {
      if (!card.state.blank) {
        cardDataMap.set(card.state, this.dataManager.query(card.state));
      }
    }
    this.state.cardDataMap = cardDataMap;
  }

  deleteRow(y) {
    let cards = this.state.cards.filter(d => d.y != y);
    cards.forEach(card => {
      if (card.y > y) {
        card.y--;
      }
    });
    this.state.cards = cards;
  }

  deleteColumn(x) {
    const cards = this.state.cards.filter(d => d.x != x);
    cards.forEach(card => {
      if (card.x > x) {
        card.x--;
      }
    })
    this.state.cards = cards;
  }

  addRow() {
    const nRows = this.nRows + 1;
    for (let x = 1; x <= this.nCols; x++) {
      this.state.cards.push({ x, y: nRows, state: {blank: true}}); 
    }
    this.state.trigger("cards");
  }

  addColumn() {
    const nCols = this.nCols + 1;
    for (let y = 1; y <= this.nRows; y++) {
      this.state.cards.push({ x: nCols, y, state: {blank: true}}); 
    }
    this.state.trigger("cards");
  }

  swapGridCells(cell1, cell2) {
    const card1 = this.state.cards.find(d => d.x == cell1.x && d.y == cell1.y);
    const card2 = this.state.cards.find(d => d.x == cell2.x && d.y == cell2.y);
    
    const { x, y } = card1;
    card1.x = card2.x;
    card1.y = card2.y;
    card2.x = x;
    card2.y = y;
    
    this.state.trigger("cards");
  }

  async #updatedDataDependent() {
    // Handles inter-dependent select logic (so the user knows when certain selection combinations have no data).
    // TODO: This isn't functional yet, due to some strange bugs, but it's low-priority so we'll fix it later.

    // const editQueryState = {};
    // for (const field of CARD_FIELDS) {
    //   editQueryState[field] = this.state[field];
    // }

    // for (const select of SELECT_CONFIGS.filter(d => d.dataDependent)) {
    //   const dataName = select.dataName ?? select.propertyName;
    //   const query = { ... editQueryState, [dataName]: "*" };
    //   const data = await this.dataManager.query(query);
    //   const valueSet = new Set(data.map(d => d[dataName]));
    //   this.state[select.propertyName + "Options"].forEach(option => {
    //     if (typeof option == "string") {
    //       option = {value: option, label: option};
    //     }

    //     if (select.propertyName == "areaState") {
    //       // Special case for state field
    //       // console.log("areaState special case")
    //       // if (data.length == 0) {
    //       //   option.label = option.label + " (no data for selection)";
    //       // }
    //     } else {
    //       if (!valueSet.has(option.value)) {
    //         option.label = option.label + " (no data for selection)";
    //       }
    //     }
    //   });
    //   this.state.trigger(select.propertyName + "Options");
    // }

  }

  #calculateSharedState() {
    const cardStates = this.state.cards.filter(d => !d.state.blank).map(d => d.state);

    const sharedState = { ...cardStates[0] };
    for (const cardState of cardStates.slice(1)) {
      if (cardState) {
        for (const [k, v] of Object.entries(cardState)) {
          if (sharedState[k] != v) {
            delete sharedState[k];
          }
        }
      }
    }

    return sharedState;
  }

  #calculateTitle() {
    if (this.state.cards.every(d => d.state.blank)) {
      return "";
    }

    const baseElements = [
       formatName("measures", this.state.measure, "shortish")
    ];
    let filterElements = [
      this.sharedState.year,
      this.sharedState.race == "All" ? "All races" : this.sharedState.race,
      this.sharedState.sex == "All" ? "All sexes" : this.sharedState.sex,
    ]
    if (this.sharedState.measure != "population") {
      filterElements.push(this.sharedState.cause == "All" ? "All cancers" : this.sharedState.cause)
    }
    filterElements = filterElements.filter(d => d);

    let title = `US ${baseElements.filter(d => d).map(d => d.toLowerCase()).join(" ")}`;
    if (filterElements.length > 0) {
      title += `, ${filterElements.join(", ")}`;
    }

    return title;
  }

  #calculateCardTitles() {
    const differentFields = CARD_FIELDS.filter(field => !this.sharedState.hasOwnProperty(field));

    let cardTitleMap = new Map();
    for (const card of this.state.cards) {
      if (!card.state.blank) {
        const titleElements = []
        for (const field of ["sex", "race", "cause"]) {
          if (differentFields.includes(field)) {
            const value = card.state[field];
            titleElements.push(CARD_TITLE_FORMATTERS[field](value));
          }
        }

        // Area is a special case because we want to consider state and county together
        if (differentFields.includes("areaCounty") || differentFields.includes("areaState")) {
          if (card.state.areaCounty != "All") {
            titleElements.push(CARD_TITLE_FORMATTERS.areaCounty(card.state.areaCounty))
          } else {
            titleElements.push(CARD_TITLE_FORMATTERS.areaState(card.state.areaState))
          }
        }

        cardTitleMap.set(card.state, titleElements.join(", "));
      } 
    }

    return cardTitleMap;
  }

  async #calculateColorConfig() {
    if (this.state.cards.every(d => d.state.blank)) {
      return null;
    }

    const colorConfig = {
      scheme: this.state.colorScheme,
      reverse: this.state.colorReverse,
    };

    let allValues = []
    for (const card of this.state.cards) {
      if (!card.state.blank) {
        const data = await this.dataManager.query(card.state);
        data.forEach(row => allValues.push(row[this.state.measure]));
      }
    }

    if (this.state.colorExcludeExtremes) {
      const median = d3.median(allValues);
      const deviations = allValues.map(d => Math.abs(d - median));
      const MAD = 1.4826 * d3.median(deviations);
      const initialClipDomain = [ median - 5 * MAD, median + 5 * MAD];
      allValues = allValues.filter(d => d > initialClipDomain[0] && d < initialClipDomain[1]);  
    }

    const mean = d3.mean(allValues)
    let domain = d3.extent(allValues);

    if (this.state.colorCenterMean) {
      colorConfig.pivot = mean;
    } else {
      colorConfig.pivot = null;
    }

    if (this.state.colorExcludeExtremes && allValues.length > 1) {
      const std = d3.deviation(allValues);
      
      const clipDomain = [-this.state.colorExtremeCutoff, this.state.colorExtremeCutoff].map(d => mean + d*std);
      colorConfig.domain = [
        Math.max(domain[0], clipDomain[0]),
        Math.min(domain[1], clipDomain[1]),
      ]
    } else {
      colorConfig.domain = domain
    }

    if (Number.isFinite(mean) && domain.every(d => Number.isFinite(d))) {
      colorConfig.valid = true;
    }

    return colorConfig;
  }
}

class UIManager {
  constructor(state, dataManager) {
    this.state = state;
    this.dataManager = dataManager;
    this.init();
  }

  on(name, callback) {
    this.callbackMap.get(name).push(callback);
  }

  emit(name, ...params) {
    const callbacks = this.callbackMap.get(name);
    callbacks.forEach(callback => callback(...params));
  }

  init() {
    this.elems = retrieveElements({
      dashboardContainer: "#dashboard-container",
      gridContainer: "#grid-container",
      templateCard: "#template-card",
      templateCardBlank: "#template-card-blank",
      popupContentTable: "#popup-content-table",
      tableTitle: "#table-title",
      tableContainer: "#table-container",
      plotConfigurator: "#plot-configurator",
      buttonCardSubmit: "#button-card-submit",
      mapsTitle: "#maps-title",
      colorLegendContainer: "#color-legend-container",
      dropdownContentSettings: "#dropdown-content-settings",
      mapTooltipContent: "#map-tooltip",
      mapTooltipName: "#map-tooltip-name",
      mapTooltipValue: "#map-tooltip-value",
      mapTooltipPlot: "#map-tooltip-plot",
      rangeExtremeCutoff: "#range-extreme-cutoff",
      selectCauseContainer: "#select-cause-container",
      
      templateImagePlotCell: "#template-image-map-plot-cell",
      imageTemplate: "#img-template",
      imageTitle: "#img-title",
      imagePlotGrid: "#img-plot-grid",
    });

    this.cardElementMap = new WeakMap();
    this.cardPlotMap = new WeakMap();

    this.callbackMap = new Map([
      ["rowAdded", []],
      ["rowDeleted", []],
      ["columnAdded", []],
      ["columnDeleted", []],
      ["gridCellsSwapped", []]
    ]);

    this.grid = new Gridette(this.elems.gridContainer, { handle: ".plotgrid-card-handle" });
    this.grid.on("swap", (cell1, cell2) => this.emit("gridCellsSwapped", cell1, cell2));

    this.state.subscribe("cards", () => this.updatedCards());

    document.getElementById("grid-add-row").addEventListener("click", () => this.emit("rowAdded"));
    document.getElementById("grid-add-col").addEventListener("click", () => this.emit("columnAdded"));

    this.state.subscribe("title", () => this.updatedTitle());
    this.state.subscribe("colorConfig", () => this.updatedColorConfig());

    const handleCauseSelectDisplay = () => {
      if (this.state.plotSettings.measure == "population") {
        // TODO: Disable, don't hide.
        this.elems.selectCauseContainer.style.visibility = "hidden";
      } else {
        this.elems.selectCauseContainer.style.visibility = "visible";
      }
    }

    this.state.subscribe("plotSettings", handleCauseSelectDisplay);
    handleCauseSelectDisplay();

    this.popup = initializePopup();

    this.hookInputs();
    this.hookMenuButtons();
    this.hookMapInteraction();

    let resizeTimer = null;
    const dashboardResizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimer);

      this.clearCards();
      resizeTimer = setTimeout(() => {
        this.#redrawPlots();
      }, 100)
    })
    dashboardResizeObserver.observe(this.elems.dashboardContainer);
  }


  hookInputs() {
    this.comboBoxes = [];
    this.selects = [];
    for (const selectConfig of SELECT_CONFIGS) {
      const element = document.getElementById(selectConfig.id);
      if (element.nodeName == "SELECT") {
        hookSelect(element, this.state, selectConfig.propertyName, selectConfig.propertyName + "Options");
        this.selects.push(element);
      } else if (element.classList.contains("usa-combo-box")) {
        const comboBox = hookComboBox(element, this.state, 
          selectConfig.propertyName, selectConfig.propertyName + "Options");
        this.comboBoxes.push(comboBox);
      } 
    }

    this.elems.buttonCardSubmit.addEventListener("click", () => {
      const updatedCardState = {};
      for (const field of CARD_FIELDS) {
        updatedCardState[field] = this.state[field];
      }
      this.currentlyEditingCard.state = updatedCardState;
      this.currentlyEditingCard = null;
      this.popup.close();
      this.state.trigger("cards");
    });

    hookCheckbox("#check-color-reverse", this.state, "colorReverse");
    hookCheckbox("#check-color-center", this.state, "colorCenterMean");
    hookCheckbox("#check-color-exclude-extremes", this.state, "colorExcludeExtremes");

    hookCheckbox("#check-outline-county", this.state, "showOutlineCounty");
    hookCheckbox("#check-outline-state", this.state, "showOutlineState");
    hookCheckbox("#check-outline-map", this.state, "showOutlineMap");

    createDropdown(this.elems.dashboardContainer, document.querySelector("#table-button-download-data"), [
      { label: "Download data (.csv)", action: () => this.downloadData("csv")},
      { label: "Download data (.tsv)", action: () => this.downloadData("tsv") },
      { label: "Download data (.json)",  action: () => this.downloadData("json") },
    ]);

    this.elems.rangeExtremeCutoff.addEventListener("input", () => {
      this.state.colorExtremeCutoff = parseFloat(this.elems.rangeExtremeCutoff.value);
    });
    Range.on(); // This is the USDWS range JS component. It's pretty pointless, but we'll adhere to the standard here.
  }

  hookMenuButtons() {
    minorPopup(this.elems.dashboardContainer, document.getElementById("button-settings"), 
      this.elems.dropdownContentSettings, "Settings");

    document.querySelector("#button-undo").addEventListener("click", () => {
      this.state.undo();
    });

    document.querySelector("#button-redo").addEventListener("click", () => {
      this.state.redo();
    });

    document.querySelector("#button-table").addEventListener("click", () => {
      this.#updateTable();
      this.popup.open(this.elems.popupContentTable, "Data Table");
    });

    createDropdown(this.elems.dashboardContainer, document.querySelector("#button-download"), [
      { label: "Download data (.csv)", action: () => this.downloadData("csv")},
      { label: "Download data (.tsv)", action: () =>  this.downloadData("tsv") },
      { label: "Download data (.json)",  action: () =>  this.downloadData("json"), separatorAfter: true },
      { label: "Download graph (.png)", action: () => this.downloadGraph("png") },
      { label: "Download graph (.svg)", action: () => this.downloadGraph("svg") },
    ]);

    createDropdown(this.elems.dashboardContainer, document.querySelector("#button-edit-grid"), [
      { label: "Add map grid row", action: () => this.emit("rowAdded")},
      { label: "Add map grid column", action: () => this.emit("columnAdded") },
    ]);
  }

  hookMapInteraction() {
    this.mapTooltip = addPopperTooltip(this.elems.dashboardContainer);

    // for (const )
  }

 

  async downloadData(format) {
    const filename = "epitracker_map_data";
    const data = await this.#getFlattenedData();
    downloadRowData(data, filename, format);
  }

  clearCards() {
    for (const card of this.state.cards) {
      if (!card.state.blank) {
        const cardContentElement = this.cardElementMap.get(card.state)?.querySelector(".plotgrid-card-content");
        if (cardContentElement) {
          cardContentElement.replaceChildren();
        }
      }
    }
  }

   async downloadGraph(format) {
    this.elems.imagePlotGrid.style.width = "1600px";
    this.elems.imagePlotGrid.style.height = "900px";

    this.elems.imagePlotGrid.style.gridTemplateRows = `repeat(${this.grid.nRows}, minmax(0, 1fr))`;
    this.elems.imagePlotGrid.style.gridTemplateColumns = `repeat(${this.grid.nCols}, minmax(0, 1fr))`;

    this.elems.imageTitle.innerText = this.state.title;


    const div = document.createElement("div");
    div.innerText = "Preparing download image (this may take a few seconds)";
    this.popup.open(div, "Downloading");

    setTimeout(async () => {
      for (const card of this.state.cards) {
        if (!card.state.blank) {
          const mapPlot = await this.cardPlotMap.get(card);
          const cellElement = this.elems.imagePlotGrid.querySelector(`#image-map-plot-cell-${card.x}-${card.y}`);
          
          const cellTitleElement = cellElement.querySelector(".image-map-plot-cell-title");
          const title = this.state.cardTitleMap.get(card.state);
          cellTitleElement.innerText = title;

          const cellPlotElement = cellElement.querySelector(".image-map-plot-cell-plot");
          mapPlot.draw(cellPlotElement, this.state.measure, await this.state.colorConfig);

          this.elems.imagePlotGrid.style.width = "fit-content";
          this.elems.imagePlotGrid.style.height = "fit-content";
        }
      }

      await downloadElementAsImage(this.elems.imageTemplate, "epitracker-map-grid", format);
      div.innerText = "Image prepared, your download will appear shortly.";
      // this.popup.close();
    }, 500);

    // requestAnimationFrame(() => {
    //   downloadElementAsImage(this.elems.imageTemplate, "epitracker-map-grid", format);
    // });
  }

  async updatedCards() {
    this.clearCards();

    let nRows = 0;
    let nCols = 0;
    this.state.cards.forEach(card => {
      nRows = Math.max(nRows, card.y);
      nCols = Math.max(nCols, card.x);
    });
    this.grid.setGridSize(nRows, nCols);

    for (const card of this.state.cards) {
      if (!card.state.blank) {
        const mapPlot = this.#createCardMapPlot(card);
        this.cardPlotMap.set(card, mapPlot);
      }

      let element = this.cardElementMap.get(card.state);
      if (!element) {
        element = await this.#createCardElement(card);
        this.grid.setCell(element, card.x, card.y);
        this.cardElementMap.set(card.state, element);
      } else {
        if (!card.state.blank) {
          const cardTitle = this.state.cardTitleMap.get(card.state);
          element.querySelector("#plotgrid-card-title").innerText = cardTitle;
          this.grid.setCell(element, card.x, card.y);
        }
      
      }
    }

    // Update downloadable image template
    this.elems.imagePlotGrid.style.gridTemplateRows = `repeat(${this.grid.nRows}, minmax(0, 1fr))`;
    this.elems.imagePlotGrid.style.gridTemplateColumns = `repeat(${this.grid.nCols}, minmax(0, 1fr))`;
    const cellElements = [];
    for (const card of this.state.cards) {
      let cellElement;
      if (!card.state.blank) {
        cellElement = this.elems.templateImagePlotCell.content.cloneNode(true).firstElementChild;
        cellElement.setAttribute("id", `image-map-plot-cell-${card.x}-${card.y}`);
       
      } else {
        cellElement = document.createElement("div");
      }
      cellElement.style.gridRow = card.y;
      cellElement.style.gridColumn = card.x;
      cellElements.push(cellElement);
    }
    this.elems.imagePlotGrid.replaceChildren(...cellElements);
  }

  async #createCardMapPlot(card) {
    const { countyGeoJSON, stateGeoJSON, nationGeoJSON } = await this.dataManager.getGeoJSON();

    let featureCollection = null;
    if (card.state.spatialLevel == "county") {
      featureCollection = countyGeoJSON;

      // if (card.state.areaCounty != "All") {
      //   featureCollection = {
      //     type: "FeatureCollection",
      //     features: featureCollection.features.filter(d => d.id.startsWith(card.state.areaCounty))
      //   }
      // }
      if (card.state.areaState != "All") {
        featureCollection = {
          type: "FeatureCollection",
          features: featureCollection.features.filter(d => d.id.startsWith(card.state.areaState))
        }
      }
    } else {
      featureCollection = stateGeoJSON;
      if (card.state.areaState != "All") {
        featureCollection = {
          type: "FeatureCollection",
          features: featureCollection.features.filter(d => d.id == card.state.areaState)
        }
      }
    }

    let overlays = [];
    if (this.state.showOutlineState && card.state.spatialLevel == "county" ) {
      let featureCollection = stateGeoJSON;
      if (card.state.areaState != "All") {
        featureCollection = {
          type: "FeatureCollection",
          features: stateGeoJSON.features.filter(d => d.id == card.state.areaState)
        }
      }
      overlays.push({featureCollection, strokeColor: "#c4c4c4"});
    }
    if (this.state.showOutlineMap) {
      overlays.push({
        featureCollection: nationGeoJSON.features,
        strokeColor: "#3d4551",
      });
    }
    

    return new MapPlot(card.state, this.state, this.dataManager, featureCollection, overlays);
  }

  updatedTitle() {
    this.elems.mapsTitle.innerText = this.state.title;
  }

  updatedColorConfig() {
    this.#updateMapTooltip();
    this.#updateColorLegend();
    this.#redrawPlots();
  }
  

  /**
   * Enables and disables the input elements of the UI.
   * @param {*}  A boolean indicating whether to enable (`true`) or disable (`false`) the input elements.
   */
  setInputsEnabled(enabled) {
    for (const element of this.selects) {
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

  async #getFlattenedData() {
    return Promise.all(this.state.cardDataMap.values()).then((resolvedDataArrays) => {
      return resolvedDataArrays.flat();
    });
  }

  async #updateMapTooltip() {
    const data = await this.#getFlattenedData();
    const colorConfig = await this.state.colorConfig;
    const inRangeValues = data.map(d => d[this.state.measure])
      .filter(d => d >= colorConfig.domain[0] && d <= colorConfig.domain[1]);
    this.mapTooltipHistogram =  createTooltipHistogram(inRangeValues);
    this.elems.mapTooltipPlot.replaceChildren(this.mapTooltipHistogram);
  }

  async #updateColorLegend() {
    const measureName = this.state.measure ? formatName("measures", this.state.measure) : "Measure";

    const colorConfig = await this.state.colorConfig;
    if (colorConfig) {
      const sharedColorLegend = colorRampLegendPivot(colorConfig, { label: measureName });
      this.elems.colorLegendContainer.replaceChildren(sharedColorLegend);
    } else {
       this.elems.colorLegendContainer.replaceChildren();
    }

  }

  #updateTable() {
    this.elems.tableTitle.innerText = this.elems.mapsTitle.innerText;

    this.#getFlattenedData().then((allData) => {
      plotDataTable(allData, this.elems.tableContainer, {
        columns: mapTableColumns
      });
    });

  }

  async #createCardElement(card) {
    if (card.state.blank) {
      return this.#createBlankItemElement(card);
    } else {
      const cardElement = this.elems.templateCard.content.cloneNode(true).firstElementChild;

      const cardTitle = this.state.cardTitleMap.get(card.state);
      cardElement.querySelector("#plotgrid-card-title").innerText = cardTitle;

      cardElement.querySelector(".plotgrid-card-delete").addEventListener("click", () => {
        card.state = { blank: true };
        this.state.trigger("cards");
      });

      cardElement.querySelector(".plotgrid-card-expand").addEventListener("click", async () => {
        const expandPlotContainer = document.createElement("div");
        expandPlotContainer.setAttribute("id", "popup-plot-container");

        expandPlotContainer.style.width = "80vw";
        expandPlotContainer.style.height = "80vh";
        const mapPlot = await this.cardPlotMap.get(card);
        const expandCardTitle =  `${this.elems.mapsTitle.innerText}, ${cardTitle}`
        this.popup.open(expandPlotContainer, expandCardTitle);
        const plotElement = mapPlot.draw(expandPlotContainer, this.state.measure, await this.state.colorConfig);
        makeSvgZoomable("#popup-plot-container svg", "#popup-plot-container svg g");

        this.#addMapInteractivity(plotElement, mapPlot);
      });


      cardElement.querySelector("#button-edit-card").addEventListener("click", () => {
        this.currentlyEditingCard = card;
        for (const field of CARD_FIELDS) {
          this.state[field] = card.state[field];
        }
        this.popup.open(this.elems.plotConfigurator, "Edit plot card");
      });


      return cardElement;
    }
  }

  async #redrawPlots() {
    requestAnimationFrame(async () => {
      for (const card of this.state.cards.filter(d => !d.state.blank)) {
        const cardContentElement = this.cardElementMap.get(card.state).querySelector(".plotgrid-card-content");
        const mapPlot = await this.cardPlotMap.get(card);
        const plotElement = mapPlot.draw(cardContentElement, this.state.measure, await this.state.colorConfig);
        this.#addMapInteractivity(plotElement, mapPlot);
      }
    });

  }


  #addMapInteractivity(plotElement, mapPlot) {
    const onHover = (path, feature) => {
      let name = feature.properties.name;
      if (mapPlot.cardState.spatialLevel == "county") {
        name +=  ", " + feature.properties.state;
      }
      this.elems.mapTooltipName.innerText = name;

      const value = mapPlot.dataIndex.get(feature.id)?.[this.state.measure];
      this.elems.mapTooltipValue.innerText = value != null ? value.toLocaleString() : "N/A";

      const xScale = this.mapTooltipHistogram.scale("x");
      const yScale = this.mapTooltipHistogram.scale("y");
      
      d3.select(this.mapTooltipHistogram)
        .selectAll("circle").data(Number.isFinite(value) ? [value] : []).join("circle")
        .attr("cx", d => xScale.apply(d))
        .attr("cy", yScale.apply(0))
        .attr("r", 3)
        .attr("fill", "red")

      this.mapTooltip.show(path, this.elems.mapTooltipContent);
      d3.select(path).raise();
    };

    const onUnhover = () => {
      this.mapTooltip.hide();
    }

    addMapHoverInteraction(plotElement, mapPlot.primaryFeatureCollection, onHover, onUnhover);
  }


  #createBlankItemElement(card) {
    const blankItemElement = this.elems.templateCardBlank.content.cloneNode(true).firstElementChild;

    createDropdown(this.elems.dashboardContainer, blankItemElement.querySelector(".plotgrid-blank-delete-button i"), [
      { label: "Delete map grid row", action: () => this.emit("rowDeleted", card.y) },
      { label: "Delete map grid column", action: () =>this.emit("columnDeleted", card.x) },
    ])

    blankItemElement.addEventListener("click", (e) => {
      // e.preventDefault();
      this.currentlyEditingCard = card;
      this.popup.open(this.elems.plotConfigurator, "Create plot card");
    });

    return blankItemElement;
  }
}

class DataManager {
  constructor(state) {
    this.state = state;
    this.dataManager = new EpiTrackerData();
    this.dataCache = new Map();
    this.state.subscribe("cards", () => this.updatedCards());
  }

  async getDataDetails() {
    const initialData = await this.dataManager.getCountyMortalityData({
      year: "2018-2022"
    }, { withPopulation: false });

    const valueObj = {}
    for (const field of ["race", "sex", "cause", "county_fips", "state_fips"]) {
      const values = [...new Set(initialData.map(d => d[field]))].map(d => d);
      valueObj[field] = values;
      values.sort((a, b) => {
        if (a === 'All') return -1;
        if (b === 'All') return 1;  
        return a.localeCompare(b);  
      });
    }
    return valueObj
  }

  updatedCards() {
    const updatedDataCache = new Map();
    for (const card of this.state.cards) {
      if (!card.state.blank) {
        let cardData = this.query(card.state);
        updatedDataCache.set(card.state, cardData);
      }
    }
    this.dataCache = updatedDataCache;
  }

  async getGeoJSON() {
    if (this.geoJSON) {
      return this.geoJSON;
    } else {
      this.geoJSON = {
        stateGeoJSON: await d3.json(STATES_GEOJSON_FILEPATH),
        countyGeoJSON: await d3.json(COUNTIES_GEOJSON_FILEPATH),
        nationGeoJSON: await d3.json(NATION_GEOJSON_FILEPATH),
      };
      this.countyNameMap = new Map(this.geoJSON.countyGeoJSON.features.map(d => [d.id, d.properties.name]));
      return this.geoJSON;
    }
  }

  async query(cardState) {
    // console.time("Query");
    let cardData = this.dataCache.get(cardState);
    if (cardData) {
      return cardData;
    } 
    
    const query = {
      sex: cardState.sex,
      race: cardState.race,
      cause: cardState.cause,
      year: cardState.year
    };
    if (cardState.areaCounty && cardState.areaCounty != "All") {
      query.county_fips = cardState.areaCounty
    }
    if (cardState.areaState && cardState.areaState != "All") {
      query.state_fips = cardState.areaState
    }
    if (cardState.spatialLevel == "state") {
      query.county_fips = "All";
    }

    // const populationQuery = { ...query };
    // delete populationQuery.cause;
    // const populationData = await this.dataManager.getPopulationData(populationQuery, { includeTotals: false });
    // const mortalityData = await this.dataManager.getCountyMortalityData(query, {
    //   includeTotals: false,
    //   states: this.state.areaStateOptions,
    //   counties: this.state.areaCountyOptions,
    // });

    let data = null;
    if (this.state.measure == "population") {
      const populationQuery = { ...query };
      delete populationQuery.cause;
      data = this.dataManager.getPopulationData(populationQuery, { includeTotals: false });
    } else {
      data = this.dataManager.getCountyMortalityData(query, {
        includeTotals: false,
        states: this.state.areaStateOptions,
        counties: this.state.areaCountyOptions,
      });
    }

    await this.getGeoJSON();
    // console.timeEnd("Query");

    return this.processData(await data);
  }

  clearCache() {
    this.dataCache = new Map();
  }

  processData(data) {
    for (const row of data) {
      row.state = formatName("states", row.state_fips);
      row.county = this.countyNameMap.get(row.county_fips) ?? "N/A";
    }
    return data; 
  }
}

class MapPlot {
  constructor(cardState, state, dataManager, options={}) {
    options = {
      ...options 
    };
    Object.assign(this, options);

    this.cardState = cardState;
    this.state = state;
    this.dataManager = dataManager;
    this.indexField = cardState.spatialLevel + "_fips";

    this.init();
  }

  async init() {
    this.data = await this.state.cardDataMap.get(this.cardState);
    this.dataIndex = d3.index(this.data, d => d[this.indexField]);

    const { countyGeoJSON, stateGeoJSON, nationGeoJSON } = await this.dataManager.getGeoJSON();
    this.stateGeoJSON = stateGeoJSON;
    this.countyGeoJSON = countyGeoJSON;

    let featureCollection = null;
    if (this.cardState.spatialLevel == "county") {
      featureCollection = countyGeoJSON;

      if (this.cardState.areaCounty != "All") {
        featureCollection = {
          type: "FeatureCollection",
          features: featureCollection.features.filter(d => d.id == this.cardState.areaCounty)
        };
        this.mapOutline = featureCollection;
      } else if  (this.cardState.areaState != "All") {
        featureCollection = {
          type: "FeatureCollection",
          features: featureCollection.features.filter(d => d.id.startsWith(this.cardState.areaState))
        };
        this.mapOutline = stateGeoJSON.features.filter(d => d.id == this.cardState.areaState);
      } else {
        this.mapOutline = nationGeoJSON;
      }
    } else {
      featureCollection = stateGeoJSON;
      if (this.cardState.areaState != "All") {
        featureCollection = {
          type: "FeatureCollection",
          features: featureCollection.features.filter(d => d.id == this.cardState.areaState)
        };
        this.mapOutline = stateGeoJSON.features.filter(d => d.id == this.cardState.areaState);
      } else {
        this.mapOutline = nationGeoJSON;
      }
    }
    
    this.primaryFeatureCollection = featureCollection;
  }

  draw(container, measure, colorConfig) {
    const bbox = container.getBoundingClientRect();

    let overlays = [];
    if (this.cardState.areaState == "All" &&  this.cardState.areaCounty == "All" && this.state.showOutlineState) {
      overlays.push({featureCollection: this.stateGeoJSON.features, strokeColor: "#a9aeb1"});
    }

    
    if (this.state.showOutlineMap) {
      overlays.push({
        featureCollection: this.mapOutline,
        strokeColor: "#3d4551",
      });
    }

    const { plot } = createChoroplethPlot(this.data, this.primaryFeatureCollection, {
      indexField: this.indexField,
      measureField: measure,
      // overlays: this.overlays,
      overlays,
      width: bbox.width - 30,
      height: bbox.height - 30,
      color: colorConfig,
      strokeColor: this.state.showOutlineCounty ? "lightgrey" : null,
    });

    container.replaceChildren(plot);
    return plot;
  }
}

new MapApp();