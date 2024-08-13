import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as Plot from "https://cdn.jsdelivr.net/npm/@observablehq/plot@0.6/+esm";
import {
  createDropdownDownloadButton,
} from "../utils/helper.js";
import {
  addPopperTooltip,
  initSidebar,
  downloadStringAsFile,
  downloadMortalityData,
} from "../utils/helper.js";
import { downloadElementAsImage } from "../utils/download.js";

// Just the static plot.
export function createChoroplethPlot(
  spatialData,
  featureCollection,
  options = {}
) {

  const { ...restOptions } = options;

  options = {
    drawBorders: true,
    overlayColor: "silver",
    outlierColor: "#3d3d3d",
    onSettingsClick: d => d,
    ...restOptions,
  };

  if (!options.colorLegendLabel) {
    options.colorLegendLabel = options.measureField;
  }

  const spatialDataMap = d3.index(spatialData, (d) => d[options.indexField]);

  let values = spatialData.map(d => d[options.measureField])
  // if (options.color.outlierThreshold) {
  //   const mean = d3.mean(values)
  //   const std = d3.deviation(values)
  //   values = values.filter(d => ((d-mean)/std) <= options.color.outlierThreshold)
  // }

  let color = options.color;
  if (!color) {
    color.pivot = d3.mean(values);
    color.domain = d3.extent(values);
    color.reverse = true;
    color.scheme = "RdYlBu";
  }

  let colorDomain = color.domain 
  if (color.pivot != null) {
    const maxSide = Math.max(
      color.pivot - color.domain[0],
      color.domain[1] - color.pivot
    );
    colorDomain = [color.pivot - maxSide, color.pivot + maxSide] 
  } 

  if (color.reverse) {
    colorDomain = [colorDomain[1], colorDomain[0]]
  }

  const colorScale = d3
    .scaleSequential(d3["interpolate" + color.scheme])
    .domain(colorDomain);
  // const color = {
  //   scheme: options.scheme,
  //   pivot: meanValue,
  //   symmetric: true,
  //   reverse: true,
  //   label: options.measureField,
  //   ...options.color
  // }

  const marks = [];
  marks.push(
    Plot.geo(featureCollection, {
      stroke: (d) =>
        options.drawBorders
          ? spatialDataMap.get(d.id)?.[options.measureField] ? "none" : "lightgrey"
          : spatialDataMap.get(d.id)?.[options.measureField],
      fill: (d) => {
        const row = spatialDataMap.get(d.id);
        if (row && row[options.measureField] != null) {
          if (row[options.measureField] >= color.domain[0] && row[options.measureField] <= color.domain[1]) {
            return colorScale(row[options.measureField]);
          } else {
            return options.outlierColor
          }
        } else {
          return "white";
        }
      },
      strokeWidth: 1,
    })
  );

  if (options.overlayFeatureCollection) {
    marks.push(
      Plot.geo(options.overlayFeatureCollection, {
        stroke: options.overlayColor,
        fill: "none",
        strokeWidth: 1,
        pointerEvents: "none",
      })
    );
  }

  const plotOptions = {
    projection: { 
      type: "albers-usa", 
      //domain: featureCollection,
      domain: options.overlayFeatureCollection ? options.overlayFeatureCollection : featureCollection 
    },
    //color: color,
    marks: marks,
  };

  if (options.width) plotOptions.width = options.width;
  if (options.height) plotOptions.height = options.height;


  const figure = document.createElement("figure");
  const plot = Plot.plot(plotOptions);
  const plotWrapper = document.createElement("svg");
  plotWrapper.appendChild(plot);
  //colorLegend && figure.appendChild(colorLegend)
  figure.appendChild(plotWrapper);
  figure.style.overflow = "hidden";
  plot.style.maxWidth = "initial";

  d3.select(plot)
    .selectAll("g[aria-label='geo']")
    .filter((_, i) => i == 0)
    .selectAll("path")
    .attr("id", (d, i) => "area-" + featureCollection.features[d].id);

  if (options.overlayFeatureCollection) {
    d3.select(plot)
      .selectAll("g[aria-label='geo']")
      .filter((_, i) => i == 1)
      .selectAll("path")
      .attr(
        "id",
        (d, i) => "area-" + options.overlayFeatureCollection.features[d].id
      );
  }

  return { figure, plot, plotWrapper };
}

