import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";
import * as Popper from "https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.8/+esm";

export function dataToTableData(data) {
  const keys = Object.keys(data[0]);
  const array = [];
  for (const row of data) {
    array.push(keys.map((key) => row[key]));
  }

  return { headings: keys, data: array };
}

export function addProximityHover(
  elementsSelect,
  plotSelect,
  listener,
  minDistance = 30
) {
  const plotRect = plotSelect.node().getBoundingClientRect();

  const points = [];
  elementsSelect.each((_, i, nodes) => {
    const elemRect = nodes[i].getBoundingClientRect();
    const centroid = [
      elemRect.x + elemRect.width / 2,
      elemRect.y + elemRect.height / 2,
    ];
    const relCentroid = [centroid[0] - plotRect.x, centroid[1] - plotRect.y];
    points.push(relCentroid);
  });

  const delauney = d3.Delaunay.from(
    points,
    (d) => d[0],
    (d) => d[1]
  );
  const distSqr = minDistance ** 2;

  let previousHover = null;

  plotSelect.on("mousemove.interact", (e, d) => {
    // To account for elements rescaled by CSS
    const domPoint = new DOMPointReadOnly(e.clientX, e.clientY);
    const pt = domPoint.matrixTransform(
      plotSelect.node().getScreenCTM().inverse()
    );
    const mousePoint = [pt.x, pt.y];

    const index = delauney.find(mousePoint[0], mousePoint[1]);
    const point = points[index];

    if (minDistance != null) {
      const distance =
        (mousePoint[0] - point[0]) ** 2 + (mousePoint[1] - point[1]) ** 2;
      if (distance < distSqr) {
        if (index != previousHover) {
          const elem = elementsSelect.nodes()[index];
          listener(index, elem, elementsSelect.nodes()[previousHover]);
          previousHover = index;
        }
      } else {
        if (previousHover != null) {
          listener(null, null, elementsSelect.nodes()[previousHover]);
          previousHover = null;
        }
      }
    }
  });
}

export function createOptionSorter(forceStart = [], forceEnd = []) {
  const forceStartSet = new Set(forceStart);
  const forceEndSet = new Set(forceEnd);

  return (a, b) => {
    if (forceStartSet.has(a.label) || forceEndSet.has(b.label)) {
      return -1;
    } else if (forceEndSet.has(a.label) || forceStartSet.has(b.label)) {
      return 1;
    } else {
      return a.label.localeCompare(b.label);
    }
  };
}

// export const createGroupingOptionSorter = (forceStart=[], forceEnd=[]) => {
//   const forceStartSet = new Set(forceStart)
//   const forceEndSet = new Set(forceEnd)

//   return (a,b) => {
//     if (forceStartSet.has(a.label) || forceEndSet.has(b.label) || a.customProperties.active || !b.customProperties.active) {
//       return -1
//     } else if (forceEndSet.has(a.label)  || forceStartSet.has(b.label) || a.customProperties.active || !b.customProperties.active) {
//       return 1
//     } else {
//       return a.label.localeCompare(b.label)
//     }
//   }
// }

export function replaceSelectsWithChoices(opts = {}) {
  opts = {
    searchable: [],
    ...opts,
  };
}

