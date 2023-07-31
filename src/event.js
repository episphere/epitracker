import {
  showAnimation,
  removeActiveClass,
  uploadFile,
  createFolder,
  getCollaboration,
  addNewCollaborator,
  removeBoxCollaborator,
  notificationTemplate,
  updateBoxCollaborator,
  getFolderItems,
  consortiumSelection,
  filterStudies,
  filterDataTypes,
  filterFiles,
  copyFile,
  hideAnimation,
  getFileAccessStats,
  uploadFileVersion,
  getFile,
  csv2Json,
  json2csv,
  publicDataFileId,
  summaryStatsFileId,
  getFileInfo,
  missingnessStatsFileId,
  assignNavbarActive,
  reSizePlots,
  showComments,
  tsv2Json,
  json2other,
  getUser,
  updateBoxCollaboratorTime
} from "./shared.js";
import { renderDataSummary } from "./pages/about.js";
import { variables } from "./variables.js";
// import {
//   template as dataGovernanceTemplate,
//   // addFields,
//   dataGovernanceLazyLoad,
//   dataGovernanceCollaboration,
//   dataGovernanceProjects, testingDataGov
// } from "./pages/dataGovernance.js";
import { myProjectsTemplate } from "./pages/myProjects.js";
import { createProjectModal } from "./components/modal.js";
import {
  getSelectedStudies,
  renderAllCasesCharts,
  renderAllCharts,
  updateCounts,
  getFileContent,
  getFileContentCases,
} from "./visualization.js";

import { showPreview } from "./components/boxPreview.js";

let top = 0;
let previousValue = "";

export const addEventStudyRadioBtn = () => {
  const createStudyRadio = document.getElementsByName("createStudyRadio");
  Array.from(createStudyRadio).forEach((element) => {
    element.addEventListener("click", () => {
      if (element.checked) {
        if (element.value === "no") {
          const studyFormElements =
            document.getElementById("studyFormElements");
          const selectConsortiaUIS =
            document.getElementById("selectConsortiaUIS");
          studyFormElements.innerHTML = `
                        <div class="form-group">
                            <label for="selectStudyUIS">Select folder</label> <span class="required">*</span>
                            <select class="form-control" id="selectStudyUIS" name="selectedStudy" required></select>
                        </div>
                        <div class="form-group">
                            <label for="uploadDataUIS">Submit data</label> <span class="required">*</span>
                            <input type="file" class="form-control-file" id="uploadDataUIS" name="dataFile" required>
                        </div>
                    `;
          if (selectConsortiaUIS.value)
            selectConsortiaUIS.dispatchEvent(new Event("change"));
        } else {
          const studyFormElements =
            document.getElementById("studyFormElements");
          studyFormElements.innerHTML = `
                        <div class="form-group">
                            <label for="newStudyName">Folder Name</label> <span class="required">*</span>
                            <input type="text" id="newStudyName" autocomplete="off" required class="form-control" placeholder="Enter folder name">
                        </div>
                        <div class="form-group">
                            <label for="uploadDataUIS">Submit data</label> <span class="required">*</span>
                            <input type="file" class="form-control-file" id="uploadDataUIS" name="dataFile" required>
                        </div>
                    `;
        }
      }
    });
  });
};

export const addEventConsortiaSelect = () => {
  const element = document.getElementById("selectConsortiaUIS");
  if (!element) return;
  element.addEventListener("change", async () => {
    const selectStudyUIS = document.getElementById("selectStudyUIS");
    if (!selectStudyUIS) return;
    const value = element.value;
    if (!value) {
      Array.from(selectStudyUIS.options).forEach((option) => {
        selectStudyUIS.remove(option);
      });
      return;
    }

    let entries = (await getFolderItems(value)).entries;

    // check if study document exists
    const documentExists = entries.filter(
      (dt) => dt.name.trim().toLowerCase() === "BCRPP data from studies"
    );
    if (documentExists.length === 1) {
      entries = (await getFolderItems(documentExists[0].id)).entries;
    }

    selectStudyUIS.innerHTML = "";
    const firstOption = document.createElement("option");
    firstOption.value = "";
    firstOption.text = "-- Select folder --";
    selectStudyUIS.appendChild(firstOption);
    entries = filterStudies(entries);
    for (let obj of entries) {
      const option = document.createElement("option");
      option.value = obj.id;
      option.text = obj.name;
      selectStudyUIS.appendChild(option);
    }
  });
};

export const addEventUploadStudyForm = () => {
  const form = document.getElementById("uploadStudyForm");
  if (!form) return;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const file = document.getElementById("uploadDataUIS").files[0];
    const fileName = file.name;
    const fileType = fileName.slice(
      fileName.lastIndexOf(".") + 1,
      fileName.length
    );
    if (fileType !== "txt") {
      alert("File type not supported!");
      return;
    }
    const consortia = document.getElementById("selectConsortiaUIS");
    const consortiaText = consortia.options[consortia.selectedIndex].text;
    const study = document.getElementById("selectStudyUIS");
    const newStudyName = document.getElementById("newStudyName");
    const studyName = newStudyName
      ? newStudyName.value
      : study.options[study.selectedIndex].text;
    const r = confirm(
      `Upload ${fileName} in ${consortiaText} >> ${studyName}?`
    );
    if (r) {
      document.getElementById("submitBtn").classList.add("btn-disbaled");

      let fileReader = new FileReader();
      fileReader.onload = function (fileLoadedEvent) {
        const textFromFileLoaded = fileLoadedEvent.target.result;

        performQAQC(textFromFileLoaded, fileName);
      };
      fileReader.readAsText(file, "UTF-8");
    }
  });
};

const separateData = async (qaqcFileName, textFromFileLoaded, fileName) => {
  const consortia = document.getElementById("selectConsortiaUIS");
  const consortiaId = consortia.value;
  const study = document.getElementById("selectStudyUIS");
  const newStudyName = document.getElementById("newStudyName");
  let studyId;
  if (study) {
    studyId = study.value;
  } else if (newStudyName) {
    const entries = (await getFolderItems(consortiaId)).entries;
    const studyFolders = entries.filter(
      (dt) =>
        dt.type === "folder" &&
        dt.name.trim().toLowerCase() === "bcrpp data from studies"
    );
    const response = await createFolder(
      `${studyFolders.length === 0 ? consortiaId : studyFolders[0].id}`,
      newStudyName.value
    );
    if (response.status !== 201) return;
    const data = await response.json();
    studyId = data.id;
  }
  const dataEntries = (await getFolderItems(studyId)).entries;
  let logFolderID = "",
    cDataFolderID = ""; //, pDataFolderID = '', rfDataFolderID = '', stDataFolderID = '';
  logFolderID = await existsOrCreateNewFolder(
    dataEntries,
    studyId,
    "Submission_Logs"
  );
  cDataFolderID = await existsOrCreateNewFolder(
    dataEntries,
    studyId,
    "Core Data"
  );
  let rows = textFromFileLoaded.split(/\n/g).map((tx) => tx.split(/\t/g));
  const headings = rows[0];
  rows.splice(0, 1);
  let obj = rows.map((el) => {
    let obj = {};
    for (let i = 0; i < el.length; i++) {
      obj[headings[i].trim()] = el[i];
    }
    return obj;
  });

  const masterFile = variables.masterFile;
  const core = masterFile.core.map((att) => att.toLowerCase());
  let coreData = [];

  obj.forEach((data) => {
    let cObj = {};
    for (const key in data) {
      if (core.indexOf(key.toLowerCase()) !== -1) {
        cObj[key] = data[key];
      }
    }
    if (Object.keys(cObj).length > 0) coreData.push(cObj);
  });
  const response1 = await uploadFile(
    coreData,
    `${fileName.slice(0, fileName.lastIndexOf("."))}_Core_Data.json`,
    cDataFolderID
  );
  location.reload();
};

const existsOrCreateNewFolder = async (dataEntries, studyId, folderName) => {
  const folderExists = dataEntries.filter(
    (dt) => dt.type === "folder" && dt.name === folderName
  );
  let ID = "";
  if (folderExists.length === 0) {
    ID = (await (await createFolder(studyId, folderName)).json()).id;
  } else {
    ID = folderExists[0].id;
  }
  return ID;
};

const performQAQC = async (textFromFileLoaded, fileName) => {
  const fileNameQAQC = `${fileName.substr(
    0,
    fileName.lastIndexOf(".")
  )}_qaqc_${new Date().toISOString()}.html`;
  addEventContinueSubmission(fileNameQAQC, textFromFileLoaded, fileName);
};

