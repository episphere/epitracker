// Import the 'renderTable' function from the "./table.js" module.
import { renderTable } from "./table.js";
// This function, 'paginationOptimizer', optimizes pagination display based on the 'pageNumber' and 'pageSize'.
 // it calculates the number of pages in each category (group of 10 pages).
 // Gets all elements with class 'page-item' (assumed to represent pagination elements).
 // Iterates through each 'pageEl' (pagination element) found in the document.
function paginationOptimizer(pageNumber, pageSize) {
  const pageCategory = Math.ceil(pageSize / 10);
  const pageElements = document.querySelectorAll('.page-item');
  pageElements.forEach(pageEl => {
    // Get the button child element of each 'pageEl' (assumed to contain the page number as a 'data-page' attribute).
    const child = pageEl.querySelector('button');
    
    // If 'child' exists (i.e., 'pageEl' contains a button element).
    if (child) {
      // Extract the page number from the 'data-page' attribute and convert it to a number.
      const page = Number(child.dataset.page);
      
      // Check if the extracted page number is a valid number.
      if (!isNaN(page)) {
        // Calculate the current category (group of 10 pages) that the 'pageNumber' belongs to.
        const currentCategory = Math.ceil(pageNumber / 10);
        
        // Calculate the page number's category threshold (which category the page belongs to).
        const pageThreshold = page / 10;

        // Check if the current category falls within the threshold of the page's category.
        if (currentCategory - 1 <= pageThreshold && pageThreshold <= currentCategory) {
          pageEl.classList.add('d-inline-block'); // Show the pagination element.
          pageEl.classList.remove('d-none'); // Hide the pagination element.
        } else {
          pageEl.classList.remove('d-inline-block'); // Hide the pagination element.
          pageEl.classList.add('d-none'); // Show the pagination element.
        }
      }
    }
  });
}

/* 
  This function handles pagination for a given 'data' array and 'pageSize'.
  It calculates the total number of pages needed to display the data based on the given 'pageSize'.
  It generates an array 'array' containing the page numbers from 1 to the total number of pages.
  The pagination template is created using 'paginationTemplate' function and sets it as the inner HTML of the element with the ID "pages-container".
  The 'addEventPageBTNs' function is called to add event handlers to the page buttons.
*/
export const paginationHandler = (data, pageSize) => {
  // If the 'data' array is empty or undefined, there's no data to paginate, so return early.
  if (!data.length) return;

  // Extract the header column names from the first element of 'data' (assuming all data elements have the same keys).
  const headers = Object.keys(data[0]);

  // Calculate the total number of data elements in 'data'.
  const dataLength = data.length;

  // Calculate the total number of pages needed to display the data with the given 'pageSize'.
  const pages = Math.ceil(dataLength / pageSize);

  // Initialize an array 'array' to store the page numbers.
  const array = [];

  // Generate the 'array' containing the page numbers from 1 to the total number of pages.
  for (let i = 0; i < pages; i++) {
    array.push(i + 1);
  }

  // Get the element with the ID "pages-container" from the DOM and set its innerHTML with pagination template using 'paginationTemplate' function.
  document.getElementById("pages-container").innerHTML = paginationTemplate(array, pageSize);

  // Call the 'addEventPageBTNs' function to add event handlers to the page buttons.
  addEventPageBTNs(pageSize, data, headers);
};

/* 
  This function adds event handlers to the page buttons for pagination.
  When a page button is clicked, it calculates the new page number based on the clicked button's data attributes.
  If the new page number is valid, it updates the table content and active page indicator accordingly.
*/
const addEventPageBTNs = (pageSize, data, headers) => {
  // Get all elements with class "page-link" (assumed to represent pagination buttons).
  const elements = document.getElementsByClassName("page-link");
  
  // Iterate through each pagination button element and add a click event handler.
  Array.from(elements).forEach((element) => {
    element.addEventListener("click", () => {
      // Extract the data attributes of the clicked button.
      let previous = parseInt(element.dataset.previous);
      let next = parseInt(element.dataset.next);
      let last = parseInt(element.dataset.last);
      let first = parseInt(element.dataset.first);
      
      // Calculate the new page number based on the clicked button's data attributes.
      const pageNumber = !isNaN(previous)
        ? previous - 1
        : !isNaN(next)
          ? next + 1
          : !isNaN(last) ? last : !isNaN(first) ? first : parseInt(element.dataset.page);

      // Calculate the total number of pages.
      const pageLength = Math.ceil(data.length / pageSize);

      // If the new page number is out of range, return early (invalid page number).
      if (pageNumber < 1 || pageNumber > pageLength)
        return;

      // Call the 'paginationOptimizer' function to optimize pagination display based on the new page number.
      paginationOptimizer(pageNumber, pageLength)

      // If the clicked button is not already the active page, update the table content and active page indicator.
      if (!element.classList.contains("active-page")) {
        // Calculate the start and end indices of the data for the new page.
        let start = (pageNumber - 1) * pageSize;
        let end = pageNumber * pageSize;
        
        // Update the 'previousPage' and 'nextPage' buttons' data attributes with the new page number.
        document.getElementById("previousPage").dataset.previous = pageNumber;
        document.getElementById("nextPage").dataset.next = pageNumber;
        
        // Render the table with the data for the new page.
        renderTable("map-table", dataPagination(start, end, data));

        // Remove the "active-page" class from all pagination buttons and add it to the clicked button.
        Array.from(elements).forEach((ele) =>
          ele.classList.remove("active-page")
        );
        document
          .querySelector(`button[data-page="${pageNumber}"]`)
          .classList.add("active-page");
      }
    });
  });
};

