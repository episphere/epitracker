import { GridStack } from 'https://cdn.jsdelivr.net/npm/gridstack@10.1.2/+esm'
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.8.5/+esm";
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";
import html2canvas from 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm'

import { EpiTrackerData } from "../utils/EpiTrackerData.js"
import { State } from '../utils/State.js';
import { addPopperTooltip, addTippys, colorRampLegendPivot, createOptionSorter, scaleGradient, popup, plotDataTable } from '../utils/helper.js';
import { hookCheckbox, hookSelectChoices } from '../utils/input2.js';
import { createChoroplethPlot } from '../plots/mapPlots.js';
import { toggleLoading } from '../utils/download.js';
import { formatName } from '../utils/nameFormat.js';
import { mapTableColumns } from '../utils/tableDefinitions.js';

const CONSTANTS = {
  DEFAULT_STATE: {
    nRows: 1,
    nCols: 1,
  
    sex: "All",
    race: "All",
    year: "2018-2022",
    cause: "All",
    areaState: "All",
    areaCounty: "All",
  
    measure: "age_adjusted_rate",
    spatialLevel: "county",
  
    scheme: "RdYlBu",
    colorReverse: true,
    colorCenterMean: true,
    colorExcludeOutliers: true,
    outlierCutoff: 3,
  },
  CARD_STATE_FIELDS: ["sex", "race", "year", "cause", "areaState", "areaCounty", "measure", "spatialLevel"],
  DATA_YEARS: ["2018", "2019", "2020", "2021", "2022", "2018-2022"],
  NUMERIC_MEASURES: ["crude_rate", "age_adjusted_rate","deaths", "population"],
  SPATIAL_LEVELS: ["county", "state"],
  STATE_URL_FIELDS: ["scheme", "colorReverse", "colorExcludeOutliers", "outlierCutoff"]
}

class MapApplication {

  constructor() {
    this.init();
  }


  /**
   * Initialize  the application.
   */
  async init() {
    this.url = new URL(window.location.href);
    this.pastStates = [];

    this.dataManager = new EpiTrackerData(); 

    await this.initState();
    this.parseUrl();
    this.hookStateToForm();

    // The elems object contains references to the applications HTML elements.
    this.elems = {
      // body: document.getEl("dashboard-container"),
      dashboardContainer: document.getElementById("dashboard-container"),
      dashboard: document.getElementById("dashboard"),
      innerDashboard: document.getElementById("ex-dashboard"),
      gridContainer: document.getElementById("grid-container"),
      grid: document.getElementById("grid-stack"),
      buttonUndo: document.getElementById("button-undo"),
      buttonColorSettings: document.getElementById("button-color-settings"),
      buttonTable: document.getElementById("button-table"),
      buttonDownload: document.getElementById("button-download"),
      title: document.getElementById("title"),
     
      // Color settings popup
      colorLegend: document.getElementById("color-legend"),
      colorSettings: document.getElementById("color-settings"),
      buttonColorSettingsClose: document.getElementById("color-settings-close"),
     
      // Map tooltip
      mapTooltipContent: document.getElementById("map-tooltip"),
      mapTooltipName: document.getElementById("map-tooltip-name"),
      mapTooltipValue: document.getElementById("map-tooltip-value"),
      mapTooltipPlot: document.getElementById("map-tooltip-plot")
    };

    this.tippyMap = addTippys();

    this.cardConfigPopup = new CardConfigPopup(this.elems.dashboardContainer, this.elems.dashboard, this.state);

    this.colorConfig = { scheme: "RdYlBu", reverse: true, outlierThreshold: 3 };
    this.colorConfig.domain = [0, 500]; // TODO: Implement properly.

    // Non query data.
    this.sData = {
      stateGeoJSON: await d3.json("../data/states.json"),
      countyGeoJSON: await d3.json("../data/geograpy/us_counties_simplified_more.json"),
    };

    // Set the county names after the GeoJSON is loaded.
    const countyNameMap = d3.index(this.sData.countyGeoJSON.features, d => d.id);

    console.log({countyNameMap})
    const countyOptions =  this.state.areaCountyOptions.map(d => {
      let name = d == "All" ? "All" : countyNameMap.get(d)?.properties?.name + ", " + formatName("states", d.slice(0,2), "short");
      return { value: d, label: name}
    })
    this.state.areaCountyOptions = countyOptions.filter(d => d.label);

    this.addColorSettingsPopup(); 

    // Initialize the grid, and updagte it with the starting state.
    this.updateGrid();
    this.toggleLoading(false);

    this.showInitialHints();

    this.elems.buttonUndo.addEventListener("click", () => this.eventButtonUndoClicked());
    this.elems.buttonColorSettings.addEventListener("click", () => this.eventButtonColorSettingsClicked());
    this.elems.buttonTable.addEventListener("click", () => this.eventButtonTableClicked());
    this.elems.buttonDownload.addEventListener("click", () => this.eventButtonDownloadClicked());

    this.createMapTooltip();

    window.addEventListener("popstate", () => {
      this.parseUrl();
      this.updateGrid();
    });
  }


  /**
   * Initialize the application's state handling, which is comprised primarily of user input handling and changes to 
   * the URL arguments. 
   */
  async initState() {
    // The state object contains every mutable bit of information in application (including user inputs).
    this.state = new State();

    const optionValues = await this.getOptionValues();
    const initialState = CONSTANTS.DEFAULT_STATE;

    this.state.defineProperty("nRows", 1);
    this.state.defineProperty("nCols", 1);

    this.state.defineProperty("race", initialState.race);
    this.state.defineProperty("raceOptions", optionValues.race);
    this.state.defineProperty("sex", initialState.sex);
    this.state.defineProperty("sexOptions", optionValues.sex);
    this.state.defineProperty("year", initialState.year);
    this.state.defineProperty("yearOptions", CONSTANTS.DATA_YEARS);
    this.state.defineProperty("cause", initialState.cause);
    this.state.defineProperty("causeOptions", optionValues.cause);
    this.state.defineProperty("measure", initialState.measure);
    this.state.defineProperty("measureOptions", CONSTANTS.NUMERIC_MEASURES.map(d => ({
      value: d, label: formatName("measures", d)
    })));
    this.state.defineProperty("areaState", initialState.areaState);
    this.state.defineProperty("areaStateOptions", optionValues.state_fips.map(d => ({
      value: d, label: formatName("states", d)
    })));
    // this.state.defineProperty("areaStateOptions", optionValues.state_fips);
    this.state.defineProperty("areaCounty", initialState.areaCounty, ["areaState"]);
    this.state.defineProperty("areaCountyOptions", optionValues.county_fips, ["areaState"]);
    this.state.defineProperty("spatialLevel", initialState.spatialLevel);
    this.state.defineProperty("spatialLevelOptions", CONSTANTS.SPATIAL_LEVELS.map(d => ({
      value: d, label: formatName("levels", d)
    })));
    this.state.defineProperty("scheme", initialState.scheme);
    this.state.defineProperty("schemeOptions");
    this.state.defineProperty("colorReverse", initialState.colorReverse);
    this.state.defineProperty("colorReverseOptions");
    this.state.defineProperty("colorCenterMean", initialState.colorCenterMean);
    this.state.defineProperty("colorCenterMeanOptions");
    this.state.defineProperty("colorExcludeOutliers", initialState.colorExcludeOutliers);
    this.state.defineProperty("outlierCutoff", initialState.outlierCutoff);


    this.state.defineJointProperty("colorSettings", 
      ["scheme", "colorReverse", "colorCenterMean", "colorExcludeOutliers", "outlierCutoff"]);
    this.state.subscribe("colorSettings", () => {
      this.updateColors();
      this.updateUrl();
    });
  }

