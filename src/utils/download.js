export function downloadHtmlAsImage(html, fileName) {
  html2canvas(html).then(function(canvas) {
    downloadImage(canvas, fileName)
  });
}
  
function downloadImage(image, fileName) {
  var dataUrl = image.toDataURL();
  var link = document.createElement("a");
  link.href = dataUrl;
  link.download = `${fileName}.jpg`;
  link.click();
}

export function downloadGraph(graphId, fileName) {
  const html = document.querySelector(`#${graphId}`)
  if (html) {
    downloadHtmlAsImage(html, fileName)
  }
}