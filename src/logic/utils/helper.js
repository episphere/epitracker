import { USAComboBox } from "./USAComboBox.js";
import * as Popper from "@popperjs/core";
import { Tabulator, FrozenColumnsModule, SortModule, FormatModule } from 'tabulator-tables'
import * as d3 from "d3";
import { domToPng } from 'modern-screenshot';
import tippy from 'tippy.js';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/animations/scale.css';
import { formatName } from "./nameFormat.js";

Tabulator.registerModule([FrozenColumnsModule, SortModule, FormatModule]);

/**
 * Retrieves DOM elements based on CSS selectors provided in an object.
 * Modifies the input object directly by replacing selector strings with Element objects.
 *
 * @param {Object.<string, string>} elements - An object where keys are desired property names
 * and values are CSS selector strings.
 * @returns {Object.<string, Element|null>} The input object, with selector strings replaced
 * by the corresponding DOM Elements (or null if not found).
 * Returns the original input unmodified if it's not a valid object.
 */
export function retrieveElements(elements) {
  if (typeof elements !== 'object' || elements === null) {
    console.error('retrieveElements: Input must be a non-null object.');
    return elements;
  }

  for (const [property, selector] of Object.entries(elements)) {
    if (typeof selector === 'string') {
      elements[property] = document.querySelector(selector);
      if (elements[property] === null) {
        console.warn(`retrieveElements: Element not found for selector "${selector}"`);
      }
    } else {
      console.warn(`retrieveElements: Value for key "${property}" is not a string selector. Skipping.`);
    }
  }
  return elements;
}


// === Input ===========================================================================================================

function setSelectOptions(select, state, optionsProperty, valueProperty) {
  select.innerHTML = '';

  let options = [];
  if (Array.isArray(state[optionsProperty])) {
    options = state[optionsProperty].map((d) =>
      typeof d == "string" ? { label: d, value: d } : d
    );
  }
  // options.sort((a,b) => a.label.localeCompare(b.label));

  const optionElements = [];
  for (const option of options) {
    const optionElement = document.createElement("option");
    optionElement.setAttribute("value", option.value);

    if (option.element) {
      optionElement.replaceChildren(option.element);
    } else {
       optionElement.innerText = option.label;
    }

    if (option.value == state[valueProperty]) {
      optionElement.setAttribute("selected", "");
    }
    optionElements.push(optionElement);
  }
  console.log(optionsProperty, optionElements)
  
  select.replaceChildren(...optionElements);
  return optionElements;
}

export function hookSelect(element, state, valueProperty, optionsProperty) {
  let select = typeof element == "string" ? document.querySelector(element) : element;

  let optionElements = [];
  state.subscribe(optionsProperty, () => {
    optionElements = setSelectOptions(select, state, optionsProperty, valueProperty);
  });

  state.subscribe(valueProperty, () => {
    for (const optionElement of optionElements) {
      if (state[valueProperty] == optionElement.value) {
        optionElement.setAttribute("selected", "");
      } else {
        optionElement.removeAttribute("selected");
      }
    }
  });

  select.addEventListener("change", () => {
    state[valueProperty] = select.value;
  });

  optionElements = setSelectOptions(select, state, optionsProperty, valueProperty);
}

export function hookComboBox(element, state, valueProperty, optionsProperty, unselectedValue=null) {
  let combo = typeof element == "string" ? document.querySelector(element) : element;
  let select = combo.querySelector("select");
  let comboBox = null;

  let optionElements = [];
  state.subscribe(optionsProperty, () => {
    // comboBox.unregister();
    select = combo.querySelector("select");
    optionElements = setSelectOptions(select, state, optionsProperty, valueProperty);
    comboBox.updateOptions(optionElements);
    // comboBox = USAComboBox.create(combo);
  });


  optionElements = setSelectOptions(select, state, optionsProperty, valueProperty);
  comboBox = USAComboBox.create(combo);

  state.subscribe(valueProperty, () => {
    comboBox.setSelectedByValue(state[valueProperty] ? state[valueProperty] : unselectedValue);
  });

  combo.addEventListener("usa-combo-box:selected", () => {
    state[valueProperty] = comboBox.getValue();
  });
  combo.addEventListener("usa-combo-box:unselected", () => {
    state[valueProperty] = comboBox.getValue();
  });

  return comboBox;
}

