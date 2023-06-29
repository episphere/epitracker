export function downloadHtmlAsImage(html, fileName) {
    const {offsetWidth:width, offsetHeight: height} = html
  
    var data = `
      data:image/svg+xml;charset=utf-8, 
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">
    ` +
    htmlToXml(html.innerHTML) +
    `</foreignObject></svg>`;
  
    var img = new Image();
    img.src = data;
    img.onload = function() {
      const canvas = document.createElement('canvas');
      canvas.height = height
      canvas.width = width
      canvas.getContext('2d').drawImage(img, 0, 0);
      downloadImage(canvas, fileName)
    }
  }
  
  function htmlToXml(html) {
    var doc = document.implementation.createHTMLDocument('');
    doc.write(html);
  
    doc.documentElement.setAttribute('xmlns', doc.documentElement.namespaceURI);
  
    html = (new XMLSerializer).serializeToString(doc.body);
    return html;
  }
  
  function downloadImage(image, fileName) {
    var dataUrl = image.toDataURL();
    var link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${fileName}.jpg`;
    link.click();
  }
  