import { hookSelect } from "./input.js"

export const COMPARABLE_FIELDS = ["none", "sex", "race"]
export const SELECTABLE_FIELDS = ["cause", "sex", "race"]

function initSearchSelectInputs(selectInputQueries = [], state) {
  state.choicesInstances = {}
  selectInputQueries.forEach(({ key, options }) => {
    const choicesInstance = new Choices(key, {
      ...options,
      searchEnabled: true, // Enable search functionality
      searchResultLimit: 4,
      itemSelectText: ''
      // renderChoiceLimit: 6
    })
    state.choicesInstances[key.replace('#', '')] = choicesInstance
  })
}

export function hookDemographicInputs(state, searchSelectInputQueries) {
  initSearchSelectInputs(searchSelectInputQueries, state)
  state.defineDynamicProperty("comparePrimaryOptions", COMPARABLE_FIELDS)

  state.defineDynamicProperty("comparePrimary", null)
  state.defineDynamicProperty("compareSecondary", null)
  state.defineDynamicProperty("selectYear", "2020")
  state.defineDynamicProperty("selectCause", "All")
  state.defineDynamicProperty("selectRace", "All")
  state.defineDynamicProperty("selectSex", "All")

  hookSelect("#comparePrimarySelect", state, "comparePrimaryOptions", "comparePrimary")
  hookSelect("#compareSecondarySelect", state, "compareSecondaryOptions", "compareSecondary")
  hookSelect("#yearSelectSelect", state, "selectYearOptions", "selectYear")
  hookSelect("#sexSelectSelect", state, "selectSexOptions", "selectSex")
  hookSelect("#raceSelectSelect", state, "selectRaceOptions", "selectRace")
  hookSelect("#causeSelectSelect", state, "selectCauseOptions", "selectCause", true)

  state.addListener(() => {
    state.compareSecondaryOptions = unique(["none", ...COMPARABLE_FIELDS.filter(d => d != state.comparePrimary)])
    state.comparePrimaryOptions = unique(["none", ...COMPARABLE_FIELDS.filter(d => d != state.compareSecondary)])

    for (const field of SELECTABLE_FIELDS) {
      const element = document.getElementById(field + "SelectSelect")
      if (state.comparePrimary == field || state.compareSecondary == field) {
        element.setAttribute("disabled", "")
      } else {
        element.removeAttribute("disabled")
      }
    }
  }, "comparePrimary", "compareSecondary")

}

export function syncDataDependentInputs(state) {
  state.selectCauseOptions = unique(state.data.filter(d => d.sex == state.selectSex && d.race == state.selectRace),
    d => d.cause).sort().map(d => ({ text: d, value: d }))
  state.selectSexOptions = unique(state.data.filter(d => d.cause == state.selectCause && d.race == state.selectRace),
    d => d.sex)
  state.selectRaceOptions = unique(state.data.filter(d => d.sex == state.selectSex && d.cause == state.selectCause),
    d => d.race)

  if (state.comparePrimary == "race") state.selectRace = "All"
  if (state.comparePrimary == "sex") state.compareSex = "All"
  if (state.comparePrimary == "cause") state.compareCause = "All"
}


function unique(data, accessor = d => d) {
  return [...new Set(data.map(accessor))]
}

export function mapStateAndCounty(stateFips, countyFips, state) {
  const { features: stateFeatures } = state.stateGeo
  const { features: countyFeatures } = state.countyGeo
  const foundedState = stateFeatures.find(item => item.id === stateFips)
  const foundedCounty = countyFeatures.find(item => item.id === countyFips)
  const stateName = foundedState ? foundedState.properties.name : 'All'
  const countyName = foundedCounty ? foundedCounty.properties.name : 'All'

  return { stateName, countyName }
}