  showInitialHints() {
    // TODO: Make robust to variable loading time.
    setTimeout(() => {
      this.tippyMap.get("fa-edit").forEach(d => d.show());
      this.tippyMap.get("plot-grid-add").forEach(d => d.show());
    }, 2000)
    setTimeout(() => {
      this.tippyMap.get("fa-edit").forEach(d => d.hide());
      this.tippyMap.get("plot-grid-add").forEach(d => d.hide());
    }, 8000)
  }

  addColorSettingsPopup() {
    const colorSettingsTooltip = addPopperTooltip(this.elems.innerDashboard);

    let tooltipShown = false;
    this.elems.buttonColorSettings.addEventListener("click", () => {
      this.elems.colorSettings.style.display = "flex";
      if (tooltipShown) {
        colorSettingsTooltip.hide();
      } else {
        colorSettingsTooltip.show(this.elems.buttonColorSettings, this.elems.colorSettings);
      }
      tooltipShown = !tooltipShown;
    })

    // Add color scheme gradients
    this.state.schemeOptions = Object.entries(formatName("colorSchemes")).map(
      ([k, name]) => {
        const colorScale = d3.scaleSequential(d3["interpolate" + k]);
        const div = document.createElement("div");
        const labelSpan = document.createElement("span");
        labelSpan.innerText = name;
        div.appendChild(scaleGradient(colorScale, 6, 100));
        div.appendChild(labelSpan);
        div.value = name;
        return { value: k, label: div.outerHTML };
      });

    this.elems.buttonColorSettingsClose.addEventListener("click", () => {
      tooltipShown = false;
      colorSettingsTooltip.hide()
    });

    const outlierCutoffRange = document.getElementById("outlier-cutoff-range");
    const outlierCutoffRangeText = document.getElementById(
      "outlier-cutoff-range-text"
    );
    outlierCutoffRange.addEventListener("input", () => {
      this.state.outlierCutoff = outlierCutoffRange.value;
      outlierCutoffRangeText.innerText = "±" + outlierCutoffRange.value + "σ";
    });
    outlierCutoffRange.value = this.state.outlierCutoff;
    outlierCutoffRangeText.innerText = "±" + this.state.outlierCutoff + "σ";
  }

  async createMapTooltip() {
    this.mapTooltip = addPopperTooltip(this.elems.dashboardContainer);
    this.elems.mapTooltipContent.parentNode.removeChild(this.elems.mapTooltipContent);
    this.elems.mapTooltipContent.style.display = "flex";
  }

  hookMapTooltip(plot, featureCollection, valueIndex) {
    const plotSelect = d3.select(plot);
    const gSelect = d3.select(
      plotSelect.selectAll("g[aria-label='geo'").nodes()[0]
    );
    const geoSelect = gSelect.selectAll("path");

    geoSelect.on("mouseover.interact", (e, d) => {
      const feature = featureCollection.features[d];
      
      let name = feature.properties.name;
      if (feature.id.length == 5) {
        name += ", " + formatName("states",feature.id.slice(0,2), "short")
      }
      this.elems.mapTooltipName.innerText = name; 
      
      const value = valueIndex.get(feature.id);
      this.elems.mapTooltipValue.innerText = value != null ? value : "N/A";

      const xScale = this.mapTooltipPlot.scale("x");
      const yScale = this.mapTooltipPlot.scale("y");

      d3.select(this.mapTooltipPlot)
        .selectAll("circle").data(Number.isFinite(value) ? [value] : []).join("circle")
          .attr("cx", d => xScale.apply(d))
          .attr("cy", yScale.apply(0))
          .attr("r", 3)
          .attr("fill", "red")

      this.mapTooltip.show(e.target, this.elems.mapTooltipContent);
      d3.select(e.target).raise();
    });

    gSelect.on("mouseleave.interact", () => {
      this.mapTooltip.hide();
    });
  }

  hookStateToForm() {
    for (const inputSelectConfig of [
      { id: "#select-select-race", propertyName: "race" },
      { id: "#select-select-sex", propertyName: "sex" },
      { id: "#select-select-cause", propertyName: "cause", searchable: true },
      { id: "#select-select-year", propertyName: "year", forceEnd: "2018-2022" },
      { id: "#select-measure", propertyName: "measure" },
      { id: "#select-level", propertyName: "spatialLevel" },
      { id: "#select-select-state", propertyName: "areaState", searchable: true },
      { id: "#select-select-county", propertyName: "areaCounty", searchable: true },
      { id: "#select-color-scheme", propertyName: "scheme", searchable: true },
    ]) {

      let sorter = d => d 
      if (inputSelectConfig.propertyName == "areaCounty") {
        sorter = createOptionSorter(
          ["All", "None"],
          inputSelectConfig.propertyName == "year" ? ["2018-2022"] : [],
          (a,b) => {
            const [aCounty, aState] = a.split(",");
            const [bCounty, bState] = b.split(",");
            
            if (!aState || !bState) return 0;

            const stateComparison = aState.localeCompare(bState);
            if (stateComparison != 0) {
              return stateComparison;
            } else {
              return aCounty.localeCompare(bCounty);
            }
          }
        )
      } else {
        sorter = createOptionSorter(
          ["All", "None"],
          inputSelectConfig.propertyName == "year" ? ["2018-2022"] : []
        )
      }
  
      hookSelectChoices(
        inputSelectConfig.id,
        this.state,
        inputSelectConfig.propertyName,
        inputSelectConfig.propertyName + "Options",
        (d) => d,
        inputSelectConfig.searchable,
        sorter,
      );
    }

    hookCheckbox("#check-reverse-color", this.state, "colorReverse");
    hookCheckbox("#check-center-mean-color", this.state, "colorCenterMean");
    hookCheckbox("#check-exclude-outliers", this.state, "colorExcludeOutliers");
  }


