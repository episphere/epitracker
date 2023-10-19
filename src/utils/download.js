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

export function downloadHtmlAsImage(html, fileName, canRemove = true) {
  if (canRemove) {
    html.style.opacity = "1"
    html.style.position = "absolute"
    html.style.zIndex = "-1"
  }

  setTimeout(() => {
    html2canvas(html).then(function(canvas) {
      downloadImage(canvas, fileName, 'png')
      canRemove && html.remove()
    });
  }, 10)
}

export function downloadHtmlAsSVG(html, fileName) {
  html.style.maxHeight = 'initial'
  var svgs = html.getElementsByTagName('svg');
  var serializer = new XMLSerializer();
  let source = serializer.serializeToString(svgs[0]);
  console.log({svgs});
    if(!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)){
        source = '<svg xmlns="http://www.w3.org/2000/svg"';
    }
    if(!source.match(/^<svg[^>]+"http\:\/\/www\.w3\.org\/1999\/xlink"/)){
        source = '<svg xmlns:xlink="http://www.w3.org/1999/xlink"';
    }

    [...svgs[0].attributes].forEach((attr) => {
      if (attr.name === 'height') {
        source += ` ${attr.name}="${attr.value * svgs.length}"`
      } else if (attr.name === 'viewBox') {
        const [,,,height] = attr.value.split(' ')
        const totalHeight = height * svgs.length
        const newValue = attr.value.split(' ')
        newValue.pop()
        const viewBox = newValue.join(' ') + ' ' + totalHeight
        source += ` ${attr.name}="${viewBox}"`
      } else {
        source += ` ${attr.name}="${attr.value}"`
      }
    })
  let svgSource = '<?xml version="1.0" standalone="no"?>\r\n' + source + ' xmlns="http://www.w3.org/2000/svg">';
  [...svgs].forEach((item, index) => {
    
    const height = [...item.attributes].find(attr => attr.name === 'height')
    console.log({item, height});
    svgSource += `<g style="transform: translateY(${height.value * index}px)">`
    const children = [...item.children];

    children.forEach(child => {
      // if ()
      const childSource = serializer.serializeToString(child);
      svgSource += childSource
    })
    svgSource += '</g>'
    console.log({svgSource});
    
    // svgSource += source
  })
  svgSource += '</svg>'
  
  var url = "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svgSource);
  var link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}.svg`;
  link.click();
}

  
function downloadImage(image, fileName, fileExtension) {
  let dataUrl = image.toDataURL();
  var link = document.createElement("a");
  link.href = dataUrl;
  link.download = `${fileName}.${fileExtension}`;
  link.click();
}

export function downloadGraph(graphId, fileName, fileExtension) {
  const html = document.getElementById(graphId)
  if (html) {
    fileExtension === 'svg' 
      ? downloadHtmlAsSVG(html, fileName)
      : downloadHtmlAsImage(html, fileName, false)
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