const addEventDownloadQAQCReport = (fileName) => {
  const element = document.getElementById("downloadQAQCReport");
  element.addEventListener("click", () => {
    const elHtml = document.getElementById("qaqcSubmissionReport").innerHTML;
    const link = document.createElement("a");
    const mimeType = "text/html";

    link.setAttribute("download", fileName);
    link.setAttribute(
      "href",
      "data:" + mimeType + ";charset=utf-8," + encodeURIComponent(elHtml)
    );
    link.click();

    replaceBtns();
    document
      .getElementById("uploadInStudy")
      .querySelectorAll(".close.modal-close-btn")[0]
      .click();
  });
};

const replaceBtns = () => {
  const element = document.getElementById("downloadQAQCReport");
  const closeBtn = document.createElement("button");
  closeBtn.classList = ["btn btn-dark"];
  closeBtn.title = "Close";
  closeBtn.innerHTML = "Close";
  closeBtn.type = "button";
  closeBtn.dataset.dismiss = "modal";

  element.parentNode.replaceChild(closeBtn, element);

  const continueBtn = document.getElementById("continueSubmission");
  const submitBtn = document.createElement("button");
  submitBtn.classList = ["btn btn-light"];
  submitBtn.id = "submitBtn";
  submitBtn.title = "Submit";
  submitBtn.innerHTML = "run QAQC";
  submitBtn.type = "Submit";

  continueBtn.parentNode.replaceChild(submitBtn, continueBtn);
};

const addEventContinueSubmission = (
  qaqcFileName,
  textFromFileLoaded,
  fileName
) => {
  const element = document.getElementById("continueSubmission");
  separateData(qaqcFileName, textFromFileLoaded, fileName);
};