  async getOptionValues() {
    const data = await this.dataManager.getCountyMortalityData({year: "2018-2022"})
    const valueObj = {} 
    for (const field of ["race", "sex", "cause", "county_fips", "state_fips"]) {
      valueObj[field] = [...new Set(data.map(d => d[field]))].map(d => d)//({value: d, label: d}))
    }
    return valueObj
  }

  getCardStates(url) {
    const cardStates = []
    const dFieldsString = url.searchParams.get("dFields")
    console.log('getQuery 0', {url, a: dFieldsString})
    if (dFieldsString) {
      const dFields = dFieldsString.split(",");
      const dCardString = url.searchParams.get("dCards");
      const dCards = dCardString.split("|");
      console.log('getQuery 1', {dFields, dCards})

      for (const dValueString of dCards) {
        if (dValueString) {
          const cardState = {};
          CONSTANTS.CARD_STATE_FIELDS.forEach(field => cardState[field] = this.state[field])
          const dFieldValues = dValueString.split(",");
          dFields.forEach((field,i) => cardState[field] = dFieldValues[i])
          cardStates.push(cardState);
        } else {
          cardStates.push(null);
        }
      }
    } else {
      const cardState = {};
      CONSTANTS.CARD_STATE_FIELDS.forEach(field => cardState[field] = this.state[field]);
      cardStates.push(cardState);
    }
    console.log('ssss: ', {cardStates})

    return cardStates
  }


  /**
   * Parse the URL params and put the information into the state object.
   */
  parseUrl() {
    for (const field of [...CONSTANTS.CARD_STATE_FIELDS, ...CONSTANTS.STATE_URL_FIELDS]) {
      const value = this.url.searchParams.get(field);
      if (value != null) {
        this.state[field] = value;
      } else {
        this.state[field] = CONSTANTS.DEFAULT_STATE[field];
      }
    }
    for (const field of ["nRows", "nCols"]) {
      let value = this.url.searchParams.get(field);
      if (value != null) {
        value = parseInt(value);
        if (this.state[field] != value) {
          this.state[field] = value;
        }
      } else {
        this.state[field] = CONSTANTS.DEFAULT_STATE[field];
      }
    }

    this.cardStates = this.getCardStates(this.url)

    console.log('parsed url....', {cardState: this.cardStates})
  }

  /**
   * Fully reset / update the plot grid, usually in response to a page load or undo operation.
   */
  updateGrid() {

    this.batchUpdate(true);

    // this.elems.dashboard.style.opacity = Math.random();

    this.plotGrid = new PlotGrid({
      gridContainerElement: this.elems.gridContainer,
      // gridElement: this.elems.grid,
      nRows: this.state.nRows, 
      nCols: this.state.nCols,
    });


    for (let i = 0; i < this.state.nRows * this.state.nCols; i++) {
      const x = i % this.state.nCols;
      const y = Math.floor(i / this.state.nCols);
      const cardState = this.cardStates[i];
      this.createMapCard(x, y, cardState);
    }

    this.plotGrid.addListener("gridUpdated", () => this.gridUpdated());
    this.plotGrid.addListener("editCardClicked", (card) => this.editCardClicked(card));
    this.plotGrid.addListener("blankCardClicked", (x,y) => this.blankCardClicked(x,y));
    this.plotGrid.addListener("closeCardClicked", (card) => this.closeCardClicked(card));

    this.batchUpdate(false);
    //this.elems.dashboard.style.opacity = "1"
  }

  blankCardClicked(x, y) {
    const promise = this.cardConfigPopup.popupGetState();
    promise.then((newCardState) => {
      this.createMapCard(x, y, newCardState);
    })
  }

  closeCardClicked(card) {
    this.createMapCard(card.x, card.y);
  }

  batchUpdate(bool) {
    this.batchMode = bool;
    if (!bool) {
      this.gridUpdated();
    }
  }

  /**
   * LISTENER. 
   * Called when the plot grid receives any type of update. 
   */
  async gridUpdated() {

    if (!this.batchMode) {
      this.state.nRows = this.plotGrid.nRows;
      this.state.nCols = this.plotGrid.nCols;
      this.sharedState = this.#calcSharedState(); 
      this.dFields = [];
      for (const field of CONSTANTS.CARD_STATE_FIELDS) {
        if (!this.sharedState.hasOwnProperty(field)) {
          this.dFields.push(field);
        }
      }
      await this.updateAllValueArray();
      this.updateTooltipHistogram();
      this.updateColors();
      this.updateTitles();
      this.updateUrl();
    }

    // * Update the URL
    // * Update the title
    // * Update the color legend
  }

  async updateAllValueArray() {
    const allValues = []
    for (const card of this.plotGrid.getCards()) {
      if (card) {
        const data = await card.data;
        data.forEach(row => allValues.push(row[card.cardState.measure]));
      }
    }
    this.allValues = allValues;
  }

  async updateTooltipHistogram() {
    this.mapTooltipPlot = Plot.plot({
      style: { fontSize: "12px" },
      width: 150,
      height: 60,
      marginBottom: 18,
      x: { ticks: d3.extent(this.allValues), tickSize: 0 },
      y: {axis: null},
      marks: [
        Plot.rectY(this.allValues, Plot.binX({y: "count"}, {x: d => d, fill: "#c0d3ca", inset: 0, thresholds: 20})),
      ]
    })
    this.elems.mapTooltipPlot.innerHTML = '';
    this.elems.mapTooltipPlot.appendChild(this.mapTooltipPlot);
  }

