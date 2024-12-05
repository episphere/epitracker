import choices from "https://cdn.jsdelivr.net/npm/choices.js@10.2.0/+esm";

import { EpiTrackerData } from "../utils/EpiTrackerData.js";
import { createDropdownButton, createOptionSorter, downloadDataWithPopup, minorPopup, plotDataTable, popup } from "../utils/helper.js";
import { hookCheckbox, hookSelectChoices } from "../utils/input2.js";
import { State } from "../utils/State.js";
import { formatName } from "../utils/nameFormat.js";
import { plotDemographicPlots } from "../plots/demographicPlots.js";
import { downloadElementAsImage } from "../utils/download.js";

const CONSTANTS = {
  DEFAULT_STATE: {
    sex: "All",
    race: "All",
    year: "2018-2022",
    cause: "All",
    age: "All",
    areaState: "All",
    measure: "age_adjusted_rate",
    compareBar: "race",
    compareFacet: "sex",
    startZero: true,
  },
  COMPARABLE_FIELDS: ["race", "sex", "age_group"],
  NUMERIC_MEASURES: ["crude_rate", "age_adjusted_rate"],
  DATA_YEARS: ["2018", "2019", "2020", "2021", "2022", "2018-2022"],
}

const AGE_SORTER = (a, b) => a.replace('+', '999').localeCompare(b.replace('+', '999'), 'en', { numeric: true });

class DemographicsApplication {
  
  constructor() {
    this.init();
  }

  async init() {
    this.url = new URL(window.location.href);
    this.pastStates = [];

    this.dataManager = new EpiTrackerData();

    this.elems = {
      dashboardContainer: document.getElementById("dashboard-container"),
      rightContainer: document.getElementById("right-container"),
      demographicsContainer: document.getElementById("demographics-container"),
      plotContainer: document.getElementById("plot-demographics"),

      buttonSettings: document.getElementById("button-settings"),
      buttonTable: document.getElementById("button-table"),
      buttonFilter: document.getElementById("filter-button"),
      buttonDownloadData: document.getElementById("button-download-data"),
      buttonDownloadImage: document.getElementById("button-download-image"),

      settingsDropdown: document.getElementById("settings-dropdown"),
      filterDropdown: document.getElementById("filter-dropdown"),

      title: document.getElementById("title"),

      imageTemplate: document.getElementById("img-template"),
      imageTitle: document.getElementById("img-title"),
      imagePlot: document.getElementById("img-plot"),
      imageSource: document.getElementById("img-source"),
    }

    this.elems.buttonFilter.style.display = "block";

    await this.initState();
    this.parseUrl();
    this.hookStateToForm();
    this.addControlsLogic();
    this.addPlottingLogic();

    this.state.trigger("query");
  }

