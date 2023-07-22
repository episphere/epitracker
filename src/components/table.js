const renderTableHeader = (headers = []) => {
  let headerElement = `<thead>`
  headers.forEach((item) => {
    headerElement += `<th scope="col">${item}</th>`;
  });
  headerElement += `</thead>`;
  return headerElement
}

const renderTableBody = (data = [], headers = []) => {
  let bodyElement = `<tbody>`
  data.forEach((item) => {
    let rowData = "";
      headers.forEach((key) => {
        rowData += `<td>${item[key]}</td>`;
      });
      bodyElement += `<tr>${rowData}</tr>`;
  });
  bodyElement += `</tbody>`;
  return bodyElement
}

export const renderTable = (tableID, data) => {
  if (!data.length) return;
  const headers = Object.keys(data[0])

  const dataTable = document.querySelector(`#${tableID}`);
  if (dataTable) {
    dataTable.innerHTML = renderTableHeader(headers)
    dataTable.innerHTML += renderTableBody(data, headers)
  }
};