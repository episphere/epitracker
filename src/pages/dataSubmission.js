import {
  getFolderItems,
  showCommentsDropDown,
  filterStudiesDataTypes,
  filterConsortiums,
  hideAnimation,
  checkDataSubmissionPermissionLevel,
  getCollaboration,
  getFile,
  emailforChair,
  emailforDACC,
  tsv2Json,
  consortiumSelection,
  uploadFormFolder,
  daccReviewFolder,
  getFileInfo,
  daccReviewChairFolder,
  acceptedFolder,
  deniedFolder,
  chairReviewFolder,
} from "../shared.js";
import { uploadInStudy } from "../components/modal.js";
import { pageNavBar } from "../components/navBarMenuItems.js";
import { showPreview } from "../components/boxPreview.js";
import { template } from "./dataGovernance.js";
let previousValue = "";
export const dataSubmissionTemplate = async () => {
  const response = await getFolderItems("145996351913"); //Should be 0 for those without access to this folder
  const studiesList = await getFile("910115863871");
  let studyIDs = [];
  if (studiesList)
    studyIDs = tsv2Json(studiesList).data.map((dt) => dt["Folder ID"].trim());
  const studies = response.entries.filter((obj) => studyIDs.includes(obj.id));
  const consortias = filterConsortiums(response.entries);
  const array = [...studies]; //, ...consortias];
  let bool = false;
  for (let consortia of array) {
    if (bool) continue;
    const permitted = checkDataSubmissionPermissionLevel(
      await getCollaboration(consortia.id, `${consortia.type}s`),
      JSON.parse(localStorage.parms).login
    );
    if (permitted) bool = true;
  }
  if (array.length <= 0) {
    hideAnimation();
    return `<div class="general-bg padding-bottom-1rem">
                    <div class="container body-min-height">
                        <div class="main-summary-row">
                            <div class="align-left">
                                <h1 class="page-header">Data Submitted</h1>
                            </div>
                        </div>
                        <div class="data-submission div-border font-size-18" style="padding-left: 1rem;">
                            No folder found for Data Submission
                        </div>
                    </div>
                </div>`;
  }

  let template = "";

  template += `
        <div class="general-bg padding-bottom-1rem">
            <div class="container body-min-height font-size-18">
                <div class="main-summary-row">
                    <div class="align-left">
                        <h1 class="page-header">Data Submitted</h1>
                    </div>
                </div>
                ${
                  bool
                    ? `
                <div class="row create-study">
                    <div class="upload-in-study">
                        <button data-toggle="modal" id="uploadDataBtn" title="Submit data" data-target="#uploadInStudy" class="btn btn-light div-border">
                            <i class="fas fa-upload"></i> Submit data
                        </button>
                    </div>
                </div>
                `
                    : ``
                }`;

  template += await uploadInStudy("uploadInStudy");

  template +=
    '<div class="data-submission div-border white-bg"><ul class="ul-list-style first-list-item collapsible-items mb-0">';

  for (let obj of array) {
    const consortiaName = obj.name;
    let type = obj.type;
    let liClass = type === "folder" ? "collapsible consortia-folder" : "";
    let title = type === "folder" ? "Expand / Collapse" : "";
    template += `<li class="collapsible-items">
                        <button class="${liClass}" data-toggle="collapse" href="#toggle${
      obj.id
    }">
                            <i title="${title}" data-id="${
      obj.id
    }" data-folder-name="${consortiaName}" data-status="pending" class="lazy-loading-spinner"></i>
                        </button> 
                        ${consortiaName}
                        <a href="https://nih.app.box.com/${
                          type === "folder" ? "folder" : "file"
                        }/${obj.id}" target="_blank" title="Open ${
      obj.type
    }"><i class="fas fa-external-link-alt"></i></a>
                    </li>`;
  }

  template += "</ul></div></div></div>";
  return template;
};