  async initState() {
    this.state = new State();

    const optionValues = await this.getOptionValues();
    this.optionValues = optionValues;
    const initialState = CONSTANTS.DEFAULT_STATE;

    this.state.defineProperty("compareBar", initialState.compareBar);
    this.state.defineProperty("compareBarOptions", ["none", ...CONSTANTS.COMPARABLE_FIELDS].map(d => ({
      value: d, label: formatName("fields", d)
    })));
    this.state.defineProperty("compareFacet", initialState.compareFacet);
    this.state.defineProperty("compareFacetOptions",  ["none", ...CONSTANTS.COMPARABLE_FIELDS].map(d => ({
      value: d, label: formatName("fields", d)
    })));

    this.state.defineProperty("areaState", initialState.areaState);
    this.state.defineProperty("areaStateOptions", optionValues.state_fips.map(d => ({
      value: d, label: formatName("states", d)
    })));
    this.state.defineProperty("race", initialState.race);
    this.state.defineProperty("raceOptions", optionValues.race);
    this.state.defineProperty("sex", initialState.sex);
    this.state.defineProperty("sexOptions", optionValues.sex);
    this.state.defineProperty("year", initialState.year);
    this.state.defineProperty("yearOptions", CONSTANTS.DATA_YEARS);
    this.state.defineProperty("cause", initialState.cause);
    this.state.defineProperty("causeOptions", optionValues.cause);
    this.state.defineProperty("age", initialState.age);
    this.state.defineProperty("ageOptions", optionValues.age_group);

    this.state.defineProperty("startZero", initialState.startZero);
    this.state.defineProperty("filterBar", new Set());
    this.state.defineProperty("filterFacet", new Set())

    // The compareBar and compareFacet properties can't be the same value.
    for (const [childProperty, parentProperty] of [
      ["compareBar", "compareFacet"],
      ["compareFacet", "compareBar"],
    ]) {
      this.state.linkProperties(childProperty, parentProperty);
      this.state.subscribe(parentProperty, () => {
        if (this.state[parentProperty] ==  this.state[childProperty]) {
          if (this.state[parentProperty] == "none") {
            // If the user tries to set a compare value such that both to "none", then set the other to its default. 
            this.state[childProperty] = CONSTANTS.DEFAULT_STATE[childProperty];
          } else {
            this.state[childProperty] = "none"
          }
        }
      });
    };

    // The values for the selections are dependent on the compares (e.g. if we are comparing by race, then the race 
    // select must be equal to "all").
    this.state.defineJointProperty("compareState", ["compareBar", "compareFacet"]);
    this.state.subscribe("compareState", () => {
      const comparingFields = new Set([this.state.compareBar,  this.state.compareFacet].filter(d => d != "none"));
      for (const field of CONSTANTS.COMPARABLE_FIELDS) {
        if (comparingFields.has(field)) {
          this.state[field == "age_group" ? "age" : field] = "All";
          choices["#select-select-"+field].disable();
        } else {
          choices["#select-select-"+field].enable();
        }
      }
    });

    // The measure options depends on whether or not the user is comparing by age. 
    this.state.defineProperty("measure", initialState.measure);
    this.state.defineProperty("measureOptions", CONSTANTS.NUMERIC_MEASURES.map(d => ({
      value: d, label: formatName("measures", d)
    })), ["compareState"]);
    this.state.subscribe("compareState", () => {
      let measureOptions = CONSTANTS.NUMERIC_MEASURES.map((field) => ({
        value: field,
        label: formatName("measures", field),
      }));

      if (this.state.compareBar ==  "age_group" || this.state.compareFacet == "age_group") {
        measureOptions = measureOptions.filter(d => d.value != "age_adjusted_rate");
        this.state.measure = "crude_rate";
      } 

      this.state.measureOptions = measureOptions;
    });

    this.state.defineJointProperty("query", [
      "compareBar",
      "compareFacet",
      "year",
      "areaState",
      "cause",
      "race",
      "sex",
      "age",
    ]);

    this.state.defineJointProperty("plotConfig", ["query", "measure", "startZero", "filterBar", "filterFacet"]);

    this.state.subscribe("query", () => this.queryUpdated());
    this.state.subscribe("plotConfig", () => this.plotConfigUpdated());
  }

  async getOptionValues() {
    const data = await this.dataManager.getDemographicMortalityData({ year: "2018-2022" });

    const valueObj = {};
    for (const field of ["race", "sex", "cause", "age_group", "state_fips"]) {
      valueObj[field] = [...new Set(data.map(d => d[field]))].map(d => d);
    }
    return valueObj;
  }

  hookStateToForm() {
    for (const inputSelectConfig of [
      { id: "#select-compare-color", propertyName: "compareBar" },
      { id: "#select-compare-facet", propertyName: "compareFacet" },
      { id: "#select-select-year", propertyName: "year", forceEnd: "2018-2022" },
      { id: "#select-select-state", propertyName: "areaState", searchable: true },
      { id: "#select-select-cause", propertyName: "cause", searchable: true },
      { id: "#select-select-sex", propertyName: "sex" },
      { id: "#select-select-race", propertyName: "race" },
      { id: "#select-select-age_group", propertyName: "age" },
      { id: "#select-measure", propertyName: "measure" },
    ]) {

      let sorter = null;
      if (inputSelectConfig.propertyName == "age") {
        // Special sorter for age groups because alphanumeric sorting fails on 0-4 / 5-14
        sorter = createOptionSorter(
          ["All"], [], AGE_SORTER
        )
      } else {
        sorter = createOptionSorter(
          ["All", "None"],
          inputSelectConfig.propertyName == "year" ? ["2018-2022"] : []
        )
      }
    
      choices[inputSelectConfig.id] = hookSelectChoices(
        inputSelectConfig.id,
        this.state,
        inputSelectConfig.propertyName,
        inputSelectConfig.propertyName + "Options",
        (d) => d,
        inputSelectConfig.searchable,
        sorter,
      );

      choices[inputSelectConfig.id].enable();
    }

    hookCheckbox("#check-start-zero", this.state, "startZero");
  }