export function hookCheckboxList(element, state, valueProperty, optionsProperty) {

  state.subscribe(optionsProperty, () => {
    element.innerHTML = '';

    let options = [];
    if (Array.isArray(state[optionsProperty])) {
      options = state[optionsProperty].map((d) =>
        typeof d == "string" ? { label: d, value: d } : d
      );
    }

    options.forEach((option, i) => {
      const checkboxWrapper = document.createElement("div");
      checkboxWrapper.classList.add("usa-checkbox");

      const inputElement = document.createElement("input");
      inputElement.setAttribute("type", "checkbox");
      inputElement.className = "usa-checkbox__input";
      inputElement.setAttribute("id", `check-${valueProperty}-${i}`);
      inputElement.setAttribute("name", `check-${valueProperty}-${i}`);
      if ((!state[valueProperty]) || state[valueProperty].has(option.value)) {
        inputElement.setAttribute("checked", "");
      }
      inputElement.addEventListener("click", () => {
        let checkedSet = state[valueProperty];
        if (!checkedSet) {
          checkedSet = new Set(options.map(d => d.value));
        }
        if (inputElement.checked) {
          checkedSet.add(option.value);
        } else {
          checkedSet.delete(option.value);
        }
        // If all options are checked, set to a null value.
        if (checkedSet.size == options.length) {
          checkedSet = null;
        }
        state[valueProperty] = checkedSet;
      });
      checkboxWrapper.appendChild(inputElement);

      const labelElement = document.createElement("label");
      labelElement.className = "usa-checkbox__label";
      labelElement.setAttribute("for", `check-${valueProperty}-${i}`);
      labelElement.innerText = option.label;
      checkboxWrapper.appendChild(labelElement);

      element.appendChild(checkboxWrapper);
    });
  });

  state.trigger(optionsProperty);
}

export function hookCheckbox(selector, state, valueProperty) {
  const check = document.querySelector(selector);
  if (check == null) {
    throw new Error(`No element found for ${selector}`);
  }

  function setEnabled(enabled) {
    if (enabled) {
      check.setAttribute("checked", "");
    } else {
      check.removeAttribute("checked");
    }
  }

  state.subscribe(valueProperty, () => setEnabled(state[valueProperty]));
  check.addEventListener("click", () => (state[valueProperty] = check.checked));

  setEnabled(state[valueProperty]);
}

// =====================================================================================================================

export function createDropdown(container, button, actions) {
  const dropdown = document.createElement("div");
  dropdown.className = "bg-white padding-y-1 border radius-sm shadow-2";
  
  const dropdownContent = document.createElement("ul");
  dropdownContent.className = "dropdown-menu";
  dropdown.appendChild(dropdownContent);


  for (const action of actions) {
    const dropdownItem = document.createElement("li");
    dropdownItem.className = "dropdown-item";
    dropdownItem.innerText = action.label;
    dropdownContent.appendChild(dropdownItem);

    dropdownItem.addEventListener("click", () => {
      tooltip.hide();
      action.action()
    });

    if (action.separatorAfter) {
      const seperator = document.createElement("div");
      seperator.className = "border-bottom width-full border-gray-10 margin-y-1";
      dropdownContent.appendChild(seperator);
    }
  }

  const tooltip = addPopperTooltip(container);
  let tooltipShown = false;

  button.addEventListener("click", (e) => {
    e.stopPropagation();
    if (tooltipShown) {
      tooltip.hide();
    } else {
      tooltip.show(button, dropdown);
    }
    tooltipShown = !tooltipShown;
  });

  document.addEventListener("click", e => {
    if (!dropdown.contains(e.target) && e.target != button) {
      tooltipShown = false;
      tooltip.hide();
    }
  });

  const mutationObserver = new MutationObserver((mutations, observer) => {
    for (const mutation of mutations) {
      if (mutation.type == "childList") {
        for (const removedNode of mutation.removedNodes) {
          if (removedNode == button || removedNode.contains(button)) {
            tooltip.hide();
          }
        }
      }
    }
  });
  mutationObserver.observe(container, { childList: true, subtree: true });

  // tooltip.show(button, dropdown)
}

