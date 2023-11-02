/** @format */

import {
  renderSettingsVisualization,
  SETTINGS,
} from "../components/visualization/settingsVisualization.js";

export const renderMapVisualizationPage = () => {
  let template = /*html*/`
    <div class="container-fluid p-5">
      <div class="row">
        <div class="col-md-2"  id="sidebar">
          <div  class="sticky-top" style="top:50px">
            <div class="card rounded-1">
              <div class="card-header">
                Demographic Options
              </div>
              <div class="card-body">
                <h5 class="">Compare</h5>
      
                <label for="comparePrimarySelect">Row</label>
                <select id="comparePrimarySelect" class="form-select mb-2" disabled aria-label="Compare Primary">
                  <option hidden >Awaiting data...</option>
                </select>
      
                <label for="compareSecondarySelect">Column</label>
                <select id="compareSecondarySelect" class="form-select mb-2" disabled aria-label="Compare Secondary">
                  <option hidden >Awaiting data...</option>
                </select>

                <h5 class="pt-3">Select</h5>

                <label for="yearSelectSelect">Year</label>
                <select id="yearSelectSelect" class="form-select mb-2" disabled aria-label="Year select">
                  <option hidden >Awaiting data...</option>
                </select>

                <label for="causeSelectSelect">Cause</label>
                <select id="causeSelectSelect" class="form-select mb-2" aria-label="Cause select">
                  <option hidden >All</option>
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
                  <select id="stateSelectSelect" class="form-select mb-2" aria-label="State select">
                    <option hidden >All</option>
                  </select>                

                  <div id="county-wrapper">
                    <label for="countySelectSelect">Search County</label>
                    <select id="countySelectSelect" class="form-select mb-2" aria-label="County select">
                      <option hidden >All</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          
  `
  template += renderSettingsVisualization([ SETTINGS.COLOR_SCHEME])
        
  template += /*html*/`
        </div>
        </div>

        <div class="col-md-10 px-3 position-relative" id="main-content">
          <button id="sidebar-toggle" class="btn btn-light position-absolute start-0">
            <i class="fas fa-lg fa-caret-left"></i>
          </button>

          <div class="tab-pane fade show px-4 py-1" id="plot-map-pane" role="tabpanel" aria-labelledby="plot-map-tab">

            <div id="loader-container" class="position-absolute" style="top:50%; left:50%;">
              <div class="spinner-border" role="status"></div>
            </div>

            <div id="plots-container" class="d-flex flex-column pe-2 position-relative">
              <div id="plots-bar" class="d-inline-flex justify-content-between ps-2">
                <div id="color-legend" style="display:inline-block"></div>
                <div class="d-inline-flex align-self-end">
                  <div id="display-mode-control">
                    <ul class="nav nav-pills">
                      <li class="nav-item">
                        <a id="map-nav-link" class="nav-link active"><i class="bi bi-map"></i></a>
                      </li>
                      <li class="nav-item">
                        <a id="table-nav-link" class="nav-link"><i class="bi bi-table"></i></a>
                      </li>
                    <ul>
                  </div> 
                  <div id="group-download-container" ></div>
                </div>
                
              </div>
              <div id="maps-container" class="mt-3 main-plot-panel" style="display: grid"></div>
              <div id="table-container" class="mt-3 main-plot-panel" style="display: none"></div>
            </div>
          </div>
      
        </div>
  `;
  return template;
};
