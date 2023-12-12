/** @format */

import {
   renderSettingsVisualization,
  SETTINGS,
  } from "../components/visualization/settingsVisualization.js";
  
  export const renderDemographicVisualizationPage = () => {
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
                    <label for="ageGroupsSelect">Age Groups</label>
                    <select id="ageGroupsSelect" class="form-select mb-2" aria-label="Level select">
                      <option hidden >Awaiting data...</option>
                    </select>
  
                    <label for="stateSelectSelect">Search State</label>
                    <select id="stateSelectSelect" class="form-select mb-2" aria-label="State select">
                      <option hidden >Awaiting data...</option>
                    </select>
                  </div>
                </div>
              </div>
    `
    template += renderSettingsVisualization([ SETTINGS.COLOR_SCHEME])
          
    template += /*html*/`
          </div>
        </div>
    `;
    return template;
  };
  