export function plotMortalityMapGrid(
  container,
  legendContainer,
  mortalityData,
  mainFeatureCollection,
  options = {}
) {
  const mapsContainer = container;

  options = {
    overlayFeatureCollection: null,
    rowField: null,
    columnField: null,
    scheme: "RdYlBu",
    measureField: "crude_rate",
    level: "county",
    featureNameFormat: null,
    valueFormat: null,
    prepareDataForDownload: (d) => d,
    measureLabel: null,
    minMapHeight: 550,
    reverseColorScheme: false,
    centerColorMean: true,
    outlierThreshold: 3,
    ...options,
  };

  let valuesRow = ["All"];
  let valuesColumn = ["All"];

  if (options.rowField) {
    valuesRow = [...new Set(mortalityData.map((d) => d[options.rowField]))];
  }
  if (options.columnField) {
    valuesColumn = [
      ...new Set(mortalityData.map((d) => d[options.columnField])),
    ];
  }

  if (!options.measureLabel) {
    options.measureLabel = options.measureField;
  }

  // TODO: Better sorting in the future.
  valuesRow.sort();
  valuesColumn.sort();

  const mapConfigs = generateCombinations(
    valuesRow,
    valuesColumn,
    "row",
    "column"
  );
  mapConfigs.forEach((config) => {
    config.rowIndex = config.rowIndex + 1;
    config.columnIndex = config.columnIndex + 1;
    config.data = mortalityData.filter(
      (d) =>
        (d[options.rowField] == config.rowValue || !options.rowField) &&
        (d[options.columnField] == config.columnValue || !options.columnField)
    );
    config.prepareDataForDownload = options.prepareDataForDownload;
    config.prepareMapForDownload = options.prepareMapForDownload;
  });

  const nRows = Math.max(valuesColumn.length, 1);
  const nColumns = Math.max(valuesColumn.length, 1);

  options.minMapHeight = Math.floor(550 / nColumns)
  mapsContainer.innerHTML = ``;
  //mapsContainer.style.display = 'grid';
  mapsContainer.style.gridTemplateRows = `repeat(${
    options.rowField ? nRows + 1 : nRows
  }, auto)`;
  //mapsContainer.style.gridTemplateColumns = `repeat(${options.columnField ? nColumns + 1 : nColumns}, auto)`;
  const columns = options.columnField ? nColumns + 1 : nColumns;
  mapsContainer.style.gridTemplateColumns = `auto ${Array.from(
    { length: columns - 1 },
    () => "1fr"
  ).join(" ")}`;

  if (options.rowField != "none") {
    valuesRow.forEach((value, i) => {
      const label = document.createElement("div");
      label.classList.add("map-grid-label");
      label.classList.add("map-grid-cell");
      label.innerText = value;
      label.style.gridRow = `${i + 2}`;
      label.style.gridColumn = `1`;
      mapsContainer.appendChild(label);
    });
  }

  if (options.columnField != "none") {
    valuesColumn.forEach((value, i) => {
      const label = document.createElement("div");
      label.classList.add("map-grid-label");
      label.classList.add("map-grid-cell");
      label.innerText = value;
      label.style.gridColumn = `${i + 2}`;
      label.style.gridRow = ``;
      mapsContainer.appendChild(label);
    });
  }

  const bbox = mapsContainer.getBoundingClientRect();
  let mapWidth = (0.9 * bbox.width) / nColumns;
  let mapHeight = Math.max(0.87 * bbox.height / nColumns, options.minMapHeight);

  let values = mortalityData.map((d) => d[options.measureField])
  const mean = d3.mean(values);
  let domain = d3.extent(values);

  // if (options.color.outlierThreshold && values.length > 1) {
  //   const std = d3.deviation(values)
  //   const clipDomain = [-options.color.outlierThreshold, options.color.outlierThreshold].map(d => d*std+mean)
  //   domain = [
  //     Math.max(domain[0], clipDomain[0]),
  //     Math.min(domain[1], clipDomain[1]),
  //   ]
  // }

  const baseHistogramConfig = {
    options: {
      width: 300,
      height: 100, 
      // width: 140,
      // height: 60,
      // margin: 15,
      // x: { ticks: domain, label: null, tickSize: 0, tickPadding: 4, domain, },
      // y: { ticks: [], label: null, margin: 0 },
      // style: {
      //   background: "none",
      //   color: "black",
      // },
    },
    marks: [
      // Plot.rectY(
      //   mortalityData,
      //   Plot.binX(
      //     { y: "count" },
      //     { x: options.measureField, thresholds: 16, fill: "#c3d1c0" }
      //   )
      // ),
    ],
  };

  let sharedColorLegend = colorRampLegendMeanDiverge(
    values.filter(d => d >= domain[0] && d <= domain[1]),
    options.scheme,
    options.measureLabel,
    null,
    options.reverseColorScheme,
    ["#3d3d3d"],
    options.centerColorMean
  );

  for (const config of mapConfigs) {
    const mapDiv = document.createElement("div");
    mapDiv.style.position = "relative";

    mapDiv.classList.add("map-grid-cell");
    mapDiv.style.gridRow = `${(config.rowIndex ?? 1) + 1} `;
    mapDiv.style.gridColumn = `${(config.columnIndex ?? 1) + 1}`;

    const color = { pivot: options.centerColorMean ? mean : null, 
      domain, scheme: options.scheme, reverse: options.reverseColorScheme }

    const { plot, colorLegend } = createChoroplethPlot(
      config.data,
      mainFeatureCollection,
      {
        indexField: options.level + "_fips",
        measureField: options.measureField,
        scheme: options.scheme,
        overlayFeatureCollection: options.overlayFeatureCollection,
        width: mapWidth,
        height: mapHeight,
        color,
        outlierThreshold: 1,
      }
    );

    mapDiv.appendChild(plot);
    //addIndividualDownloadButton(mapDiv, config)
    mapsContainer.appendChild(mapDiv);

    addChoroplethInteractivity(
      plot,
      mapDiv,
      config.data,
      mortalityData,
      options.level,
      options.measureField,
      baseHistogramConfig,
      mainFeatureCollection,
      {
        featureNameFormat: options.featureNameFormat,
        valueFormat: options.valueFormat,
        xDomain: domain,
      }
    );

    zoomOnMap(mainFeatureCollection, options.state);
  }

  const legendDiv = document.createElement("div");
  legendDiv.classList.add("legend-wrapper");
  legendDiv.classList.add("legend-minimized")
  if (sharedColorLegend) {
    legendDiv.appendChild(sharedColorLegend);

    const palette = document.createElement("i")
    palette.className = "fas fa-palette legend-min-icon"
    // palette.style.width = "80px"
    // palette.style.fontSize = "30px"
    // palette.style.marginLeft = "8px"
    legendDiv.appendChild(palette)

  }
  // document.getElementById("color-legend").style.top = "5px"

  const legendButtons = document.createElement("div");
  legendButtons.classList.add("legend-buttons");
  const settingsButton = document.createElement("i");
  settingsButton.className = "fa-solid fa-gear";
  legendButtons.appendChild(settingsButton);
  // const pinButton = document.createElement("i");
  // pinButton.className = "fa-solid fa-thumbtack pin-button";
  // legendButtons.appendChild(pinButton);
  const minimizeButton = document.createElement("i");
  minimizeButton.className = "fas fa-expand pin-button";
  legendButtons.appendChild(minimizeButton);

  // pinButton.addEventListener("click", () => {
  //   legendContainer.classList.toggle("unpinned");
  // });

  minimizeButton.addEventListener("click", () => {
    legendDiv.classList.toggle("legend-minimized");
    minimizeButton.classList.toggle("fa-compress");
    minimizeButton.classList.toggle("fa-expand");
  })

  settingsButton.addEventListener("click", () => options.onSettingsClick(settingsButton))

  legendContainer.innerHTML = ``;
  legendContainer.appendChild(legendDiv);
  legendContainer.appendChild(legendButtons);
}

