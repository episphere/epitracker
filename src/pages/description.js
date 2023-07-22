import { addEventFilterBarToggle } from "../event.js";
import {
  defaultPageSize,
  getFile,
  shortenText,
  tsv2Json,
} from "./../shared.js";
import { downloadFiles } from "../utils/download.js";
let previousValue = "";

export const renderDescription = (modified_at) => {
  let template = `
  <div class="main-summary-row">
         <div class="row align-left w-100 m-0">
              <h1 class="col page-header pl-0 pt-2">Cancer Death Rate</h1>
                <div class="ml-auto allow-overflow mr-2" style="margin:1rem 0" id="pagesContainer"></div>
                <div class="ml-auto mt-3 mb-3 mr-2" id="pageSizeContainer"></div>
                <div class="ml-auto mt-3 mb-3" id="downloadContainer">
                    <div class="col-md-12 p-0 dropdown">
                        <div class="grid-elements ">
                            <button title="Download" class="transparent-btn form-control dropdown-toggle dropdown-btn" data-toggle="dropdown" id="downloadDictionary" style="color:#000000 !important">
                                Download Table <i class="fas fa-download" style="color:#000000 !important"></i>
                            </button>
                            <div class="dropdown-menu navbar-dropdown" aria-labelledby="download-table-data">
                                <button class="transparent-btn dropdown-item dropdown-menu-links" title="Download dictionary as csv" id="downloadDictionaryCSV">CSV</button>
                                <button class="transparent-btn dropdown-item dropdown-menu-links" title="Download dictionary as tsv" id="downloadDictionaryTSV">TSV</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="main-summary-row">
            <div class="col-xl-2 filter-column div-border white-bg align-left p-2" id="summaryFilterSiderBar">
                <div class="main-summary-row">
                    <div class="col-xl-12 pl-1 pr-0">
                        <span class="font-size-17 font-bold">Filter</span>
                        <div id="filterDataCatalogue" class="align-left"></div>
                    </div>
                </div>
            </div>
            <div class="col-xl-10 padding-right-zero font-size-16" id="summaryStatsCharts">
                <button id="filterBarToggle"><i class="fas fa-lg fa-caret-left"></i></button>
                <!---<div class="main-summary-row pl-2" style="min-height: 10px;margin-bottom: 1rem;">
                    <div class="col white-bg div-border align-left font-size-17" style="padding: 0.5rem;" id="listFilters">
                        <span class="font-bold">Region:</span> All
                    </div>
                </div>--->
                <div class="main-summary-row pl-2">
                    <div class="col-xl-12 pb-2 pl-0 pr-0 white-bg div-border">
                        <div class="pt-0 pl-2 pb-2 pr-2 allow-overflow" style="height: calc(100vh - 190px) !important;min-height: 500px;" id="descriptionBody"></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="main-summary-row">
            <div class="offset-xl-2 col data-last-modified align-left mt-3 mb-0 pl-4" id="dataLastModified">
                Data last modified at - ${new Date(
                  modified_at
                ).toLocaleString()}
            </div>
        </div>
    `;
  document.getElementById("overview").innerHTML = template;
  getDescription();
};

