export const renderMapVisualizationPage = () => {
    const template = `
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
            
              <div >
                <label for="quantileNumSelect">Quantiles</label>
                <select id="quantileNumSelect" class="form-select mb-2" aria-label="Quantile num select" disabled>
                  <option hidden >Awaiting data...</option>
                </select>
              </div>
            
            </div>
          </div>
        </div>
  
        <div class="col-md-10 px-3">
          <div>
            <div class="tab-pane fade show active px-3 py-5" id="plot-map-pane" role="tabpanel" aria-labelledby="plot-map-tab">
            
              <div id="loader-container" class="d-flex flex-row justify-content-center">
                <div class="spinner-border" role="status">
                </div>
              </div>
            
              <div id="plots-container" class="d-flex flex-row">
                <div id="plot-quantiles"></div>
              </div>
              
            </div>
  
            <div class="tab-pane fade" id="plot-quantile-pane" role="tabpanel" aria-labelledby="plot-quantile-tab">
            </div>
  
          </div>
        </div>
      </div>
    </body>
      `;
    return template;
  };
  