function createColorSettings() {
 
}

function zoomOnMap(featureCollection, state) {
  const gNodes = d3.selectAll("g[aria-label='geo'").nodes();
  const selectedAreaState = state["areaState"] !== "All" || !state["areaState"];

  gNodes.forEach((g, index) => {
    if (index % 2 === 0 || selectedAreaState) {
      const gSelect = d3.select(g);
      const geoSelect = gSelect.selectAll("path");

      geoSelect.on("click", (e, d) => {
        const feature = featureCollection.features[d];
        const areaState = feature.id.slice(0,2)
        if (!state["areaState"] || state["areaState"] == "All") {
          state["areaState"] = areaState;
        } else if (!state["areaCounty"] || state["areaCounty"] == "All") {
          state["areaCounty"] = feature.id;
        }
      });
    }
  });
}

// export function addChoroplethTooltip(args) {
//   const {
//     plot, 
//     plotContainer, 
//     plotData,
//     fullData,
//     featureCollection,
//   } = args; 

//   const tooltip = addPopperTooltip(plotContainer);
//   tooltip.tooltipElement.setAttribute("id", "map-tooltip");
// }

export function addChoroplethInteractivity(
  plot,
  plotContainer,
  mapData,
  mapGridData,
  level,
  measure,
  baseHistogramConfig,
  featureCollection,
  args = {}
) {
  args = {
    featureNameFormat: null,
    valueFormat: null,
    xDomain: [-3, 3],
    ...args,
  };

  const state = { plotHighlight: null };
  const indexField = level + "_fips";
  const mapDataGeoMap = d3.group(mapGridData, (d) => d[indexField]);

  const spatialDataMap = d3.index(mapData, (d) => d[indexField]);

  const plotSelect = d3.select(plot);

  const gSelect = d3.select(
    plotSelect.selectAll("g[aria-label='geo'").nodes()[0]
  );

  const geoSelect = gSelect.selectAll("path");

  const tooltip = addPopperTooltip(plotContainer);
  tooltip.tooltipElement.setAttribute("id", "map-tooltip")

  const previousStroke = null;

  gSelect.on("mouseleave.interact", () => {
    // if (!state.isSelectedStateCounty) {
    //   state.plotHighlight =
    //     state.selectCounty !== "all"
    //       ? state.selectCounty
    //       : state.selectState !== "all"
    //       ? state.selectState
    //       : null;
    // }
    tooltip.hide();
  });


  geoSelect
    .on("mouseover.interact", (e, d) => {
      const feature = featureCollection.features[d];
      state.plotHighlight = feature.id;
      d3.select(e.target)
        // .attr("stroke", "mediumseagreen")
        // .attr("stroke-opacity", 0.6)
        // .attr("stroke-width", 3)
        .raise();

      const row = spatialDataMap.get(feature.id);

      const div = document.createElement("div");
      div.style.display = "flex";
      div.style.flexDirection = "column";
      div.style.justifyContent = "space-between";

      if (!args.valueFormat) {
        args.valueFormat = (d) => {
          if (Number.isFinite(d)) {
            return d.toFixed(2);
          } else {
            return "Ø";
          }
        };
      }

      if (!args.featureNameFormat) {
        args.featureNameFormat = (d) => d.id;
      }

      const infoDiv = document.createElement("div");
      infoDiv.style.display = "flex";
      infoDiv.style.justifyContent = "space-between";
      infoDiv.style.gap = "10px";
      infoDiv.innerHTML = `<b>${args.featureNameFormat(feature)}
      </b>${args.valueFormat(row ? row[measure] : null)}`;
      // infoDiv.innerHTML = `<b>${feature.properties.name},
      // ${state.conceptMappings.states[feature.id.slice(0, 2)].short}</b>${row[state.measure].toFixed(2)}`

      div.appendChild(infoDiv);

      const histogramOptions = baseHistogramConfig.options;
      histogramOptions.marks = [...baseHistogramConfig.marks];

      // Expand tooltip histogram to show outliers if they are outside standard range
      let xDomain = args.xDomain
      // if (row?.[measure] < xDomain[0]) {
      //   baseHistogramConfig.options.x.domain[0] = row[measure]
      // } else if (row?.[measure] > xDomain[1]) {
      //   baseHistogramConfig.options.x.domain[1] = row[measure]
      // } else {
      //   baseHistogramConfig.options.x.domain = [...xDomain]
      // }

      if (row && Number.isFinite(row[measure])) {
        const otherRows = mapDataGeoMap.get(feature.id).filter((d) => d != row);
        histogramOptions.marks.push(
          Plot.dot(otherRows, {
            x: measure,
            y: 0,
            stroke: "red",
            r: 2,
            strokeWidth: 1,
          })
        );
        histogramOptions.marks.push(
          Plot.ruleX([row[measure]], { stroke: "red", strokeWidth: 1.5 })
        );
      }
      // div.appendChild(Plot.plot({...baseHistogramConfig.options, marks: baseHistogramConfig.marks}))
      div.appendChild(Plot.plot(histogramOptions));
      // const testPlot = Plot.plot({
      //   height: 100,
      //   width: 300,
      //   marks: [
      //     Plot.dot([0,1], {x: d => d, y: d => d})
      //   ]
      // })
      // div.appendChild(testPlot);

      tooltip.show(e.target, div);
    })
    .on("mouseleave.interact", (e, d) => {
      // d3.select(e.target)
      //   .attr("stroke", previousStroke)
      //   .attr("stroke-width", 0.5)
      //   .raise();
    });

  //state.defineDynamicProperty("plotHighlight");
}