export const lazyload = (element) => {
  let spinners = document.getElementsByClassName("lazy-loading-spinner");
  if (element)
    spinners = element.parentNode.querySelectorAll(".lazy-loading-spinner");
  Array.from(spinners).forEach(async (element) => {
    const id = element.dataset.id;
    const status = element.dataset.status;
    if (status !== "pending") return;
    let allEntries = (await getFolderItems(id)).entries;
    if (allEntries.length === 0) {
      element.classList = ["fas fa-exclamation-circle"];
      element.title = "Empty folder";
    }
    allEntries = allEntries.filter((dt) => dt.name !== "Study Documents");
    element.dataset.status = "complete";
    const entries = filterStudiesDataTypes(allEntries);
    const fileEntries = allEntries.filter((obj) => obj.type === "file");
    if (entries.length > 0) {
      const ul = document.createElement("ul");
      ul.classList = ["ul-list-style collapse"];
      ul.id = `toggle${id}`;

      for (const obj of entries) {
        const li = document.createElement("li");
        li.classList = ["collapsible-items"];
        let type = obj.type;
        let liClass = type === "folder" ? "collapsible consortia-folder" : "";
        let title = type === "folder" ? "Expand / Collapse" : "";
        li.innerHTML = `<button class="${liClass}" data-toggle="collapse" href="#toggle${
          obj.id
        }">
                                    <i title="${title}" data-id="${
          obj.id
        }" data-folder-name="${
          obj.name
        }" data-status="pending" class="lazy-loading-spinner"></i>
                                </button> 
                                ${obj.name}
                                <a href="https://nih.app.box.com/${
                                  type === "folder" ? "folder" : "file"
                                }/${obj.id}" target="_blank" title="Open ${
          obj.type
        }"><i class="fas fa-external-link-alt"></i></a>`;
        ul.appendChild(li);
      }

      element.classList.remove("lazy-loading-spinner");
      element.classList.add("fas");
      element.classList.add("fa-folder-plus");
      element.parentNode.parentNode.appendChild(ul);
      dataSubmission(element.parentNode);
    } else if (fileEntries.length > 0) {
      const ul = document.createElement("ul");
      ul.classList = ["ul-list-style collapse"];
      ul.id = `toggle${id}`;

      for (const obj of fileEntries) {
        const li = document.createElement("li");
        li.classList = ["collapsible-items"];
        li.innerHTML = `<a><i title="files" data-id="${
          obj.id
        }" data-status="pending" class="fas fa-file-alt"></i></a> 
                                ${obj.name}
                                <a href="https://nih.app.box.com/${
                                  obj.type === "folder" ? "folder" : "file"
                                }/${obj.id}" target="_blank" title="Open ${
          obj.type
        }"><i class="fas fa-external-link-alt"></i></a>
                                `;
        ul.appendChild(li);
      }

      element.classList.remove("lazy-loading-spinner");
      element.classList.add("fas");
      element.classList.add("fa-folder-plus");
      element.parentNode.parentNode.appendChild(ul);
      dataSubmission(element.parentNode);
    }
  });
};

export const dataSubmission = (element) => {
  element.addEventListener("click", (e) => {
    e.preventDefault();
    if (
      element.getElementsByClassName("fa-folder-minus").length > 0 &&
      element
        .getElementsByClassName("fa-folder-minus")[0]
        .classList.contains("fa-folder-minus")
    ) {
      element
        .getElementsByClassName("fa-folder-minus")[0]
        .classList.add("fa-folder-plus");
      element
        .getElementsByClassName("fa-folder-minus")[0]
        .classList.remove("fa-folder-minus");
    } else {
      element
        .getElementsByClassName("fa-folder-plus")[0]
        .classList.add("fa-folder-minus");
      element
        .getElementsByClassName("fa-folder-plus")[0]
        .classList.remove("fa-folder-plus");
      if (
        document.getElementsByClassName("lazy-loading-spinner").length !== 0
      ) {
        lazyload(element);
      }
    }
  });
};

