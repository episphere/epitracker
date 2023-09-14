/** @format */

import {
  renderSettingsVisualization,
  SETTINGS,
} from "../components/visualization/settingsVisualization.js";

export const renderMapVisualizationPage = () => {
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

                <label for="stateSelectSelect">Search State</label>
                <select id="stateSelectSelect" class="form-select mb-2" disabled aria-label="State select">
                  <option hidden >Awaiting data...</option>
                </select>

                <div id="county-wrapper">
                  <label for="countySelectSelect">Search County</label>
                  <select id="countySelectSelect" class="form-select mb-2" disabled aria-label="County select">
                    <option hidden >Awaiting data...</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
  `;
  template += renderSettingsVisualization([
    SETTINGS.SHOW_HIDE_TABLE,
    SETTINGS.SHOW_HIDE_OUTLINE,
    SETTINGS.COLOR_SCHEME,
  ]);

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
                      <li><button class="transparent-btn dropdown-item dropdown-menu-links" title="Download all figures as PNG"
                          id="downloadAllFiguresPNG">All Figures</button></li>
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
          <div class="tab-pane fade show px-3 py-5" id="plot-map-pane" role="tabpanel" aria-labelledby="plot-map-tab">

            <div id="loader-container" class="position-absolute" style="top:50%; left:50%;">
              <div class="spinner-border" role="status">
              </div>
            </div>

            <div id="plots-container" class="d-flex flex-row">
              <div class="position-relative graph" id="plot-map-container">
                <div style="display: flex; flex-direction: column; justify-content:center; flex-end; margin-bottom: 12px; margin-left: 8px;">
                <span class="label">Zoom in/out on the map</span>
                   <label class="switch">
                   <input type="checkbox" id="lock-map">
                   <span class="slider round"></span>
                    </label>
                </div>
                <div id="plot-map"></div>
                <div>
                  <p id="map-title">Figure 1. Map of <b data-map-item="measure">measure</b> <b data-map-item="level">level</b> level <b data-map-item="selectCause" data-options-key="selectCauseOptions">cause</b>-cause cancer morality rates for <b data-map-item="selectSex">sex</b> sex of <b data-map-item="selectRace">race</b> race and ethnitic groups, <b data-map-item="selectYear">Year</b>.</p>
                </div>
              </div>
              <div class="d-flex flex-column gap-5">
                <div id="plot-histogram-container">
                  <div class="position-relative graph">
                    <div id="plot-histogram"></div>
                  </div>
                     <p id="histogram-title">Figure 2. Histogram showing the frequency of <b data-map-item="measure">measure</b> <b data-map-item="level">level</b> level <b data-map-item="selectCause" data-options-key="selectCauseOptions">cause</b>-cause cancer morality rates for <b data-map-item="selectSex">sex</b> sex of <b data-map-item="selectRace">race</b> race and ethnitic groups, <b data-map-item="selectYear">Year</b>.</p>
                </div>
                <div id="plot-demographic-container">
                  <div class="position-relative graph">
                    <div id="plot-demographic"></div>
                  </div>
                  <p id="demographic-title">Figure 3. <b data-map-item="measure">measure</b> <b data-map-item="selectCause" data-options-key="selectCauseOptions">cause</b> cancer morality rate by <b data-map-item="selectSex">sex</b> sex, <b data-map-item="selectRace">race</b> race and ethnicity, <b data-map-item="selectYear">Year</b>.</p>
                </div>
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