const dataForQAQC = (txt) => {
  let data = {};
  if (txt.slice(0, 1) == "[") {
    txt = "{" + txt + "}";
  }
  if (txt.slice(0, 1) == "{") {
    data = JSON.parse(txt);
    return data;
  } else {
    let arr = txt.split(/[\r\n]+/g).map((row) => {
      // data array
      return row.replace(/"/g, "").split(/[,\t]/g); // split csv and tsv alike
    });
    if (arr.slice(-1).toLocaleString() == "") {
      arr.pop();
    }
    const labels = arr[0];
    labels.forEach((label) => {
      data[label] = [];
    });
    arr.slice(1).forEach((row, i) => {
      labels.forEach((label, j) => {
        data[label][i] = row[j];
      });
    });
    labels.forEach((label) => {
      data[label] = numberType(data[label]);
    });
    return data;
  }
};

const numberType = (aa) => {
  // try to fit numeric typing
  let tp = "number";
  aa.forEach((a) => {
    if (!(a == parseFloat(a) || a == "undefined" || a == "")) {
      tp = "string";
    }
  });
  if (tp == "number") {
    aa = aa.map((a) => {
      if (a == "undefined" || a == "") {
        a = undefined;
      } else {
        a = parseFloat(a);
      }
      return a;
    });
  }
  return aa;
};

export const addEventShowAllCollaborator = () => {
  const btn1 = document.getElementById("addNewCollaborators");
  const btn2 = document.getElementById("listCollaborators");
  const btn3 = document.getElementById("listExtCollaborators");
  const folderToShare = document.getElementById("folderToShare");
  btn2.addEventListener("click", async () => {
    if (btn2.classList.contains("active-tab")) return;
    const ID = folderToShare.dataset.folderId;
    const folderName = folderToShare.dataset.folderName;
    const type = folderToShare.dataset.objectType;
    btn2.classList.add("active-tab");
    btn1.classList.remove("active-tab");
    btn3.classList.remove("active-tab");
    const collaboratorModalBody = document.getElementById(
      "collaboratorModalBody"
    );
    collaboratorModalBody.innerHTML = ``;
    const response = await getCollaboration(ID, `${type}s`);
    const userPermission = checkPermissionLevel(response);
    let table = "";
    let allEntries = [];
    if (response && response.entries.length > 0) {
      let entries = response.entries;
      entries.forEach((entry) => {
        const name = !entry.invite_email ? entry.accessible_by.name : "";
        const email = !entry.invite_email ? entry.accessible_by.login : entry.invite_email;
        const role = entry.role;
        const status = entry.status;
        const id = entry.id;
        //const userid = entry.accessible_by.id;
        //const folderName = entry.item.name;
        const addedBy = `${entry.created_by.name}`;
        const addedAt = new Date(entry.added_at).toLocaleString();
        const expiresAt = new Date(entry.expires_at).toLocaleString();
        allEntries.push({
          name,
          email,
          role,
          status,
          addedBy,
          addedAt,
          id,
          folderName,
          expiresAt
          //userid
        });
      });

      allEntries = allEntries.sort((a, b) =>
        a.name.toLowerCase() > b.name.toLowerCase()
          ? 1
          : b.name.toLowerCase() > a.name.toLowerCase()
          ? -1
          : 0
      );

      table += `
                <div class="row mb-3">
                    <div class="col"><strong>${folderName}</strong></div>
                    <div class="col">
                        <div class="input-group">
                            <input type="search" class="form-control rounded pt-0 pb-0" style="font-size:0.75rem" autocomplete="off" placeholder="Search min. 3 characters" aria-label="Search" id="searchCollaborators" aria-describedby="search-addon">
                            <span class="input-group-text border-0 search-input-collaborator">
                                <i class="fas fa-search"></i>
                            </span>
                        </div>
                    </div>
                </div>
                <table id="collaboratorsList" class="table table-borderless table-striped collaborator-table"></table>
            `;
    } else {
      table = "Collaborators not found!";
    }
    console.log(allEntries);
    // await Promise.all(allEntries.map(async (input) => {
    //   if (input.name) {
    //     console.log("true");
    //   } else {
    //     const userName = await getUser(input.userid);
    //     console.log(userName);
    //   }
    // }));
    collaboratorModalBody.innerHTML = `
            <div class="modal-body allow-overflow max-height-collaboration-list">${table}</div>
            <div class="modal-footer">
                <button type="button" title="Close" class="btn btn-dark" data-dismiss="modal">Close</button>
            </div>
        `;
    renderCollaboratorsList(allEntries, userPermission);
    addEventSearchCollaborators(allEntries, userPermission);
  });
};

export const addEventShowExtCollaborator = () => {
  const btn1 = document.getElementById("addNewCollaborators");
  const btn2 = document.getElementById("listCollaborators");
  const btn3 = document.getElementById("listExtCollaborators");
  const folderToShare = document.getElementById("folderToShare");
  btn3.addEventListener("click", async () => {
    if (btn3.classList.contains("active-tab")) return;
    showAnimation();
    const ID = folderToShare.dataset.folderId;
    const folderName = folderToShare.dataset.folderName;
    const type = folderToShare.dataset.objectType;
    btn3.classList.add("active-tab");
    btn1.classList.remove("active-tab");
    btn2.classList.remove("active-tab");
    const collaboratorModalBody = document.getElementById(
      "collaboratorModalBody"
    );
    collaboratorModalBody.innerHTML = ``;
    let x = document.getElementById(`toggle${ID}`).querySelectorAll(".share-folder")
    let allFolders = [[ID, type, folderName]];
    x.forEach(entry => {
      //console.log(entry.dataset);
      const idAll = entry.dataset.folderId;
      const typeAll = entry.dataset.objectType;
      const folderAll = entry.dataset.folderName;
      allFolders.push([idAll, typeAll, folderAll]);
    })
    console.log(allFolders);
    const responseParent = await getCollaboration(ID, `${type}s`);
    const userPermission = checkPermissionLevel(responseParent);
    let responses = await getCollaboration(allFolders[0][0], `${allFolders[0][1]}s`);
    responses = responses.entries;
    var ids = new Set(responses.map(d => d.id));
    for (let index = 1; index < allFolders.length; index++) {
      let response = (await getCollaboration(allFolders[index][0], `${allFolders[index][1]}s`)).entries;
      responses = [...responses, ...response.filter(d => !ids.has(d.id))];
      ids = new Set(responses.map(d => d.id));
      //console.log(responses);
    };
    responses = [...new Set(responses.map((item) => item))];
    console.log(responseParent);
    let table = "";
    let allEntries = [];
    if (responseParent && responses.length > 0) {
      //let entries = responses.entries;
      responses.forEach(entry => {
        const name = !entry.invite_email ? entry.accessible_by.name : "";
        const email = !entry.invite_email ? entry.accessible_by.login : entry.invite_email;
        const role = entry.role;
        const status = entry.status;
        const id = entry.id;
        const addedBy = entry.created_by ? entry.created_by.name : "";
        const addedAt = new Date(entry.added_at).toLocaleString();
        const expiresAt = entry.expires_at !== null ? new Date(entry.expires_at).toDateString() : "None";
        if (!email.includes("@nih.gov")){
          allEntries.push({
            name,
            email,
            role,
            status,
            addedBy,
            addedAt,
            id,
            folderName,
            expiresAt
            //userid
          });
        };
      });

      allEntries = allEntries.sort((a, b) =>
        a.name.toLowerCase() > b.name.toLowerCase()
          ? 1
          : b.name.toLowerCase() > a.name.toLowerCase()
          ? -1
          : 0
      );

      table += `
                <div class="row mb-3">
                    <div class="col"><strong>${folderName}</strong></div>
                    <div class="col">
                        <div class="input-group">
                            <input type="search" class="form-control rounded pt-0 pb-0" style="font-size:0.75rem" autocomplete="off" placeholder="Search min. 3 characters" aria-label="Search" id="searchCollaborators" aria-describedby="search-addon">
                            <span class="input-group-text border-0 search-input-collaborator">
                                <i class="fas fa-search"></i>
                            </span>
                        </div>
                    </div>
                </div>
                <table id="collaboratorsList" class="table table-borderless table-striped collaborator-table"></table>
            `;
    } else {
      table = "Collaborators not found!";
    }
    // console.log(allEntries);
    // await Promise.all(allEntries.map(async (input) => {
    //   if (input.name) {
    //     console.log("true");
    //   } else {
    //     const userName = await getUser(input.userid);
    //     console.log(userName);
    //   }
    // }));
    collaboratorModalBody.innerHTML = `
            <div class="modal-body allow-overflow max-height-collaboration-list">${table}</div>
            <div class="modal-footer">
                <button type="button" id="extendCollaborations" title="Extend" class="btn btn-light" data-dismiss="modal">Extend Collaboration</button>
                <button type="button" title="Close" class="btn btn-dark" data-dismiss="modal">Close</button>
            </div>
        `;
    renderCollaboratorsList(allEntries, userPermission);
    addEventSearchCollaborators(allEntries, userPermission);
    hideAnimation();
  });
};

const renderCollaboratorsList = (allEntries, userPermission) => {
  if (allEntries.length === 0) {
    document.getElementById("collaboratorsList").innerHTML =
      "Collaborators not found!";
    return;
  }
  if (!document.getElementById("collaboratorsList")) return;
  let table = `
        <thead>
            <tr>`
      table += document.getElementById("listExtCollaborators").classList.contains("active-tab") ? `<th>Check </th>` : ``;
      table += `<th>Name <button class="transparent-btn sort-column" data-column-name="name" data-order-by="asc"><i class="fas fa-sort"></i></button></th>
              <th>Email <button class="transparent-btn sort-column" data-column-name="email" data-order-by="asc"><i class="fas fa-sort"></i></button></th>
              <th>Role <button class="transparent-btn sort-column" data-column-name="role" data-order-by="asc"><i class="fas fa-sort"></i></button></th>
              <th>Added by <button class="transparent-btn sort-column" data-column-name="addedBy" data-order-by="asc"><i class="fas fa-sort"></i></button></th>
              <th>Expires at <button class="transparent-btn sort-column" data-column-name="expiresAt" data-order-by="asc"><i class="fas fa-sort"></i></button></th>
            </tr>
        </thead>
        <tbody id="tBodyCollaboratorList"></tbody>
    `;
  document.getElementById("collaboratorsList").innerHTML = table;
  renderCollaboratorListTBody(allEntries, userPermission);
  addEventSortTable(allEntries, userPermission);
  addEventExtendCollaborations();
};

const renderCollaboratorListTBody = (allEntries, userPermission) => {
  let tbody = "";
  allEntries.forEach((entry) => {
    const { name, email, role, addedBy, expiresAt, id, folderName } = entry;
    const userName = JSON.parse(localStorage.parms).name;
    tbody += `<tr>`
    tbody += document.getElementById("listExtCollaborators").classList.contains("active-tab") ? `<td title="${id}"><input type="checkbox" id="${id}" name="extendCollab" value="${role}" checked></td>` : ``;
    tbody += `  <td title="${name}">${name.length > 20 ? `${name.slice(0, 20)}...` : `${name}`}</td>
                <td title="${email}">${email.length > 20 ? `${email.slice(0, 20)}...` : `${email}`}</td>
                <td>${email !== JSON.parse(localStorage.parms).login && userPermission && updatePermissionsOptions(userPermission, role) && userName === addedBy? `<select title="Update permission" data-collaborator-id="${id}" data-previous-permission="${role}" data-collaborator-name="${name}" data-collaborator-login="${email}" class="form-control updateCollaboratorRole">${updatePermissionsOptions(userPermission,role)}</select>`: `${role}`}</td>
                <td title="${addedBy}">${addedBy.length > 20 ? `${addedBy.slice(0, 20)}...` : `${addedBy}`}</td>
                <td title="${expiresAt}">${expiresAt}</td>
                <td>${addedBy === userName? `<button class="removeCollaborator" title="Remove collaborator" data-collaborator-id="${id}" data-email="${email}" data-collaborator-name="${name}" data-folder-name="${folderName}"><i class="fas fa-user-minus"></i></button>`: ``}</td>
              </tr>`;
  });
  document.getElementById("tBodyCollaboratorList").innerHTML = tbody;
  addEventRemoveCollaborator();
  addEventUpdateCollaborator();
};

const addEventSortTable = (allEntries, userPermission) => {
  const elements = Array.from(document.getElementsByClassName("sort-column"));
  elements.forEach((element) => {
    element.addEventListener("click", () => {
      const columnName = element.dataset.columnName;
      const orderBy = element.dataset.orderBy;
      if (orderBy === "desc") {
        element.dataset.orderBy = "asc";
        renderCollaboratorListTBody(
          allEntries.sort((a, b) =>
            a[columnName] < b[columnName]
              ? 1
              : b[columnName] < a[columnName]
              ? -1
              : 0
          ),
          userPermission
        );
      } else {
        element.dataset.orderBy = "desc";
        renderCollaboratorListTBody(
          allEntries.sort((a, b) =>
            a[columnName] > b[columnName]
              ? 1
              : b[columnName] > a[columnName]
              ? -1
              : 0
          ),
          userPermission
        );
      }
    });
  });
};

const addEventSearchCollaborators = (allEntries, userPermission) => {
  const search = document.getElementById("searchCollaborators");
  let filteredEntries = allEntries;
  search.addEventListener("input", () => {
    const searchValue = search.value.trim().toLowerCase();
    if (searchValue.length < 3) {
      filteredEntries = allEntries;
      filteredEntries = filteredEntries.map((dt) => {
        dt["name"] = dt["name"].replace(/(<b>)|(<\/b>)/g, "");
        dt["email"] = dt["email"].replace(/(<b>)|(<\/b>)/g, "");
        return dt;
      });
      renderCollaboratorsList(filteredEntries, userPermission);
      return;
    }
    filteredEntries = allEntries.filter(
      (dt) =>
        dt.name
          .toLowerCase()
          .replace(/(<b>)|(<\/b>)/g, "")
          .includes(searchValue) ||
        dt.email
          .toLowerCase()
          .replace(/(<b>)|(<\/b>)/g, "")
          .includes(searchValue)
    );
    filteredEntries = filteredEntries.map((dt) => {
      dt["name"] = dt["name"]
        .replace(/(<b>)|(<\/b>)/g, "")
        .replace(new RegExp(searchValue, "gi"), "<b>$&</b>");
      dt["email"] = dt["email"]
        .replace(/(<b>)|(<\/b>)/g, "")
        .replace(new RegExp(searchValue, "gi"), "<b>$&</b>");
      return dt;
    });
    renderCollaboratorsList(filteredEntries, userPermission);
  });
};

const updatePermissionsOptions = (userPermission, role) => {
  if (userPermission === "owner")
    return `<option ${
      role === "co-owner" ? `selected` : ``
    } value="co-owner">co-owner</option><option ${
      role === "editor" ? `selected` : ``
    } value="editor">editor</option><option ${
      role === "viewer" ? `selected` : ``
    } value="viewer">viewer</option><option ${
      role === "uploader" ? `selected` : ``
    } value="uploader">uploader</option>`;
  else if (userPermission === "co-owner")
    return `<option ${
      role === "co-owner" ? `selected` : ``
    } value="co-owner">co-owner</option><option ${
      role === "editor" ? `selected` : ``
    } value="editor">editor</option><option ${
      role === "viewer" ? `selected` : ``
    } value="viewer">viewer</option><option ${
      role === "uploader" ? `selected` : ``
    } value="uploader">uploader</option>`;
  else if (
    userPermission === "editor" &&
    role !== "co-owner" &&
    role !== "owner"
  )
    return `<option ${
      role === "editor" ? `selected` : ``
    } value="editor">editor</option><option ${
      role === "viewer" ? `selected` : ``
    } value="viewer">viewer</option><option ${
      role === "uploader" ? `selected` : ``
    } value="uploader">uploader</option>`;
  else return null;
};
const addEventUpdateCollaborator = () => {
  const updateCollaboratorRole = document.getElementsByClassName(
    "updateCollaboratorRole"
  );
  const showNotification = document.getElementById("showNotification");
  Array.from(updateCollaboratorRole).forEach((element) => {
    element.addEventListener("change", async () => {
      const newRole = element.value;
      const prevRole = element.dataset.previousPermission;
      const id = element.dataset.collaboratorId;
      const name = element.dataset.collaboratorName;
      const login = element.dataset.collaboratorLogin;
      const r = confirm(
        `Update Collaborator ${name || login} Role as ${newRole}?`
      );
      if (r) {
        const response = await updateBoxCollaborator(id, newRole);
        if (response.status === 200) {
          top = top + 2;
          let template = notificationTemplate(
            top,
            `<span class="successMsg">Collaborator Updated</span>`,
            `Collaborator ${
              name || login
            } role updated as ${newRole} successfully!`
          );
          showNotification.innerHTML = template;
          addEventHideNotification();
        } else {
          element.value = prevRole;
        }
      } else {
        element.value = prevRole;
      }
    });
  });
};

const addEventRemoveCollaborator = () => {
  const removeCollaborator =
    document.getElementsByClassName("removeCollaborator");
  const showNotification = document.getElementById("showNotification");
  Array.from(removeCollaborator).forEach((element) => {
    element.addEventListener("click", async () => {
      const id = element.dataset.collaboratorId;
      const folderName = element.dataset.folderName;
      const email = element.dataset.email;
      const name = element.dataset.collaboratorName;
      const r = confirm(
        `Remove Collaborator ${name || email} from ${folderName}?`
      );
      if (r) {
        const response = await removeBoxCollaborator(id);
        if (response.status === 204) {
          top = top + 2;
          let template = notificationTemplate(
            top,
            `<span class="successMsg">Collaborator Removed</span>`,
            `Collaborator ${
              name || email
            } removed from ${folderName} successfully!`
          );
          element.parentNode.parentNode.parentNode.removeChild(
            element.parentNode.parentNode
          );
          showNotification.innerHTML = template;
          addEventHideNotification();
        }
      }
    });
  });
};

const addEventExtendCollaborations = async () => {
  const btn = document.getElementById('extendCollaborations');
  if(!btn) return;
  btn.addEventListener('click', async () => {
      const header = document.getElementById('confluenceModalHeader');
      const body = document.getElementById('confluenceModalBody');
      
      header.innerHTML = `<h5 class="modal-title">Collaborations Updating</h5>
                          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                              <span aria-hidden="true">&times;</span>
                          </button>`;
      var checkboxes = document.getElementsByName('extendCollab');
      console.log(checkboxes);
      var result = [];
      const promises = []
      Date.prototype.addDays = function(days) {
          var date = new Date(this.valueOf());
          date.setDate(date.getDate() + days);
          return date;
      }
      var date = new Date();
      const newDate = date.addDays(90);
      const newDateString = newDate.toISOString();
      for (var i=0; i < checkboxes.length; i++) {
          if (checkboxes[i].checked) {
              const promise = updateBoxCollaboratorTime(checkboxes[i].id, checkboxes[i].value, newDateString)
                  .then(response => response.json());
              promises.push(promise);
              //result.push(checkboxes[i].id);
              //promises.push(checkboxes[i].value);
          }
      }
      showAnimation();
      Promise.all(promises).then(results => {
          alert("Please confirm collaborations have been updated");
          hideAnimation();
      });
  })
};

export const addEventUpdateExtCollaborators = async () => {
  const btn = document.getElementById('updateCollaborations');
  if(!btn) return;
  btn.addEventListener('click', async () => {
      const id = document.getElementById('')
      const header = document.getElementById('confluenceModalHeader');
      const body = document.getElementById('confluenceModalBody');
      
      header.innerHTML = `<h5 class="modal-title">Update Collaborations</h5>
                          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                              <span aria-hidden="true">&times;</span>
                          </button>`;
      const ID = 156698557621;
      let collabs = await getCollaboration(ID, 'folders');
      console.log(collabs);
      Date.prototype.addDays = function(days) {
          var date = new Date(this.valueOf());
          date.setDate(date.getDate() + days);
          return date;
      }
      var date = new Date();
      const newDate = date.addDays(360);
      const newDateString = newDate.toISOString();
      console.log(newDateString);
      const allEntries = collabs.entries;
      console.log(allEntries[0]);
      let test = await updateBoxCollaboratorTime(43582145593, "editor", newDateString);
      console.log(test);

  })
};

export const addEventUpdateAllCollaborators = async () => {
  const btn = document.getElementById('updateCollaborations');
  if(!btn) return;
  btn.addEventListener('click', async () => {
      const header = document.getElementById('confluenceModalHeader');
      const body = document.getElementById('confluenceModalBody');
      
      header.innerHTML = `<h5 class="modal-title">Update Collaborations</h5>
                          <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                              <span aria-hidden="true">&times;</span>
                          </button>`;
      const ID = 156698557621;
      let collabs = await getCollaboration(ID, 'folders');
      console.log(collabs);
      Date.prototype.addDays = function(days) {
          var date = new Date(this.valueOf());
          date.setDate(date.getDate() + days);
          return date;
      }
      var date = new Date();
      const newDate = date.addDays(360);
      const newDateString = newDate.toISOString();
      console.log(newDateString);
      const allEntries = collabs.entries;
      console.log(allEntries[0]);
      let test = await updateBoxCollaboratorTime(43582145593, "editor", newDateString);
      console.log(test);
      // allEntries.forEach(entry => {
      //     console.log(entry);
      //     let test = await updateBoxCollaboratorTime()
      // })

  })
};

const checkPermissionLevel = (data) => {
  if (data.entries.length === 0) return null;
  const login =
    localStorage.parms && JSON.parse(localStorage.parms).login
      ? JSON.parse(localStorage.parms).login
      : undefined;
  const array = data.entries.filter(
    (d) => d.accessible_by && d.accessible_by.login === login
  );
  if (array.length === 0) {
    const newArray = data.entries.filter(
      (d) => d.created_by && d.created_by.login === login
    );
    if (newArray.length > 0) return "owner";
  } else {
    return array[0].role;
  }
  return null;
};

export const addEventDataGovernanceNavBar = (bool) => {
  const dataGovernanceElement = document.getElementById("dataGovernance");
  if (!dataGovernanceElement) return;
  dataGovernanceElement.addEventListener("click", async () => {
    // // if(dataGovernanceElement.classList.contains('navbar-active')) return;
    showAnimation();
    assignNavbarActive(dataGovernanceElement);
    // document.title = "DCEG - Data Governance";
    // const confluenceDiv = document.getElementById("confluenceDiv");
    // // if(bool){
    // confluenceDiv.classList.add("general-bg");

    // const containerDiv = document.createElement("div");
    // containerDiv.classList = ["container padding-bottom-1rem"];

    // const headerDiv = document.createElement("div");
    // headerDiv.classList = ["main-summary-row"];
    // headerDiv.innerHTML = `<div class="align-left">
    //                                     <h1 class="page-header">Data Governance of Uploaded Data</h1>
    //                                 </div>`;
    // const divRow = document.createElement("div");
    // divRow.classList = ["main-summary-row white-bg div-border"];
    // divRow.id = "dataGovernanceMain";

    // const div1 = document.createElement("div");
    // div1.classList = ["col-lg-6 align-left"];

    //div1.innerHTML = await dataGovernanceTemplate();
    await dataGovernanceTemplate();
    hideAnimation();
    // divRow.appendChild(div1);
    // confluenceDiv.innerHTML = ``;
    // containerDiv.appendChild(headerDiv);
    // containerDiv.appendChild(btnDiv)
    // containerDiv.appendChild(divRow);
    // confluenceDiv.appendChild(containerDiv);
    //     dataGovernanceProjects();
    // dataGovernanceLazyLoad();
    // dataGovernanceCollaboration();
  });
};

const addEventCreateProjectBtn = () => {
  const btn = document.getElementById("createProjectBtn");
  btn.addEventListener("click", async () => {
    const body = document.getElementById("createProjectModalBody");
    body.innerHTML = `
        <form id="createProjectForm" method="POST">
            <label><strong>Project Name</strong> <span class="required">*</span>
                <div class="form-group">
                    <input type="text" class="form-control" id="newProjectName" placeholder="Enter project name" required>
                </div>
            </label>
            
            <div class="form-group" id="consortiumSelection">${await consortiumSelection()}</div>
            <div class="form-group" id="studySelection"></div>
            <div class="form-group" id="dataTypeSelection"></div>
            <div class="form-group" id="fileSelection"></div>

            <div class="form-group">
                <strong>Add collaborator(s)</strong> <span class="required">*</span>
                <div class="row" id="collaboratorEmails">
                    ${addFields(1, true)}
                </div>
            </div>
                
            <div class="row">
                <div class="col"><button title="Add more collaborators" type="button" class="btn btn-light" id="addMoreEmail" data-counter=1><i class="fas fa-plus"></i> Add</button></div>
            </div>
            </br>
        </div>
        <div class="modal-footer">
            <button type="submit" title="Submit" class="btn btn-light">Submit</button>
            <button type="button" title="Close" class="btn btn-dark" data-dismiss="modal">Close</button>
        </form>
        `;
    const addMoreEmail = document.getElementById("addMoreEmail");
    addMoreEmail.addEventListener("click", () => {
      const counter = parseInt(addMoreEmail.dataset.counter) + 1;
      addMoreEmail.dataset.counter = counter;
      document
        .getElementById("collaboratorEmails")
        .insertAdjacentHTML("beforeend", addFields(counter));
      if (counter === 5) addMoreEmail.disabled = true;
    });
    addEventCPCSelect();
    addEventcreateProjectForm();
  });
};

const addEventcreateProjectForm = () => {
  const form = document.getElementById("createProjectForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const projectName =
      "Confluence_" +
      document.getElementById("newProjectName").value +
      "_Project";
    const fileId = document.getElementById("CPFSelect").value;

    const showNotification = document.getElementById("showNotification");
    let template = "";
    const folder = await createFolder(0, projectName);
    if (folder.status === 201) {
      const parent = await folder.json();
      const copied = await copyFile(fileId, parent.id);
      if (copied.status === 201) {
        for (let i = 1; i <= 5; i++) {
          const email = document.getElementById(`shareFolderEmail${i}`);
          const role = document.getElementById(`folderRole${i}`);
          if (email && role) {
            const emails = email.value.split(",");
            for (let index = 0; index < emails.length; index++) {
              const login = emails[index].trim();
              const response = await addNewCollaborator(
                parent.id,
                "folder",
                login,
                role.value.toLowerCase()
              );
              top = top + 2;
              if (response.status === 200 || response.status === 201) {
                template += notificationTemplate(
                  top,
                  `<span class="successMsg">Added new collaborator</span>`,
                  `${login} added to ${projectName} as ${role.value} successfully!`
                );
                //dataGovernanceProjects();
                testingDataGov();
              } else {
                template += notificationTemplate(
                  top,
                  `<span class="errorMsg">Error!</span>`,
                  `Could not add ${login} to ${projectName} as ${
                    role.value
                  }, <span class="errorMsg">${
                    (await response.json()).message
                  }</span>!!`
                );
              }
            }
          }
        }
      } else {
        template += notificationTemplate(
          top,
          `<span class="errorMsg">Error!</span>`,
          `Could not copy file to ${projectName}, <span class="errorMsg">${
            (await copied.json()).message
          }</span>!!`
        );
      }
    } else {
      template += notificationTemplate(
        top,
        `<span class="errorMsg">Error!</span>`,
        `Could not create ${projectName}, <span class="errorMsg">${
          (await folder.json()).message
        }</span>!!`
      );
    }
    showNotification.innerHTML = template;
    addEventHideNotification();
  });
};