export function createDemographicsPlot(data, options = {}) {
  options = {
    width: 360,
    height: 320,
    xTickFormat: (d) => d,
    ...options,
  };

  if (!options.referenceData) {
    options.referenceData = data;
  }

  const mainField =
    options.compareSecondary != "none"
      ? options.compareSecondary
      : options.comparePrimary;
  const otherField =
    options.compareSecondary != "none" ? options.comparePrimary : "none";

  const domainValues = options.referenceData.map((d) => d[mainField]);
  const facetDomainValues = options.referenceData.map((d) => d[otherField]);
  const colorScheme = d3
    .scaleOrdinal()
    .domain(domainValues)
    .range(d3.schemeTableau10);

  const extent = d3.extent(
    options.referenceData,
    (d) => d[options.measureField]
  );
  let tickFormat = (d) => d;
  if (extent.some((d) => Math.abs(d) >= 100000)) {
    tickFormat = (d) => d.toExponential();
  }

  const highlightExtent = d3.extent(data, (d) => d[options.measureField]);
  const maxValue = Math.max(highlightExtent[1], extent[1]);

  // Make missing data explicitx
  const missingData = [];
  const keys = otherField != "none" ? [mainField, otherField] : [mainField];
  const presentKeys = new Set(
    data.map((row) => keys.map((key) => row[key]).join("_"))
  );
  for (const mainValue of new Set(domainValues)) {
    for (const otherValue of new Set(facetDomainValues)) {
      const key = [mainValue, otherValue].filter((d) => d != null).join("_");
      if (!presentKeys.has(key)) {
        missingData.push({ [mainField]: mainValue, [otherField]: otherValue });
      }
    }
  }
  const textPos = maxValue / 2;

  const barOptions = {
    x: mainField,
    y: options.measureField,
    fill: (d) => colorScheme(d[mainField]),
    title: (d) => {
      return d[mainField];
    },
  };
  const refTickOptions = {
    x: mainField,
    y: options.measureField,
    strokeWidth: 2,
    strokeDasharray: "3,2",
  };
  const missingBarOptions = {
    x: mainField,
    y: maxValue,
    fill: "#f5f5f5",
    title: () => "sahar",
  };
  const textOptions = {
    x: mainField,
    y: () => textPos,
    text: () => "N/A",
    fontSize: 14,
    fill: "#dedede",
    pointerEvents: "none",
  };
  if (otherField != "none") {
    barOptions.fx = otherField;
    refTickOptions.fx = otherField;
    missingBarOptions.fx = otherField;
    textOptions.fx = otherField;
  }

  const plotOptions = {
    width: options.width,
    height: options.height,
    marginTop: 40,
    marginRight: 60,
    y: {
      grid: true,
      axis: "right",
      // label: options.measureField + " ↑",
      label: "Mortality rate per 100,000",
      tickFormat: tickFormat,
    },
    x: { domain: domainValues, tickFormat: options.xTickFormat },
    fx: { tickFormat: (d) => options.facetTickFormat(d) },
    marks: [
      Plot.barY(missingData, missingBarOptions),
      Plot.text(missingData, textOptions),
      Plot.barY(data, barOptions),
      Plot.tickY(options.referenceData, refTickOptions),
    ],
  };

  return Plot.plot(plotOptions);
}

