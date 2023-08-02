//Changes required regarding dictionary
import { addEventFilterBarToggle } from "../event.js";
import {
  hideAnimation,
  shortenText,
  tsv2Json,
  json2other,
} from "./../shared.js";
import {
  addEventToggleCollapsePanelBtn,
  pageSizeTemplate,
  dataPagination,
  paginationTemplate,
} from "./description.js";
import {downloadFiles} from '../utils/download.js'

let previousValue = "";

export const dataDictionaryTemplate = async () => {
  const data = await (await fetch("./BCRP_DataDictionary.txt")).text();
  const tsvData = tsv2Json(data);
  const dictionary = tsvData.data;
  const headers = tsvData.headers;

  let template = `
    <div class="col-xl-2 filter-column" id="summaryFilterSiderBar">
        <div class="div-border white-bg align-left p-2">
            <div class="main-summary-row">
                <div class="col-xl-12 pl-1 pr-0">
                    <span class="font-size-17 font-bold">Filter</span>
                    <div id="filterDataDictionary" class="align-left"></div>
                </div>
            </div>
        </div>
    </div>
    <div class="col-xl-10 padding-right-zero" id="summaryStatsCharts">
        <button id="filterBarToggle"><i class="fas fa-lg fa-caret-left"></i></button>
        <div class="main-summary-row pl-2" style="min-height: 10px;margin-bottom: 1rem;">
            <div class="col white-bg div-border align-left font-size-17" style="padding: 0.5rem;" id="listFilters">
                <span class="font-bold">Categories:</span> All
            </div>
        </div>
        <div class="main-summary-row pl-2">
            <div class="col-xl-12 pb-2 pr-0 pl-0 white-bg div-border">
                <div class="allow-overflow" style="height: calc(100vh - 190px) !important;min-height: 500px;" id="dataDictionaryBody"></div>
            </div>
        </div>
    </div>
    `;
  document.getElementById("dataSummaryStatistics").innerHTML = template;
  renderDataDictionaryFilters(dictionary, headers);
  renderDataDictionary(dictionary, 60, headers);
  paginationHandler(dictionary, 60, headers);
  addEventFilterBarToggle();
  hideAnimation();
};

const saveVariables = () => {
  //Get all the checked data variables
  const vars = Array.from(
    document.getElementsByClassName("select-variable-type")
  );
  const varArr = [];
  vars.forEach((v) => {
    if (v.checked) {
      varArr.push(v.id.split("label")[1]);
    }
  });

  localStorage.setItem("dictionaryVars", varArr);
};

const paginationHandler = (data, pageSize, headers) => {
  const dataLength = data.length;
  const pages = Math.ceil(dataLength / pageSize);
  const array = [];

  for (let i = 0; i < pages; i++) {
    array.push(i + 1);
  }
  document.getElementById("pagesContainer").innerHTML =
    paginationTemplate(array);
  addEventPageBtns(pageSize, data, headers);
};

const addEventPageBtns = (pageSize, data, headers) => {
  const elements = document.getElementsByClassName("page-link");
  Array.from(elements).forEach((element) => {
    element.addEventListener("click", () => {
      let previous = parseInt(element.dataset.previous);
      let next = parseInt(element.dataset.next);
      if (previous && !isNaN(previous) && previous === 1)
        previous = document.querySelectorAll("[data-page]").length + 1;
      if (
        next &&
        !isNaN(next) &&
        next === document.querySelectorAll("[data-page]").length
      )
        next = 0;
      const pageNumber = !isNaN(previous)
        ? previous - 1
        : !isNaN(next)
        ? next + 1
        : element.dataset.page;

      if (pageNumber < 1 || pageNumber > Math.ceil(data.length / pageSize))
        return;

      if (!element.classList.contains("active-page")) {
        let start = (pageNumber - 1) * pageSize;
        let end = pageNumber * pageSize;
        document.getElementById("previousPage").dataset.previous = pageNumber;
        document.getElementById("nextPage").dataset.next = pageNumber;
        renderDataDictionary(
          dataPagination(start, end, data),
          document.getElementById("pageSizeSelector").value,
          headers
        );
        Array.from(elements).forEach((ele) =>
          ele.classList.remove("active-page")
        );
        document
          .querySelector(`button[data-page="${pageNumber}"]`)
          .classList.add("active-page");
      }
    });
  });
};

