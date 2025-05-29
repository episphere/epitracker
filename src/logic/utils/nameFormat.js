const names = {
  "fields": {
    "none": "None",
    "race": "Race/Ethnicity",
    "sex": "Sex",
    "county": "County",
    "state": "State",
    "age_group": "Age Group",
    "quantile": "Quantile",
    "quantile_field_name": "County Characteristic",
    "quantile_range": "Quantile Range",
    "cause": "Cause",
  },
  "measures": {
    "age_adjusted_rate": { 
      "name": "Age-Adjusted Mortality Rate (per 100,000)",
      "plot_label": "Age-Adjusted Mortality Rate (per 100,000)",
      "short": "AA Rate",
      "shortish": "Age-Adjusted Rate",
      "verbose":  "Age-Adjusted Cancer Mortality Rate (per 100,000)",
    },
    "crude_rate": {
      "name": "Crude Mortality Rate (per 100,000)",
      "plot_label": "Crude Mortality Rate (per 100,000)",
      "short": "Crude Rate",
      "shortish": "Crude Rate",
      "verbose":  "Crude Cancer Mortality Rate (per 100,000)",
    },
    "age_adjusted_rate_ratio_ref_low": {
      "name": "Age-Adjusted Mortality Rate Ratio (Ref. Low)",
      "plot_label": "Age-Adjusted Mortality Rate Ratio",
      "shortish": "Age-Adjusted Rate Ratio (Ref. Low)",
      "short": "AA Rate Ratio"
    },
    "age_adjusted_rate_ratio_ref_high": {
      "name": "Age-Adjusted Mortality Rate Ratio (Ref. High)",
      "plot_label": "Age-Adjusted Mortality Rate Ratio",
      "shortish": "Age-Adjusted Rate Ratio (Ref. High)",
      "short": "AA Rate Ratio"
    },
    "crude_rate_ratio_ref_low": {
      "name": "Crude Mortality Rate Ratio (Ref. Low)",
      "plot_label": "Crude Mortality Rate Ratio",
      "shortish": "Crude Rate Ratio (Ref. Low)",
      "short": "Crude Rate Ratio"
    },
    "crude_rate_ratio_ref_high": {
      "name": "Crude Mortality Rate Ratio (Ref. High)",
      "plot_label": "Crude Mortality Rate Ratio",
      "shortish": "Crude Rate Ratio (Ref. High)",
      "short": "Crude Rate Ratio"
    },
    "deaths": "Deaths",
    "population": "Population"
  },
  "levels": {
    "state": "State-level",
    "county": "County-level"
  },
  "quantiles": {
    "3": "tertile", 
    "4": "quartile", 
    "5": "quintile", 
    "10": "decile"
  },
  "colorSchemes": {
    "Blues": "Blues (sequential, single-hue)",
    "Greens": "Greens (sequential, single-hue)",
    "Greys": "Greys (sequential, single-hue)",
    "Purples": "Purples (sequential, single-hue)",
    "Reds": "Reds (sequential, single-hue)",
    "Oranges": "Oranges (sequential, single-hue)",
    "Turbo": "Turbo (sequential, multi-hue)",
    "Viridis": "Viridis (sequential, multi-hue)",
    "Magma": "Magma (sequential, multi-hue)",
    "Inferno": "Inferno (sequential, multi-hue)",
    "Plasma": "Plasma (sequential, multi-hue)",
    "Cividis": "Cividis (sequential, multi-hue)",
    "Cubehelix": "Cubehelix (sequential, multi-hue)",
    "Warm": "Warm (sequential, multi-hue)",
    "Cool": "Cool (sequential, multi-hue)",
    "BuGn": "BuGn (sequential, multi-hue)",
    "BuPu": "BuPu (sequential, multi-hue)",
    "GnBu": "GnBu (sequential, multi-hue)",
    "OrRd": "OrRd (sequential, multi-hue)",
    "PuBuGn": "PuBuGn (sequential, multi-hue)",
    "PuBu": "PuBu (sequential, multi-hue)",
    "PuRd": "PuRd (sequential, multi-hue)",
    "RdPu": "RdPu (sequential, multi-hue)",
    "YlGnBu": "YlGnBu (sequential, multi-hue)",
    "YlGn": "YlGn (sequential, multi-hue)",
    "YlOrBr": "YlOrBr (sequential, multi-hue)",
    "YlOrRd": "YlOrRd (sequential, multi-hue)",
    "BrBG": "BrBG (diverging)",
    "PRGn": "PRGn (diverging)",
    "PiYG": "PiYG (diverging)",
    "PuOr": "PuOr (diverging)",
    "RdBu": "RdBu (diverging)",
    "RdGy": "RdGy (diverging)",
    "RdYlBu": "RdYlBu (diverging)",
    "RdYlGn": "RdYlGn (diverging)",
    "Spectral": "Spectral (diverging)",
    "Rainbow": "Rainbow (cyclical)",
    "Sinebow": "Sinebow (cylical)"
  },
  "states": {
    "10": {
      "name": "Delaware",
      "short": "DE"
    },
    "11": {
      "name": "District of Columbia",
      "short": "DC"
    },
    "12": {
      "name": "Florida",
      "short": "FL"
    },
    "13": {
      "name": "Georgia",
      "short": "GA"
    },
    "15": {
      "name": "Hawaii",
      "short": "HI"
    },
    "16": {
      "name": "Idaho",
      "short": "ID"
    },
    "17": {
      "name": "Illinois",
      "short": "IL"
    },
    "18": {
      "name": "Indiana",
      "short": "IN"
    },
    "19": {
      "name": "Iowa",
      "short": "IA"
    },
    "20": {
      "name": "Kansas",
      "short": "KS"
    },
    "21": {
      "name": "Kentucky",
      "short": "KY"
    },
    "22": {
      "name": "Louisiana",
      "short": "LA"
    },
    "23": {
      "name": "Maine",
      "short": "ME"
    },
    "24": {
      "name": "Maryland",
      "short": "MD"
    },
    "25": {
      "name": "Massachusetts",
      "short": "MA"
    },
    "26": {
      "name": "Michigan",
      "short": "MI"
    },
    "27": {
      "name": "Minnesota",
      "short": "MN"
    },
    "28": {
      "name": "Mississippi",
      "short": "MS"
    },
    "29": {
      "name": "Missouri",
      "short": "MO"
    },
    "30": {
      "name": "Montana",
      "short": "MT"
    },
    "31": {
      "name": "Nebraska",
      "short": "NE"
    },
    "32": {
      "name": "Nevada",
      "short": "NV"
    },
    "33": {
      "name": "New Hampshire",
      "short": "NH"
    },
    "34": {
      "name": "New Jersey",
      "short": "NJ"
    },
    "35": {
      "name": "New Mexico",
      "short": "NM"
    },
    "36": {
      "name": "New York",
      "short": "NY"
    },
    "37": {
      "name": "North Carolina",
      "short": "NC"
    },
    "38": {
      "name": "North Dakota",
      "short": "ND"
    },
    "39": {
      "name": "Ohio",
      "short": "OH"
    },
    "40": {
      "name": "Oklahoma",
      "short": "OK"
    },
    "41": {
      "name": "Oregon",
      "short": "OR"
    },
    "42": {
      "name": "Pennsylvania",
      "short": "PA"
    },
    "44": {
      "name": "Rhode Island",
      "short": "RI"
    },
    "45": {
      "name": "South Carolina",
      "short": "SC"
    },
    "46": {
      "name": "South Dakota",
      "short": "SD"
    },
    "47": {
      "name": "Tennessee",
      "short": "TN"
    },
    "48": {
      "name": "Texas",
      "short": "TX"
    },
    "49": {
      "name": "Utah",
      "short": "UT"
    },
    "50": {
      "name": "Vermont",
      "short": "VT"
    },
    "51": {
      "name": "Virginia",
      "short": "VA"
    },
    "53": {
      "name": "Washington",
      "short": "WA"
    },
    "54": {
      "name": "West Virginia",
      "short": "WV"
    },
    "55": {
      "name": "Wisconsin",
      "short": "WI"
    },
    "56": {
      "name": "Wyoming",
      "short": "WY"
    },
    "01": {
      "name": "Alabama",
      "short": "AL"
    },
    "02": {
      "name": "Alaska",
      "short": "AK"
    },
    "04": {
      "name": "Arizona",
      "short": "AZ"
    },
    "05": {
      "name": "Arkansas",
      "short": "AR"
    },
    "06": {
      "name": "California",
      "short": "CA"
    },
    "08": {
      "name": "Colorado",
      "short": "CO"
    },
    "09": {
      "name": "Connecticut",
      "short": "CT"
    }
  },
  "race": {
    "Hispanic": { 
      "formatted": "Hispanic",
      "short": "Hispanic"
    },
    "American Indian or Alaska Native": {
      "formatted": "American Indian \n or Alaska Native",
      "half_short": "American Indian or Alaska Native",
      "short": "AI/AN"
    },
    "Black or African American": {
      "formatted": "Black or \nAfrican American",
      "half_short": "Black or African American",
      "short": "Black or AA"
    },
    "Native Hawaiian or Other Pacific Islander": {
      "formatted": "Native Hawaiian or \n Other Pacific Islander",
      "half_short": "Native Hawaiian or Other Pacific Islander",
      "short": "NHPI"
    },
    "White": {
      "formatted": "White",
      "half_short": "White",
      "short": "White"
    },
    "Asian": {
      "formatted": "Asian",
      "half_short": "Asian",
      "short": "Asian"
    }
  }
}

const nameMappings = new Map([
  ["state_fips", "states"],
  ["measureField", "measures"]
]);

export function formatName(field, value, mode = "name") {
  if (nameMappings.has(field)) {
    field = nameMappings.get(field);
  }
  const valueNames = names[field];
  if (value == null) return valueNames;
  if (!valueNames) return value;
  let name = valueNames[value];
  if (mode == "all") {
    return name;
  }
  if (typeof name == "object") {
    let nameStr = name[mode];
    if (!nameStr) nameStr = name["name"];
    name = nameStr
  } 
  return name ? name : value;
}