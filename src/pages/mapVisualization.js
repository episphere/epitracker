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
      
                <label for="select-compare-row">Row</label>
                <select id="select-compare-row" class="form-select mb-2" disabled aria-label="Compare Primary">
                  <option hidden >Awaiting data...</option>
                </select>
      
                <label for="select-compare-column">Column</label>
                <select id="select-compare-column" class="form-select mb-2" disabled aria-label="Compare Secondary">
                  <option hidden >Awaiting data...</option>
                </select>

                <h5 class="pt-3">Select</h5>

                <label for="select-select-year">Year</label>
                <select id="select-select-year" class="form-select mb-2" disabled aria-label="Year select">
                  <option hidden >Awaiting data...</option>
                </select>

                <label for="select-select-cause">Cause</label>
                <select id="select-select-cause" class="form-select mb-2" disabled aria-label="Cause select">
                  <option hidden >Awaiting data...</option>
                </select>

                <label for="select-select-sex">Sex</label>
                <select id="select-select-sex" class="form-select mb-2" disabled aria-label="Sex select">
                  <option hidden >Awaiting data...</option>
                </select>

                <label for="select-select-race">Race</label>
                <select id="select-select-race" class="form-select mb-2" disabled aria-label="Race select">
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
                  <label for="select-measure">Measure</label>
                  <select id="select-measure" class="form-select mb-2" aria-label="Measure select" disabled>
                    <option hidden >Awaiting data...</option>
                  </select>

                  <label for="select-level">Spatial Level</label>
                  <select id="select-level" class="form-select mb-2" aria-label="Level select" disabled>
                    <option hidden >Awaiting data...</option>
                    <option >County</option>
                    <option >State</option>
                  </select>

                  <label for="select-state">State</label>
                  <select id="select-state" class="form-select mb-2" disabled aria-label="State select">
                    <option hidden >Awaiting data...</option>
                  </select>

                  <div id="county-wrapper">
                    <label for="select-county">County</label>
                    <select id="select-county" class="form-select mb-2" disabled aria-label="County select">
                      <option hidden >Awaiting data...</option>
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
              <div id="maps-container" class="mt-3 main-plot-panel">
                <div id="graph-title"></div>
                <div id="map-grid" style="display: grid"></div>
              </div>
              <div id="table-container" class="mt-3 main-plot-panel" style="display: none"></div>
            </div>
          </div>
      
        </div>
  `;
  return template;
};