const renderDataDictionaryFilters = (dictionary, headers) => {
  var coreArray = Object.values(dictionary).filter(function (el) {
    return el.Category === "Core";
  });
  var mamArray = Object.values(dictionary).filter(function (el) {
    return el.Category === "Mammographic density";
  });
  var incArray = Object.values(dictionary).filter(function (el) {
    return el.Category === "Incident Breast Cancer ";
  });

  const coreVariableType = coreArray.map((dt) => dt["Sub-Category"]);
  const mamVariableType = mamArray.map((dt) => dt["Sub-Category"]);
  const incVariableType = incArray.map((dt) => dt["Sub-Category"]);
  const coreuniqueType = coreVariableType
    .filter((d, i) => coreVariableType.indexOf(d) === i)
    .sort();
  const mamuniqueType = mamVariableType
    .filter((d, i) => mamVariableType.indexOf(d) === i)
    .sort();
  const incuniqueType = incVariableType
    .filter((d, i) => incVariableType.indexOf(d) === i)
    .sort();

  let template = "";
  template += `
    <div class="main-summary-row">
        <div style="width: 100%;">
            <div class="form-group" margin:0px>
                <div class="input-group">
                    <input type="search" class="form-control rounded" autocomplete="off" placeholder="Search min. 3 characters" aria-label="Search" id="searchDataDictionary" aria-describedby="search-addon" />
                    <span class="input-group-text border-0 search-input">
                        <i class="fas fa-search"></i>
                    </span>
                </div>
            </div>
        </div>
    </div>
    <div class="main-summary-row">
        <div style="width: 100%;">
            <div class="form-group" margin:0px>
                <label class="filter-label font-size-13" for="variableTypeList">Baseline</label>
                <ul class="remove-padding-left font-size-15 allow-overflow" id="variableTypeList">
                `;
  coreuniqueType.forEach((vt) => {
    template += `
                        <li class="filter-list-item">
                            <input type="checkbox" data-variable-type="${vt}" id="label${vt}" class="select-variable-type" style="margin-left: 1px !important;">
                            <label for="label${vt}" class="sub-category" title="${vt}">${shortenText(vt,60)}</label>
                        </li>
                    `;
  });
  template += `
                </ul>

                <label class="filter-label font-size-13" for="variableTypeList">Mammographic density</label>
                <ul class="remove-padding-left font-size-15 allow-overflow" id="variableTypeList">
                `;
  mamuniqueType.forEach((vt) => {
    template += `
                        <li class="filter-list-item">
                            <input type="checkbox" data-variable-type="${vt}" id="label${vt}" class="select-variable-type" style="margin-left: 1px !important;">
                            <label for="label${vt}" class="sub-category" title="${vt}">${shortenText(vt,60)}</label>
                        </li>
                    `;
  });
  template += `
                </ul>

                <label class="filter-label font-size-13" for="variableTypeList">Incident Breast Cancer</label>
                <ul class="remove-padding-left font-size-15 allow-overflow" id="variableTypeList">
                `;
  incuniqueType.forEach((vt) => {
    template += `
                        <li class="filter-list-item">
                            <input type="checkbox" data-variable-type="${vt}" id="label${vt}" class="select-variable-type" style="margin-left: 1px !important;">
                            <label for="label${vt}" class="sub-category" title="${vt}">${shortenText(vt,60)}</label>
                        </li>
                    `;
  });
  template += `
                </ul>

            </div>
        </div>
    </div>
    `;
  document.getElementById("filterDataDictionary").innerHTML = template;
  addEventFilterDataDictionary(dictionary, headers);
  // downloadFiles(dictionary, headers, "dictionary");
  document.getElementById("pageSizeContainer").innerHTML = pageSizeTemplate(
    dictionary,
    60
  );
  addEventPageSizeSelection(dictionary, headers);
};