const addEventCPCSelect = () => {
  const select = document.getElementById("CPCSelect");
  select.addEventListener("change", async () => {
    document.getElementById("studySelection").innerHTML = "";
    document.getElementById("dataTypeSelection").innerHTML = "";
    document.getElementById("fileSelection").innerHTML = "";
    if (select.value === "") return;
    const ID = select.value;
    let response = await getFolderItems(ID);
    if (response.entries.length === 0) return;
    // check if study document exists
    const documentExists = response.entries.filter(
      (dt) => dt.name.trim().toLowerCase() === "BCRPP data from studies"
    );
    if (documentExists.length === 1) {
      response = await getFolderItems(documentExists[0].id);
    }
    const array = filterStudies(response.entries);
    if (array.length === 0) return "";
    let template = "";
    template +=
      '<strong>Select study</strong> <span class="required">*</span><select id="CPSSelect" class="form-control" required>';
    array.forEach((obj, index) => {
      if (index === 0)
        template += '<option value=""> -- Select study -- </option>';
      template += `<option value="${obj.id}">${obj.name}</option>`;
    });
    template += "</select>";
    document.getElementById("studySelection").innerHTML = template;
    addEventCPSSelect();
  });
};

const addEventCPSSelect = () => {
  const select = document.getElementById("CPSSelect");
  select.addEventListener("change", async () => {
    document.getElementById("dataTypeSelection").innerHTML = "";
    document.getElementById("fileSelection").innerHTML = "";
    if (select.value === "") return;
    const ID = select.value;
    const response = await getFolderItems(ID);
    if (response.entries.length === 0) return;
    const array = filterDataTypes(response.entries);
    if (array.length === 0) return "";
    let template = "";
    template +=
      '<strong>Select data type</strong> <span class="required">*</span><select id="CPDTSelect" class="form-control" required>';
    array.forEach((obj, index) => {
      if (index === 0)
        template += '<option value=""> -- Select data type -- </option>';
      template += `<option value="${obj.id}">${obj.name}</option>`;
    });
    template += "</select>";
    document.getElementById("dataTypeSelection").innerHTML = template;
    addEventCPDTSelect();
  });
};