  addControlsLogic() {
    minorPopup(this.elems.dashboardContainer, this.elems.buttonSettings, this.elems.settingsDropdown, "Plot Settings");
    minorPopup(this.elems.dashboardContainer, this.elems.buttonFilter, this.elems.filterDropdown, "Filter");

    // Create table popup
    this.elems.buttonTable.addEventListener("click", () => {
      const content = document.createElement("div");
      content.className = "table-popup-content";

      const tableTopbar = document.createElement("div");
      tableTopbar.classList.add("table-topbar");

      const tableTitle = document.createElement("div");
      tableTitle.classList.add("table-title");
      tableTitle.innerText = this.elems.title.innerText;
      tableTopbar.appendChild(tableTitle);

      const downloadButton = document.createElement("div");
      downloadButton.className = "settings-button fa-solid fa-download";
      tableTopbar.appendChild(downloadButton);
      content.appendChild(tableTopbar);

      // Create a dropdown for data download (JSON/CSV)
      createDropdownButton(downloadButton, [
        { text: "Download JSON", callback: () => this.eventButtonDownloadData("json") },
        { text: "Download CSV", callback: () => this.eventButtonDownloadData("csv") },
        { text: "Download TSV", callback: () => this.eventButtonDownloadData("tsv") }
      ]);

      const tableContainer = document.createElement("div");
      tableContainer.classList.add("table-container");
      content.appendChild(tableContainer);

      const fields = ["race", "sex", "cause", "age_group", "state_fips"]
        .map(d => ({ field: d, title: formatName("fields", d) }));
      const measureFields = CONSTANTS.NUMERIC_MEASURES
        .map(d => ({ field: d, title: formatName("measures", d) }))

      const contentRender = (width, height) => {
        plotDataTable(this.data, tableContainer, {
          columns: [...fields, ...measureFields]
        });
        return content
      }

      popup(this.elems.dashboardContainer, contentRender, {
        title: "Data Table",
        fillScreen: true,
      });
    })

    // Create a dropdown for data download (JSON/CSV)
  createDropdownButton(this.elems.buttonDownloadData, [
    { text: "Download JSON", callback: () => this.eventButtonDownloadData("json") },
    { text: "Download CSV", callback: () => this.eventButtonDownloadData("csv") },
    { text: "Download TSV", callback: () => this.eventButtonDownloadData("tsv") }
  ]);

  createDropdownButton(this.elems.buttonDownloadImage, [
    { text: "Download PNG", callback: () => this.eventButtonDownloadImage("png") },
    { text: "Download SVG", callback: () => this.eventButtonDownloadImage("svg") },
  ]);
  }

  eventButtonDownloadData(format) {
    downloadDataWithPopup(this.elems.dashboardContainer, this.data, "epitracker_mortality_data", format);
  }

  eventButtonDownloadImage(format) {
    this.elems.imageTitle.innerText = this.elems.title.innerText;
    this.drawPlot(this.elems.imagePlot);
    downloadElementAsImage(this.elems.imageTemplate, "epitracker_bar_graph", format);
  }

  addPlottingLogic() {
    let resizeTimeout;
    let previousSize = [-1, -1];
    const resizeObserver = new ResizeObserver(() => {
      const rect = this.elems.demographicsContainer.getBoundingClientRect();
  
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
  
      if (rect.width != previousSize[0] || rect.height != previousSize[1]) {
        this.elems.plotContainer.innerHTML = '';
        resizeTimeout = setTimeout(() => {
          this.state.trigger("plotConfig");
        }, 100);
        previousSize = [rect.width, rect.height]
      }
    });
    resizeObserver.observe(this.elems.rightContainer);
  }

  async queryUpdated() {
    const query = this.state.query;

     // Prepare the data query based on the provided query parameters
    const dataQuery = {
      year: query.year,
      cause: query.cause,
      race: query.race,
      sex: query.sex,
      age_group: query.age,
      state_fips: query.areaState,
    };

    // Add compareBar and compareFacet to dataQuery if not 'none'
    if (query.compareBar !== "none") dataQuery[query.compareBar] = "*";
    if (query.compareFacet !== "none") dataQuery[query.compareFacet] = "*";

    this.data = await this.dataManager.getDemographicMortalityData(dataQuery, {
      includeTotals: false,
    });

    this.updateFilterDropdown();
    this.updateTitle();
  }