export function createHistogramPlot(data, options = {}) {
  options = {
    width: 360,
    height: 320,
    markLine: [],
    ...options,
  };

  const meanValue = d3.mean(data, (d) => d[options.measureField]);

  const extent = d3.extent(data, (d) => d[options.measureField]);
  let tickFormat = (d) => d;
  if (extent.some((d) => Math.abs(d) >= 100000)) {
    tickFormat = (d) => d.toExponential();
  }

  const plot = Plot.plot({
    width: options.width,
    height: options.height,
    color: {
      scheme: "rdylbu",
      type: "diverging",
      pivot: meanValue,
      symmetric: true,
      reverse: true,
    },
    marginBottom: 40,
    x: { label: options.measureField + " →", tickFormat: tickFormat },
    y: { label: "number of counties" },
    marks: [
      Plot.rectY(
        data,
        Plot.binX(
          { y: "count" },
          { x: options.measureField, stroke: null, fill: "green" }
        )
      ),
      Plot.ruleX(options.markLine, {
        x: (d) => d[options.measureField],
        stroke: "red",
        strokeWidth: 2,
      }),
      Plot.text(options.markLine, {
        x: (d) => d[options.measureField],
        text: (d) => d[options.measureField].toFixed(0),
        textAnchor: "start",
        dx: 3,
      }),
    ],
  });

  return plot;
}

