import { renderSettingsVisualization, SETTINGS } from "../components/visualization/settingsVisualization.js"

export const renderQuantileVisualizationPage = () => {
  let template = `
  <div class="container-fluid p-5">
    <div class="row">
      <h1 class="mb-4">EpiTracker Cancer</h1>
    </div>
    <div class="row">
      <div class="col-md-2">
        <div class="card rounded-1">
          <div class="card-header">
            Demographic Options
          </div>
          <div class="card-body">
          <h4 class="">Compare</h2>
            <label for="comparePrimarySelect">Compare Primary</label>
            <select id="comparePrimarySelect" class="form-select mb-2" disabled aria-label="Compare Primary">
              <option hidden >Awaiting data...</option>
            </select>

            <label for="compareSecondarySelect">Compare Secondary</label>
            <select id="compareSecondarySelect" class="form-select mb-2" disabled aria-label="Compare Secondary">
              <option hidden >Awaiting data...</option>
            </select>

            <h4 class="pt-3">Select</h2>

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

      <div class="col-md-10 px-3">
        <div class="d-flex flex-row-reverse justify-content-between">
            <div class="ml-auto mt-3 mb-3" id="downloadContainer">
                <div class="col-md-12 p-0 dropdown">
                      <button title="Download" class="transparent-btn form-control dropdown-toggle dropdown-btn" type="button" data-bs-toggle="dropdown" id="downloadDictionary" style="color:#000000 !important">
                          Download Graph<i class="fas fa-download" style="color:#000000 !important"></i>
                      </button>
                      <ul class="dropdown-menu navbar-dropdown" aria-labelledby="downloadDictionary">
                          <li><button class="transparent-btn dropdown-item dropdown-menu-links" title="download figure 1 as PNG" id="quantileDownloadFigureOnePNG">Figure 1</button></li>
                          <li><button class="transparent-btn dropdown-item dropdown-menu-links" title="download figure 2 as PNG" id="quantileDownloadFigureTwoPNG">Figure 2</button></li>
                      </ul>
                </div>
            </div>
          </div>
        <div>
          <div class="tab-pane fade show active px-10 py-10" id="plot-map-pane" role="tabpanel" aria-labelledby="plot-map-tab">
          
            <div id="loader-container" class="d-flex flex-row justify-content-center">
              <div class="spinner-border" role="status">
              </div>
            </div>
          
            <div id="plots-container" class="d-flex flex-row">
               <div class="position-relative graph">
              <div id="plot-quantiles"></div>
            </div>
            <div class="row" id="map-table-wrapper" style="display: none;">
            <div class="d-flex flex-row-reverse justify-content-between">
              <div class="ml-auto mt-3 mb-3" id="downloadContainer">
                  <div class="col-md-12 p-0 dropdown">
                      <button title="Download" class="transparent-btn form-control dropdown-toggle dropdown-btn" type="button" data-bs-toggle="dropdown" id="download-table" style="color:#000000 !important">
                          Download Table<i class="fas fa-download" style="color:#000000 !important"></i>
                      </button>
                      <ul class="dropdown-menu navbar-dropdown" aria-labelledby="downloadTable">
                        <li><button class="transparent-btn dropdown-item dropdown-menu-links" title="Download table as csv" id="download-table-csv-Quantile">CSV</button></li>
                        <li><button class="transparent-btn dropdown-item dropdown-menu-links" title="Download table as tsv" id="download-table-tsv-Qunatile">TSV</button></li>
                      </ul>
                  </div>
              </div>
              <div class="ml-auto allow-overflow mr-2" style="margin:1rem 0" id="pages-container"></div>
            
          </div>

          <div class="tab-pane fade" id="plot-quantile-pane" role="tabpanel" aria-labelledby="plot-quantile-tab">
          </div>

        </div>

        <div class="row" id="quantile-table-wrapper" style="display: none;">
            <div class="ml-auto allow-overflow mr-2" style="margin:1rem 0" id="pages-container"></div>
            <div class="tab-pane fade" id="plot-map-pane" role="tabpanel" aria-labelledby="plot-map-tab"></div>
            <div class="table-responsive">
              <table class="table" id="quantile-table"></table>
            <div>
              <div class="ml-auto mt-3 mb-3 mr-2" id="page-size-container"></div>
          </div>
      </div>
    </div>
  </div>
  
  `;
  return template;
};
