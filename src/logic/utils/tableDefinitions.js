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
  { field: "state", frozen: true, formatAs: "fields" },
  { field: "county", frozen: true, formatAs: "fields"},
  { field: "cause", frozen: true, formatAs: "fields"},
  { field: "race", frozen: true, maxWidth: 250, formatAs: "fields"},
  { field: "sex", frozen: true, formatAs: "fields"},
  { field: "deaths", formatAs: "measures" },
  { field: "population", formatAs: "measures"},
  { field: "crude_rate", formatAs: "measures", formatMode: "shortish"},
  { field: "age_adjusted_rate", formatAs: "measures", formatMode: "shortish"},
  // { field: "state_fips", formatAs: "measures"},
  // { field: "county_fips", formatAs: "measures"},
]