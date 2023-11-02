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
            <label for="comparePrimarySelect">Color by</label>
            <select id="comparePrimarySelect" class="form-select mb-2" disabled aria-label="Compare Primary">
              <option hidden >Awaiting data...</option>
            </select>

            <label for="compareSecondarySelect">Sub-plot by</label>
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

            <label for="measureSelect">Measure</label>
            <select id="measureSelect" class="form-select mb-2" aria-label="Measure select" disabled>
              <option hidden >Awaiting data...</option>
            </select>

            <div >
              <label for="quantileFieldSelect">Quantile Field</label>
              <select id="quantileFieldSelect" class="form-select mb-2" aria-label="Quantile field select">
                <option hidden >All</option>
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

  template += renderSettingsVisualization([SETTINGS.GRAPH_TYPE, SETTINGS.START_ZERO])


  template += `
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
          <div id="plots-bar" class="d-inline-flex justify-content-end ps-2">
            
            <div class="d-inline-flex align-self-end">
              <div id="display-mode-control">
                <ul class="nav nav-pills">
                  <li class="nav-item">
                    <a id="graph-nav-link" class="nav-link active"><i class="bi bi-map"></i></a>
                  </li>
                  <li class="nav-item">
                    <a id="table-nav-link" class="nav-link"><i class="bi bi-table"></i></a>
                  </li>
                <ul>
              </div> 
            </div>

            <div class="ml-auto" id="downloadContainer">
              <div class="col-md-12 p-0 dropdown">
                <button title="Download" class="transparent-btn form-control dropdown-toggle dropdown-btn" type="button"
                  data-bs-toggle="dropdown" id="download-dropdown-btn" style="color:#000000 !important">
                  Download <span class="download-icon ms-2"><i class="fas fa-download" style="color:#000000 !important"></i></span>
                </button>
                <div class="dropdown-menu overflow-hidden p-0" aria-labelledby="download-dropdown-btn">
                  <div class="position-relative d-flex align-items-center">
                    <ul class="navbar-dropdown w-100">
                      <li>
                        <button class="transparent-btn dropdown-item dropdown-menu-links" title="download graph as PNG" id="downloadGraph">Download Plot (PNG)</button>
                      </li>
                      <li>
                        <button class="transparent-btn dropdown-item dropdown-menu-links" title="download graph as SVG" id="download-graph-svg">Download Plot (SVG)</button>
                      </li>
                      <li><button class="transparent-btn dropdown-item dropdown-menu-links" title="Download table as csv"
                          id="download-table-csv">Download Data(CSV) </button></li>
                      <li><button class="transparent-btn dropdown-item dropdown-menu-links" title="Download table as tsv"
                          id="download-table-tsv">Download Data (TSV)</button></li>
                      <div id="table-loading" class="loading-icon position-absolute top-0 start-0 w-100 h-100" style="display: none;">
                        <div class="top-50 start-50 translate-middle position-absolute">
                          <div class="spinner-border" role="status"></div>
                        </div>
                      </div>
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
          <div id="graph-container" class="mt-3 main-plot-panel" style="display: grid">
            <figure class="d-flex flex-column" style="gap: 20px; width: fit-content;">
              <div id="plot-legend" class="d-flex" style= "justify-content:flex-end;"></div>
              <p id="plot-title" class="text-center">This graph shows: Year: <b data-quantile-item="selectYear">year</b>, Cause: <b data-quantile-item="selectCause">cause</b><span id="sex-title">, Sex: <b data-quantile-item="selectSex">sex</b></span><span id="race-title" style="display: none">, Race: <b data-quantile-item="selectRace">race</b></span></p>
              <div id="plot-quantiles"></div>
            </figure>
          </div>
          <div id="table-container" class="mt-3 main-plot-panel" style="display: none">
            <div class="row" id="quantile-table-wrapper">
              <div class="d-flex flex-row-reverse justify-content-end">
                
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
  `
  return template

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
            <div>
              <p id="quantiles-title"><b data-quantile-item="quantile">quantile</b></p>
            </div>
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