function generateCombinations(arr1, arr2, varName1, varName2) {
  const combinations = [];

  for (let i = 0; i < arr1.length; i++) {
    for (let j = 0; j < arr2.length; j++) {
      const obj = {};
      obj[`${varName1}Value`] = arr1[i];
      obj[`${varName1}Index`] = i;
      obj[`${varName2}Value`] = arr2[j];
      obj[`${varName2}Index`] = j;
      combinations.push(obj);
    }
  }

  return combinations;
}

// ========================
// Handle download buttons
// ========================

// function addIndividualDownloadButton(element, config) {
//   // TODO: More detailed filename based on inputs and grid plot
//   const baseFilename = "epitracker_data"

//   const buttonElement = createDropdownDownloadButton(true, [
//     {label: "Download data (CSV)", listener: () => downloadMortalityData(config.data, baseFilename, "csv")},
//     {label: "Download data (TSV)", listener: () => downloadMortalityData(config.data, baseFilename, "tsv")},
//     {label: "Download data (JSON)", listener: () => downloadMortalityData(config.data, baseFilename, "json")},
//     {label: "Download map (PNG)", listener: () => downloadMap(element)},
//   ])
//   buttonElement.style.position = "absolute"
//   buttonElement.style.top = "5px"
//   buttonElement.style.right = "5px"

//   element.appendChild(buttonElement)
// }

function downloadMap(element) {
  const svg = element.querySelector("svg");

  // TODO: Add title
  const temporaryDiv = document.createElement("div");
  temporaryDiv.appendChild(
    document.getElementById("color-legend").cloneNode(true)
  );
  temporaryDiv.appendChild(svg.cloneNode(true));

  // TODO: Better filename
  return downloadElementAsImage(temporaryDiv, "epitracker-map");
}
