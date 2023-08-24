// An export statement defining a constant object called SETTINGS that contains various properties related to settings, each with a corresponding string value.
export const SETTINGS = {
  GRAPH_TYPE: 'graph-type',
  SHOW_HIDE_TABLE: 'show-hide-table',
  START_ZERO: 'start-zero',
  COLOR_SCHEME: 'RdYlBu',
};
// defining a constant object, SETTINGS_CONTENTS that uses computed property names to map each property from SETTINGS to an object with a 'render' property, which contains a function.
const SETTINGS_CONTENTS = {
  [SETTINGS.GRAPH_TYPE]: { render: getGraphType },
  [SETTINGS.SHOW_HIDE_TABLE]: { render: getShowHideTable },
 // [SETTINGS.SHOW_HIDE_OUTLINE]: { render: getShowHideOutline },
  [SETTINGS.START_ZERO]: { render: getStartZero },
  [SETTINGS.COLOR_SCHEME]: { render: getColorScheme },
};

//The function getGraphType generates and returns an HTML string representing a form-check input with a checkbox and label for 'Show Lines' in the quantile page. 
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
//The function getShowHideTable()generates and returns an HTML string representing a form-check input with a checkbox and label for 'Show table' in both quantile and map pages.
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
// function getShowHideOutline() {
//   return `
//     <div class="form-check">
//       <input class="form-check-input" type="checkbox" value="" id="showOutlineCheck">
//       <label class="form-check-label" for="showOutlineCheck">
//         Show Map's Outline
//       </label>
//     </div>
//   `
// }
//The function getColorScheme() generates and returns an HTML string representing a form-selection input with selection choices and label for 'Scheme select' in both quantile and map pages.

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
//The function getStartZero() generates and returns an HTML string representing a form-check input with a checkbox and label for 'start zero' on the quantile graph.
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
// This function takes an optional array of setting names as 'settings'.
// It generates an HTML string representing a visualization of the settings provided in the 'settings' array.
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