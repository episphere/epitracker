export const studyDropDownTemplate = (entries) => {
  let template = "";

  for (let studyId in entries) {
    template += `<li>
                        <label><input type="checkbox" class="chk-box-margin" name="studiesCheckBox" data-study-name="${entries[studyId].name}" value="${studyId}"/>${entries[studyId].name}</label>
                    </li>`;
  }

  return template;
};

export const renderConsortium = () => {
  let obj = JSON.parse(localStorage.data_summary);
  let template = "";
  for (let ID in obj) {
    template += `
                    <li><input type="radio" aria-labelledby="labelConsortia" class="chk-box-margin" name="consortiaCheckBox" value="${ID}"/><label>${obj[ID].name}</label></li>
                    `;
  }
  return template;
};

export const alertTemplate = (className, message) => {
  return `
        <div class="alert ${className} alert-dismissible">
            <a href="#" class="close" data-dismiss="alert" aria-label="close">&times;</a>
            ${message}
        </div>
    `;
};

export const renderForm = () => {
  return `
        <div class="col">
            <form id="consortiaIdForm">
                <label>Consortia Id / Box Folder Id
                    <div class="form-group">
                        <input type="text" class="form-control" required id="boxFolderId" placeholder="Enter Consortia ID / Box Folder ID" title="Consortia ID / Box Folder ID">
                    </div>
                    <div class="form-group">
                        <button id="submit" title="Submit" class="btn btn-light" title="Submit">Submit</button>
                    </div>
                </label>
            </form>
        </div>
    `;
};

export function renderFilePreviewDropdown(files, tab) {
  let template = "";
  if (!Array.isArray(files)) {
    return;
  }
  if (files.length != 0) {
    if (
      tab !== "daccReview" &&
      tab !== "dacctoBeCompleted" &&
      tab !== "completed" &&
      tab !== "decided"
    ) {
      template += `<div class='card-body p-0'>
                <div class='card-title'>
                <label for='${tab}selectedDoc'>
                    <b>Select Concept Form:</b>
                    <div class='text-muted small'>Hold Ctrl to select multiple concept forms </div>
                </label>
                <br>
                <select id='${tab}selectedDoc' multiple size='3'>
            `;
    } else {
      template += `<div class='card-body p-0'>
                <div class='card-title'>
                <label for='${tab}selectedDoc'>
                    <b>Select Concept Form:</b>
                </label>
                <br>
                <select id='${tab}selectedDoc'>`;
    }

    for (const file of files) {
      template += `
                <option value='${file.id}'>
                ${file.name}</option>`;
    }

    template += `
                </select>
                </div>
                </div>  
            </div>`;
  } else {
    template += `
    <br>
              No files to show.    
    </div>
    
    `;
  }

  return template;
}
