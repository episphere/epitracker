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

export const renderTable = (tableID, data, headers) => {
  if (!data.length) return;
  
  const dataTable = document.querySelector(`#${tableID}`);
  console.log(`render table ${tableID}`, {data, headers, dataTable})
  if (dataTable) {
    dataTable.innerHTML = renderTableHeader(headers)
    dataTable.innerHTML += renderTableBody(data, headers)
  }
};