export async function userSubmissionTemplate(pageHeader, activeTab) {
  const uploads = await getFolderItems(uploadFormFolder);
  const daccReview = await getFolderItems(daccReviewFolder);
  const resubmit = await getFolderItems(daccReviewChairFolder);
  const chairReview = await getFolderItems(chairReviewFolder);
  const accepted = await getFolderItems(acceptedFolder);
  const denied = await getFolderItems(deniedFolder);

  const files = [];

  for (const file of uploads.entries) {
    const fileInfo = await getFileInfo(file.id);
    if (fileInfo.created_by.login === JSON.parse(localStorage.parms).login) {
      files.push({
        file: fileInfo,
        status: "Uploaded",
        decision: "In Progress",
      });
    }
  }

  for (const file of daccReview.entries) {
    const fileInfo = await getFileInfo(file.id);
    if (fileInfo.created_by.login === JSON.parse(localStorage.parms).login) {
      files.push({
        file: fileInfo,
        status: "DACC Review",
        decision: "In Progress",
      });
    }
  }

  for (const file of resubmit.entries) {
    const fileInfo = await getFileInfo(file.id);
    if (fileInfo.created_by.login === JSON.parse(localStorage.parms).login) {
      files.push({
        file: fileInfo,
        status: "Resubmitted to DACC",
        decision: "In Progress",
      });
    }
  }

  for (const file of chairReview.entries) {
    const fileInfo = await getFileInfo(file.id);
    if (fileInfo.created_by.login === JSON.parse(localStorage.parms).login) {
      files.push({
        file: fileInfo,
        status: "Chair Review",
        decision: "In Progress",
      });
    }
  }

  for (const file of accepted.entries) {
    const fileInfo = await getFileInfo(file.id);
    if (fileInfo.created_by.login === JSON.parse(localStorage.parms).login) {
      files.push({
        file: fileInfo,
        status: "Review Complete",
        decision: "Accepted",
      });
    }
  }

  for (const file of denied.entries) {
    const fileInfo = await getFileInfo(file.id);
    if (fileInfo.created_by.login === JSON.parse(localStorage.parms).login) {
      files.push({
        file: fileInfo,
        status: "Review Complete",
        decision: "Denied",
      });
    }
  }
  let authChair =
    emailforChair.indexOf(JSON.parse(localStorage.parms).login) !== -1;
  let authDacc =
    emailforDACC.indexOf(JSON.parse(localStorage.parms).login) !== -1;
  let navBarItems = "";
  if (authDacc && authChair) {
    navBarItems = pageNavBar(
      "data_access"
      // activeTab
      // "Overview",
      // "Project Concept Form",
      // "View Submissions",
      // "Chair Menu",
      // "DACC Menu"
    );
    // navBarItems = pageNavBar('data_access', activeTab, 'Overview', 'Project Concept Form', 'Accepted', 'Chair Menu', 'DACC Menu');
  } else if (authChair) {
    navBarItems = pageNavBar(
      "data_access",
      activeTab
      // "Overview",
      // "Project Concept Form",
      // "View Submissions",
      // "Chair Menu"
    );
    // navBarItems = pageNavBar('data_access', activeTab, 'Overview', 'Project Concept Form', 'Accepted', 'Chair Menu');
  } else if (authDacc) {
    navBarItems = pageNavBar(
      "data_access",
      activeTab
      // "Overview",
      // "Project Concept Form",
      // "View Submissions",
      // "DACC Menu"
    );
    // navBarItems = pageNavBar('data_access', activeTab, 'Overview', 'Project Concept Form', 'Accepted', 'DACC Menu');
  } else {
    navBarItems = pageNavBar(
      "data_access",
      activeTab
      // "Overview",
      // "Project Concept Form",
      // "View Submissions"
    );
    // navBarItems = pageNavBar('data_access', activeTab, 'Overview', 'Project Concept Form', 'Accepted');
  }
  let template = `
      <div class="general-bg body-min-height padding-bottom-1rem">
          <div class="container">
            ${navBarItems}
      `;
  template += `
            <div class="main-summary-row">
                <div class="row align-left w-100 m-0">
                    <h1 class="col page-header pl-0 pt-2">${pageHeader}</h1>
                </div>
            </div>`;
  if (files.length > 0) {
    template += `
                <div id='decidedFiles'>
                <div class='row'>
                  <div class="col-xl-2 filter-column" id="summaryFilterSiderBar">
                      <div class="div-border white-bg align-left p-2">
                          <div class="main-summary-row">
                              <div class="col-xl-12 pl-1 pr-0">
                                  <span class="font-size-17 font-bold">Filter</span>
                                  <div id="filterData" class="align-left"></div>
                              </div>
                          </div>
                      </div>
                  </div>
                  <div class='col-xl-10 pr-0'>`;
    template += userSubmissionHeaders();
    template += '<div id="files"> </div>';
  } else {
    template += `
        <div class="div-border white-bg align-left p-2">
                <div class='row'>
                <div class='col-5'></div> 
                        <div class='col-3'> 
                            <h4 class='text-dark'>No Submissions</h4>
                            <!--div class='row'>
                                <a class='btn btn-primary' href='#data_access/form'>Submit a Form</a>
                            </div-->
                        </div>
                        <div class='col-4'></div> 
                </div>
                <div class='row'>
                
                </div>
        
        </div>
        </div>
        </div>`;
  }

  document.getElementById("confluenceDiv").innerHTML = template;

  if (files.length > 0) {
    userSubmissionFiles(files);

    for (const element of files) {
      document
        .getElementById(`study${element.file.id}`)
        .addEventListener("click", showCommentsDropDown(element.file.id));
    }

    let btns = Array.from(document.querySelectorAll(".preview-file"));
    btns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        // e.stopPropagation();
        btn.dataset.target = "#bcrppPreviewerModal";
        const header = document.getElementById("bcrppPreviewerModalHeader");
        const body = document.getElementById("bcrppPreviewerModalBody");
        header.innerHTML = `<h5 class="modal-title">File preview</h5>
                                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                        <span aria-hidden="true">&times;</span>
                                    </button>`;
        const fileId = btn.dataset.fileId;

        $("#bcrppPreviewerModal").modal("show");
        showPreview(fileId, "bcrppPreviewerModalBody");
      });
    });
    const table = document.getElementById("decidedFiles");
    const headers = table.querySelector(`.div-sticky`);
    Array.from(headers.children).forEach((header, index) => {
      header.addEventListener("click", (e) => {
        const sortDirection = header.classList.contains("header-sort-asc");

        sortUserSubmissions(table, index, !sortDirection);
      });
    });

    //Filtering and Sorting
    userSubmissionFilters(files);
    Array.from(document.getElementsByClassName("filter-var")).forEach((el) => {
      el.addEventListener("click", () => {
        filterUserSubmissions(files);
      });
    });
    const input = document.getElementById("searchDataDictionary");
    input.addEventListener("input", () => {
      filterUserSubmissions(files);
    });
  }
}