const addEventCPDTSelect = () => {
  const select = document.getElementById("CPDTSelect");
  select.addEventListener("change", async () => {
    document.getElementById("fileSelection").innerHTML = "";
    if (select.value === "") return;

    const ID = select.value;
    const response = await getFolderItems(ID);
    if (response.entries.length === 0) return;
    const array = filterFiles(response.entries);
    if (array.length === 0) return "";
    let template = "";
    template +=
      '<strong>Select file</strong> <span class="required">*</span><select id="CPFSelect" class="form-control" required>';
    array.forEach((obj, index) => {
      if (index === 0)
        template += '<option value=""> -- Select file -- </option>';
      template += `<option value="${obj.id}">${obj.name}</option>`;
    });
    template += "</select>";
    document.getElementById("fileSelection").innerHTML = template;
    addEventCPDTSelect();
  });
};

export const addEventMyProjects = () => {
  const myProjects = document.getElementById("myProjects");
  myProjects.addEventListener("click", async () => {
    if (myProjects.classList.contains("navbar-active")) return;
    showAnimation();
    assignNavbarActive(myProjects, 2);
    document.title = "BCRPP - My Projects";
    myProjectsTemplate();
  });
};

export const addEventCopyToClipboard = () => {
  const copyFileApi = document.getElementsByClassName("copy-file-api");
  Array.from(copyFileApi).forEach((elem) => {
    elem.addEventListener("click", () => {
      const fileId = elem.dataset.fileId;
      const versionId = elem.dataset.versionId;
      const data = fileId && !versionId ? fileId : versionId;
      if (!navigator.clipboard) {
        const textArea = document.createElement("textarea");
        textArea.value = data;
        textArea.style.position = "fixed"; //avoid scrolling to bottom
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const copied = document.execCommand("copy");
        if (copied) {
          elem.innerHTML = `<i class="fas fa-check"></i>`;
          setTimeout(() => {
            elem.innerHTML = `<i class="far fa-copy">`;
          }, 5000);
        }
        document.body.removeChild(textArea);
      } else {
        navigator.clipboard.writeText(data).then(
          function () {
            elem.innerHTML = `<i class="fas fa-check"></i>`;
            setTimeout(() => {
              elem.innerHTML = `<i class="far fa-copy">`;
            }, 5000);
          },
          function (err) {
            console.error("Async: Could not copy text: ", err);
          }
        );
      }
    });
  });
};

