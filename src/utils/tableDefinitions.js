export const quantileTableColumns = [
  { field: "cause", frozen: true},
  { field: "race", frozen: true, maxWidth: 250},
  { field: "sex", frozen: true},
  { field: "quantile_field", frozen: true},
  { field: "quantile", frozen: true},
  { field: "quantile_range", frozen: true},
  { field: "deaths"},
  { field: "population"},
  { field: "crude_rate"},
  { field: "age_adjusted_rate"},
]

export const demographicTableColumns = [
  { field: "cause", frozen: true},
  { field: "race", frozen: true, maxWidth: 250},
  { field: "sex", frozen: true},
  { field: "age_group", frozen: true, formatter: "html"},
  { field: "deaths"},
  { field: "population"},
  { field: "crude_rate"},
  { field: "age_adjusted_rate"},
]

export const mapTableColumns = [
  { field: "state", frozen: true},
  { field: "county", frozen: true},
  { field: "cause", frozen: true},
  { field: "race", frozen: true, maxWidth: 250},
  { field: "sex", frozen: true},
  { field: "deaths"},
  { field: "population"},
  { field: "crude_rate"},
  { field: "age_adjusted_rate"},
  { field: "state_fips"},
  { field: "county_fips"},
]