export function userSubmissionsView(files) {
  // let template = '';
  // if (files.length > 0) {
  //     template += userSubmissionHeaders();
  //     template += userSubmissionFiles(files);
  // };
  // document.getElementById('userSubmissionFiles').innerHTML = template;
  // for (const element of files) {
  //     document.getElementById(`file${element.file.id}`).addEventListener('click', showCommentsDropDown(element.file.id))
  // }
}

function userSubmissionHeaders() {
  return `
    <div class="row m-0 pt-2 pb-2 align-left div-sticky" style="border-bottom: 1px solid rgb(0,0,0, 0.1);">
        <div class="col-md-4 text-center font-bold ws-nowrap header-sortable">Concept Name <button class="transparent-btn sort-column" data-column-name="Cohort name"><i class="fas fa-sort"></i></button></div>
        <div class="col-md-3 text-center font-bold ws-nowrap header-sortable">Status <button class="transparent-btn sort-column" data-column-name="Population type"><i class="fas fa-sort"></i></button></div>
        <div class="col-md-3 text-center font-bold ws-nowrap header-sortable">Submission Date <button class="transparent-btn sort-column" data-column-name="Acronym"><i class="fas fa-sort"></i></button></div>
        <div class="col-md-1 text-center font-bold ws-nowrap header-sortable">Decision<button class="transparent-btn sort-column" data-column-name="Region"><i class="fas fa-sort"></i></button></div>
    </div>`;
}