const getDescription = async () => {
  const data = await (await fetch("./imports/pubPubData.tsv")).text();
  const tsv2json = tsv2Json(data);
  const json = tsv2json.data;
  const headers = tsv2json.headers;
  console.log(json);
  let newJsons = {};
  let prevAcronym = "";
  // json.forEach((obj) => {
  //   if (obj["Cohort name"]) obj["Cohort name"] = obj["Cohort name"].trim();
  //   if (obj["Acronym"]) obj["Acronym"] = obj["Acronym"].trim();
  //   const consortium = obj["Cohort name"] ? obj["Cohort name"] : undefined;
  //   const studyAcronym = obj["Acronym"] ? obj["Acronym"] : undefined;
  //   if (studyAcronym && newJsons[`${consortium}${studyAcronym}`] === undefined)
  //     newJsons[`${consortium}${studyAcronym}`] = {};
  //   if (studyAcronym) {
  //     prevAcronym = `${consortium}${studyAcronym}`;
  //     newJsons[`${consortium}${studyAcronym}`] = obj;
  //   } else {
  //   }
  // });

  // const allCountries = [];
  // Object.values(newJsons).forEach((dt) => {
  //   if (dt["Region"] === undefined) return;
  //   dt["Region"].split(",").forEach((ctr) => {
  //     ctr.split(" and ").forEach((c) => {
  //       if (c.trim()) allCountries.push(c.trim());
  //     });
  //   });
  // });
  const allTitles = Object.values(json).map((dt) => dt["title"]);

  // const countries = allCountries
  //   .filter((d, i) => allCountries.indexOf(d) === i)
  //   .sort();
  const uniqueTitles = allTitles
    .filter((d, i) => d && allTitles.indexOf(d.trim()) === i)
    .sort();

  console.log(uniqueTitles);
  console.log(json.filter((dt) => dt['title'] === uniqueTitles[0]));

  let filterTemplate = `
        <div class="main-summary-row">
            <div style="width: 100%;">
                <div class="form-group" margin:0px>
                    <div id="searchContainer"></div>
                </div>
            </div>
        </div>
        `;
  // filterTemplate += `
  //                   </ul>
  //               </div>
  //           </div>
  //       </div>
  //       <div class="main-summary-row">
  //           <div style="width: 100%;">
  //               <div class="form-group" margin:0px>
  //                   <label class="filter-label font-size-13" for="countriesList">Region</label>
  //                   <ul class="remove-padding-left font-size-15 filter-sub-div allow-overflow" id="countriesList">
  //                       `;
  // countries.forEach((region) => {
  //   filterTemplate += `
  //               <li class="filter-list-item">
  //                   <input type="checkbox" data-country="${region}" id="label${region}" class="select-country" style="margin-left: 1px !important;">
  //                   <label for="label${region}" class="country-name" title="${region}">${shortenText(
  //     region,
  //     15
  //   )}</label>
  //               </li>
  //           `;
  // });
  // filterTemplate += `
  //                   </ul>
  //               </div>
  //           </div>
  //       </div>
  //   `;
  document.getElementById("filterDataCatalogue").innerHTML = filterTemplate;
  // const descriptions = Object.values(json);
  // console.log(descriptions);
  document.getElementById("searchContainer").innerHTML = `
    <div class="input-group">
        <input type="search" class="form-control rounded" autocomplete="off" placeholder="Search min. 3 characters" aria-label="Search" id="searchDataCatalog" aria-describedby="search-addon" />
        <span class="input-group-text border-0 search-input">
            <i class="fas fa-search"></i>
        </span>
    </div>
    `;
  addEventFilterDataCatalogue(json, headers);
  // downloadFiles(json, headers, "study_description", true);
  renderStudyDescription(json, defaultPageSize, headers);
  paginationHandler(json, defaultPageSize, headers);
  document.getElementById("pageSizeContainer").innerHTML = pageSizeTemplate(
    json,
    defaultPageSize
  );
  addEventPageSizeSelection(json, headers);
  addEventFilterBarToggle();
};