const addEventPageSizeSelection = (data, headers) => {
  const select = document.getElementById("pageSizeSelector");
  select.addEventListener("change", () => {
    const value = select.value;
    renderDataDictionary(data, value, headers);
    paginationHandler(data, value, headers);
  });
};

const addEventFilterDataDictionary = (dictionary, headers) => {
  const variableTypeSelection = document.getElementsByClassName(
    "select-variable-type"
  );
  Array.from(variableTypeSelection).forEach((ele) => {
    ele.addEventListener("click", () => {
      filterDataBasedOnSelection(dictionary, headers);
    });
  });

  const input = document.getElementById("searchDataDictionary");
  input.addEventListener("input", () => {
    filterDataBasedOnSelection(dictionary, headers);
  });
};

const filterDataBasedOnSelection = (dictionary, headers) => {
  const highlightData = filterDataHandler(dictionary);
  renderDataDictionary(
    highlightData,
    document.getElementById("pageSizeSelector").value,
    headers
  );
  const pageSize =
    highlightData.length < 60
      ? Math.floor(highlightData.length / 10) * 10 === 0
        ? 10
        : Math.floor(highlightData.length / 10) * 10
      : 60;
  paginationHandler(highlightData, pageSize);
  document.getElementById("pageSizeContainer").innerHTML = pageSizeTemplate(
    highlightData,
    pageSize
  );
  addEventPageSizeSelection(highlightData);
};

const filterDataHandler = (dictionary) => {
  const variableTypeSelection = Array.from(
    document.getElementsByClassName("select-variable-type")
  )
    .filter((dt) => dt.checked)
    .map((dt) => dt.dataset.variableType);

  let filteredData = dictionary;
  if (variableTypeSelection.length > 0) {
    filteredData = filteredData.filter(
      (dt) => variableTypeSelection.indexOf(dt["Sub-Category"]) !== -1
    );
  }
  if (variableTypeSelection.length === 0) filteredData = dictionary;

  document.getElementById("listFilters").innerHTML = `
    ${
      variableTypeSelection.length > 0
        ? `
        <span class="font-bold">Category: </span>${variableTypeSelection[0]} ${
            variableTypeSelection.length > 1
              ? `and <span class="other-variable-count">${
                  variableTypeSelection.length - 1
                } other</span>`
              : ``
          }
    `
        : `
        <span class="font-bold">Category:</span> All`
    }
    `;

  const input = document.getElementById("searchDataDictionary");
  const currentValue = input.value.trim().toLowerCase();
  if (
    currentValue.length <= 2 &&
    (previousValue.length > 2 || previousValue.length === 0)
  ) {
    return filteredData;
  }
  previousValue = currentValue;
  let searchedData = JSON.parse(JSON.stringify(filteredData));
  searchedData = searchedData.filter((dt) => {
    let found = false;
    if (dt["Variable Name"].toLowerCase().includes(currentValue)) found = true;
    if (dt["Label"].toLowerCase().includes(currentValue)) found = true;
    if (found) return dt;
  });
  let highlightData = JSON.parse(JSON.stringify(searchedData));
  highlightData.map((dt) => {
    dt["Variable Name"] = dt["Variable Name"].replace(
      new RegExp(currentValue, "gi"),
      "<b>$&</b>"
    );
    dt["Label"] = dt["Label"].replace(
      new RegExp(currentValue, "gi"),
      "<b>$&</b>"
    );
    return dt;
  });
  return highlightData;
};

