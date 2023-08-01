export const SETTINGS = {
  GRAPH_TYPE: 'graph-type',
  SHOW_HIDE_TABLE: 'show-hide-table',
  START_ZERO: 'start-zero',
  COLOR_SCHEME: 'RdYlBu',
}

const SETTINGS_CONTENTS = {
  [SETTINGS.GRAPH_TYPE]: {render: getGraphType},
  [SETTINGS.SHOW_HIDE_TABLE]: {render: getShowHideTable},
  [SETTINGS.START_ZERO]: {render: getStartZero},
  [SETTINGS.COLOR_SCHEME]: {render: getColorScheme}
}

function getGraphType() {
  return `
    <div class="form-check">
      <input class="form-check-input" type="checkbox" value="" id="showLinesCheck">
      <label class="form-check-label" for="showLinesCheck">
        Show Lines
      </label>
    </div>
  `
}

function getShowHideTable() {
  return `
    <div class="form-check">
      <input class="form-check-input" type="checkbox" value="" id="showTableCheck">
      <label class="form-check-label" for="showTableCheck">
        Show Table
      </label>
    </div>
  `
}

function getColorScheme() {
  return `
  <div>
  <label for="schemeSelect">Color Scheme</label>
  <select id="schemeSelect" class="form-select mb-2" aria-label="Scheme select" disabled>
    <option hidden >Awaiting data...</option>
  </select>
  </div>
  `
}

function getStartZero() {
  return `
    <div class="form-check">
      <input checked class="form-check-input" type="checkbox" value="" id="startZeroCheck">
      <label class="form-check-label" for="startZeroCheck">
        Start Y at 0
      </label>
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