  async updateColors() {
    if (!this.plotGrid) return;

    this.getColorConfig();

    this.colorConfig.scheme = this.state.scheme;
    this.colorConfig.reverse = this.state.colorReverse;
    if (this.state.colorExcludeOutliers) {
      this.colorConfig.outlierThreshold = this.state.outlierCutoff;
    } else {
      this.colorConfig.outlierThreshold = null;
    }

    const mean = d3.mean(this.allValues);

    if (this.state.colorCenterMean) {
      this.colorConfig.pivot = mean;
    } else {
      this.colorConfig.pivot = null;
    }

    const domain = d3.extent(this.allValues);
    if (this.colorConfig.outlierThreshold != null && this.allValues.length > 1) {
      const std = d3.deviation(this.allValues);
      const clipDomain = [-this.colorConfig.outlierThreshold, this.colorConfig.outlierThreshold].map(d => d*std+mean)
      this.colorConfig.domain = [
        Math.max(domain[0], clipDomain[0]),
        Math.min(domain[1], clipDomain[1]),
      ]
    } else {
      this.colorConfig.domain = domain
    }

    const measureName = this.sharedState.measure ? formatName( "measures", this.sharedState.measure) : "Measure"
    const sharedColorLegend = colorRampLegendPivot(await this.getColorConfig(), {label: measureName});

    this.elems.colorLegend.innerHTML = '';
    this.elems.colorLegend.appendChild(sharedColorLegend);

    // TODO: We don't need to re-render the full card on color scheme changes. Make more efficient.
    this.plotGrid.renderCards(); 
  }


  async getColorConfig() {
    const colorConfig = {
      scheme: this.state.scheme,
      reverse: this.state.colorReverse,
    };

    const allValues = []
    for (const card of this.plotGrid.getCards()) {
      if (card) {
        const data = await card.data;
        data.forEach(row => allValues.push(row[card.cardState.measure]));
      }
    }
    const mean = d3.mean(allValues);
    let domain = d3.extent(allValues);

    if (this.state.colorCenterMean) {
      colorConfig.pivot = mean;
    } else {
      colorConfig.pivot = null;
    }

    if (this.state.outlierCutoff && allValues.length > 1) {
      const std = d3.deviation(allValues);
      const clipDomain = [-this.state.outlierCutoff , this.state.outlierCutoff ].map(d => d*std+mean)
      colorConfig.domain = [
        Math.max(domain[0], clipDomain[0]),
        Math.min(domain[1], clipDomain[1]),
      ]
    } else {
      colorConfig.domain = domain
    }

    return colorConfig;
  }

  updateTitles() {
    const state = this.sharedState

    const baseElements = [ 
      state.measure ? formatName( "measures", state.measure) : "Data" 
    ]
    let filterElements = [
      state.year,
      state.cause == "All" ? "All cancers" : state.cause,
      state.race == "All" ? "All races" : state.race,
      state.sex == "All" ? "All sexes" : state.sex,
    ].filter(d => d);


    let title = `US ${baseElements.filter(d => d).map(d => d.toLowerCase()).join(" ")}`;
    if (filterElements.length > 0) {
      title += `, ${filterElements.join(", ")}`;
    }
    this.elems.title.innerText = title;

    const cardTitleFormatters = {
      sex: d => d == "All" ? "All sexes" : d,
      race: d => d == "All" ? "All races" : d,
      cause: d => d == "All" ? "All cancers" : d,
      areaState: d => d == "All" ? "US" : formatName("states", d)
    }

    for (const card of this.plotGrid.getCards()) {
      if (card) {
        const cardTitle = this.dFields.map(field => {
          const value = card.cardState[field];
          if (cardTitleFormatters[field]) {
            return cardTitleFormatters[field](value);
          } else {
            return value;
          }
        }).join(", ");
        card.setTitle(cardTitle);
      }
    }
  }


  /**
   * LISTENER.
   * Called when the user updates the color scheme config.
   */
  colorConfigUpdated() {
    this.updateGrid();
  }


  /**
   * Listener.
   * Called when the user clicks the edit button on a plot card.
   */
  async editCardClicked(card) {
    const promise = this.cardConfigPopup.popupGetState(card);
    promise.then((newCardState) => {
      this.createMapCard(card.x, card.y, newCardState);
    })
  }  


  createMapCard(x, y, cardState) {
    if (cardState) {
      const query = {
        sex: cardState.sex,
        race: cardState.race,
        cause: cardState.cause,
        year: cardState.year
      }
      if (cardState.areaCounty && cardState.areaCounty != "All") {
        query.county_fips = cardState.areaCounty
      }
      if (cardState.areaState && cardState.areaState  != "All") {
        query.state_fips = cardState.areaState
      }
      if (cardState.spatialLevel == "state") {
        query.county_fips = "All";
      }
  
      let data = null;
      if (cardState.measure == "population") {
        const populationQuery = {...query};
        delete populationQuery.cause;
        data = this.dataManager.getPopulationData(populationQuery, {includeTotals: false});
      } else {
        data = this.dataManager.getCountyMortalityData(query, {
          includeTotals: false, 
          states: this.state.areaStateOptions, 
          counties: this.state.areaCountyOptions
          });
      }

      // NOTE: DRAW
      const drawMap = async (width, height) => {
        // TODO: Add spinner or something to show loading.


        return data.then(data => {
          const indexField =  cardState.spatialLevel + "_fips";

          let overlayFeatureCollection = null;
          if (cardState.spatialLevel == "county") {
            overlayFeatureCollection = this.sData.stateGeoJSON;
            if (cardState.areaState != "All") {
              overlayFeatureCollection = {
                type: "FeatureCollection",
                features: this.sData.stateGeoJSON.features.filter(d => d.id == cardState.areaState)
              }
            }
          }

          const { plot } = createChoroplethPlot(data, featureCollection, {
            indexField,
            measureField: cardState.measure, 
            overlayFeatureCollection,
            width: width,
            height: height,
            color: this.colorConfig, 
          })

          const valueIndex = new Map(data.map(d => [d[indexField], d[cardState.measure]]))
          this.hookMapTooltip(plot, featureCollection, valueIndex);
    
          // this.plot = plot 
          // this.postRender(this)
          console.log({plot})
          return plot 
        })
      }
  
      let featureCollection = null;
      if (cardState.spatialLevel == "county") {
        featureCollection = this.sData.countyGeoJSON;
        if (cardState.areaState != "All") {
          featureCollection = {
            type: "FeatureCollection", 
            features: featureCollection.features.filter(d => d.id.startsWith(cardState.areaState))
          }
        }
      } else {
        featureCollection = this.sData.stateGeoJSON;
        if (cardState.areaState != "All") {
          featureCollection = {
            type: "FeatureCollection", 
            features: featureCollection.features.filter(d => d.id == cardState.areaState)
          }
        }
      }

      this.plotGrid.addCard(drawMap, {x, y, cardState, data, url: this.url, state: this.state});
    } else {
      this.plotGrid.addBlank({x, y});
    }

    this.gridUpdated();
  }