export function addPopperTooltip(element) {
  const tooltipElement = document.createElement("div");
  tooltipElement.classList.add("custom-tooltip");
  element.appendChild(tooltipElement);

  let popper = null;
  function show(targetElement, html) {
    if (popper) popper.destroy();
    popper = Popper.createPopper(targetElement, tooltipElement, {
      placement: "bottom-end",
      modifiers: [
        {
          name: "offset",
          options: {
            offset: [10, 10],
          },
        },
        {
          name: "preventOverflow",
          options: {
            boundary: element,
          },
        },
      ],
    });

    if (html instanceof Element) {
      tooltipElement.innerHTML = ``;
      tooltipElement.appendChild(html);
    } else {
      tooltipElement.innerHTML = html;
    }

    tooltipElement.style.display = "block";
  }

  function hide() {
    tooltipElement.style.display = "none";
  }

  function remove() {
    tooltipElement.remove();
  }

  return { show, hide, remove, tooltipElement };
}

export function minorPopup(container, button, content, title) {
  const popupTemplate = /*html*/ `
  <div class="display-flex flex-justify text-base-darker">
    <div class="font-serif-sm text-bold">${title}</div>
    <div class="popup-buttons margin-left-2 font-sans-md top-neg-05 position-relative">
      <i class="fas fa-times clickable-button"></i>
    </div>
  </div>
  <div class="popup-content padding-1">
`;

  const tooltip = addPopperTooltip(container);

  let popup = document.createElement("div");
  popup.className = "popup-minor bg-white padding-1 border radius-sm shadow-2";
  popup.innerHTML = popupTemplate;

  const popupContent = popup.querySelector(".popup-content");
  popupContent.innerHTML = "";
  popupContent.appendChild(content);

  let tooltipShown = false;
  popup.querySelector(".popup-buttons .fa-times").addEventListener("click", () => {
    tooltipShown = false;
    tooltip.hide();
  })

  button.addEventListener("click", () => {
    // content.style.display = "flex";
    if (tooltipShown) {
      tooltip.hide();
    } else {
      tooltip.show(button, popup);
    }
    tooltipShown = !tooltipShown;
  });

  document.addEventListener("click", e => {
    if (!popup.contains(e.target) && e.target != button) {
      tooltipShown = false;
      tooltip.hide();
    }
  })
}

export function initializePopup() {
  const popupElement = document.getElementById("popup");
  const titleElement = popupElement.querySelector("#popup-title");
  const contentContainerElement = popupElement.querySelector("#popup-content-container");
  const popupBodyElement = popupElement.querySelector("#popup-body");

  function open(content, title) {
    popupElement.classList.remove("display-none");
    popupElement.classList.add("display-flex");
    titleElement.innerText = title;
    contentContainerElement.replaceChildren(content);
  }

  function close() {
    popupElement.classList.add("display-none");
    popupElement.classList.remove("display-flex");
  }

  popupElement.addEventListener("click", (e) => {
    if (!popupBodyElement.contains(e.target)) {
      close();
    }
  });
  popupElement.querySelector("#popup-close").addEventListener("click", () => close());

  return { open, close };
}

export function popup(popupContent, title) {
  if (typeof popupContent == "string") {
    popupContent = document.querySelector(popupContent);
  }

  const popupElement = document.getElementById("popup");
  popupElement.classList.remove("display-none");
  popupElement.classList.add("display-flex");

  popupElement.querySelector("#popup-title").innerText = title;

  const contentContainer = popupElement.querySelector("#popup-content-container");
  contentContainer.replaceChildren(popupContent);

  function close() {
    popupElement.classList.add("display-none");
    popupElement.classList.remove("display-flex");
  }

  const popupBody = popupElement.querySelector("#popup-body");
  popupElement.addEventListener("click", (e) => {
    if (!popupBody.contains(e.target)) {
      close();
    }
  });

  popupElement.querySelector("#popup-table-close").addEventListener("click", () => close());
}

export function approximateTextBBox(text, rotation=-Math.PI/4) {
  const BASE_SIZE = 10;
  const CHAR_SIZE = 8;

  if (typeof text != "string") {
    text = String(text);
  }

  // Very crude, assuming a fixed text size - other problems too.
  const size = BASE_SIZE + CHAR_SIZE * text.length;
  return [
    Math.abs(Math.cos(rotation)*size), 
    Math.abs(Math.sin(rotation)*size)
  ];
}

