const names = {
  "fields": {
    "none": "None",
    "race": "Race/Ethnicity",
    "sex": "Sex",
    "county": "County",
    "state": "State",
    "age_group": "Age Group"
  },
  "measures": {
    "age_adjusted_rate": { 
      "name": "Age-Adjusted Mortality Rate (per 100,000)",
      "short": "AA Rate"
    },
    "crude_rate": {
      "name": "Crude Mortality Rate (per 100,000)",
      "short": "Crude Rate"
    },
    "age_adjusted_rate_ratio (ref=low)": "Age-Adjusted Rate Ratio (Ref=Low)",
    "age_adjusted_rate_ratio (ref=high)": "Age-Adjusted Rate Ratio (Ref=High)",
    "crude_rate_ratio(ref=low)": "Crude Rate Ratio (Ref=Low)",
    "crude_rate_ratio (ref=high)": "Crude Rate Ratio (Ref=High)",
    "deaths": "Deaths",
    "population": "Population"
  },
  "levels": {
    "state": "State-level",
    "county": "County-level"
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
  "quantile_fields": {
    "premature_death": {
      "measure": "Premature death",
      "description": "Years of potential life lost before age 75 per 100,000 population (age-adjusted).",
      "unit": "Year"
    },
    "poor_or_fair_health": {
      "measure": "Poor or fair health",
      "description": "Percentage of adults reporting fair or poor health (age-adjusted).",
      "unit": "Proportion"
    },
    "poor_physical_health_days": {
      "measure": "Poor physical health days",
      "description": "Average number of physically unhealthy days reported in past 30 days (age-adjusted).",
      "unit": "Days"
    },
    "poor_mental_health_days": {
      "measure": "Poor mental health days",
      "description": "Average number of mentally unhealthy days reported in past 30 days (age-adjusted).",
      "unit": "Days"
    },
    "low_birthweight": {
      "measure": "Low birthweight",
      "description": "Percentage of live births with low birthweight (&lt; 2,500 grams).",
      "unit": "Proportion"
    },
    "adult_smoking": {
      "measure": "Adult smoking",
      "description": "Percentage of adults who are current smokers.",
      "unit": "Proportion"
    },
    "adult_obesity": {
      "measure": "Adult obesity",
      "description": "Percentage of the adult population (age 20 and older) that reports a body mass index (BMI) greater than or equal to 30 kg/m2.",
      "unit": "Proportion"
    },
    "food_environment_index": {
      "measure": "Food environment index",
      "description": "Index of factors that contribute to a healthy food environment, from 0 (worst) to 10 (best).",
      "unit": "Food Environment Index (0-10)"
    },
    "physical_inactivity": {
      "measure": "Physical inactivity",
      "description": "Percentage of adults age 20 and over reporting no leisure-time physical activity.",
      "unit": "Proportion"
    },
    "access_to_exercise_opportunities": {
      "measure": "Access to exercise opportunities",
      "description": "Percentage of population with adequate access to locations for physical activity.",
      "unit": "Proportion"
    },
    "excessive_drinking": {
      "measure": "Excessive drinking",
      "description": "Percentage of adults reporting binge or heavy drinking.",
      "unit": "Proportion"
    },
    "alcohol_impaired_driving_deaths": {
      "measure": "Alcohol-impaired driving deaths",
      "description": "Percentage of driving deaths with alcohol involvement.",
      "unit": "Proportion"
    },
    "sexually_transmitted_infections": {
      "measure": "Sexually transmitted infections",
      "description": "Number of newly diagnosed chlamydia cases per 100,000 population.",
      "unit": "per 100,000"
    },
    "teen_births": {
      "measure": "Teen births",
      "description": "Number of births per 1,000 female population ages 15-19.",
      "unit": "per 1,000"
    },
    "uninsured": {
      "measure": "Uninsured",
      "description": "Percentage of population under age 65 without health insurance.",
      "unit": "Proportion"
    },
    "primary_care_physicians": {
      "measure": "Primary care physicians",
      "description": "Number of primary care physicians per 100,000 population",
      "unit": "Rate per 100,000"
    },
    "dentists": {
      "measure": "Dentists",
      "description": "Number of dentists per 100,000 population",
      "unit": "per 100,000"
    },
    "mental_health_providers": {
      "measure": "Mental health providers",
      "description": "Number of mental health care providers per 100,000 population",
      "unit": "per 100,000"
    },
    "preventable_hospital_stays": {
      "measure": "Preventable hospital stays",
      "description": "Rate of hospital stays for ambulatory-care sensitive conditions per 100,000 Medicare enrollees.",
      "unit": "per 100,000"
    },
    "diabetes_monitoring": {
      "measure": "Diabetes monitoring"
    },
    "mammography_screening": {
      "measure": "Mammography screening",
      "description": "Percentage of female Medicare enrollees ages 65-74 that received an annual mammography screening.",
      "unit": "Proportion"
    },
    "high_school_graduation": {
      "measure": "High school graduation",
      "description": "Percentage of ninth-grade cohort that graduates in four years.",
      "unit": "Proportion"
    },
    "some_college": {
      "measure": "Some college",
      "description": "Percentage of adults ages 25-44 with some post-secondary education.",
      "unit": "Proportion"
    },
    "unemployment": {
      "measure": "Unemployment",
      "description": "Percentage of population ages 16 and older unemployed but seeking work.",
      "unit": "Proportion"
    },
    "children_in_poverty": {
      "measure": "Children in poverty",
      "description": "Percentage of people under age 18 in poverty.",
      "unit": "Proportion"
    },
    "income_inequality": {
      "measure": "Income inequality",
      "description": "Ratio of household income at the 80th percentile to income at the 20th percentile.",
      "unit": "Ratio (80th/20th)"
    },
    "children_in_single_parent_households": {
      "measure": "Children in single-parent households",
      "description": "Percentage of children that live in a household headed by single parent.",
      "unit": "Proportion"
    },
    "social_associations": {
      "measure": "Social associations",
      "description": "Number of membership associations per 10,000 population.",
      "unit": "per 100,000"
    },
    "violent_crime": {
      "measure": "Violent crime",
      "description": "Number of reported violent crime offenses per 100,000 population.",
      "unit": "per 100,000"
    },
    "injury_deaths": {
      "measure": "Injury deaths",
      "description": "Number of deaths due to injury per 100,000 population.",
      "unit": "per 100,000"
    },
    "air_pollution_particulate_matter": {
      "measure": "Air pollution - particulate matter",
      "description": "Average daily density of fine particulate matter in micrograms per cubic meter (PM2.5).",
      "unit": "PM2.5 Concentration (µg/m³)"
    },
    "drinking_water_violations": {
      "measure": "Drinking water violations",
      "description": "Indicator of the presence of health-related drinking water violations. 0=No, 1=Yes",
      "unit": "Violation Indicator (0/1)"
    },
    "severe_housing_problems": {
      "measure": "Severe housing problems",
      "description": "Percentage of households with at least 1 of 4 housing problems: overcrowding, high housing costs, lack of kitchen facilities, or lack of plumbing facilities.",
      "unit": "Proportion"
    },
    "driving_alone_to_work": {
      "measure": "Driving alone to work",
      "description": "Percentage of the workforce that drives alone to work.",
      "unit": "Proportion"
    },
    "long_commute_driving_alone": {
      "measure": "Long commute - driving alone",
      "description": "Among workers who commute in their car alone, the percentage that commute more than 30 minutes.",
      "unit": "Proportion"
    },
    "premature_age_adjusted_mortality": {
      "measure": "Premature age-adjusted mortality",
      "description": "Number of deaths among residents under age 75 per 100,000 population (age-adjusted).",
      "unit": "per 100,000"
    },
    "child_mortality": {
      "measure": "Child mortality",
      "description": "Number of deaths among children under age 18 per 100,000 population."
    },
    "infant_mortality": {
      "measure": "Infant mortality",
      "description": "Number of all infant deaths (within 1 year), per 1,000 live births."
    },
    "frequent_physical_distress": {
      "measure": "Frequent physical distress",
      "description": "Percentage of adults reporting 14 or more days of poor physical health per month.",
      "unit": "Proportion"
    },
    "frequent_mental_distress": {
      "measure": "Frequent mental distress",
      "description": "Percentage of adults reporting 14 or more days of poor mental health per month.",
      "unit": "Proportion"
    },
    "diabetes_prevalence": {
      "measure": "Diabetes prevalence",
      "description": "Percentage of adults aged 20 and above with diagnosed diabetes.",
      "unit": "Proportion"
    },
    "hiv_prevalence": {
      "measure": "HIV prevalence",
      "description": "Number of people aged 13 years and older living with a diagnosis of human immunodeficiency virus (HIV) infection per 100,000 population."
    },
    "food_insecurity": {
      "measure": "Food insecurity",
      "description": "Percentage of population who lack adequate access to food.",
      "unit": "Proportion"
    },
    "limited_access_to_healthy_foods": {
      "measure": "Limited access to healthy foods",
      "description": "Percentage of population who are low-income and do not live close to a grocery store.",
      "unit": "Proportion"
    },
    "drug_overdose_deaths": {
      "measure": "Drug overdose deaths",
      "description": "Number of drug poisoning deaths per 100,000 population."
    },
    "drug_overdose_deaths_modeled": {
      "measure": "Drug overdose deaths - modeled"
    },
    "motor_vehicle_crash_deaths": {
      "measure": "Motor vehicle crash deaths",
      "description": "Number of motor vehicle crash deaths per 100,000 population."
    },
    "insufficient_sleep": {
      "measure": "Insufficient sleep",
      "description": "Percentage of adults who report fewer than 7 hours of sleep on average.",
      "unit": "Proportion"
    },
    "uninsured_adults": {
      "measure": "Uninsured adults",
      "description": "Percentage of adults under age 65 without health insurance.",
      "unit": "uninsured_adults"
    },
    "uninsured_children": {
      "measure": "Uninsured children",
      "description": "Percentage of children under age 19 without health insurance.",
      "unit": "uninsured_adults"
    },
    "health_care_costs": {
      "measure": "Health care costs"
    },
    "other_primary_care_providers": {
      "measure": "Other primary care providers",
      "description": "Number of other primary care providers per 100,000 population",
      "unit": "per 100,000"
    },
    "disconnected_youth": {
      "measure": "Disconnected youth",
      "description": "Percentage of teens and young adults ages 16-19 who are neither working nor in school."
    },
    "median_household_income": {
      "measure": "Median household income",
      "description": "The income where half of households in a county earn more and half of households earn less.",
      "unit": "(USD)"
    },
    "children_eligible_for_free_or_reduced_price_lunch": {
      "measure": "Children eligible for free or reduced price lunch raw value",
      "description": "Percentage of children enrolled in public schools that are eligible for free or reduced price lunch.",
      "unit": "Proportion"
    },
    "residential_segregation_black_white": {
      "measure": "Residential segregation - Black/White",
      "description": "Index of dissimilarity where higher values indicate greater residential segregation between Black and White county residents."
    },
    "residential_segregation_non_white_white": {
      "measure": "Residential segregation - non-White/White",
      "description": "Index of dissimilarity where higher values indicate greater residential segregation between non-White and White county residents."
    },
    "homicides": {
      "measure": "Homicides",
      "description": "Number of deaths due to homicide per 100,000 population."
    },
    "firearm_fatalities": {
      "measure": "Firearm fatalities",
      "description": "Number of deaths due to firearms per 100,000 population."
    },
    "population": {
      "measure": "Population",
      "description": "Resident population.",
      "unit": "(in thousands)"
    },
    "percent_below_18_years_of_age": {
      "measure": "% below 18 years of age",
      "description": "Percentage of population below 18 years of age.",
      "unit": "Proportion"
    },
    "percent_65_and_older": {
      "measure": "% 65 and older",
      "description": "Percentage of population ages 65 and older.",
      "unit": "Proportion"
    },
    "percent_non_hispanic_african_american": {
      "measure": "% Non-Hispanic African American"
    },
    "percent_american_indian_and_alaskan_native": {
      "measure": "% American Indian and Alaskan Native"
    },
    "percent_asian": {
      "measure": "% Asian",
      "description": "Percentage of population that is Asian.",
      "unit": "Proportion"
    },
    "percent_native_hawaiian_other_pacific_islander": {
      "measure": "% Native Hawaiian/Other Pacific Islander",
      "description": "Percentage of population that is Native Hawaiian or Other Pacific Islander.",
      "unit": "Proportion"
    },
    "percent_hispanic": {
      "measure": "% Hispanic",
      "description": "Percentage of population that is Hispanic.",
      "unit": "Proportion"
    },
    "percent_non_hispanic_white": {
      "measure": "% Non-Hispanic White",
      "description": "Percentage of population that is non-Hispanic White.",
      "unit": "Proportion"
    },
    "percent_not_proficient_in_english": {
      "measure": "% not proficient in English",
      "description": "Percentage of population that is not proficient in English.",
      "unit": "Proportion"
    },
    "percent_females": {
      "measure": "% Females",
      "description": "Percentage of population that is female.",
      "unit": "Proportion"
    },
    "percent_rural": {
      "measure": "% Rural",
      "description": "Percentage of population living in a rural area.",
      "unit": "Proportion"
    },
    "communicable_disease": {
      "measure": "Communicable disease",
      "description": "Number of new cases of reportable diseases and conditions per 100,000 population."
    },
    "self_inflicted_injury_hospitalizations": {
      "measure": "Self-inflicted injury hospitalizations",
      "description": "Hospitalizations due to self-inflicted injuries per 100,000 population."
    },
    "cancer_incidence": {
      "measure": "Cancer incidence",
      "description": "Number of new cancer diagnoses per 100,000 population (age-adjusted)."
    },
    "smoking_during_pregnancy": {
      "measure": "Smoking during pregnancy",
      "description": "Percentage of births where mother reports smoking during pregnancy."
    },
    "drug_arrests": {
      "measure": "Drug arrests"
    },
    "motor_vehicle_crash_occupancy_rate": {
      "measure": "Motor vehicle crash occupancy rate",
      "description": "Motor vehicle crash occupancy rate per 1,000 population."
    },
    "on_road_motor_vehicle_crash_related_er_visits": {
      "measure": "On-road motor vehicle crash-related ER visits raw value",
      "description": "On-road motor vehicle crash-related emergency room visits per 100,000 population."
    },
    "off_road_motor_vehicle_crash_related_er_visits": {
      "measure": "Off-road motor vehicle crash-related ER visits"
    },
    "no_recent_dental_visit": {
      "measure": "No recent dental visit"
    },
    "did_not_get_needed_health_care": {
      "measure": "Did not get needed health care"
    },
    "childhood_immunizations": {
      "measure": "Childhood immunizations",
      "description": "Percentage of children aged 19 to 35 months who received the recommended doses of DTaP, polio, MMR, Hib, hepatitis B, varicella, and Pneumococcal conjugate."
    },
    "reading_proficiency": {
      "measure": "Reading proficiency",
      "description": "Percentage of fourth grade students proficient or advanced in reading."
    },
    "w_2_enrollment": {
      "measure": "W-2 enrollment",
      "description": "Count of individuals enrolled in W-2 (Wisconsin Works) on the last working day of the month."
    },
    "poverty": {
      "measure": "Poverty",
      "description": "Percentage of population living below the Federal Poverty Line."
    },
    "older_adults_living_alone": {
      "measure": "Older adults living alone",
      "description": "Percentage of adults 65 years and older who live alone."
    },
    "hate_crimes": {
      "measure": "Hate crimes"
    },
    "child_abuse": {
      "measure": "Child abuse",
      "description": "Child abuse rate per 1,000 population."
    },
    "injury_hospitalizations": {
      "measure": "Injury hospitalizations",
      "description": "Hospitalizations due to injuries per 100,000 population (age-adjusted)."
    },
    "fall_fatalities_65_plus": {
      "measure": "Fall fatalities 65+",
      "description": "Number of injury deaths due to falls among those 65 years of age and over per 100,000 population."
    },
    "year_structure_built": {
      "measure": "Year structure built",
      "description": "Percentage of housing units built prior to 1950."
    },
    "male_population_0_17": {
      "measure": "Male population 0-17",
      "description": "Number of males ages 0-17."
    },
    "male_population_18_44": {
      "measure": "Male population 18-44",
      "description": "Number of males ages 18-44."
    },
    "male_population_45_64": {
      "measure": "Male population 45-64",
      "description": "Number of males ages 45-64."
    },
    "male_population_65_plus": {
      "measure": "Male population 65+",
      "description": "Number of males ages 65 and older."
    },
    "total_male_population": {
      "measure": "Total male population",
      "description": "Total number of males."
    },
    "female_population_0_17": {
      "measure": "Female population 0-17",
      "description": "Number of females ages 0-17."
    },
    "female_population_18_44": {
      "measure": "Female population 18-44",
      "description": "Number of females ages 18-44."
    },
    "female_population_45_64": {
      "measure": "Female population 45-64",
      "description": "Number of females ages 45-64."
    },
    "female_population_65_plus": {
      "measure": "Female population 65+",
      "description": "Number of females ages 65 and older."
    },
    "total_female_population": {
      "measure": "Total female population",
      "description": "Total number of females."
    },
    "population_growth": {
      "measure": "Population growth",
      "description": "Percentage change in population since the last decennial US Census."
    },
    "flu_vaccinations": {
      "measure": "Flu vaccinations",
      "description": "Percentage of fee-for-service (FFS) Medicare enrollees that had an annual flu vaccination.",
      "unit": "Proportion"
    },
    "life_expectancy": {
      "measure": "Life expectancy",
      "description": "Average number of years a person can expect to live.",
      "unit": "(years)"
    },
    "homeownership": {
      "measure": "Homeownership",
      "description": "Percentage of occupied housing units that are owned.",
      "unit": "Proportion"
    },
    "severe_housing_cost_burden": {
      "measure": "Severe housing cost burden",
      "description": "Percentage of households that spend 50% or more of their household income on housing.",
      "unit": "Proportion"
    },
    "coronary_heart_disease_hospitalizations": {
      "measure": "Coronary heart disease hospitalizations",
      "description": "Coronary heart disease hospitalization rate per 1,000 population."
    },
    "cerebrovascular_disease_hospitalizations": {
      "measure": "Cerebrovascular disease hospitalizations",
      "description": "Cerebrovascular disease hospitalization rate per 1,000 population."
    },
    "opioid_hospital_visits": {
      "measure": "Opioid hospital visits",
      "description": "Rate of opioid-related hospital visits per 100,000 population."
    },
    "alcohol_related_hospitalizations": {
      "measure": "Alcohol-related hospitalizations",
      "description": "Rate of alcohol-related hospitalization per 1,000 population."
    },
    "reading_scores": {
      "measure": "Reading scores",
      "description": "Average grade level performance for 3rd graders on English Language Arts standardized tests"
    },
    "math_scores": {
      "measure": "Math scores",
      "description": "Average grade level performance for 3rd graders on math standardized tests"
    },
    "suicides": {
      "measure": "Suicides",
      "description": "Number of deaths due to suicide per 100,000 population (age-adjusted)."
    },
    "juvenile_arrests": {
      "measure": "Juvenile arrests",
      "description": "Rate of delinquency cases per 1,000 juveniles"
    },
    "traffic_volume": {
      "measure": "Traffic volume",
      "description": "Average traffic volume per meter of major roadways in the county.",
      "unit": "(vehicles/meter)"
    },
    "percent_non_hispanic_black": {
      "measure": "% Non-Hispanic Black",
      "description": "Percentage of population that is non-Hispanic Black or African American.",
      "unit": "Proportion"
    },
    "percent_american_indian_alaska_native": {
      "measure": "% American Indian & Alaska Native",
      "description": "Percentage of population that is American Indian or Alaska Native.",
      "unit": "Proportion"
    }
  },
  "race": {
    "Hispanic": { 
      "formatted": "Hispanic",
      "short": "Hispanic"
    },
    "Non-Hispanic American Indian or Alaska Native": {
      "formatted": "American Indian \n or Alaska Native \n (Non-Hispanic)",
      "half_short": "American Indian or Alaska Native (NH)",
      "short": "AI/AN"
    },
    "Non-Hispanic Black or African American": {
      "formatted": "Black or \nAfrican American \n (Non-Hispanic)",
      "half_short": "Black or African American (NH)",
      "short": "Black or AA"
    },
    "Non-Hispanic Native Hawaiian or Other Pacific Islander": {
      "formatted": "Native Hawaiian or \n Other Pacific Islander \n (Non-Hispanic)",
      "half_short": "Native Hawaiian or Other Pacific Islander (NH)",
      "short": "NHPI"
    },
    "Non-Hispanic White": {
      "formatted": "White \n (Non-Hispanic)",
      "half_short": "White (NH)",
      "short": "White"
    },
    "Non-Hispanic Asian": {
      "formatted": "Asian \n (Non-Hispanic)",
      "half_short": "Asian (NH)",
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