  /**
   * Update the page URL to reflect the current application state.
   */
  updateUrl() {
    if (!this.sharedState) return;

    const newParams = new URLSearchParams();

    for (const [k,v] of Object.entries(this.sharedState)) {
      if (CONSTANTS.DEFAULT_STATE[k] != v) {
        newParams.append(k,v);
      }
    }

    for (const setting of CONSTANTS.STATE_URL_FIELDS) {
      if (CONSTANTS.DEFAULT_STATE[setting] != this.state[setting]) {
        newParams.append(setting, this.state[setting]);
      }
    }

    if (this.state.nRows != CONSTANTS.DEFAULT_STATE.nRows) {
      newParams.append("nRows", this.state.nRows);
    }
    if (this.state.nCols != CONSTANTS.DEFAULT_STATE.nCols) {
      newParams.append("nCols", this.state.nCols);
    }

    
    if (this.dFields.length > 0) {
      newParams.append("dFields", this.dFields.join(","));

      const dCards = [];
      for (const card of this.plotGrid.getCards()) {
        if (card?.cardState) {
          dCards.push(this.dFields.map(field => card.cardState?.[field]))
        } else {
          dCards.push(null);
        }
      }
      newParams.append("dCards", dCards.map(dCard => dCard != null ? dCard.join(",") : "").join("|"));
    }

    const newParamString = newParams.toString();
    if (this.url.search.slice(1) != newParamString) {
      if (this.url.search != this.pastStates.at(-1)) {
        this.pastStates.push(this.url.search);
      }
      this.url.search = newParamString;
      history.pushState(null, null, this.url.search);
    }
  }


  /**
   * DIRECT EVENT HANDLER.
   * Called when the user clicks the the undo button.
   */
  eventButtonUndoClicked() {
    this.toggleLoading(true);
    setTimeout(() => {
      if (this.pastStates.length > 0) {
        const stateStr = this.pastStates.pop();
        this.url.search = stateStr;
        history.pushState(null, null, this.url.search ? this.url.search : "? "); // Weird work-around for URL not updating when no params.
        this.parseUrl();
        this.updateGrid();
      }
      this.toggleLoading(false);

    }, 50)

  }

  // TODO: Remove redundant codes
eventButtonDownloadClicked() {
  console.log("Download button clicked");

  // Create and show loading message
  const loadingMessage = document.createElement("div");
  loadingMessage.innerText = "Generating image...";
  loadingMessage.style.position = 'fixed';
  loadingMessage.style.top = '50%';
  loadingMessage.style.left = '50%';
  loadingMessage.style.transform = 'translate(-50%, -50%)';
  loadingMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
  loadingMessage.style.color = 'white';
  loadingMessage.style.padding = '20px';
  loadingMessage.style.borderRadius = '5px';
  loadingMessage.style.zIndex = '10000';
  document.body.appendChild(loadingMessage);

  // Create the Virtual DOM container
  const virtualContainer = document.createElement('div');
  virtualContainer.id = 'virtual-dashboard';
  virtualContainer.style.position = 'absolute';
  virtualContainer.style.top = '-9999px'; // Hide it offscreen
  virtualContainer.style.left = '-9999px';
  virtualContainer.style.width = '100%'; // Ensure it captures full width
  virtualContainer.style.height = 'auto'; // Ensure it captures full height
  virtualContainer.style.overflow = 'hidden'; // Hide overflow

  const originalDashboard = document.getElementById('ex-dashboard');
  const gridContainer = originalDashboard.querySelector('#grid-container');
  const legend = originalDashboard.querySelector('#color-legend');
  const title = originalDashboard.querySelector('#title');

  // Clone the grid container (preserves the layout of maps)
  if (gridContainer) {
    console.log("Grid container found and cloning");

    // Clone grid container and remove unwanted elements
    const clonedGridContainer = gridContainer.cloneNode(true);

    // Remove specific unwanted elements (edit, add, plus icons, etc.)
    const unwantedElements = clonedGridContainer.querySelectorAll(
      '.fa-edit, .fa-download, .fa-table, .fa-times, .fa-expand, .fa-grip-horizontal, .fa-circle-plus'
    );
    unwantedElements.forEach(el => el.remove());

    // Make sure the maps fit inside their containers (adjust sizing)
    const maps = clonedGridContainer.querySelectorAll('.grid-card');
    maps.forEach(map => {
      // Adjust the map and card sizes
      map.style.width = '100%'; // Ensure the card takes the full width
      map.style.height = 'auto'; // Let height adjust automatically

      const mapContent = map.querySelector('.map-content'); // Adjust the selector if necessary
      if (mapContent) {
        mapContent.style.width = '100%';
        mapContent.style.height = '100%'; // Ensure it fits within the card
        mapContent.style.overflow = 'hidden'; // Prevent overflow of the map
      }
    });

    virtualContainer.appendChild(clonedGridContainer);
  } else {
    console.warn("Grid container not found");
  }

  // Clone title element
  if (title) {
    const clonedTitle = title.cloneNode(true);
    virtualContainer.appendChild(clonedTitle);
  } else {
    console.warn("Title element not found");
  }

  // Clone legend element
  if (legend) {
    console.log("Legend found and cloning");
    const clonedLegend = legend.cloneNode(true);
    virtualContainer.appendChild(clonedLegend);
  } else {
    console.warn("Legend element not found");
  }

  // Append the virtual container to the body
  document.body.appendChild(virtualContainer);

  // Log the content of virtualContainer for debugging
  console.log("Virtual container content:", virtualContainer.innerHTML);

  // Render Virtual DOM to Canvas
  html2canvas(virtualContainer, { useCORS: true }).then(canvas => {
    console.log("Canvas generated");

    const dataURL = canvas.toDataURL("image/png");

    // Trigger the download
    const downloadLink = document.createElement('a');
    downloadLink.href = dataURL;
    downloadLink.download = 'dashboard-maps.png';
    downloadLink.click();

    document.body.removeChild(virtualContainer);  // Clean up the virtual DOM after rendering
    document.body.removeChild(loadingMessage);    // Remove the loading message
  }).catch(error => {
    console.error("Error generating canvas:", error);
    document.body.removeChild(loadingMessage);  // Remove the loading message in case of error
  });
}


  /**
   * DIRECT EVENT HANDLER.
   * Called when the user clicks the the color settings button.
   */
  eventButtonColorSettingsClicked() {}