export const addEventFileStats = (element) => {
  element.addEventListener("click", async () => {
    const ID = element.dataset.fileId;
    const name = element.dataset.fileName;
    document.getElementById("modalFileStatsBody").innerHTML = "";
    document.getElementById("modalFileStatsHeader").innerHTML = `
            <h5 class="modal-title">${name}</h5>
            <button type="button" title="Close" class="close modal-close-btn" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        `;
    const response = await getFileAccessStats(ID);
    document.getElementById("modalFileStatsBody").innerHTML = `
            <div class="row file-stats-row">
                <div class="col" title="File download count">
                    <span class="file-stats-heading">Download count</span></br>
                    <i class="fas fa-4x fa-database file-stats-icon"></i> <span class="fa-3x"> ${response.download_count}</span>
                </div>
                <div class="col" title="File edit count">
                    <span class="file-stats-heading">Edit count</span></br>
                    <i class="fas fa-4x fa-edit file-stats-icon"></i> <span class="fa-3x"> ${response.edit_count}</span>
                </div>
            </div>
            <div class="row file-stats-row">
                <div class="col" title="File preview count">
                    <span class="file-stats-heading">Preview count</span></br>
                    <i class="fas fa-4x fa-file-alt file-stats-icon"></i> <span class="fa-3x"> ${response.preview_count}</span>
                </div>
                <div class="col" title="File comment count">
                    <span class="file-stats-heading">Comment count</span></br>
                    <i class="fas fa-4x fa-comments file-stats-icon"></i> <span class="fa-3x"> ${response.comment_count}</span>
                </div>
            </div>
        `;
  });
};

export const addEventVariableDefinitions = () => {
  const elements = document.getElementsByClassName("variable-definition");
  Array.from(elements).forEach((element) => {
    element.addEventListener("click", (e) => {
      e.preventDefault();
      const variable = element.dataset.variable;
      let variableName = "";
      let definition = "";
      if (variable === "studyDesign") {
        variableName = "Study design";
        definition =
          "Study type classified as ‘population based’ or ‘non-population based’";
      }
      if (variable === "status") {
        variableName = "Case-control status";
        definition =
          "Number of subjects with a reported diagnosis of invasive breast cancer or in situ breast cancer and number of subjects without a breast cancer diagnosis";
      }
      if (variable === "ethnicity") {
        variableName = "Ethnicity";
        definition = "Ethnic descent";
      }
      if (variable === "race") {
        variableName = "race";
        definition = "Race";
      }
      if (variable === "study") {
        variableName = "Study";
        definition = "Study";
      }
      if (variable === "ageInt") {
        variableName = "Age";
        definition = "Age at interview/questionnaire for controls and cases";
      }
      if (variable === "famHist") {
        variableName = "Family history";
        definition =
          "Family history of breast cancer in a first degree relative";
      }
      if (variable === "ER_statusIndex") {
        variableName = "ER status";
        definition = "Estrogen receptor status of breast cancer tumor";
      }
      if (variable === "chip") {
        variableName = "Genotyping chip";
        definition =
          "Filter data according to subjects genotyped by the confluence chips or other genotyping chips";
      }
      if (variable === "subsetStatistics") {
        variableName = "Subset statistics";
        definition =
          "This plot shows the number of subjects with data available on variables selected on the bottom left panel. You can filter the numbers shown by case-control status and study by selecting filters on the top left panel.";
      }
      if (variable === "allSubjects") {
        variableName = "All Subjects";
        definition =
          "All subjects in the set with data on any of the selected variables.";
      }
      if (variable === "completeSet") {
        variableName = "Complete set";
        definition = "Number of subjects with data on all selected variables.";
      }
      if (variable === "midsetTopBars") {
        variableName = "Top bars";
        definition =
          "Number of subjects with data on each of the selected variable (irrespective of the others).";
      }
      if (variable === "midsetSideBars") {
        variableName = "Side bars";
        definition =
          "Number of subjects with data on a combination 2 or more selected variables.";
      }
      if (variable === "midsetSideBars") {
        variableName = "Side bars";
        definition =
          "Number of subjects with data on a combination 2 or more selected variables.";
      }
      if (variable === "varSelection") {
        variableName = "Variable Selection";
        definition = "Input here";
      }
      if (variable === "Reproductive_History1") {
        variableName = "Reproductive History 1";
        definition = "Definition of Reproductive History 1";
      }
      if (variable === "Reproductive_History2") {
        variableName = "Reproductive History 2";
        definition = "Definition of Reproductive History 2";
      }
      if (variable === "folderUpdateInput") {
        variableName = "Box Folder Input";
        definition = "Enter Box folder ID. To see all folders enter 0. Only folder owners can extend access.";
      }

      const header = document.getElementById("confluenceModalHeader");
      const body = document.getElementById("confluenceModalBody");

      header.innerHTML = `<h5 class="modal-title">${variableName}</h5>
                                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                    <span aria-hidden="true">&times;</span>
                                </button>`;
      body.innerHTML = `<span>${definition}</span>`;
    });
  });
};

export const addEventUpdateSummaryStatsData = () => {
  const btn = document.getElementById("updateSummaryStatsData");
  console.log(btn);
  if (!btn) return;
  btn.addEventListener("click", async () => {
    const header = document.getElementById("confluenceModalHeader");
    const body = document.getElementById("confluenceModalBody");

    header.innerHTML = `<h5 class="modal-title">Download updated data</h5>
                            <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>`;

    let template = '<form id="updateSummaryStatsForm">';
    template += `<p>Updating data will download an updated publication </br> file to be uploaded to: <a href="https://github.com/episphere/dataplatform/tree/production/imports" target="__blank">DCEG PDR GitHub</a></p>`;

    template +=
      '<div class="modal-footer"><button type="submit" class="btn btn-outline-primary">Update data</button></div>';
    template += "</form>";
    body.innerHTML = template;
    //addEventDataTypeRadio();
    addEventUpdateSummaryStatsForm();
  });
};

const addEventDataTypeRadio = () => {
  const radios = document.getElementsByName("summarydataType");
  Array.from(radios).forEach((radio) => {
    radio.addEventListener("click", async () => {
      const dataType = Array.from(
        document.getElementsByName("summarydataType")
      ).filter((ele) => ele.checked === true)[0].value;
      let template = "";
      const response = await getFolderItems(106289683820);
      let summaryFolder = [];
      if (dataType === "summary") {
        summaryFolder = response.entries.filter(
          (dt) =>
            dt.type === "folder" &&
            /_summary_statistics/i.test(dt.name) === true
        );
      } else {
        summaryFolder = response.entries.filter(
          (dt) =>
            dt.type === "folder" &&
            /_missingness_statistics/i.test(dt.name) === true
        );
      }
      template += `Select data folder(s)`;
      template += `<ul>`;
      summaryFolder.forEach((folder) => {
        template += `<li class="filter-list-item">
                <button type="button" class="filter-btn collapsible-items update-summary-stats-btn filter-midset-data-btn" data-folder-id="${folder.id}">
                <div class="variable-name">${folder.name}</div>
                </button>
                </li>`;
      });
      template += `</ul>`;

      document.getElementById("summaryDataFolderList").innerHTML = template;
      addEventSummaryFolderSelection();
    });
  });
};

const addEventSummaryFolderSelection = () => {
  const elements = document.getElementsByClassName("update-summary-stats-btn");
  Array.from(elements).forEach((element) => {
    element.addEventListener("click", () => {
      if (element.classList.contains("active-filter"))
        element.classList.remove("active-filter");
      else element.classList.add("active-filter");
    });
  });
};