  updateFilterDropdown() {
    this.elems.filterDropdown.innerHTML = '';
    this.elems.filterDropdown.style.flexDirection = "row";
    this.elems.filterDropdown.style.gap = "50px";

    for (const compareProperty of ["compareBar", "compareFacet"]) {
      if (this.state[compareProperty] != "none") {
        const filterContainer = document.createElement("div");
        filterContainer.style.display = "flex";
        filterContainer.style.flexDirection = "column";
        filterContainer.style.gap = "5px";

        const filterTitle = document.createElement("b");
        filterTitle.innerText = formatName("fields", this.state[compareProperty]);
        filterContainer.appendChild(filterTitle);

        // const compareValues = [...new Set(this.data.map(d => d[this.state[compareProperty]]))].sort();
        const compareValues = this.optionValues[this.state[compareProperty]].filter(d => d != "All");

        const filterSetProperty = compareProperty == "compareBar" ? "filterBar" : "filterFacet";
        this.state[filterSetProperty] = new Set();

        for (const value of compareValues) {
          const formCheck = document.createElement("div");
          formCheck.className = "form-check";
    
          const checkbox = document.createElement("input");
          checkbox.className = "form-check-input";
          checkbox.setAttribute("type", "checkbox");
          if (!this.state[filterSetProperty].has(value)) {
            checkbox.setAttribute("checked", "")
          }
    
          const label = document.createElement("label");
          label.className = "form-check-label";
          label.innerText = value;
    
          formCheck.appendChild(checkbox);
          formCheck.appendChild(label);
    
          checkbox.addEventListener("input", () => {
            if (checkbox.checked) {
              this.state[filterSetProperty].delete(value);
            } else {
              this.state[filterSetProperty].add(value);
            }
            this.state.trigger(filterSetProperty);
          })
          
          filterContainer.appendChild(formCheck);
        }

        this.elems.filterDropdown.appendChild(filterContainer);
      }

    
    }
  }

  async plotConfigUpdated() {
    this.updateUrl();
    this.drawPlot();
  }

  drawPlot(plotContainer) {
    if (!plotContainer) {
      plotContainer = this.elems.plotContainer;
    }

    const xFormat = (d) => formatName(this.state.compareBar, d, "short");
    const tickFormat = (d) => formatName(this.state.compareFacet, d, "short");

    const xOptions = { tickFormat: xFormat, label: '' };
    const fxOptions = { tickFormat: tickFormat, label: '' };

    const barDomain = this.optionValues[this.state.compareBar]?.filter(d => d != "All" && !this.state.filterBar.has(d));
    const facetDomain = this.optionValues[this.state.compareFacet]?.filter(d => d != "All" && !this.state.filterFacet.has(d));
  
    plotDemographicPlots(plotContainer, this.data, {
      compareBar: this.state.compareBar !== "none" ? this.state.compareBar : null,
      compareFacet: this.state.compareFacet !== "none" ? this.state.compareFacet : null,
      measure: this.state.measure,
      plotOptions: {
        x: xOptions,
        fx: fxOptions,
        y: { label: formatName("measures", this.state.measure) },
      },
      yStartZero: this.state.startZero,
      valueField: this.state.measure,
      tooltipFields: [this.state.compareFacet, this.state.compareBar].filter(d => d !== "none"),
      barDomain, facetDomain,
      // nameMappings: state.nameMappings
    });
  }

  parseUrl() {
    for (const property of Object.keys(CONSTANTS.DEFAULT_STATE)) {
      if (this.url.searchParams.has(property)) {
        this.state[property] = this.url.searchParams.get(property);
      }
    }
  }

  updateUrl() {
    const newParams = new URLSearchParams();

    for (const [property, defaultValue] of Object.entries(CONSTANTS.DEFAULT_STATE)) {
      if (this.state[property] != defaultValue) {
        newParams.append(property, this.state[property]);
      }
    }

    for (const filterProperty of ["filterBar", "filterFacet"]) {
      const compareProperty = filterProperty == "filterBar" ? "compareBar" : "compareFacet";
      if (this.state[compareProperty] != "none" && this.state[filterProperty].size > 0) {
        newParams.append(filterProperty, [...this.state[filterProperty]].join(","));
      }
    }

    const newParamString = newParams.toString();
    if (this.url.search.slice(1) != newParamString) {
      if (this.url.search != this.pastStates.at(-1)) {
        this.pastStates.push(this.url.search);
      }
      this.url.search = newParamString ? newParamString : " "; // Weird work-around, URL won't update if blank...?
      history.pushState(null, null, this.url.search);
    }
  }

  updateTitle() {
    const measure = formatName("measures", this.state.measure, "verbose").toLowerCase();
    const stratifications = [this.state.compareBar, this.state.compareFacet]
      .filter(d => d != "none")
      .map(d => formatName("fields", d).toLowerCase())
      .join(" and ");

    let filterElements = [
      this.state.year,
      this.state.areaState == "All" ? null : this.state.areaState,
      this.state.cause == "All" ? null : this.state.cause,
      this.state.race == "All" ? null : this.state.race,
      this.state.sex == "All" ? null : this.state.sex,
      this.state.age == "All" ? null : this.state.age,
    ].filter(d => d).map(d => d.toLowerCase()).join(", ");

    let title = `US ${measure} by ${stratifications}, ${filterElements}`;
    this.elems.title.innerText = title;
  }
}


new DemographicsApplication();