  eventButtonTableClicked() {
    (async () => {
      const {clientHeight: height} = document.body
      const cardStates = this.getCardStates(this.url)
  
      const data = [];
  
      for (const cardState of cardStates) {
      const query = {
        sex: cardState.sex,
        race: cardState.race,
        cause: cardState.cause,
        year: cardState.year
      }
      if (cardState.areaCounty && cardState.areaCounty != "All") {
        query.county_fips = cardState.areaCounty
      }
      if (cardState.areaState && cardState.areaState != "All") {
        query.state_fips = cardState.areaState
      }
      if (cardState.spatialLevel == "state") {
        query.county_fips = "All";
      }
    
      if (cardState.measure == "population") {
        const populationQuery = {...query};
        delete populationQuery.cause;
        const filteredData = await this.dataManager.getPopulationData(populationQuery, {includeTotals: false})
        data.push(...filteredData);
      } else {
        const filteredData = await this.dataManager.getCountyMortalityData(query, {
        includeTotals: false, 
        states: this.state.areaStateOptions, 
        counties: this.state.areaCountyOptions
        });
        data.push(...filteredData);
      }
    
      }
    
      console.log({data, this: this, measure: cardStates, state: this.state.areaStateOptions   })
  
      const content = document.createElement("div");
      content.style.height = (height * .9) + 'px' ;
      content.style.overflowY = 'auto';
      content.style.overflowX = 'auto'; 
      content.style.minWidth = '1000px'; // Set a minimum width to ensure horizontal scroll
  
  
      popup(document.body, content , {
      title: "Data Table",
      backdrop: true,
      stopEvents: false,
      });
  
      let tableColumns = [...mapTableColumns]
      plotDataTable(data, content, {
      columns: tableColumns
      })
    })()
  }

  #calcSharedState() {
    const cardStates = this.plotGrid.getCards().filter(d => d).map(d => d.cardState);
    
    const sharedState = { ...cardStates[0] };
    for (const cardState of cardStates.slice(1)) {
      if (cardState) {
        for (const [k,v] of Object.entries(cardState)) {
          if (sharedState[k] != v) {
            delete sharedState[k];
          }
        }
      }

    }
    return sharedState;
  }

  toggleLoading(loading) {
    if (loading) {
      this.elems.dashboard.classList.add("loading");
    } else {
      this.elems.dashboard.classList.remove("loading");
    }
  }
}

class CardConfigPopup {
  constructor(container, blurElement, state) {
    this.state = state;
    this.elems = {
      container, blurElement,
      plotCardConfig: document.getElementById("plot-card-config"),
      cardSelects: document.querySelectorAll("#plot-card-config .plot-card-select"),
      submitButton: document.querySelector("#card-submit-button")
    }

    this.elems.submitButton.addEventListener("click", () => {
      if (this.cardStateResolve) {
        const newCardState = {};
        for (const field of CONSTANTS.CARD_STATE_FIELDS) {
          newCardState[field] = this.state[field];
        }

        this.cardStateResolve(newCardState);
        this.configPopup.close();
        this.cardStateResolve = null;
        this.configPopup = null;
      }
    })
  }

  popupGetState(card=null) {
    const promise = new Promise((resolve) => this.cardStateResolve = resolve);

    if (card) {
      for (const [k,v] of Object.entries(card.cardState)) {
        if (v != this.state[k]) {
          this.state[k] = v;
        }
      }  
    }

    this.elems.plotCardConfig.style.display = "flex";
    this.configPopup = popup(this.elems.container, this.elems.plotCardConfig, { 
      title: "Configure map card",
      blur: this.elems.blurElement,
    });

    return promise; 
  }
}

class PlotGrid {
  constructor(options={}) {
    options = {
      gridContainerElement: null,

      nRows: 1, 
      nCols: 1,
      addHoverProximity: 80,
      ...options
    }
    Object.assign(this, options)

    this.nodeMatrix = Array.from({length: this.nCols}, () => Array.from({length: this.nRows}, () => null));
    this.listeners = {
      gridUpdated: d => d, 
      editCardClicked: d => d,
      blankCardClicked: d => d,
      closeCardClicked: d => d,
      downloadCardClicked: (card) => {
        // Download logic here
        console.log('Downloading card:', card);
        
        // // Example download content logic:
        // const contentToDownload = card.content();
        // const blob = new Blob([contentToDownload], { type: 'text/plain' });
        // const link = document.createElement('a');
        // link.href = window.URL.createObjectURL(blob);
        // link.download = 'card-content.txt';  // File name
        // link.click();
      },
      tableClicked: (card) => {
        console.log("Table button clicked for card:", card);
        // Define what happens when the table button is clicked
        // For example, open a modal, render a table, etc.
      },
    }

    this.gridContainerElement.innerHTML = '';
    this.gridElement = document.createElement("div");
    this.gridElement.classList.add("grid-stack");
    this.gridContainerElement.appendChild(this.gridElement);

    this.grid = GridStack.init({
      row: options.nRows,
      // maxRow: options.nRows,
      column: options.nCols,
      // cellHeight: this.gridElement.getBoundingClientRect().height / options.nRows - 10,
      disableResize: true,
      handle: ".fa-grip-horizontal"
    }, this.gridElement)
    this.grid.setAnimation(false);
    this.grid.removeAll();

    this.gridElement.style.height = "100%"

    const resizeObserver = new ResizeObserver(() => {
      this.grid.cellHeight(this.gridContainerElement.getBoundingClientRect().height / this.nRows - 5)
      this.gridElement.style.height = "100%"
    })
    resizeObserver.observe(this.gridContainerElement)

    const addColumnButton = document.createElement("i")
    addColumnButton.setAttribute("class", "fa-solid fa-circle-plus")
    addColumnButton.classList.add("plot-grid-add")
    addColumnButton.classList.add("plot-grid-add-col")
    addColumnButton.setAttribute("tip", "Add new column");
    addColumnButton.addEventListener("click", () => this.addColumn())
    this.gridElement.appendChild(addColumnButton)

    const addRowButton = document.createElement("i")
    addRowButton.setAttribute("class", "fa-solid fa-circle-plus")
    addRowButton.classList.add("plot-grid-add")
    addRowButton.classList.add("plot-grid-add-row")
    addRowButton.setAttribute("tip", "Add new row");
    addRowButton.addEventListener("click", () => this.addRow())
    this.gridElement.appendChild(addRowButton)

    document.addEventListener("mousemove", e => {
      const bbox = this.gridElement.getBoundingClientRect() 

      if (Math.abs(e.clientY - bbox.bottom) < this.addHoverProximity) {
        this.gridElement.classList.add("add-visible-row")
      } else {
        this.gridElement.classList.remove("add-visible-row")
      }

      if (Math.abs(e.clientX - bbox.right) < this.addHoverProximity) {
        this.gridElement.classList.add("add-visible-col")
      } else {
        this.gridElement.classList.remove("add-visible-col")
      }
    })

    this.grid.on("change", (e, gridNodes) => {
      gridNodes.forEach(gridNode => {
        const node = this.nodeMatrix[gridNode._orig.x][gridNode._orig.y];
        node.x = gridNode.x;
        node.y = gridNode.y;
        if (node.card) {
          node.card.x =  gridNode.x;
          node.card.y =  gridNode.y;
        }
      })
      const newNodeMatrix = this.nodeMatrix.map(d => [...d]);
      for (let i = 0; i < this.nCols; i++) {
        for (let j = 0; j < this.nRows; j++) {
          const node = this.nodeMatrix[i][j];
          newNodeMatrix[node.x][node.y] = node;
        }
      }
      this.nodeMatrix = newNodeMatrix;
      this.listeners.gridUpdated();
    })
  }
  