const addEventUpdateSummaryStatsForm = () => {
  const form = document.getElementById("updateSummaryStatsForm");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const files = await getFolderItems(196819085811);
    if (files.length === 0) return;
    console.log(files.entries);
    form.innerHTML = "Gathering data...";

    var dataArray = [];
    for (let file of files.entries) {
      const tsv = await getFile(file.id);
      form.innerHTML = `Processing File: ${file.name}`;
      const responseData = tsv2Json(tsv);
      const jsonArray = responseData.data;
      console.log(jsonArray);
      //dataArray.push(jsonArray);
      Array.prototype.push.apply(dataArray,jsonArray);
    }
    form.innerHTML = `Saving File...`
    console.log(dataArray);
    const headers = Object.keys(dataArray[0]);
    const tsvValue = json2other(dataArray, headers, true).replace(/(<b>)|(<\/b>)/g, "");
    let tsvContent =
        "data:text/tsv;charset=utf-8," +
        tsvValue;
    const encodedUri = encodeURI(tsvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `DCEG_Publications.tsv`);
    link.click();
    form.innerHTML = `Complete: Please upload file to: </br> <a href="https://github.com/episphere/dataplatform/tree/production/imports" target="__blank">DCEG PDR GitHub</a>`
    return;
    // const folderIds = Array.from(selectedBtn).map((btn) =>
    //   parseInt(btn.dataset.folderId)
    // );
    // if (folderIds.length === 0) return;
    // let masterArray = [];
    // let publicDataObj = {};
    // let allHeaders = [];
    for (let id of folderIds) {
      const response = await getFolderItems(id);
      let file = [];
      if (dataType === "summary")
        file = response.entries.filter(
          (dt) =>
            dt.type === "file" &&
            /_summary_statistics.csv/i.test(dt.name) === true
        );
      else
        file = response.entries.filter(
          (dt) =>
            dt.type === "file" &&
            /_missingness_statistics.csv/i.test(dt.name) === true
        );
      if (file.length === 0) return;

      form.querySelectorAll(
        '[type="submit"]'
      )[0].innerHTML = `Processing ${file[0].name}...`;
      const csv = await getFile(file[0].id);
      const responseData = csv2Json(csv);
      const jsonArray = responseData.data;
      allHeaders = allHeaders.concat(responseData.headers);
      if (dataType === "summary") {
        const uniqueStudies = [];
        jsonArray.forEach((obj) => {
          const consortium =
            obj.consortium === "NCI" ? "NCI-DCEG" : obj.consortium;
          if (publicDataObj[consortium] === undefined) {
            publicDataObj[consortium] = {};
            publicDataObj[consortium].name = consortium;
            publicDataObj[consortium].studies = 0;
            publicDataObj[consortium].cases = 0;
            publicDataObj[consortium].controls = 0;
          }
          if (uniqueStudies.indexOf(obj.study) === -1) {
            uniqueStudies.push(obj.study);
            publicDataObj[consortium].studies += 1;
          }
          if (obj.status === "case")
            publicDataObj[consortium].cases += parseInt(obj.statusTotal);
          if (obj.status === "control")
            publicDataObj[consortium].controls += parseInt(obj.statusTotal);
        });
      }
      masterArray = masterArray.concat(jsonArray);
    }
    const finalHeaders = allHeaders.filter(
      (item, pos) => allHeaders.indexOf(item) === pos
    );
    const masterCSV = json2csv(masterArray, finalHeaders);
    if (dataType === "summary") {
      publicDataObj["dataModifiedAt"] = new Date().toISOString();
      await uploadFileVersion(masterCSV, summaryStatsFileId, "text/csv");
      form.innerHTML = JSON.stringify(publicDataObj, null, 2);
      await getFile(summaryStatsFileId);
      await getFileInfo(summaryStatsFileId);
    } else {
      await uploadFileVersion(masterCSV, missingnessStatsFileId, "text/csv");
      form.querySelectorAll('[type="submit"]')[0].classList.remove("disabled");
      await getFile(missingnessStatsFileId);
      await getFileInfo(missingnessStatsFileId);
    }
    removeActiveClass("update-summary-stats-btn", "active-filter");
    let template = notificationTemplate(
      top,
      `<span class="successMsg">Data updated</span>`,
      `Data successfully updated, please reload to see updated data.`
    );
    document.getElementById("showNotification").innerHTML = template;
    addEventHideNotification();
  });
};

export const addEventFilterBarToggle = () => {
  const button = document.getElementById("filterBarToggle");
  button.addEventListener("click", () => {
    const child = Array.from(button.childNodes)[0];
    if (child.classList.contains("fa-caret-left")) {
      reSizePlots();
      child.classList.remove("fa-caret-left");
      child.classList.add("fa-caret-right");
      document
        .getElementById("summaryFilterSiderBar")
        .classList.remove("col-xl-2");
      document.getElementById("summaryFilterSiderBar").classList.add("d-none");
      document
        .getElementById("summaryStatsCharts")
        .classList.remove("col-xl-10");
      document.getElementById("summaryStatsCharts").classList.add("col-xl-12");
      document
        .getElementById("dataLastModified")
        .classList.remove("offset-xl-2");
      document
        .getElementById("dataLastModified")
        .classList.remove("padding-left-20");
    } else {
      reSizePlots();
      child.classList.remove("fa-caret-right");
      child.classList.add("fa-caret-left");
      document
        .getElementById("summaryFilterSiderBar")
        .classList.add("col-xl-2");
      document
        .getElementById("summaryFilterSiderBar")
        .classList.remove("d-none");
      document.getElementById("summaryStatsCharts").classList.add("col-xl-10");
      document
        .getElementById("summaryStatsCharts")
        .classList.remove("col-xl-12");
      document.getElementById("dataLastModified").classList.add("offset-xl-2");
      document
        .getElementById("dataLastModified")
        .classList.add("padding-left-20");
    }
  });
};

export const addEventMissingnessFilterBarToggle = () => {
  const button = document.getElementById("filterBarToggle");
  button.addEventListener("click", () => {
    const child = button.querySelector(".fas");
    if (child.classList.contains("fa-caret-left")) {
      reSizePlots();
      child.classList.remove("fa-caret-left");
      child.classList.add("fa-caret-right");
      document.getElementById("missingnessFilter").classList = ["d-none"];
      document.getElementById("missingnessTable").parentNode.classList = [
        "col-xl-12 padding-right-zero padding-left-zero",
      ];
      document
        .getElementById("dataLastModified")
        .classList.remove("offset-xl-2");
      document.getElementById("dataLastModified").classList.remove("pl-4");
    } else {
      reSizePlots();
      child.classList.remove("fa-caret-right");
      child.classList.add("fa-caret-left");
      document.getElementById("missingnessFilter").classList = [
        "col-xl-2 filter-column",
      ];
      document.getElementById("missingnessTable").parentNode.classList = [
        "col-xl-10 padding-right-zero",
      ];
      document.getElementById("dataLastModified").classList.add("offset-xl-2");
      document.getElementById("dataLastModified").classList.add("pl-4");
    }
  });
};

export const addEventSummaryStatsFilterForm = (jsonData, headers) => {
  const ethnicitySelection = document.getElementById("ethnicitySelection");
  ethnicitySelection.addEventListener("change", () => {
    filterData(jsonData, headers);
  });

  const raceSelection = document.getElementById("raceSelection");
  raceSelection.addEventListener("change", () => {
    filterData(jsonData, headers);
  });

  const studySelection = document.getElementById("studySelection");
  studySelection.addEventListener("change", () => {
    filterData(jsonData, headers);
  });

  const subcasesSelection = document.getElementById("subcasesSelection");
  subcasesSelection.addEventListener("change", function (event) {
    if (event.target.value == "all") getFileContent();
    if (event.target.value == "cases") getFileContentCases();
  });

  const elements = document.getElementsByClassName("select-consortium");
  Array.from(elements).forEach((el, index) => {
    el.addEventListener("click", () => {
      if (el.checked) {
        Array.from(
          el.parentNode.parentNode.querySelectorAll(".select-study")
        ).forEach((btns) => (btns.checked = true));
      } else {
        Array.from(
          el.parentNode.parentNode.querySelectorAll(".select-study")
        ).forEach((btns) => (btns.checked = false));
      }
      filterData(jsonData, headers);
    });
  });

  const studyElements = document.getElementsByClassName("select-study");
  Array.from(studyElements).forEach((ele) => {
    ele.addEventListener("click", () => {
      filterData(jsonData, headers);
    });
  });
};

const filterData = (jsonData, headers) => {
  const ethnicity = document.getElementById("ethnicitySelection").value;
  const study = document.getElementById("studySelection").value;
  const race = document.getElementById("raceSelection").value;
  const subCases = document.getElementById("subcasesSelection").value;
  const ethnicityFilter = Array.from(
    document.getElementById("ethnicitySelection").options
  ).filter((op) => op.selected)[0].textContent;
  const studyFilter = Array.from(
    document.getElementById("studySelection").options
  ).filter((op) => op.selected)[0].textContent;
  const raceFilter = Array.from(
    document.getElementById("raceSelection").options
  ).filter((op) => op.selected)[0].textContent;
  const subCasesFilter = Array.from(
    document.getElementById("subcasesSelection").options
  ).filter((op) => op.selected)[0].textContent;
  let finalData = jsonData;
  let onlyCIMBA = false;
  let selectedConsortia = [];
  Array.from(document.getElementsByClassName("select-consortium")).forEach(
    (dt) => {
      if (dt.checked) selectedConsortia.push(dt.dataset.consortia);
    }
  );
  const array = getSelectedStudies();

  if (ethnicity !== "all") {
    finalData = finalData.filter((dt) => dt["ethnicity"] === ethnicity);
  }
  if (study !== "all") {
    finalData = finalData.filter((dt) => dt["study"] === study);
  }
  if (race !== "all") {
    finalData = finalData.filter((dt) => dt["race"] === race);
  }

  updateCounts(finalData);

  if (array.length > 0) {
    finalData = finalData.filter(
      (dt) => array.indexOf(`${dt.consortium}@#$${dt.study}`) !== -1
    );
  }
  const selectedStudies = array.map((s) => s.split("@#$")[1]);

  let totalSubjects = 0;
  finalData.forEach((value) => {
    totalSubjects += value.TotalSubjects;
  });
  if (subCases == "all") {
    renderAllCharts(finalData);
  } else renderAllCasesCharts(finalData);
};

