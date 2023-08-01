import { renderTable } from "./table.js";

function paginationOptimizer(pageNumber, pageSize) {
  const pageCategory = Math.ceil(pageSize / 10)
  const pageElements = document.querySelectorAll('.page-item')
  pageElements.forEach(pageEl => {
    const child = pageEl.querySelector('button')
    if (child) {
      const page = Number(child.dataset.page)
      if (!isNaN(page)) {
        const currentCategory = Math.ceil(pageNumber / 10)
        const pageThreshold = page / 10

        if (currentCategory - 1 <= pageThreshold && pageThreshold <= currentCategory) {
          pageEl.classList.add('d-inline-block')
          pageEl.classList.remove('d-none')
        } else {
          pageEl.classList.remove('d-inline-block')
          pageEl.classList.add('d-none')
        }
      }
    }
  })
}

export const paginationHandler = (data, pageSize) => {
  if (!data.length) return;
  const headers = Object.keys(data[0])
  const dataLength = data.length;
  const pages = Math.ceil(dataLength / pageSize);
  const array = [];

  for (let i = 0; i < pages; i++) {
    array.push(i + 1);
  }
  document.getElementById("pages-container").innerHTML = paginationTemplate(array, pageSize);
  addEventPageBTNs(pageSize, data, headers);
};

const addEventPageBTNs = (pageSize, data, headers) => {
  const elements = document.getElementsByClassName("page-link");
  Array.from(elements).forEach((element) => {
    element.addEventListener("click", () => {
      let previous = parseInt(element.dataset.previous);
      let next = parseInt(element.dataset.next);
      let last = parseInt(element.dataset.last);
      let first = parseInt(element.dataset.first);
      
      
      const pageNumber = !isNaN(previous)
        ? previous - 1
        : !isNaN(next)
          ? next + 1
          : !isNaN(last) ? last : !isNaN(first) ? first : parseInt(element.dataset.page);

      const pageLength = Math.ceil(data.length / pageSize)
      if (pageNumber < 1 || pageNumber > pageLength)
        return;

      paginationOptimizer(pageNumber, pageLength)

      if (!element.classList.contains("active-page")) {
        let start = (pageNumber - 1) * pageSize;
        let end = pageNumber * pageSize;
        document.getElementById("previousPage").dataset.previous = pageNumber;
        document.getElementById("nextPage").dataset.next = pageNumber;
        renderTable("map-table", dataPagination(start, end, data));
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

export const paginationTemplate = (array, pageSize) => {
  const pages = array
  let template = `
      <nav aria-label="Page navigation example">
          <ul class="pagination m-0">
            <li class="page-item">
              <button class="page-link transparent-btn" id="first-page" data-first="1" aria-label="First">
                <span aria-hidden="true">First</span>
              </button>
            </li>  
          `;

  pages.forEach((a, i) => {
    if (i === 0) {
      template += `<li class="page-item">
                      <button class="page-link transparent-btn" id="previousPage" data-previous="1" aria-label="Previous">
                      <span aria-hidden="true">&laquo;</span>
                      <span class="sr-only">Previous</span>
                      </button>
                    </li>`;
    }
    template += `<li class="page-item ${i >= 10 ? 'd-none' : 'd-inline-block'}"><button class="page-link transparent-btn ${
      i === 0 ? "active-page" : ""
    }" data-page=${a}>${a}</button></li>`;

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
  template += `
            <li class="page-item">
              <button class="page-link transparent-btn" id="last-page" data-last="${array.length}" aria-label="Last">
                <span aria-hidden="true">Last</span>
              </button>
            </li>
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
