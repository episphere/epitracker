import { renderTable } from "./table.js";

export const paginationHandler = (data, pageSize, headers) => {
  const dataLength = data.length;
  const pages = Math.ceil(dataLength / pageSize);
  const array = [];

  for (let i = 0; i < pages; i++) {
    array.push(i + 1);
  }
  document.getElementById("pages-container").innerHTML = paginationTemplate(array);
  addEventPageBTNs(pageSize, data, headers);
};

const addEventPageBTNs = (pageSize, data, headers) => {
  const elements = document.getElementsByClassName("page-link");
  console.log('page link: 1', {elements})
  Array.from(elements).forEach((element) => {
    element.addEventListener("click", () => {
      let previous = parseInt(element.dataset.previous);
      let next = parseInt(element.dataset.next);
      if (previous && !isNaN(previous) && previous === 1)
        previous = document.querySelectorAll("[data-page]").length + 1;
      if (
        next &&
        !isNaN(next) &&
        next === document.querySelectorAll("[data-page]").length
      )
        next = 0;
      const pageNumber = !isNaN(previous)
        ? previous - 1
        : !isNaN(next)
        ? next + 1
        : element.dataset.page;

      if (pageNumber < 1 || pageNumber > Math.ceil(data.length / pageSize))
        return;

      console.log('page link: 2', element)
      if (!element.classList.contains("active-page")) {
        let start = (pageNumber - 1) * pageSize;
        let end = pageNumber * pageSize;
        document.getElementById("previousPage").dataset.previous = pageNumber;
        document.getElementById("nextPage").dataset.next = pageNumber;
        renderTable("map-table", dataPagination(start, end, data), headers);
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

export const paginationTemplate = (array) => {
  let template = `
      <nav aria-label="Page navigation example">
          <ul class="pagination m-0">`;

  array.forEach((a, i) => {
    if (i === 0) {
      template += `<li class="page-item">
                      <button class="page-link transparent-btn" id="previousPage" data-previous="1" aria-label="Previous">
                      <span aria-hidden="true">&laquo;</span>
                      <span class="sr-only">Previous</span>
                      </button>
                    </li>`;
    }
    template += `<li class="page-item"><button class="page-link transparent-btn ${
      i === 0 ? "active-page" : ""
    }" data-page=${a}>${a}</button></li>`;

    if (i === array.length - 1) {
      template += `
          <li class="page-item">
              <button class="page-link transparent-btn" id="nextPage" data-next="1" aria-label="Next">
              <span aria-hidden="true">&raquo;</span>
              <span class="sr-only">Next</span>
              </button>
          </li>`;
    }
  });
  template += `
          </ul>
      </nav>
  `;
  return template;
};

export const pageSizeTemplate = (array, startPageSize) => {
  const contentSize =
    Math.ceil(array.length / defaultPageSize) * defaultPageSize;
  let pageSizes = [];
  for (let i = startPageSize; i <= contentSize; i += defaultPageSize) {
    pageSizes.push(i);
  }
  let template = `
  <select class="form-control" id="pageSizeSelector">`;
  pageSizes.forEach((size) => {
    template += `<option value="${size}">${size}</option>`;
  });
  template += `</select>
  `;
  return template;
};

export const dataPagination = (start, end, data) => {
  return data.slice(start, end);
};