function userSubmissionFiles(files) {
  let template = "";
  for (const element of files) {
    let filename = element.file.name.split("_").slice(0, -4).join(" "); // fileInfo.name.split('_')[0];
    const shortfilename =
      filename.length > 21 ? filename.substring(0, 20) + "..." : filename;

    template += `<div class="card mt-1 mb-1 align-left">
        <div style="padding: 10px" aria-expanded="false" id="file${
          element.file.id
        }" class='filedata'>
            <div class="row">
                <div class="col-md-4 text-center">${shortfilename}<button class="btn btn-lg custom-btn preview-file" title='Preview File' data-file-id="${
      element.file.id
    }" aria-label="Preview File"  data-keyboard="false" data-backdrop="static" data-toggle="modal" data-target="#bcrppPreviewerModal"><i class="fas fa-external-link-alt"></i></button></div>
                <div class="col-md-3 text-center">${element.status}</div>
                <div class="col-md-3 text-center">${new Date(
                  element.file.created_at
                )
                  .toDateString()
                  .substring(4)}</div>
                <div class="col-md-1 text-center">${
                  element.decision === "Accepted"
                    ? '<h6 class="badge badge-pill badge-success">Accepted</h6>'
                    : element.decision === "Denied"
                    ? '<h6 class="badge badge-pill badge-danger">Denied</h6>'
                    : '<h6 class="badge badge-pill badge-warning">In Progress</h6>'
                }</div>
                <div class="col-md-1 text-center">
                    <button title="Expand/Collapse" class="transparent-btn collapse-panel-btn" data-toggle="collapse" data-target="#study${
                      element.file.id
                    }">
                        <i class="fas fa-caret-down fa-2x"></i>
                    </button>
                </div>
            </div>
            <div id="study${
              element.file.id
            }" class="collapse" aria-labelledby="file${element.file.id}">
                        <div class="card-body" style="padding-left: 10px;background-color:#f6f6f6;">
                        <div class="row mb-1 m-0">
                    <div class="col-12 font-bold">
                    Concept: ${filename}
                    </div>
                    </div>
                        <div class="row mb-1 m-0">
                          <div id='file${
                            element.file.id
                          }Comments' class='col-12'></div>
                        </div>
    
            </div>
        </div>
        </div>
        </div>
      `;
  }

  document.getElementById("files").innerHTML = template;
}

function userSubmissionFilters(files) {
  //Get all possible values for filters (Submitted By and Decision)
  let template = "";

  const submitterFilterButtons = []; // [...new Set([...files.map(element => element.file.created_by.name)])];
  const decisionFilterButtons = [
    ...new Set([...files.map((element) => element.decision)]),
  ];
  template += `<div class="main-summary-row">
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
     `;
  if (submitterFilterButtons.length !== 0) {
    template += `       
       <label class="filter-label font-size-13" for="variableTypeList">Submitter</label>
       <ul class="remove-padding-left font-size-15 allow-overflow" id="submitterFilterList"> </ul>`;
  }
  let submitterTemp = "";
  submitterFilterButtons.forEach((submitter, index) => {
    submitterTemp += `
      <li class="filter-list-item">
        <input type="checkbox" data-variable-type="${submitter}" name='submitter_${submitter}' id="submitter${index}" value='${submitter}' class="filter-var" style="margin-left: 1px !important;" data-variable-column='Submitter'>
        <label for="label${submitter}" class="sub-category" title="${submitter}">${submitter}</label>
        `;
  });
  if (decisionFilterButtons.length !== 0) {
    template += `       
      <label class="filter-label font-size-13" for="variableTypeList">Decision</label>
      <ul class="remove-padding-left font-size-15 allow-overflow" id="decisionFilterList"> </ul>`;
  }
  let decisionFilterTemp = "";
  decisionFilterButtons.forEach((decision, index) => {
    decisionFilterTemp += `
     <li class="filter-list-item">
       <input type="checkbox" data-variable-type="${decision}" name='decision${decision}' id="decision${index}" value='${decision}' class="filter-var" style="margin-left: 1px !important;" data-variable-column='Decision'>
       <label for="label${decision}" class="sub-category" title="${decision}">${decision}</label>
       `;
  });

  document.getElementById("filterData").innerHTML = template;
  if (submitterFilterButtons.length !== 0)
    document.getElementById("submitterFilterList").innerHTML = submitterTemp;
  if (decisionFilterButtons.length !== 0)
    document.getElementById("decisionFilterList").innerHTML =
      decisionFilterTemp;
}