  addCard(content, options) {
    this.grid.batchUpdate(true);
    if (this.nodeMatrix[options.x]?.[options.y]) {
      this.grid.removeWidget(this.nodeMatrix[options.x][options.y].element);
    }

    const card = new PlotCard(content, options);
    card.addListener("editClicked", (card) =>
      this.listeners.editCardClicked(card)
    );
    card.addListener("closeClicked", (card) =>
      this.listeners.closeCardClicked(card)
    );
    card.addListener("downloadClicked", (card) =>
      this.listeners.downloadCardClicked(card)
    );
    card.addListener("tableClicked", (card) =>
      this.listeners.tableClicked(card)
    );

    const gridItem = document.createElement("div")
    gridItem.classList.add("plot-grid-item")
    gridItem.appendChild(card.getElement())
    this.grid.addWidget(gridItem, options)

    this.nodeMatrix[options.x][options.y] = { origX: options.x, origY: options.y, x: options.x, y: options.y, card, element: gridItem};
    this.tippyMap = addTippys();
    this.grid.batchUpdate(false);
  }

  addColumn() {
    this.grid.column(this.nCols + 1, "none")
    this.nodeMatrix.push([])
    this.grid.batchUpdate();
    for (let i = 0; i < this.nRows; i++) {
      // const blankElement = this.#blankItemElement();
      // this.grid.addWidget(blankElement, {  y:i });
      // const internalNode = this.grid.engine.addedNodes.at(-1);
      // const node = { origX: internalNode.x, origY: internalNode.y, x: internalNode.x, y: internalNode.y, element: blankElement };
      // this.nodeMatrix[node.x][node.y] = node;
      // blankElement.addEventListener("click", () => {
      //   this.listeners.blankCardClicked(node.x, node.y)
      // });
      this.addBlank({ y: i });
    }
    this.grid.batchUpdate(false);
    this.nCols = this.nCols + 1;
    this.listeners.gridUpdated();
  }

  addRow() {
    this.grid.cellHeight(this.gridContainerElement.getBoundingClientRect().height / (this.nRows + 1));
    this.grid.batchUpdate();
    this.grid.engine.maxRow = this.nRows + 1;
    for (let i = 0; i < this.nCols; i++) {
      // const blankElement = this.#blankItemElement()
      // this.grid.addWidget(blankElement,  { x:i,  });
      // const internalNode = this.grid.engine.addedNodes.at(-1);
      // const node = {origX: internalNode.x, origY: internalNode.y,  x: internalNode.x, y: internalNode.y, element: blankElement };
      // this.nodeMatrix[i][this.nRows] = node;
      // blankElement.addEventListener("click", () => {
      //   this.listeners.blankCardClicked(node.x, node.y)
      // });
      this.addBlank({ x: i });
    }
    this.grid.batchUpdate(false);
    this.nRows = this.nRows + 1;
    this.listeners.gridUpdated();
  }

  addBlank(pos) {
    let openedBatch = false; 
    if (!this.grid.engine.batchMode) {
      openedBatch = true;
      this.grid.batchUpdate(true);
    }
    if (this.nodeMatrix[pos.x]?.[pos.y]) {
      this.grid.removeWidget(this.nodeMatrix[pos.x][pos.y].element);
    }
    const blankElement = this.#blankItemElement();
    this.grid.addWidget(blankElement, pos);
    const internalNode = this.grid.engine.addedNodes.at(-1);
    const node = { origX: internalNode.x, origY: internalNode.y, x: internalNode.x, y: internalNode.y, element: blankElement };
    this.nodeMatrix[node.x][node.y] = node;
    blankElement.addEventListener("click", () => {
      this.listeners.blankCardClicked(node.x, node.y)
    });
    if (openedBatch) {
      this.grid.batchUpdate(false);
    }
  }

  getCards() {
    //return d3.merge(this.nodeMatrix).map(d => d?.card);
    const cards = [];
    for (let i = 0; i < this.nodeMatrix[0].length; i++) {
      for (let j = 0; j < this.nodeMatrix.length; j++) {
        cards.push(this.nodeMatrix[j][i]?.card);
      }
    }
    return cards;
  }

  renderCards() {
    this.getCards().forEach(card => card?.render());
  }

  addListener(type, listener) {
    this.listeners[type] = listener
  }

  #blankItemElement() {
    const gridItem = document.createElement("div")
    gridItem.classList.add("plot-grid-item")

    const blankItem = document.createElement("div")
    blankItem.classList.add("plot-grid-blank-item")
    gridItem.appendChild(blankItem)

    const plus = document.createElement("i")
    plus.className = "fas fa-edit" 
    blankItem.appendChild(plus) 

    const handle = document.createElement("div")
    handle.className = "fa-grip-horizontal"
    handle.style.display = "none"
    blankItem.appendChild(handle)

