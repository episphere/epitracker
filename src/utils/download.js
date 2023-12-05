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

export function downloadElementAsImage(element, fileName, removeAfter=true) {
  const temporaryDiv = document.createElement("div")
  temporaryDiv.style.position = "fixed"
  temporaryDiv.style.left = "-10000px"
  temporaryDiv.style.right = "-10000px"
  temporaryDiv.style.width = "fit-content"
  temporaryDiv.appendChild(element)
  document.body.appendChild(temporaryDiv)

  return new Promise((resolve) => {
    setTimeout(() => {
      html2canvas(element).then(function(canvas) {
        downloadImage(canvas, fileName)
        if (removeAfter) {
          temporaryDiv.remove()
        }
        resolve()
      });
    }, 10)
  })
}

  
function downloadImage(image, fileName) {
  var dataUrl = image.toDataURL();
  var link = document.createElement("a");
  link.href = dataUrl;
  link.download = `${fileName}.png`;
  link.click();
  
}

export function downloadGraph(graphId, fileName) {
  const html = document.getElementById(graphId)
  if (html) {
    downloadElementAsImage(html, fileName)
  }
}

const downloadTableCallback = (e) => (data, headers, fileName, isTsv = false) => {
  console.log({fileName});
  e.stopPropagation();
  toggleLoading('table-loading', 'download-dropdown-btn', true)
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
    toggleLoading('table-loading', 'download-dropdown-btn', false)
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

  if (!data.length) return;
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