/* 
  This function generates a pagination template for displaying page numbers and navigation buttons.
  It constructs a pagination template containing page numbers, "First", "Previous", "Next", and "Last" buttons.
  The 'template' is a string of HTML representing the pagination structure.
*/
export const paginationTemplate = (array, pageSize) => {
  // Initialize the 'pages' array with the provided 'array'.
  const pages = array;

  // Initialize the 'template' with the initial pagination structure.
  let template = `
      <nav aria-label="Page navigation example">
          <ul class="pagination m-0">
            <li class="page-item">
              <button class="page-link transparent-btn" id="first-page" data-first="1" aria-label="First">
                <span aria-hidden="true">First</span>
              </button>
            </li>  
          `;

  // Iterate through each page number in the 'pages' array to construct the pagination structure.
  pages.forEach((a, i) => {
    // Add the "Previous" button for the first page.
    if (i === 0) {
      template += `<li class="page-item">
                      <button class="page-link transparent-btn" id="previousPage" data-previous="1" aria-label="Previous">
                      <span aria-hidden="true">&laquo;</span>
                      <span class="sr-only">Previous</span>
                      </button>
                    </li>`;
    }

    // Add each page number button to the pagination structure.
    template += `<li class="page-item ${i >= 10 ? 'd-none' : 'd-inline-block'}"><button class="page-link transparent-btn ${
      i === 0 ? "active-page" : ""
    }" data-page=${a}>${a}</button></li>`;

    // Add the "Next" button for the last page.
    if (i === pages.length - 1) {
      template += `
          <li class="page-item">
              <button class="page-link transparent-btn" id="nextPage" data-next="1" aria-label="Next">
              <span aria-hidden="true">&raquo;</span>
              <span class="sr-only">Next</span>
              </button>
          </li>`;
    }
  });

  // Add the "Last" button to the pagination structure.
  template += `
            <li class="page-item">
              <button class="page-link transparent-btn" id="last-page" data-last="${array.length}" aria-label="Last">
                <span aria-hidden="true">Last</span>
              </button>
            </li>
          </ul>
      </nav>
  `;

  // Return the generated 'template' as the result of the function.
  return template;
};
/* 
  This function generates a pagination template for selecting page sizes.
  It calculates the content size based on the 'array' length and the 'defaultPageSize'.
  It generates an array of 'pageSizes' based on 'startPageSize' and 'defaultPageSize'.
  The 'template' is constructed using the 'pageSizes' array to create a dropdown select element with options for different page sizes.
*/
export const pageSizeTemplate = (array, startPageSize) => {
  // Calculate the content size based on the length of 'array' and the 'defaultPageSize'.
  const contentSize = Math.ceil(array.length / defaultPageSize) * defaultPageSize;

  // Initialize an array 'pageSizes' to store the available page size options.
  let pageSizes = [];
  
  // Generate the 'pageSizes' array based on 'startPageSize' and 'defaultPageSize'.
  for (let i = startPageSize; i <= contentSize; i += defaultPageSize) {
    pageSizes.push(i);
  }

  // Initialize the 'template' with a <select> element and set its class and ID attributes.
  let template = `
  <select class="form-control" id="pageSizeSelector">`;
  
  // Iterate through each 'size' in 'pageSizes' and add an <option> element to the 'template'.
  pageSizes.forEach((size) => {
    template += `<option value="${size}">${size}</option>`;
  });
 
  template += `</select>
  `;
  return template;
};

/* 
  This function performs data pagination by slicing the 'data' array from the 'start' index to the 'end' index (exclusive).
  It returns a new array containing the sliced portion of 'data'.
*/
export const dataPagination = (start, end, data) => {
  // Use the 'slice' method to create a new array containing the data from 'start' to 'end' (exclusive).
  return data.slice(start, end);
};