    return gridItem
  }
}
class PlotCard {
  constructor(content, options) {
    options = {
      ...options,
    };
    Object.assign(this, options);

    if (typeof content !== "function") {
      content = () => this.content;
    }
    this.content = content;
    this.#createElement(options);

    this.listeners = {
      editClicked: (d) => d,
      closeClicked: (d) => d,
      tableClicked: (d) => d,
    };
    
    let timeout = null;
    const resizeObserver = new ResizeObserver(() => {
      this.contentElement.innerHTML = "";
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        this.render();
      }, 200);
    });
    resizeObserver.observe(this.cardElement);
  }

  render() {
    const bbox = this.contentElement.getBoundingClientRect();
    this.contentElement.innerHTML = '';
    let renderedContent = this.content(bbox.width, bbox.height);

    if (renderedContent instanceof Promise) {
      this.contentElement.innerText = "Loading...";
      renderedContent.then((content) => {
        this.contentElement.innerHTML = '';
        this.contentElement.appendChild(content);
      });
    } else if (renderedContent instanceof Element) {
      this.contentElement.appendChild(renderedContent);
    }
  }

  getElement() {
    return this.cardElement;
  }

  setTitle(title) {
    this.titleElement.innerText = title;
  }

  addListener(type, listener) {
    this.listeners[type] = listener;
  }
// TODO: Remove redundant codes
  eventButtonDownloadClicked() {
    console.log("Download button clicked");

    // Create and show loading message
    const loadingMessage = document.createElement("div");
    loadingMessage.innerText = "Generating image...";
    loadingMessage.style.position = 'fixed';
    loadingMessage.style.top = '50%';
    loadingMessage.style.left = '50%';
    loadingMessage.style.transform = 'translate(-50%, -50%)';
    loadingMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
    loadingMessage.style.color = 'white';
    loadingMessage.style.padding = '20px';
    loadingMessage.style.borderRadius = '5px';
    loadingMessage.style.zIndex = '10000';
    document.body.appendChild(loadingMessage);

    // Create the Virtual DOM container
    const virtualContainer = document.createElement('div');
    virtualContainer.id = 'virtual-dashboard';
    virtualContainer.style.position = 'absolute';
    virtualContainer.style.top = '-9999px'; // Hide it offscreen
    virtualContainer.style.left = '-9999px';
    virtualContainer.style.width = '100%'; // Ensure it captures full width
    virtualContainer.style.height = 'auto'; // Ensure it captures full height
    virtualContainer.style.overflow = 'hidden'; // Hide overflow

    // Get the current card's content
    const cardContent = this.getElement().cloneNode(true);
    cardContent.querySelector('.grid-card-topbar-buttons')?.remove();
    cardContent.querySelector('.grid-card-data-edit')?.remove();
    virtualContainer.appendChild(cardContent);

    // Append the virtual container to the body
    document.body.appendChild(virtualContainer);

    // Render Virtual DOM to Canvas
    html2canvas(virtualContainer, { useCORS: true }).then(canvas => {
      console.log("Canvas generated");

      const dataURL = canvas.toDataURL("image/png");

      // Trigger the download
      const downloadLink = document.createElement('a');
      downloadLink.href = dataURL;
      downloadLink.download = 'card-map.png';
      downloadLink.click();

      // Clean up
      document.body.removeChild(virtualContainer);
      document.body.removeChild(loadingMessage);
    }).catch(error => {
      console.error("Error generating canvas:", error);
      document.body.removeChild(loadingMessage);  // Remove the loading message in case of error
    });
  }

  eventButtonTableClicked(options) {
     const {clientHeight: height} = document.body
     const content = document.createElement("div");
     content.style.height = (height * .9) + 'px' ;
     content.style.overflowY = 'auto';
     content.style.overflowX = 'auto'; 
     content.style.minWidth = '1000px'; // Set a minimum width to ensure horizontal scroll
  
  
     popup(document.body, content , {
      title: "Data Table",
      backdrop: true,
      stopEvents: false,
     });
  
     let tableColumns = [...mapTableColumns]
     options.data.then(data => {
      plotDataTable(data, content, {
        columns: tableColumns
       })
     })
   }

  #buttonClickedEdit() {
    this.listeners.editClicked(this);
  }

  #buttonClickedExpand(e) {
    const isExpand = e.target.classList.contains("fa-expand");

    if (isExpand) {
      openFullscreen(this.content);
    }
  }

  #buttonClickedClose() {
    this.listeners.closeClicked(this);
  }

  #buttonClickedDownload() {
    this.eventButtonDownloadClicked();
  }
  #buttonClickedTable(options) {
    this.eventButtonTableClicked(options);
  }

  #createElement(options) {
    const gridCard = document.createElement("div");
    gridCard.className = "grid-card";
    gridCard.innerHTML = /*html*/`
      <div class="grid-card-topbar">
        <i class="fas fa-edit grid-card-data-edit highlightable-button" tip="Edit card"></i>
        <div class="grid-card-topbar-title">${this.title ? this.title : ""}</div>
        <div class="grid-card-topbar-buttons">
          <i class="fas fa-times highlightable-button"></i>
          <i class="fas fa-expand highlightable-button"></i>
          <i class="fas fa-grip-horizontal card-handle highlightable-button"></i>
          <i class="fa-solid fa-download settings-button"></i>
          <i class="fa-solid fa-table settings-button"></i>
        </div>
      </div>
      <div class="grid-card-content-container"><div class="grid-card-content"></div></div>
    `;

    gridCard.querySelector(".fas.fa-edit").addEventListener("click", () => this.#buttonClickedEdit());
    gridCard.querySelector(".fas.fa-expand").addEventListener("click", (e) => this.#buttonClickedExpand(e, options));
    gridCard.querySelector(".fas.fa-times").addEventListener("click", () => this.#buttonClickedClose());
    gridCard.querySelector(".fa-solid.fa-download").addEventListener("click", () => this.#buttonClickedDownload());
    gridCard.querySelector(".fa-solid.fa-table").addEventListener("click", () => this.#buttonClickedTable(options));

    this.cardElement = gridCard;
    this.contentElement = gridCard.querySelector(".grid-card-content");
    this.titleElement = gridCard.querySelector(".grid-card-topbar-title");
  }
}

async function openFullscreen(content) {
  const {clientHeight: height, clientWidth: width} = document.body
  document.body.style.overflow = 'hidden'
  const mapElement = await content(width * .9, height * .8)

  popup(document.body, mapElement, {
    title: "Configure map card",
    backdrop: true,
    stopEvents: false,
  });

  zoomMap()
}

function zoomMap() {
  let zoom = d3.zoom()
	.scaleExtent([0.25, 10])
	.on('zoom', handleZoom);

  function handleZoom(e) {
    d3.select('.popup svg')
      .attr('transform', e.transform);
  }


  function initZoom() {
    d3.select('.popup svg')
      .call(zoom);
  }

  function handleZoom(e) {
    d3.selectAll('.popup svg g')
      .attr('transform', e.transform);
  }


  initZoom();
}

new MapApplication();