const renderStudyDescription = (descriptions, pageSize, headers) => {
  let template = "";
  const allTitles = Object.values(descriptions).map((dt) => dt["title"]);

  // const countries = allCountries
  //   .filter((d, i) => allCountries.indexOf(d) === i)
  //   .sort();
  const uniqueTitles = allTitles
    .filter((d, i) => d && allTitles.indexOf(d.trim()) === i)
    .sort();
  if (descriptions.length > 0) {
    template = `
        <div class="row m-0 pt-2 pb-2 align-left div-sticky" style="border-bottom: 1px solid rgb(0,0,0, 0.1);">
            <div class="col-md-5 font-bold ws-nowrap pl-2">Title of Publication <button class="transparent-btn sort-column" data-column-name="title"><i class="fas fa-sort"></i></button></div>
            <div class="col-md-3 font-bold ws-nowrap">First Author <button class="transparent-btn sort-column" data-column-name="author"><i class="fas fa-sort"></i></button></div>
            <div class="col-md-2 font-bold ws-nowrap">Date <button class="transparent-btn sort-column" data-column-name="date"><i class="fas fa-sort"></i></button></div>
            <div class="col-md-1"></div>
        </div>`;
    uniqueTitles.forEach((title, index) => {
      if (index > pageSize) return;
      var desc = descriptions.filter((dt) => dt['title'] === title);
      //descTitle.forEach(desc => {
        console.log(desc);
        template += `
              <div class="card mt-1 mb-1 align-left">
                  <div style="padding: 10px" aria-expanded="false" id="heading${desc[0]["title"].replace(/\s+/g,"")}">
                      <div class="row">
                          <div class="col-md-5">${
                            desc[0]["title"] ? desc[0]["title"] : ""
                          }</div>
                          <div class="col-md-3">${
                            desc[0]["author"] ? desc[0]["author"] : ""
                          }</div>
                          <div class="col-md-2">${
                            desc[0]["date"] ? desc[0]["date"] : ""
                          }</div>
                          <div class="col-md-1">
                              <button title="Expand/Collapse" class="transparent-btn collapse-panel-btn" data-toggle="collapse" data-target="#study${desc[0]["title"].replace(/\s+/g,"")}">
                                  <i class="fas fa-caret-down fa-2x"></i>
                              </button>
                          </div>
                      </div>
                  </div>
                  <div id="study${desc[0]["title"].replace(/\s+/g,"")}" class="collapse" aria-labelledby="heading${desc[0]["title"]}">
                      <div class="card-body" style="padding-left: 10px;background-color:#f6f6f6;">
                      ${
                        desc[0]["journal_name"]
                          ? `<div class="row mb-1 m-0"><div class="col-md-3 font-bold">Journal</div><div class="col">${desc[0]["journal_name"]}</div></div>`
                          : ``
                      }
                      ${
                        desc[0]["journal_acro"]
                          ? `<div class="row mb-1 m-0"><div class="col-md-3 font-bold">Journal Acronym</div><div class="col">${desc[0]["journal_acro"]}</div></div>`
                          : ``
                      }
                      ${
                        desc[0]["author_first"]
                          ? `<div class="row mb-1 m-0"><div class="col-md-3 font-bold">First Author</div><div class="col">${desc[0]["author"]}</div></div>`
                          : ``
                      }`

                    desc.forEach(desc2 => {
                      template += `
                      <HR>
                      ${
                        desc2["study"]
                          ? `<div class="row mb-1 m-0"><div class="col-md-3 font-bold">Study</div><div class="col">${desc2["study"]}</div></div>`
                          : ``
                      }
                      ${
                        desc2["cas"]
                          ? `<div class="row mb-1 m-0"><div class="col-md-3 font-bold">cas</div><div class="col">${desc2["cas"]}</div></div>`
                          : ``
                      }
                      <div class="row mb-1 m-0"><div class="col-md-3 font-bold">Restrictions</div></div>
                      ${
                        desc2["nores"]==='true'
                          ? `<div class="row mb-1 m-0"><div class="col-md-3 font-bold"></div><div class="col">No Restrictions</div></div>`
                          : ``
                      }
                      ${
                        desc2["hmb"]==='true'
                          ? `<div class="row mb-1 m-0"><div class="col-md-3 font-bold"></div><div class="col">Health/Medical/Biomedical</div></div>`
                          : ``
                      }
                      ${
                        desc2["ngm"]==='true'
                          ? `<div class="row mb-1 m-0"><div class="col-md-3 font-bold"></div><div class="col">No General Methods</div></div>`
                          : ``
                      }
                      ${
                        desc2["nfp"]==='true'
                          ? `<div class="row mb-1 m-0"><div class="col-md-3 font-bold"></div><div class="col">Not for Profit Use Only</div></div>`
                          : ``
                      }
                      ${
                        desc2["gru"]==='true'
                          ? `<div class="row mb-1 m-0"><div class="col-md-3 font-bold"></div><div class="col">General Research Use</div></div>`
                          : ``
                      }
                      ${
                        desc2["dsr"]==='true'
                          ? `<div class="row mb-1 m-0"><div class="col-md-3 font-bold"></div><div class="col">Disease-Specific Research: ${desc2["dsr_value"]}</div></div>`
                          : ``
                      }
                      `;
                    });
        template += `
                      </div>
                  </div>
              </div>`;
    });
  } else {
    template += "Data not found!";
  }
  document.getElementById("descriptionBody").innerHTML = template;
  addEventToggleCollapsePanelBtn();
  addEventSortColumn(descriptions, pageSize, headers);
};