export function addPopperTooltip(element) {
  const tooltipElement = document.createElement("div");
  tooltipElement.classList.add("custom-tooltip");
  element.appendChild(tooltipElement);

  let popper = null;
  function show(targetElement, html) {
    if (popper) popper.destroy();
    popper = Popper.createPopper(targetElement, tooltipElement, {
      placement: "top-start",
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

  return { show, hide };
}

export function addTooltip(svgSelect, elementSelect = null) {
  const mouseOffset = [10, 10];

  const style = `
        .svg-tooltip {
        background-color: rgba(255, 255, 255, 0.7);
        position: absolute;
        transform: translate(178px, 410.19px);
        border-style: solid;
        border-color: black;
        border-width: 1px;
        border-radius: 2px;
        font-family: sans-serif;
        font-size: 10px;
        padding: 8px;
        visibility: hidden;
        max-width: 150px;
    }`;

  svgSelect.append("style").text(style);

  const foreignObject = svgSelect
    .append("foreignObject")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("pointer-events", "none");

  const tooltip = foreignObject
    .append("xhtml:div")
    .attr("class", "svg-tooltip");

  function show(text, x, y) {
    let posX = x + mouseOffset[0];
    let posY = y + mouseOffset[1];

    tooltip.html(text);
    tooltip.style("visibility", "visible");

    const svgBox = svgSelect.node().getBBox();
    const tooltipBox = tooltip.node().getBoundingClientRect();

    if (posX > svgBox.width - tooltipBox.width) {
      posX = x - tooltipBox.width - mouseOffset[0];
    }
    if (posY > svgBox.height - tooltipBox.height) {
      posY = y - tooltipBox.height - mouseOffset[1];
    }

    tooltip.style("transform", `translate(${posX}px,${posY}px)`);
  }

  function hide() {
    tooltip.style("visibility", "hidden");
  }

  if (elementSelect != null) {
    elementSelect
      .on("mouseover", (e) => {
        const title = d3.select(e.target).select("title").text();
        const bbox = e.target.getBBox();
        const centroid = [bbox.x + bbox.width / 2, bbox.y + bbox.height / 2];
        show(title, centroid[0], centroid[1]);
      })
      .on("mouseleave", () => hide());
  }

  return { show, hide };
}

export function showTable(checkboxId, tableId) {
  let checkbox = document.getElementById(checkboxId);
  checkbox.addEventListener("change", (event) => {
    const isChecked = event.target.checked;
    const tableWrapper = document.querySelector(`#${tableId}`);
    if (tableWrapper) {
      tableWrapper.style.display = isChecked ? "block" : "none";
    }
  });
}

export function changeGraphType(types = [], callback) {
  types.forEach((type) => {
    let typeRadioElement = document.getElementById(`${type}-graph`);
    typeRadioElement.addEventListener("change", () => callback(type));
  });
}

export function formatCauseName(causeName) {
  const nonSiteCancers = new Set([
    "Lymphocytic Leukemia",
    "Myeloid and Monocytic Leukemia",
    "Melanoma of the Skin",
    "Myeloma",
  ]);

  const special = new Map([
    ["Non-Melanoma Skin", "Non-Melanoma Skin Cancer"],
    ["All", "All Cancers"],
    ["Other", "Other Cancers"], // Add asterix or tooltip or something for this one.
  ]);

  if (nonSiteCancers.has(causeName)) return causeName;
  if (special.has(causeName)) return special.get(causeName);

  return causeName + " Cancer";
}

export function colorRampLegend(
  colorScale,
  valueExtent,
  label = "",
  tickValues = null,
  size = null
) {
  const nGrad = 16;
  const margin = 30;

  if (size == null) {
    size = label ? [400, 60] : [400, 40];
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
    .attr("height", size[1] - 23 - startY)
    .attr("fill", `url(#${gradientId})`);

  // Ticks

  const scale = d3
    .scaleLinear()
    .domain(valueExtent)
    .range([0, size[0] - margin * 2]);

  const axis = d3
    .axisBottom(scale)
    .tickSize(size[1] - 15 - startY)
    .tickSizeOuter(0);

  if (tickValues != null) {
    axis.tickValues(tickValues);
  } else {
    axis.ticks(5);
  }

  svg
    .append("g")
    .attr("transform", `translate(${margin},${startY})`)
    .style("font-size", 13)
    .style("color", "#424242")
    .style("stroke-width", "1px")
    .call(axis);

  svg.selectAll(".tick").selectAll("line").attr("stroke", "#424242");

  // Label

  if (label) {
    svg
      .append("g")
      .style("font-family", "sans-serif")
      .style("font-size", "12px")
      .append("text")
      .attr("x", margin)
      .attr("y", 15)
      .text(label);
  }

  return svg.node();
}

export function colorRampLegendMeanDiverge(
  values,
  schemeName,
  label = null,
  size = null,
  reverse = false
) {
  if (!values.length) return;

  const mean = d3.mean(values);
  const extent = d3.extent(values);
  const maxSide = Math.max(mean - extent[0], extent[1] - mean);

  const colorScale = d3
    .scaleSequential(d3["interpolate" + schemeName])
    .domain(
      reverse
        ? [mean + maxSide, mean - maxSide]
        : [mean - maxSide, mean + maxSide]
    );

  return colorRampLegend(
    colorScale,
    extent,
    label,
    [extent[0], mean, extent[1]],
    size
  );
}

const reSizePlots = (id, large, scale = 1.5) => {
  // const element = document.getElementById(id)
  // const svgElements = element.querySelectorAll('svg')
  // svgElements.forEach(svg => {
  //     const { clientWidth: width, clientHeight: height } = svg
  //     if (large) {
  //         svg.setAttribute("height", `${height * scale}px`);
  //         svg.setAttribute("width", `${width * scale}px`);
  //     } else {
  //         svg.setAttribute("height", `${height / scale}px`);
  //         svg.setAttribute("width", `${width / scale}px`);
  //     }
  // })
};

// export function initSidebar() {
//   const button = document.getElementById('sidebar-toggle');
//   if (!button) return;

//   button.addEventListener('click', () => {
//     const child = Array.from(button.childNodes)[1];
//     if (child.classList.contains('fa-caret-left')) {
//       // reSizePlots(graphId, true);
//       child.classList.remove('fa-caret-left');
//       child.classList.add('fa-caret-right');
//       document.getElementById('sidebar').classList.remove('col-xl-2');
//       document.getElementById('sidebar').classList.add('d-none');
//       document.getElementById('main-content').classList.remove('col-xl-10');
//       document.getElementById('main-content').classList.add('col-xl-12');
//     }
//     else {
//       // reSizePlots(graphId, false);
//       child.classList.remove('fa-caret-right');
//       child.classList.add('fa-caret-left');
//       document.getElementById('sidebar').classList.add('col-xl-2');
//       document.getElementById('sidebar').classList.remove('d-none');
//       document.getElementById('main-content').classList.add('col-xl-10');
//       document.getElementById('main-content').classList.remove('col-xl-12');
//     }
//   })
// }

export function initSidebar() {
  // TODO: Remove 'ex' prefixes.
  const button = document.getElementById("sidebar-toggle");
  const sidebar = document.getElementById("sidebar");

  button.addEventListener("click", () => {
    console.log("Hide sidebar");
    if (sidebar.classList.contains("sidebar-hidden")) {
      sidebar.classList.remove("sidebar-hidden");
    } else {
      sidebar.classList.add("sidebar-hidden");
    }
  });
}

export function sortCompare(a, b, key) {
  const nameA = key ? a[key] : a;
  const nameB = key ? b[key] : b;

  if (nameA === "All" || nameB === "All") return 1;

  if (nameA < nameB) {
    return -1;
  }
  if (nameA > nameB) {
    return 1;
  }

  // names must be equal
  return 0;
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

export function getDictionaryWord(state, word, sub = null) {
  if (sub == null) {
    for (const key of Object.keys(state.dictionary)) {
      if (state.dictionary[key][word]) {
        return state.dictionary[key][word];
      }
    }
  } else {
    if (state.dictionary[sub][word]) {
      return state.dictionary[sub][word];
    }
  }

  return word;
}

export function capitalizeFirstWord(str) {
  const [firstWord, ...otherWords] = str.split(" ");
  const capitalizedWord =
    firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();

  return [capitalizedWord, ...otherWords].join(" ");
}

export function createDropdownDownloadButton(
  compact = true,
  downloadOptions = []
) {
  const wrapper = document.createElement("div");
  wrapper.className = "dropdown d-flex justify-content-end";

  const button = document.createElement("button");
  wrapper.appendChild(button);
  button.className = `btn btn-outline-secondary dropdown-toggle`;
  if (compact) {
    button.classList.add("btn-sm");
  }
  button.setAttribute("data-bs-toggle", "dropdown");
  button.setAttribute("aria-expanded", false);

  if (!compact) {
    const downloadText = document.createElement("span");
    button.appendChild(downloadText);
    downloadText.className = "me-1";
    downloadText.innerHTML = "Download";
  }

  const downloadIcon = document.createElement("span");
  button.appendChild(downloadIcon);
  downloadIcon.className = "download-icon";

  const downloadIconContent = document.createElement("i");
  downloadIcon.appendChild(downloadIconContent);
  downloadIconContent.className = "fas fa-download";
  downloadIconContent.style.setProperty(
    "color",
    "var(--bs-btn-color)",
    "important"
  );

  const downloadSpinner = document.createElement("span");
  downloadSpinner.className = "spinner-border spinner-border-sm";
  downloadSpinner.style.display = "none";
  downloadIcon.appendChild(downloadSpinner);

  const dropdownMenu = document.createElement("ul");
  wrapper.appendChild(dropdownMenu);
  dropdownMenu.className = "dropdown-menu dropdown-menu-end";

  for (const downloadOption of downloadOptions) {
    const downloadItem = document.createElement("li");
    const downloadLink = document.createElement("a");
    downloadItem.appendChild(downloadLink);
    downloadLink.className = "dropdown-item download-item";
    downloadLink.innerText = downloadOption.label;
    downloadLink.addEventListener("click", () => {
      setDropdownDownloadButtonLoading(wrapper, true);
      const result = downloadOption.listener();
      if (result instanceof Promise) {
        result.then(() => {
          setDropdownDownloadButtonLoading(wrapper, false);
        });
      } else {
        setDropdownDownloadButtonLoading(wrapper, false);
      }
    });
    dropdownMenu.appendChild(downloadLink);
  }

  return wrapper;
}

export function setDropdownDownloadButtonLoading(element, loading = true) {
  const downloadIcon = element.querySelector(".fa-download");
  const downloadSpinner = element.querySelector(".spinner-border");
  if (loading) {
    downloadIcon.style.display = "none";
    downloadSpinner.style.display = "inline-block";
  } else {
    downloadIcon.style.display = "inline-block";
    downloadSpinner.style.display = "none";
  }
}

export function downloadMortalityData(mortalityData, filename, format) {
  const data = mortalityData; //prepareMortalityDataForDownload(mortalityData)
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

export function deepMerge(obj1, obj2) {
  const result = Array.isArray(obj1) ? [...obj1] : { ...obj1 };

  for (const key in obj2) {
    if (obj2.hasOwnProperty(key)) {
      if (
        typeof obj2[key] === "object" &&
        obj1[key] &&
        typeof obj1[key] === "object"
      ) {
        result[key] = deepMerge(obj1[key], obj2[key]);
      } else {
        result[key] = obj2[key];
      }
    }
  }

  return result;
}

export function formatName(names, field, value, mode = "half_short") {
  const valueNames = names[field];
  if (!valueNames) return value;
  let name = valueNames[value];
  if (typeof name == "object") name = name[mode];
  return name ? name : value;
}