export function swatchColorLegend(options) {
  let {
    domain, range, tickFormat = d => d, symbolRange
  } = options;

  if (!symbolRange) {
    symbolRange = domain.map(() => "circle");
  }

  const legendContainer = document.createElement("div");
  legendContainer.style.display = "flex";
  legendContainer.style.gap = "15px";
  legendContainer.style.height = "30px";

  const symbolGenerator = d3.symbol();
  for (let i = 0; i < domain.length; i++) {
    const swatch = document.createElement("div");
    swatch.style.display = "flex";
    swatch.style.justifyContent = "center";
    swatch.style.alignItems = "center";
    swatch.style.gap = "2px";

    const symbolContainer = document.createElementNS("http://www.w3.org/2000/svg", "svg"); // Use namespace for SVG
    const symbolSelect = d3.select(symbolContainer);
    symbolSelect.attr("viewBox", "0 0 30 30")
      .attr("width", 30)
      .attr("height", 30)

    const symbolType = d3["symbol" + symbolRange[i]];

    symbolSelect.append("path")
      .attr("d", symbolGenerator.type(symbolType).size(150)())
      .attr("fill", range[i])
      .attr("transform", `translate(${15}, ${15})`);

    const label = document.createElement("span");
    label.innerText = tickFormat(domain[i]);

    swatch.appendChild(symbolContainer);
    swatch.appendChild(label);

    legendContainer.appendChild(swatch);
  }

  return legendContainer;
}

export function addProximityHover(elementsSelect, plotSelect, listener, minDistance = 30) {
  let delauney = null
  let points = []
  let plotRect = null
  const observer = new ResizeObserver(() => {
    plotRect = plotSelect.node().getBoundingClientRect()
    points = []
    elementsSelect.each((_, i, nodes) => {
      const elemRect = nodes[i].getBoundingClientRect()
      const centroid = [elemRect.x + elemRect.width / 2, elemRect.y + elemRect.height / 2]
      const relCentroid = [centroid[0] - plotRect.x, centroid[1] - plotRect.y]
      points.push(relCentroid)
    })
    delauney = d3.Delaunay.from(points, d => d[0], d => d[1])
  })
  observer.observe(plotSelect.node())

  const distSqr = minDistance ** 2

  let previousHover = null

  plotSelect.on("mousemove.interact", (e, d) => {
    const mousePoint = [e.offsetX, e.offsetY]

    const pointIndex = delauney.find(mousePoint[0], mousePoint[1])
    const point = points[pointIndex]

    if (minDistance != null && point) {
      const distance = (mousePoint[0] - point[0]) ** 2 + (mousePoint[1] - point[1]) ** 2

      let newHover = distance < distSqr ? pointIndex : null
      if (newHover != previousHover) {
        listener(newHover, elementsSelect.nodes()[newHover], previousHover, elementsSelect.nodes()[previousHover])
        previousHover = newHover
      }
    }
  })
}


export function plotDataTable(data, container, options = {}) {
  const {
    order = [],
    colDefinitions = new Map(),
    columns = [],
  } = options

  const tableColumns = columns.map(d => ({...d}));
  for (const column of tableColumns) {
    if (column.formatAs) {
      column.title = formatName(column.formatAs, column.field, column.formatMode);
    }
    delete column.formatAs;
    delete column.formatMode;
  }

  tableColumns.forEach(col => {
    if (!col.title) col.title = col.field
  })

  const table = document.createElement("div")
  table.style.height = "100%"
  table.style.width = "100%"
  container.innerHTML = ``;
  container.appendChild(table);

  const tabulator = new Tabulator(table, {
    data,
    columns: tableColumns,
    // layout: "fitDataFill",
  })

}



export function downloadRowData(data, filename, format) {
  let str = null;
  if (format == "csv") {
    str = d3.csvFormat(data);
  } else if (format == "tsv") {
    str = d3.tsvFormat(data);
  } else {
    str = JSON.stringify(data, null, 2);
  }
  downloadStringAsFile(str, filename + "." + format, "text/" + format);
}

export function downloadStringAsFile(content, filename, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.target = "_blank";
  a.click();
  window.URL.revokeObjectURL(url);
}