// const addEventSortColumn = (descriptions, pageSize, headers) => {
//   const btns = document.getElementsByClassName("sort-column");
//   Array.from(btns).forEach((btn) => {
//     btn.addEventListener("click", () => {
//       const columnName = btn.dataset.columnName;
//       descriptions = descriptions.sort((a, b) =>
//         a[columnName] > b[columnName]
//           ? 1
//           : b[columnName] > a[columnName]
//           ? -1
//           : 0
//       );
//       renderStudyDescription(descriptions, pageSize, headers);
//     });
//   });
// };

const addEventSortColumn = (descriptions, pageSize, headers) => {
  console.log(descriptions);
  console.log(headers);
  const btns = document.getElementsByClassName("sort-column");
  Array.from(btns).forEach((btn) => {
    btn.addEventListener("click", () => {
      const sortDirection = !btn.classList.contains("sort-column-asc") ? 1 : -1;
      const columnName = btn.dataset.columnName;
      console.log(columnName);
      descriptions = descriptions.sort((a, b) =>
        a[columnName] > b[columnName]
          ? 1 * sortDirection
          : b[columnName] > a[columnName]
          ? -1 * sortDirection
          : 0
      );
      console.log(descriptions);
      btn.classList.remove("sort-column-asc", "sort-column-desc");

      renderStudyDescription(descriptions, pageSize, headers);

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

const addEventFilterDataCatalogue = (descriptions, headers) => {
  // const consortiumTypeSelection =
  //   document.getElementsByClassName("select-consortium");
  // Array.from(consortiumTypeSelection).forEach((ele) => {
  //   ele.addEventListener("click", () => {
  //     filterDataBasedOnSelection(descriptions, headers);
  //   });
  // });

  // const countrySelection = document.getElementsByClassName("select-country");
  // Array.from(countrySelection).forEach((ele) => {
  //   ele.addEventListener("click", () => {
  //     filterDataBasedOnSelection(descriptions, headers);
  //   });
  // });
  const input = document.getElementById("searchDataCatalog");
  input.addEventListener("input", () => {
    filterDataBasedOnSelection(descriptions, headers);
  });
};

export const addEventToggleCollapsePanelBtn = () => {
  const btns = document.getElementsByClassName("collapse-panel-btn");
  Array.from(btns).forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.querySelector(".fas.fa-2x").classList.contains("fa-caret-down")) {
        btn.querySelector(".fas.fa-2x").classList.remove("fa-caret-down");
        btn.querySelector(".fas.fa-2x").classList.add("fa-caret-up");
      } else {
        btn.querySelector(".fas.fa-2x").classList.remove("fa-caret-up");
        btn.querySelector(".fas.fa-2x").classList.add("fa-caret-down");
      }
    });
  });
};

