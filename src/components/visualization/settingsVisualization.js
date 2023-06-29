export const SETTINGS = {
  GRAPH_TYPE: 'graph-type',
  SHOW_HIDE_TABLE: 'show-hide-table',
}

const SETTINGS_CONTENTS = {
  [SETTINGS.GRAPH_TYPE]: {render: getGraphType},
  [SETTINGS.SHOW_HIDE_TABLE]: {render: getShowHideTable},
}

function getGraphType() {
  return `
    <div id="graph-type-wrapper">
      <h6>Graph Types</h6>
      <input type="radio" id="scatter-graph" name="graph-type" value="scatter" checked="checked">
      <label for="scatter-graph">Scatter</label><br>
      <input type="radio" id="line-graph" name="graph-type" value="line">
      <label for="line-graph">Line</label>
    </div>
  `
}

function getShowHideTable() {
  return `
    <div id="show-hide-table-wrapper">
      <label for="show-hide-table">Show/Hide Table</label>
      <input type="checkbox" id="show-hide-table" name="show-hide-table" value="false">
    </div>
  `
}

export function renderSettingsVisualization(settings = []) {
  let template = `
    <div class="card rounded-1 mt-3">
      <div class="card-header">
        Settings
      </div>
      <div class="card-body">
        <div>
  `
  settings.forEach(setting => {
    template += SETTINGS_CONTENTS[setting].render()
  })

  template += `
        </div>
      </div>
    </div>
  `
  return template;
}