export async function downloadElementAsImage(element, filename, format = "png") {
  const scale = 3;
  // const scale = 1.0;


  const dataUrl = await domToPng(element, { scale });
  // element.style.transform = 'scale(' + scale + ')'

  const result = await fetch(dataUrl);
  const blob = await result.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${format}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function round(number, dp) {
  return parseFloat(number.toFixed(dp));
}

const tippyMap = new Map();
export function addTippys(parentElement) {

  let elements = []
  if (parentElement) {
    elements = parentElement.querySelectorAll('[tip]');
  } else {
    elements = document.querySelectorAll('[tip]');
  }


  for (const element of elements) {
    if (!element.hasAttribute("tippy")) {
      const instance = tippy(element, {
        content: element.getAttribute("tip"),
        animation: "scale",
        theme: "dark",
        placement: "left",
      })
      element.setAttribute("tippy", "");
      let id = element.getAttribute("id");
      tippyMap.set(id, instance);
      for (const className of element.classList) {
        let arr = tippyMap.get(className);
        if (!arr) {
          arr = [];
          tippyMap.set(className, arr);
        }
        arr.push(instance);
      }
    }
  }

  return tippyMap;
}

export function getContentHeight(element) {
  const styles = window.getComputedStyle(element);
  const contentHeight = element.clientHeight - parseFloat(styles.paddingTop) - parseFloat(styles.paddingBottom);
  return contentHeight;
}


export function colorRampLegendPivot(colorConfig, options = {}) {
  const { scheme, domain, pivot, reverse } = colorConfig;
  const { label = null, size, outlierColors } = options;

  let tickFormat =  numberFormat;
  if (options.tickFormat) tickFormat = options.tickFormat;

  let colorDomain = [...domain];
  if (pivot) {
    const maxSide = Math.max(pivot - colorDomain[0], colorDomain[1] - pivot);
    colorDomain = [pivot - maxSide, pivot + maxSide];
  }

  const colorScale = d3
    .scaleSequential(d3["interpolate" + scheme])
    .domain(reverse ? [colorDomain[1], colorDomain[0]] : colorDomain);

  let  ticks = pivot ? [domain[0], pivot, domain[1]] : domain;

  return colorRampLegend(
    colorScale,
    domain,
    label,
    ticks,
    size,
    outlierColors,
    tickFormat,
  );
}

export function colorRampLegend(
  colorScale,
  valueExtent,
  label = "",
  tickValues = null,
  size = null,
  outlierColors = [],
  tickFormat = d => d,
) {
  const nGrad = 16;
  const margin = 20;

  if (size == null) {
    size = label ? [370 - (outlierColors ? outlierColors.length : 0) * 45, 50] : [370 - outlierColors.length * 45, 30];
  }
  const startY = label ? 20 : 0;

  const svg = d3.create("svg").attr("width", size[0]).attr("height", size[1]);

  // Gradient

  // This is a terrible way to generate a unique ID, but it's unlikely to cause a problem.
  const gradientId = "ramp-gradient-" + Math.floor(Math.random() * 10000000);

  const defs = svg.append("defs");
  const gradient = defs
    .append("linearGradient")
    .attr("id", gradientId)
    .attr("x1", "0%")
    .attr("x2", "100%");

  const pScale = d3.scaleLinear().domain([0, nGrad]).range(valueExtent);

  gradient
    .append("stop")
    .attr("class", "start")
    .attr("offset", `0%`)
    .attr("stop-color", colorScale(valueExtent[0]));

  for (let i = 1; i < nGrad - 1; i++) {
    gradient
      .append("stop")
      .attr("offset", `${(100 * i) / nGrad}%`)
      .attr("stop-color", colorScale(pScale(i)));
  }

  gradient
    .append("stop")
    .attr("class", "end")
    .attr("offset", `100%`)
    .attr("stop-color", colorScale(valueExtent[1]));

  svg
    .append("rect")
    .attr("x", margin)
    .attr("y", startY)
    .attr("width", size[0] - margin * 2)
    .attr("height", size[1] - 19 - startY)
    .attr("fill", `url(#${gradientId})`)

  // Ticks

  const scale = d3
    .scaleLinear()
    .domain(valueExtent)
    .range([0, size[0] - margin * 2]);

  const axis = d3
    .axisBottom(scale)
    .tickSize(size[1] - 15 - startY)
    .tickSizeOuter(0)
    .tickFormat(d => {
      return tickFormat(d)
    });

  if (tickValues != null) {
    axis.tickValues(tickValues);
  } else {
    axis.ticks(5);
  }

  svg
    .append("g")
    .attr("transform", `translate(${margin},${startY})`)
    .style("font-size", 14)
    .style("color", "#424242")
    .style("stroke-width", "1px")
    .call(axis);

  svg.selectAll(".tick").selectAll("line").attr("stroke", "#424242");
  const percent = (tickValues[1] * 100) / (tickValues[2] - tickValues[0]);
  const middleTickValue = Math.trunc(tickValues[1]);

  if (percent < 5) {
    svg
      .selectAll(".tick")
      .selectAll("text")
      .filter(function () {
        const text = +d3.select(this).text().replaceAll(",", "");
        return text >= middleTickValue - 10 && text <= middleTickValue + 10;
      })
      .attr(
        "transform",
        `translate(${Math.trunc(tickValues[0].toString().length * 8)})`
      );
  }

  // Label

  if (label) {
    svg
      .append("g")
      .style("font-family", "sans-serif")
      .style("font-size", 14)
      .append("text")
      .attr("x", margin)
      .attr("y", 15)
      .text(label)
  }

  const legendDiv = document.createElement("div")
  legendDiv.style.display = "flex"
  legendDiv.style.alignItems = "end"

  if (outlierColors && outlierColors.length > 1) {
    legendDiv.appendChild(outlierLabel(outlierColors[0]))
  }

  legendDiv.appendChild(svg.node())

  if (outlierColors) {
    legendDiv.appendChild(outlierLabel(outlierColors.at(-1)))
  }


  legendDiv.classList.add("color-scale")
  return legendDiv;
}

function outlierLabel(color) {
  const svg = d3.create("svg")
    .attr("width", 58)
    .attr("height", 40)

  var rectWidth = 16
  var rectHeight = 12
  var rectColor = color

  var textLabel = "Extreme";

  svg.append("rect")
    .attr("x", 29 - rectWidth / 2)
    .attr("y", 10)
    .attr("width", rectWidth)
    .attr("height", rectHeight)
    .attr("fill", rectColor)
    .attr("rx", 3)
    .attr("ry", 3)

  svg.append("text")
    .attr("x", 30)
    .attr("y", 37)
    .text(textLabel)
    .attr("fill", "rgb(66, 66, 66)")
    .attr("text-anchor", "middle")
    .style("font-size", 14)
    .style("font-family", "sans-serif")

  return svg.node()
}

export function numberFormat(d) {
  if (d < 1000) {
    return d % 1 ? d3.format(".1f")(d) : d3.format(".0f")(d)
  } else {
    return d3.format(".2s")(d)
  }
}

export function scaleGradient(colorScale, nStops = 5, width = 140, height = 10) {
  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height)

  // This is a terrible way to generate a unique ID, but it's unlikely to cause a problem.
  const gradientId = "ramp-gradient-" + Math.floor(Math.random() * 10000000)

  const defs = svg.append("defs")
  const gradient = defs.append("linearGradient")
    .attr("id", gradientId)
    .attr("x1", "0%")
    .attr("x2", "100%")

  gradient.append("stop")
    .attr("class", "start")
    .attr("offset", `0%`)
    .attr("stop-color", colorScale(0))

  for (let i = 1; i < nStops + 1; i++) {
    gradient.append("stop")
      .attr("offset", `${100 * i / nStops}%`)
      .attr("stop-color", colorScale(i / nStops))
  }

  const margin = 10
  svg.append("rect")
    .attr("x", margin)
    .attr("y", 0)
    .attr("width", width - margin * 2)
    .attr("height", height)
    .attr("fill", `url(#${gradientId})`)

  return svg.node()
}

export function makeSvgZoomable(svgSelector, groupSelector) {
  const group = d3.selectAll(groupSelector);

  function handleZoom(e) {
    group.attr('transform', e.transform);
  }

  let zoom = d3.zoom()
    .scaleExtent([0.25, 10])
    .on('zoom', handleZoom);

  d3.select(svgSelector).call(zoom);
}