const filterDataBasedOnSelection = (descriptions, headers) => {
  // const consortiumSelected = Array.from(
  //   document.getElementsByClassName("select-consortium")
  // )
  //   .filter((dt) => dt.checked)
  //   .map((dt) => dt.dataset.consortium);

  // const countrySelected = Array.from(
  //   document.getElementsByClassName("select-country")
  // )
  //   .filter((dt) => dt.checked)
  //   .map((dt) => dt.dataset.country);

  let filteredData = descriptions;

  // if (consortiumSelected.length > 0) {
  //   filteredData = filteredData.filter(
  //     (dt) => consortiumSelected.indexOf(dt["Acronym"]) !== -1
  //   );
  // }

  // if (countrySelected.length > 0) {
  //   filteredData = filteredData.filter((dt) => {
  //     let found = false;
  //     countrySelected.forEach((ctr) => {
  //       if (dt["Region"] === undefined) return;
  //       if (found) return;
  //       if (dt["Region"].match(new RegExp(ctr, "ig"))) found = true;
  //     });
  //     if (found) return dt;
  //   });
  // }

  // document.getElementById("listFilters").innerHTML = `
        
  //       ${
  //         countrySelected.length > 0
  //           ? `
  //           <span class="font-bold">Region: </span>${countrySelected[0]} ${
  //               countrySelected.length > 1
  //                 ? `and <span class="other-variable-count">${
  //                     countrySelected.length - 1
  //                   } other</span>`
  //                 : ``
  //             }
  //       `
  //           : `
  //           <span class="font-bold">Region:</span> All
  //       `
  //       }
  //   `;
  // if (countrySelected.length === 0) filteredData = descriptions;
  const input = document.getElementById("searchDataCatalog");
  const currentValue = input.value.trim().toLowerCase();

  if (
    currentValue.length <= 2 &&
    (previousValue.length > 2 || previousValue.length === 0)
  ) {
    document.getElementById("pageSizeContainer").innerHTML = pageSizeTemplate(
      filteredData,
      defaultPageSize
    );
    renderStudyDescription(
      filteredData,
      document.getElementById("pageSizeSelector").value,
      headers
    );
    paginationHandler(
      filteredData,
      document.getElementById("pageSizeSelector").value,
      headers
    );
    addEventPageSizeSelection(filteredData, headers);
    return;
  }
  previousValue = currentValue;
  let searchedData = JSON.parse(JSON.stringify(filteredData));
  searchedData = searchedData.filter((dt) => {
    let found = false;
    if (dt["title"].toLowerCase().includes(currentValue)) found = true;
    if (dt["author"].toLowerCase().includes(currentValue)) found = true;
    if (dt["date"].toLowerCase().includes(currentValue)) found = true;
    if (dt["journal_name"].toLowerCase().includes(currentValue)) found = true;
    if (dt["dsr_value"] && dt["dsr_value"].toLowerCase().includes(currentValue)) found = true;
    if (found) return dt;
  });
  searchedData = searchedData.map((dt) => {
    dt["title"] = dt["title"].replace(
      new RegExp(currentValue, "gi"),
      "<b>$&</b>"
    );
    dt["author"] = dt["author"].replace(
      new RegExp(currentValue, "gi"),
      "<b>$&</b>"
    );
    dt["date"] = dt["date"].replace(
      new RegExp(currentValue, "gi"),
      "<b>$&</b>"
    );
    dt["journal_name"] = dt["journal_name"].replace(
      new RegExp(currentValue, "gi"),
      "<b>$&</b>"
    );
    dt["dsr_value"] = dt["dsr_value"].replace(
      new RegExp(currentValue, "gi"),
      "<b>$&</b>"
    );
    return dt;
  });

  document.getElementById("pageSizeContainer").innerHTML = pageSizeTemplate(
    searchedData,
    defaultPageSize
  );
  renderStudyDescription(
    searchedData,
    document.getElementById("pageSizeSelector").value,
    headers
  );
  paginationHandler(
    searchedData,
    document.getElementById("pageSizeSelector").value,
    headers
  );
  addEventPageSizeSelection(searchedData, headers);
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

export const pageSizeTemplate = (array, startPageSize) => {
  const contentSize =
    Math.ceil(array.length / defaultPageSize) * defaultPageSize;
  let pageSizes = [];
  for (let i = startPageSize; i <= contentSize; i += defaultPageSize) {
    pageSizes.push(i);
  }
  let template = `
    <select class="form-control" id="pageSizeSelector">`;
  pageSizes.forEach((size) => {
    template += `<option value="${size}">${size}</option>`;
  });
  template += `</select>
    `;
  return template;
};

const addEventPageSizeSelection = (data, headers) => {
  const select = document.getElementById("pageSizeSelector");
  select.addEventListener("change", () => {
    const value = select.value;
    renderStudyDescription(data, value, headers);
    paginationHandler(data, value, headers);
  });
};

export const paginationTemplate = (array) => {
  let template = `
        <nav aria-label="Page navigation example">
            <ul class="pagination m-0">`;

  array.forEach((a, i) => {
    if (i === 0) {
      template += `<li class="page-item">
                            <button class="page-link transparent-btn" id="previousPage" data-previous="1" aria-label="Previous">
                            <span aria-hidden="true">&laquo;</span>
                            <span class="sr-only">Previous</span>
                            </button>
                        </li>`;
    }
    template += `<li class="page-item"><button class="page-link transparent-btn ${
      i === 0 ? "active-page" : ""
    }" data-page=${a}>${a}</button></li>`;

    if (i === array.length - 1) {
      template += `
            <li class="page-item">
                <button class="page-link transparent-btn" id="nextPage" data-next="1" aria-label="Next">
                <span aria-hidden="true">&raquo;</span>
                <span class="sr-only">Next</span>
                </button>
            </li>`;
    }
  });
  template += `
            </ul>
        </nav>
    `;
  return template;
};

export const dataPagination = (start, end, data) => {
  const paginatedData = [];
  for (let i = start; i < end; i++) {
    if (data[i]) paginatedData.push(data[i]);
  }
  return paginatedData;
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
        renderStudyDescription(
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
