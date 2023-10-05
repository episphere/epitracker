export const dictionaryPage = () => {
    let template = `
    <div class="general-bg padding-bottom-1rem">
           <div class="container body-min-height">
              <div class="main-summary-row">
                <div class="align-left">
                  <h1 
                    class="page-header">Epitracker's Dictionary 
                  </h1>
                </div>
           </div>
              <div class="data-submission div-border font-size-18" style="padding-left: 1rem; padding-right: 1rem;">
                The dictionray contains 
              </div>
          <div class="col-md-10 px-3 position-relative" id="main-content">
          <button id="sidebar-toggle" class="btn btn-light position-absolute start-0"><i
              class="fas fa-lg fa-caret-left"></i></button>
          <div class="d-flex flex-row-reverse justify-content-between">
            <div class="ml-auto" id="downloadContainer">
              <div class="col-md-12 p-0 dropdown">
                <button title="Download" class="transparent-btn form-control dropdown-toggle dropdown-btn" type="button"
                  data-bs-toggle="dropdown" id="download-graph-btn" style="color:#000000 !important">
                  Download Graph <span class="download-icon ms-2"><i class="fas fa-download" style="color:#000000 !important"></i></span>
                </button>
                <div class="dropdown-menu overflow-hidden p-0" aria-labelledby="download-graph-btn">
                  <div class="position-relative d-flex align-items-center">
                    <div id="map-loading" class="loading-icon position-absolute top-0 start-0 w-100 h-100" style="display: none;">
                      <div class="top-50 start-50 translate-middle position-absolute">
                        <div class="spinner-border" role="status"></div>
                      </div>
                    </div>
                  </div>
                </div>  
              </div>
            </div>
          </div>
          <div class="dropdown-menu overflow-hidden p-0" aria-labelledby="download-graph-btn">
                    <div class="position-relative d-flex align-items-center">
                      <ul class="navbar-dropdown w-100">
                        <li><button class="transparent-btn dropdown-item dropdown-menu-links" title="Download table as csv"
                            id="download-table-csv">CSV</button></li>
                        <li><button class="transparent-btn dropdown-item dropdown-menu-links" title="Download table as tsv"
                            id="download-table-tsv">TSV</button></li>
                      </ul>
                      <div id="table-loading" class="loading-icon position-absolute top-0 start-0 w-100 h-100" style="display: none;">
                        <div class="top-50 start-50 translate-middle position-absolute">
                          <div class="spinner-border" role="status"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="ml-auto allow-overflow mr-2" style="margin:1rem 0" id="pages-container"></div>
            </div>
            <div class="table-responsive">
              <table class="table" id="table"></table>
              <div>
              </div>
            </div>
          </div>
        </div>
            </div>
          </div>
      `;
  return template;
};