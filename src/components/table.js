
//this code defines three functions that work together to render an HTML table dynamically. renderTableHeader generates the table header HTML, renderTableBody generates the table body HTML, and renderTable is the main function that takes the data and renders the table into the specified HTML table element with the provided tableID. The data to be displayed is assumed to be an array of objects, where each object represents a row in the table. The keys of the objects in the 'data' array determine the column headers of the table.
// renderTableHeader function generates an HTML string for the table header based on the provided 'headers' array.
const renderTableHeader = (headers = []) => {
  let headerElement = `<thead>`;
  headers.forEach((item) => {
    headerElement += `<th scope="col">${item}</th>`;
  });
  headerElement += `</thead>`;
  return headerElement;
}

// renderTableBody function generates an HTML string for the table body based on the provided 'data' array and 'headers' array.
const renderTableBody = (data = [], headers = []) => {
  let bodyElement = `<tbody>`;
  data.forEach((item) => {
    let rowData = "";
    headers.forEach((key) => {
      rowData += `<td>${item[key]}</td>`;
    });
    bodyElement += `<tr>${rowData}</tr>`;
  });
  bodyElement += `</tbody>`;
  return bodyElement;
}

// renderTable function is the main table rendering function.
// It takes the 'tableID' representing the ID of the HTML table element to render, and 'data' as the data to display in the table.
export const renderTable = (tableID, data) => {
  // If the 'data' array is empty or undefined, there's no data to render, so return early.
  if (!data.length) return;
  
  // Extract the header column names from the first element of 'data' (assuming all data elements have the same keys).
  const headers = Object.keys(data[0]);

  // Find the HTML table element using the provided 'tableID'.
  const dataTable = document.querySelector(`#${tableID}`);
  
  // If the table element exists in the DOM, proceed with rendering.
  if (dataTable) {
    // Set the table header HTML using the 'headers' array.
    dataTable.innerHTML = renderTableHeader(headers);
    
    // Append the table body HTML using the 'data' array and 'headers' array.
    dataTable.innerHTML += renderTableBody(data, headers);
  }
};