export const addEventConsortiaFilter = (d) => {
  const checkboxs = document.getElementsByClassName("checkbox-consortia");
  Array.from(checkboxs).forEach((checkbox) => {
    checkbox.addEventListener("click", () => {
      const selectedConsortium = Array.from(checkboxs)
        .filter((dt) => dt.checked)
        .map((dt) => dt.dataset.consortia);
      let data = JSON.parse(JSON.stringify(d));
      delete data["dataModifiedAt"];
      if (selectedConsortium.length > 0) {
        const newData = Object.values(data).filter((dt) =>
          selectedConsortium.includes(dt.name)
        );
        let totalConsortia = 0,
          totalWomen = 0,
          totalPatients = 0;
        newData.forEach((obj) => {
          totalConsortia++;
          totalPatients += obj.numPatients;
          totalWomen += obj.numWomen;
        });
        renderDataSummary(
          {
            totalConsortia,
            totalPatients,
            totalWomen,
          },
          true
        );
      } else {
        let totalConsortia = 0,
          totalWomen = 0,
          totalPatients = 0;
        Object.values(data).forEach((obj) => {
          totalConsortia++;
          totalPatients += obj.numPatients;
          totalWomen += obj.numWomen;
        });
        renderDataSummary(
          {
            totalConsortia,
            totalPatients,
            totalWomen,
          },
          true
        );
      }
    });
  });
};

export function switchTabs(show, hide, files) {
  try {
    if (!Array.isArray(hide)) {
      return;
    } else if (!Array.isArray(files)) {
      return;
    } else if (show === "decided") {
      document.getElementById(show + "Tab").addEventListener("click", (e) => {
        e.preventDefault();
        const boxPreview = document.getElementById("filePreview");
        boxPreview.classList.remove("d-block");
        boxPreview.classList.add("d-none");

        for (const tab of hide) {
          document.getElementById(tab + "Tab").classList.remove("active");
          document.getElementById(tab).classList.remove("show", "active");
        }
        document.getElementById(show + "Tab").classList.add("active");
        document.getElementById(show).classList.add("show", "active");

        localStorage.setItem("currentTab", show + "Tab");
        return;
      });
    } else {
      const boxPreview = document.getElementById("filePreview");

      document.getElementById(show + "Tab").addEventListener("click", (e) => {
        e.preventDefault();
        if (boxPreview !== null) {
          if (files.length != 0) {
            if (!boxPreview.classList.contains("d-block")) {
              boxPreview.classList.add("d-block");
            }
            switchFiles(show);
            document.getElementById(show + "selectedDoc").value = files[0].id;
            showPreview(files[0].id);
            if (show !== "toBeCompleted") {
              document.getElementById("boxFilePreview").classList.add("col-8");
              showComments(files[0].id);
            } else {
              document
                .getElementById("boxFilePreview")
                .classList.remove("col-8");
            }
            if (show === "toBeCompleted") {
              document.getElementById("sendtodaccButton").style.display =
                "block";
              document.getElementById("finalChairDecision").style.display =
                "none";
              document.getElementById("daccOverride").style.display = "none";
              document.getElementById("fileComments").style.display = "none";
              // document.getElementById('fileComments').innerHTML = listComments(files[0].id);
            }
            if (show === "inProgress") {
              document.getElementById("sendtodaccButton").style.display =
                "none";
              document.getElementById("fileComments").style.display = "block";
              document.getElementById("finalChairDecision").style.display =
                "none";
              document.getElementById("daccOverride").style.display = "block";
              document.getElementById("fileComments").style.display = "block";
            }
            if (show === "daccCompleted") {
              document.getElementById("sendtodaccButton").style.display =
                "none";
              document.getElementById("daccOverride").style.display = "none";
              document.getElementById("fileComments").style.display = "block";
              document.getElementById("finalChairDecision").style.display =
                "block";
              document.getElementById("fileComments").style.display = "block";
            }
            if (show === "dacctoBeCompleted") {
              document.getElementById("daccComment").style.display = "block";
            }
            if (show === "completed") {
              document.getElementById("daccComment").style.display = "none";
            }
            if (show === "daccReview") {
              document.getElementById("boxFilePreview").classList.add("col-8");
              document.getElementById("daccComment").style.display = "block";
              showComments(files[0].id);
            }
          } else {
            boxPreview.classList.remove("d-block");
            boxPreview.classList.add("d-none");
            if (show === "completed") {
              if (document.getElementById("daccComment")) {
                document.getElementById("daccComment").style.display = "none";
              }
            }
          }
        }

        for (const tab of hide) {
          document.getElementById(tab + "Tab").classList.remove("active");
          document.getElementById(tab).classList.remove("show", "active");
        }
        document.getElementById(show + "Tab").classList.add("active");
        document.getElementById(show).classList.add("show", "active");

        localStorage.setItem("currentTab", show + "Tab");
        return;
      });
    }
  } catch (err) {
    return;
  }
}

export function switchFiles(tab) {
  document
    .getElementById(`${tab}selectedDoc`)
    .addEventListener("change", (e) => {
      const file_id = e.target.value;
      showPreview(file_id);
      showComments(file_id);
    });
}

export function filterCheckBox(table, data) {
  const rows = Array.from(document.getElementsByClassName("filedata"));

  //Get all selected filter variables
  const selectedFilters = Array.from(
    document.getElementsByClassName("filter-var")
  ).filter((dt) => dt.checked);

  const selectedDecisions = selectedFilters
    .filter((dt) => dt.dataset.variableColumn === "Decision")
    .map((dt) => dt.dataset.variableType);
  const selectedSubmitters = selectedFilters
    .filter((dt) => dt.dataset.variableColumn === "Submitter")
    .map((dt) => dt.dataset.variableType);
  //Set filter values
  let filteredData = data;
  const filter = {};
  if (selectedDecisions.length > 0) filter["Decision"] = selectedDecisions;
  if (selectedSubmitters.length > 0) filter["Submitter"] = selectedSubmitters;

  if (selectedFilters.length === 0) filteredData = data;
  else {
    filteredData = filteredData.filter((dt) => {
      for (const key in filter) {
        if (key === "Decision") {
          if (!filter[key].includes(dt.parent.name)) {
            return false;
          }
        }
        if (key === "Submitter") {
          if (!filter[key].includes(dt.created_by.name)) return false;
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
      if (dt.name.toLowerCase().includes(currentValue)) {
        found = true;
      }
      if (dt.created_by.name.toLowerCase().includes(currentValue)) {
        found = true;
      }
      if (dt.parent.name.toLowerCase().includes(currentValue)) {
        found = true;
      }
      if (found) return dt;
    });
  }

  //If file not in the showRows then add it
  let showRows = [];
  searchedData.forEach((file) => {
    const row_id = "file" + file.id;
    if (showRows.indexOf(row_id) === -1) {
      showRows.push(row_id);
    }
  });
  rows.forEach((row) => {
    if (showRows.includes(row.id)) row.parentElement.style.display = "block";
    else row.parentElement.style.display = "none";
  });
}
export function sortTableByColumn(table, column, asc = true) {
  const direction = asc ? 1 : -1;
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
      bContent = b
        .querySelector(`div:nth-child(${column + 1})`)
        .textContent.trim()
        .toLowerCase();
      aContent = a
        .querySelector(`div:nth-child(${column + 1})`)
        .textContent.trim()
        .toLowerCase();
    }
    if (!isNaN(Date.parse(aContent)) && !isNaN(Date.parse(bContent))) {
      return Date.parse(aContent) - Date.parse(bContent) > 0
        ? 1 * direction
        : -1 * direction;
    }

    return aContent > bContent ? 1 * direction : -1 * direction;
  });
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
