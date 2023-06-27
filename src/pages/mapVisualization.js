import { renderSettingsVisualization, SETTINGS } from "../components/visualization/settingsVisualization.js"

export const renderMapVisualizationPage = () => {
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

        <div class="col-md-10 px-3">
          <div class="d-flex flex-row-reverse justify-content-between">
            <div class="ml-auto mt-3 mb-3" id="downloadContainer">
                <div class="col-md-12 p-0 dropdown">
                    <button title="Download" class="transparent-btn form-control dropdown-toggle dropdown-btn" type="button" data-bs-toggle="dropdown" id="downloadDictionary" style="color:#000000 !important">
                        Download <i class="fas fa-download" style="color:#000000 !important"></i>
                    </button>
                    <ul class="dropdown-menu navbar-dropdown" aria-labelledby="downloadDictionary">
                        <li><button class="transparent-btn dropdown-item dropdown-menu-links" title="Download dictionary as csv" id="downloadDictionaryCSV">CSV</button></li>
                        <li><button class="transparent-btn dropdown-item dropdown-menu-links" title="Download dictionary as tsv" id="downloadDictionaryTSV">TSV</button></li>
                    </ul>
                </div>
            </div>
          </div>
          <div class="tab-pane fade show active px-3 py-5" id="plot-map-pane" role="tabpanel" aria-labelledby="plot-map-tab">

            <div id="loader-container" class="d-flex flex-row justify-content-center">
              <div class="spinner-border" role="status">
              </div>
            </div>

            <div id="plots-container" class="d-none flex-row">
              <div id="plot-map"></div>
              <div class="d-flex flex-column gap-4">
                <div id="plot-histogram"></div>
                <div id="plot-demographic"></div>
              </div>
            
            </div>
            
          </div>
          
          <div class="row" id="map-table-wrapper" style="display: none;">
            <div class="ml-auto allow-overflow mr-2" style="margin:1rem 0" id="pages-container"></div>
            <div class="tab-pane fade" id="plot-map-pane" role="tabpanel" aria-labelledby="plot-map-tab"></div>
            <div class="table-responsive">
              <table class="table" id="map-table"></table>
            <div>
              <div class="ml-auto mt-3 mb-3 mr-2" id="page-size-container"></div>
          </div>
        </div>
      </div> 
    </div>
  `;
  return template;
};