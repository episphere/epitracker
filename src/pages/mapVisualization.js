import { renderSettingsVisualization, SETTINGS } from "../components/visualization/settingsVisualization.js"

export const renderMapVisualizationPage = () => {
  let template = `
    <div class="container-fluid p-5">
      <div class="row">
        <h1 class="mb-4">EpiTracker Cancer</h1> 
      </div>

      
      <div class="row">
        <div class="col-md-2" id="sidebar">
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
              <div id="">
                <label for="measureSelect">Measure</label>
                <select id="measureSelect" class="form-select mb-2" aria-label="Measure select" disabled>
                  <option hidden >Awaiting data...</option>
                </select>

                <label for="levelSelect">Level</label>
                <select id="levelSelect" class="form-select mb-2" aria-label="Level select" disabled>
                  <option hidden >Awaiting data...</option>
                  <option >County</option>
                  <option >State</option>
                </select>

              </div>
            </div>
          </div>
  `
  template += renderSettingsVisualization([SETTINGS.SHOW_HIDE_TABLE])
        
  template += `
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
                    <ul class="navbar-dropdown w-100">
                      <li><button class="transparent-btn dropdown-item dropdown-menu-links" title="Download figure 1 as PNG"
                          id="downloadFigureOnePNG">Figure 1</button></li>
                      <li><button class="transparent-btn dropdown-item dropdown-menu-links" title="Download figure 2 as PNG"
                          id="downloadFigureTwoPNG">Figure 2</button></li>
                      <li><button class="transparent-btn dropdown-item dropdown-menu-links" title="Download figure 3 as PNG"
                          id="downloadFigureThreePNG">Figure 3</button></li>
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
          <div class="tab-pane fade show active px-3 py-5" id="plot-map-pane" role="tabpanel" aria-labelledby="plot-map-tab">

            <div id="loader-container" class="d-flex flex-row justify-content-center">
              <div class="spinner-border" role="status">
              </div>
            </div>

            <div id="plots-container" class="d-none flex-row">
              <div class="position-relative graph">
                <div id="plot-map"></div>
                <div>
                  <p id="map-title">Figure 1. This visualization is showing <b data-map-item="measure">measure</b> for <b data-map-item="selectCause" data-options-key="selectCauseOptions">cause</b> cancer cases for <b data-map-item="selectSex">sex</b> sex <b data-map-item="selectRace">race</b> race at the <b data-map-item="level">level</b> level.</p>
                </div>
              </div>
              <div class="d-flex flex-column gap-5">
                <div class="position-relative graph">
                  <div id="plot-histogram"></div>
                </div>
                  <p id="map-title">Figure 2. This visualization shows <b data-map-item="measure">measure</b> for <b data-map-item="selectCause" data-options-key="selectCauseOptions">cause</b> cancer cases for <b data-map-item="selectSex">sex</b> sex <b data-map-item="selectRace">race</b> race at the <b data-map-item="level">level</b> level.</p>
                <div class="position-relative graph">
                  <div id="plot-demographic"></div>
                </div>
                  <p id="map-title">Figure 3. This visualization shows <b data-map-item="measure">measure</b> for <b data-map-item="selectCause" data-options-key="selectCauseOptions">cause</b> cancer cases for <b data-map-item="selectSex">sex</b> sex <b data-map-item="selectRace">race</b> race at the <b data-map-item="level">level</b> level.</p>
               </div>
            </div>
            </div>
          <div class="row" id="map-table-wrapper" style="display: none;">
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
              <table class="table" id="map-table"></table>
              <div>
              </div>
            </div>
          </div>
        </div>
  `;
  return template;
};