function sortUserSubmissions(table, column, ascending = true) {
  const direction = ascending ? 1 : -1;
  const rows = Array.from(document.getElementsByClassName("filedata"));

  //Get only visible rows
  let filteredRows = rows;
  filteredRows = filteredRows.filter(
    (row) => row.parentElement.style.display !== "none"
  );
  //Sort each row
  const sortedRows = filteredRows.sort((a, b) => {
    let aContent = "";
    let bContent = "";
    if (column === 0) {
      aContent = a.firstElementChild.firstElementChild.textContent
        .trim()
        .toLowerCase();
      bContent = b.firstElementChild.firstElementChild.textContent
        .trim()
        .toLowerCase();
    } else {
      aContent = a
        .querySelector(`div:nth-child(${column + 1})`)
        .textContent.trim()
        .toLowerCase();
      bContent = b
        .querySelector(`div:nth-child(${column + 1})`)
        .textContent.trim()
        .toLowerCase();
    }

    return aContent > bContent ? 1 * direction : -1 * direction;
  });

  //Remove all filedata
  // while(document.getElementById('files').firstChild){
  //     document.getElementById('files').removeChilddocument.getElementById('f(iles').firstChild);
  // }
  sortedRows.forEach((row) => {
    row.parentElement.remove();
  });

  //Add Data Back
  sortedRows.forEach((row) => {
    const divEl = document.createElement("div");
    divEl.classList.add("card", "mt-1", "mb-1", "align-left");
    divEl.appendChild(row);
    document.getElementById("files").appendChild(divEl);
  });

  //Remember how colmmn is sorted
  Array.from(table.querySelectorAll(".header-sortable")).forEach((header) => {
    header.classList.remove("header-sort-asc", "header-sort-desc");
    // document.getElementsByClassName('sort-column')[column].remove();
  });

  if (direction === 1) {
    table
      .querySelector(`.div-sticky`)
      .children[column].classList.toggle("header-sort-asc", direction);
  } else {
    table
      .querySelector(`.div-sticky`)
      .children[column].classList.toggle("header-sort-desc", -direction);
  }
}

function filterUserSubmissions(data) {
  //Get all the elements
  const rows = Array.from(document.getElementsByClassName("filedata"));

  //Get all selected filter variables
  const selectedFilters = Array.from(
    document.getElementsByClassName("filter-var")
  ).filter((dt) => dt.checked);

  const selectedDecisions = selectedFilters
    .filter((dt) => dt.dataset.variableColumn === "Decision")
    .map((dt) => dt.dataset.variableType);

  let filteredData = data;
  const filter = {};
  if (selectedDecisions.length > 0) filter["Decision"] = selectedDecisions;

  if (selectedFilters.length === 0) filteredData = data;
  else {
    filteredData = filteredData.filter((dt) => {
      for (const key in filter) {
        if (key === "Decision") {
          if (!filter[key].includes(dt.decision)) {
            return false;
          }
        }
      }

      return true;
    });
  }

  // Filter on search
  let searchedData;
  const input = document.getElementById("searchDataDictionary");
  const currentValue = input.value.trim().toLowerCase();
  if (
    currentValue.length <= 2 &&
    (previousValue.length > 2 || previousValue.length === 0)
  ) {
    searchedData = filteredData;
  } else {
    previousValue = currentValue;

    searchedData = JSON.parse(JSON.stringify(filteredData)).filter((dt) => {
      let found = false;
      if (dt.file.name.toLowerCase().includes(currentValue)) {
        found = true;
      }
      if (dt.file.created_by.name.toLowerCase().includes(currentValue)) {
        found = true;
      }
      if (dt.decision.toLowerCase().includes(currentValue)) {
        found = true;
      }
      if (found) return dt;
    });
  }

  //If file not in the showRows then add it
  let showRows = [];
  searchedData.forEach((dt) => {
    const row_id = "file" + dt.file.id;
    if (showRows.indexOf(row_id) === -1) {
      showRows.push(row_id);
    }
  });
  rows.forEach((row) => {
    if (showRows.includes(row.id)) row.parentElement.style.display = "block";
    else row.parentElement.style.display = "none";
  });
}
