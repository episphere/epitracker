import {json2other} from "./../shared.js";

export function toggleLoading(spinnerId, downloadId, isShow) {
  const spinner = document.getElementById(spinnerId)
  const downloadButton = document.getElementById(downloadId)
  const downloadIcon = downloadButton.querySelector('.download-icon')
  if (downloadIcon) {
    isShow 
      ? downloadIcon.classList.add('fade-in')
      : downloadIcon.classList.remove('fade-in')
  }
  if (spinner) {
    spinner.style.display = isShow ? "block" : "none"
  }
}

export function downloadHtmlAsImage(html, fileName) {
  toggleLoading('map-loading', 'download-graph-btn', true)

  setTimeout(() => {
    html2canvas(html).then(function(canvas) {
      downloadImage(canvas, fileName)
      toggleLoading('map-loading', 'download-graph-btn', false)
    });
  }, 10)
}
  
function downloadImage(image, fileName) {
  var dataUrl = image.toDataURL();
  var link = document.createElement("a");
  link.href = dataUrl;
  link.download = `${fileName}.jpg`;
  link.click();
  
}

export function downloadGraph(graphId, fileName) {
  const html = document.getElementById(graphId)
  if (html) {
    downloadHtmlAsImage(html, fileName)
  }
}

const downloadTableCallback = (e) => (data, headers, fileName, isTsv = false) => {
  e.stopPropagation();
  toggleLoading('table-loading', 'download-table-btn', true)
  setTimeout(() => {
    const type = isTsv ? 'tsv' : 'csv';
    const content =
      `data:text/${type};charset=utf-8,`+
      json2other(data, headers, isTsv).replace(/(<b>)|(<\/b>)/g, "");
    const encodedUri = encodeURI(content);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${fileName}.${type}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toggleLoading('table-loading', 'download-table-btn', false)
  }, 1000)
  
}

const downloadFileRef = {
  csvButton: null, 
  csvCallback: null,
  tsvButton: null, 
  tsvCallback: null,
}

const removeDownloadEventListeners = () => {
  if (downloadFileRef.csvButton) {
    downloadFileRef.csvButton.removeEventListener('click', downloadFileRef.csvCallback)
  }
  if (downloadFileRef.tsvButton) {
    downloadFileRef.tsvButton.removeEventListener('click', downloadFileRef.tsvCallback)
  }
}

export const downloadFiles = (data, fileName) => {
  removeDownloadEventListeners()
  if (!Array.isArray(data)) return;
  const headers = Object.keys(data[0])
  
  const downloadTableCSV = (e) => downloadTableCallback(e)(data, headers, fileName, false)
  const downloadTableTSV = (e) => downloadTableCallback(e)(data, headers, fileName, true)


  const downloadCSVButton = document.getElementById(
    "download-table-csv"
  );

  if (downloadCSVButton) {
    downloadCSVButton.addEventListener("click", downloadTableCSV);
    downloadFileRef.csvButton = downloadCSVButton
    downloadFileRef.csvCallback = downloadTableCSV
  }
  

  const downloadTSVButton = document.getElementById(
    "download-table-tsv"
  );

  if (downloadTSVButton) {
    downloadTSVButton.addEventListener("click", downloadTableTSV);
    downloadFileRef.tsvButton = downloadTSVButton
    downloadFileRef.tsvCallback = downloadTableTSV
  }
};