const addEventSortColumn = (dictionary, pageSize, headers) => {
  const btns = document.getElementsByClassName("sort-column");
  Array.from(btns).forEach((btn) => {
    btn.addEventListener("click", () => {
      const sortDirection = !btn.classList.contains("sort-column-asc") ? 1 : -1;
      const columnName = btn.dataset.columnName;
      dictionary = dictionary.sort((a, b) =>
        a[columnName] > b[columnName]
          ? 1 * sortDirection
          : b[columnName] > a[columnName]
          ? -1 * sortDirection
          : 0
      );
      btn.classList.remove("sort-column-asc", "sort-column-desc");

      renderDataDictionary(dictionary, pageSize, headers);

      if (sortDirection === 1) {
        document
          .querySelectorAll(`[data-column-name="${columnName}"]`)[0]
          .classList.add("sort-column-asc");
      } else {
        document
          .querySelectorAll(`[data-column-name="${columnName}"]`)[0]
          .classList.add("sort-column-desc");
      }
    });
  });
};

const renderDataDictionary = (dictionary, pageSize, headers) => {
  let template = `
        <div class="row pt-md-3 pb-md-3 m-0 align-left div-sticky">
            <div class="col-md-11">
                <div class="row">
                    <div class="col-md-4 font-bold">Variable <button class="transparent-btn sort-column" data-column-name="Variable Name"><i class="fas fa-sort"></i></button></div>
                    <div class="col-md-5 font-bold">Label <button class="transparent-btn sort-column" data-column-name="Label"><i class="fas fa-sort"></i></button></div>
                    <div class="col-md-3 font-bold">Category <button class="transparent-btn sort-column" data-column-name="Sub-Category"><i class="fas fa-sort"></i></button></div>
                </div>
            </div>
            <div class="ml-auto"></div>
        </div>
        <div class="row m-0 align-left allow-overflow w-100">
        `;
  dictionary.forEach((desc, index) => {
    if (index > pageSize) return;
    template += `
        <div class="card border-0 mt-1 mb-1 align-left w-100 pt-md-1 dictionaryData">
            <div class="pl-3 pt-1 pr-3 pb-1" aria-expanded="false" id="heading${
              desc["Variable Name"]
            }">
                <div class="row">
                    <div class="col-md-11">
                        <div class="row">
                            <div class="col-md-4">${
                              desc["Variable Name"] ? desc["Variable Name"] : ""
                            }</div>
                            <div class="col-md-5">${
                              desc["Label"] ? desc["Label"] : ""
                            }</div>
                            <div class="col-md-3">${
                              desc["Sub-Category"] ? desc["Sub-Category"] : ""
                            }</div>
                        </div>
                    </div>
                    <div class="ml-auto">
                        <div class="col-md-12"><button title="Expand/Collapse" class="transparent-btn collapse-panel-btn" data-toggle="collapse" data-target="#study${desc[
                          "Variable Name"
                        ].replace(
                          /(<b>)|(<\/b>)/g,
                          ""
                        )}"><i class="fas fa-caret-down fa-2x"></i></button></div>
                    </div>
                </div>
            </div>
            <div id="study${desc["Variable Name"].replace(
              /(<b>)|(<\/b>)/g,
              ""
            )}" class="collapse" aria-labelledby="heading${
      desc["Variable Name"]
    }">
                <div class="card-body" style="padding-left: 10px;background-color:#f6f6f6;">
                    <!---${
                      desc["Category"]
                        ? `<div class="row mb-1 m-0"><div class="col-md-2 pl-2 font-bold">Category</div><div class="col">${desc["Category"]}</div></div>`
                        : ``
                    } --->
                    ${
                      desc["Coding"]
                        ? `<div class="row mb-1 m-0"><div class="col-md-2 pl-2 font-bold">Coding</div><div class="col">${desc["Coding"]}</div></div>`
                        : ``
                    }
                    ${
                      desc["Variable Type"]
                        ? `<div class="row mb-1 m-0"><div class="col-md-2 pl-2 font-bold">Variable Type</div><div class="col">${desc["Variable Type"]}</div></div>`
                        : ``
                    }
                `;
    template += `
                </div>
            </div>
        </div>`;
  });
  template += `</div>`;
  document.getElementById("dataDictionaryBody").innerHTML = template;
  addEventToggleCollapsePanelBtn();
  addEventSortColumn(dictionary, pageSize, headers);
};