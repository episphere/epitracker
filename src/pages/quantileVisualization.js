import { renderSettingsVisualization, SETTINGS } from "../components/visualization/settingsVisualization.js"

export const renderQuantileVisualizationPage = () => {
  let template = `
  <div class="container-fluid p-5">
    <div class="row">
      <div class="col-md-2" id="sidebar">
        <div class="card rounded-1">
          <div class="card-header">
            Demographic Options
          </div>
          <div class="card-body">
          <h5 class="">Compare</h5>
            <label for="comparePrimarySelect">Primary</label>
            <select id="comparePrimarySelect" class="form-select mb-2" disabled aria-label="Compare Primary">
              <option hidden >Awaiting data...</option>
            </select>

            <label for="compareSecondarySelect">Secondary</label>
            <select id="compareSecondarySelect" class="form-select mb-2" disabled aria-label="Compare Secondary">
              <option hidden >Awaiting data...</option>
            </select>

            <h5 class="pt-3">Select</h5>

            <label for="yearSelectSelect">Year</label>
              <select id="yearSelectSelect" class="form-select mb-2" disabled aria-label="Year select">
                <option hidden >Awaiting data...</option>
            </select>

            <label for="causeSelectSelect">Cause</label>
            <select id="causeSelectSelect" class="form-select mb-2" disabled aria-label="Cause select">
              <option hidden >Awaiting data...</option>
            </select>

            <label for="sexSelectSelect">Sex</label>
            <select id="sexSelectSelect" class="form-select mb-2" disabled aria-label="Sex select">
              <option hidden >Awaiting data...</option>
            </select>

            <label for="raceSelectSelect">Race</label>
            <select id="raceSelectSelect" class="form-select mb-2" disabled aria-label="Race select">
              <option hidden >Awaiting data...</option>
            </select>
          </div>
        </div>

        <div class="card rounded-1 mt-3">
          <div class="card-header">
            Other Options
          </div>
          <div class="card-body">

            <label for="measureSelect">Measure</label>
            <select id="measureSelect" class="form-select mb-2" aria-label="Measure select" disabled>
              <option hidden >Awaiting data...</option>
            </select>

            <div >
              <label for="quantileFieldSelect">Quantile Field</label>
              <select id="quantileFieldSelect" class="form-select mb-2" aria-label="Quantile field select" disabled>
                <option hidden >Awaiting data...</option>
              </select>
            </div>
          
            <div>
              <label for="quantileNumSelect">Quantiles</label>
              <select id="quantileNumSelect" class="form-select mb-2" aria-label="Quantile num select" disabled>
                <option hidden >Awaiting data...</option>
              </select>
            </div>
          
          </div>
        </div>
  `

  template += renderSettingsVisualization([SETTINGS.GRAPH_TYPE, SETTINGS.SHOW_HIDE_TABLE])

  template += `
    </div>
    <div class="col-md-10 px-3 position-relative" id="main-content">
      <button id="sidebar-toggle" class="btn btn-light position-absolute start-0"><i class="fas fa-lg fa-caret-left"></i></button> 
    <div class="d-flex flex-row-reverse justify-content-between">
      <div class="ml-auto mt-3 mb-3" id="downloadContainer">
        <div class="col-md-12 p-0 dropdown">
          <button title="Download" class="transparent-btn form-control dropdown-toggle dropdown-btn" type="button"
            data-bs-toggle="dropdown" id="download-graph-btn" style="color:#000000 !important">
            Download Graph <span class="download-icon ms-2"><i class="fas fa-download" style="color:#000000 !important"></i></span>
          </button>
          <div class="dropdown-menu overflow-hidden p-0" aria-labelledby="download-graph-btn">
            <div class="position-relative d-flex align-items-center">
              <ul class="navbar-dropdown w-100">
                <li>
                  <button class="transparent-btn dropdown-item dropdown-menu-links" title="download figure 1 as PNG" id="downloadFigureOnePNG">Figure 1</button>
                </li>
              </ul>
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
    <div>
      <div class="tab-pane fade show px-10 py-10" id="plot-map-pane" role="tabpanel"
        aria-labelledby="plot-map-tab">
  
       
  
        <div id="plots-container" class="d-flex flex-column">
         

          <div class="position-relative graph mb-5 mx-4"  style="height: fit-content">
            <div id="loader-container" class="position-absolute" style="top:50%; left:50%;">
              <div class="spinner-border" role="status">
              </div>
            </div>

            <figure class="d-flex flex-column" style="gap: 20px; width: fit-content;">
              <div id="plot-legend" class="d-flex" style= "justify-content:flex-end;"></div>
              <div id="plot-quantiles"></div>
            </figure>
          </div>
  
  
          <div class="row" id="quantile-table-wrapper" style="display: none;">
            <div class="d-flex flex-row-reverse justify-content-between">
              <div class="ml-auto mt-3 mb-3" id="downloadContainer">
                <div class="col-md-12 p-0 dropdown">
                  <button title="Download" class="transparent-btn form-control dropdown-toggle dropdown-btn" type="button"
                    data-bs-toggle="dropdown" id="download-table-btn" style="color:#000000 !important">
                    Download Table<span class="download-icon ms-2"><i class="fas fa-download" style="color:#000000 !important"></i></i>
                  </button>
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
              <table class="table" id="quantile-table"></table>
              <div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  `;
  return template;
};
