import * as d3 from "d3";
import * as Plot from "@observablehq/plot";
import { numberFormat } from "./utils/helper";

/**
 * Creates a static choropleth map plot.
 * @param {Array} spatialData - The data array for the map.
 * @param {object} featureCollection - GeoJSON feature collection for map shapes.
 * @param {object} options - Configuration options for the plot.
 * @returns {SVGSVGElement} The SVG element of the plot.
 */
export function createChoroplethPlot(spatialData, featureCollection, options = {}) {
  const finalOptions = {
    strokeColor: "lightgrey",
    outlierColor: "#3d3d3d",
    onSettingsClick: (d) => d,
    overlays: [], 
    ...options,
  };

  if (!finalOptions.colorLegendLabel) {
    finalOptions.colorLegendLabel = finalOptions.measureField;
  }

  const spatialDataMap = d3.index(spatialData, (d) => d[finalOptions.indexField]);
  const { color, strokeColor } = finalOptions;

  let colorDomain = color.domain;
  if (color.pivot != null) {
    const maxSide = Math.max(
      color.pivot - color.domain[0],
      color.domain[1] - color.pivot
    );
    colorDomain = [color.pivot - maxSide, color.pivot + maxSide];
  }

  if (color.reverse) {
    colorDomain = [colorDomain[1], colorDomain[0]];
  }

  const colorScale = d3
    .scaleSequential(d3["interpolate" + color.scheme])
    .domain(colorDomain);

  const stroke = feature => {
    if (strokeColor) {
      return strokeColor;
    } else {
      return spatialDataMap.get(feature.id)?.[finalOptions.measureField] ? "none" : "#dfe1e2";
    }
  };

  const marks = [];
  marks.push(
    Plot.geo(featureCollection, {
      stroke,
      fill: (d) => {
        const row = spatialDataMap.get(d.id);
        if (row && row[finalOptions.measureField] != null) {
          if (
            row[finalOptions.measureField] >= color.domain[0] &&
            row[finalOptions.measureField] <= color.domain[1]
          ) {
            return colorScale(row[finalOptions.measureField]);
          }
          return finalOptions.outlierColor;
        }
        return "white";
      },
      strokeWidth: 1,
    })
  );

  for (const overlay of finalOptions.overlays) {
    marks.push(
      Plot.geo(overlay.featureCollection, {
        stroke: overlay.strokeColor,
        fill: "none",
        strokeWidth: 1.3,
        pointerEvents: "none",
      })
    );
  }
  const plot = Plot.plot({
    width: finalOptions.width,
    height: finalOptions.height,
    projection: {
      type: "albers-usa",
      domain: featureCollection,
      // domain: finalOptions.overlayFeatureCollection
      //   ? finalOptions.overlayFeatureCollection
      //   : featureCollection,
    },
    marks: marks,
  });

  plot.style.maxWidth = "initial";

  // d3.select(plot)
  //   .selectAll("g[aria-label='geo']")
  //   .filter((_, i) => i === 0)
  //   .selectAll("path")
  //   .attr("id", (d) => "area-" + featureCollection.features[d].id);

  // if (finalOptions.overlayFeatureCollection) {
  //   d3.select(plot)
  //     .selectAll("g[aria-label='geo']")
  //     .filter((_, i) => i === 1)
  //     .selectAll("path")
  //     .attr("id", (d) => "area-" + finalOptions.overlayFeatureCollection.features[d].id);
  // }
   
  // This resizes the SVG to fit the plot (not entirely happy with it, but it works...)
  requestAnimationFrame(() => {
    fitSvgToContent(plot, 5); 
  });
  
  return { plot };
}

export function createTooltipHistogram(values) {
  return Plot.plot({
    style: { fontSize: "12px" },
    width: 150,
    height: 60,
    marginBottom: 18,
    x: { ticks: d3.extent(values), tickSize: 0, tickFormat: numberFormat },
    y: { axis: null },
    marks: [
      Plot.rectY(values, Plot.binX({ y: "count" }, { x: d => d, fill: "#c0d3ca", inset: 0, thresholds: 20 })),
    ]
  });
}

export function addMapHoverInteraction(mapPlot, featureCollection, onHover, onUnhover) {
  const plotSelect = d3.select(mapPlot);
  const gSelect = d3.select(plotSelect.selectAll("g[aria-label='geo'").nodes()[0]);
  const geoSelect = gSelect.selectAll("path");
  geoSelect.on("mouseover.interact", (e, d) => {
    onHover(e.target, featureCollection.features[d]);
  });
  gSelect.on("mouseleave.interact", () => {
    onUnhover();
  });
}

/**
 * Adjusts the SVG's viewBox and dimensions to fit its content tightly.
 * @param {SVGSVGElement} svgNode The SVG element to adjust.
 * @param {number} padding Optional padding to add around the content.
 */
function fitSvgToContent(svgNode, padding = 0) {
  const svg = d3.select(svgNode);
  
  const contentGroups = svg.selectAll("g[aria-label='geo']");
  if (contentGroups.empty()) return;

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  contentGroups.each(function() {
    const bbox = this.getBBox();
    if (bbox.width == 0 && bbox.height == 0) return; 
    minX = Math.min(minX, bbox.x);
    minY = Math.min(minY, bbox.y);
    maxX = Math.max(maxX, bbox.x + bbox.width);
    maxY = Math.max(maxY, bbox.y + bbox.height);
  });
  
  if (!isFinite(minX)) return; 

  const finalX = minX - padding;
  const finalY = minY - padding;
  const finalWidth = (maxX - minX) + (padding * 2);
  const finalHeight = (maxY - minY) + (padding * 2);

  svg.attr("viewBox", `${finalX} ${finalY} ${finalWidth} ${finalHeight}`);
  
  svg.attr("width", finalWidth);
  svg.attr("height", finalHeight);
}