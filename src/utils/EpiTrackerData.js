import jszip from 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm'
import * as aq from 'https://cdn.jsdelivr.net/npm/arquero@5.2.0/+esm'

export class EpiTrackerData {
  constructor(args={}) {
    this.args = {
      keepInMemory: "zipped", // "zipped", "unzipped", or "none",
      postProcessCountyMortalityData: table => table, // Function takes an arquero table
      ...args 
    }

    this.dataMemoryMap = new Map()
    this.postProcessCountyMortalityData = this.args.postProcessCountyMortalityData
  }

  // TODO: Support multiple selection queries
  async getCountyMortalityData(query, args={}) {
    args = {
      includeTotals: true, 
      includeReduntantFields: true, // TODO: Implement
      ...args 
    }

    query = {
      sex: "*",
      race: "*", 
      state_fips: "*",
      county_fips: "*",
      cause: "*",
      year: "2020",
      ...query
    }

    const year = query.year
    delete query.year 

    let countyMortalityData = await this.#loadCountyMortalityData(year) 

    // TODO: Fix this to allow all states
    const aqFilter = []
    for (const [k,v] of Object.entries(query)) {
      if (v != "*") {
        aqFilter.push(`row.${k} == "${v}"`)
      } else if (!args.includeTotals) {
        aqFilter.push(`row.${k} != "All"`)
      }
    }

    const filterString = aqFilter.length > 0 ? `row => ` + aqFilter.join(" && ") : "row => true"
    
    return this.postProcessCountyMortalityData(countyMortalityData
      .filter(filterString)
      .derive({
        deaths: d => d.aq.op.parse_float(d.deaths),
        population: d => d.aq.op.parse_float(d.population),
        crude_rate: d => aq.op.parse_float(d.crude_rate),
        age_adjusted_rate: d => aq.op.parse_float(d.age_adjusted_rate)
      }))
      .objects()

  }

  async #loadCountyMortalityData(year) {
    // Year currently takes "2018", "2019", "2020", and "2018-2020"

    let data
    if (!(data = this.dataMemoryMap.get(`mortality-data-${year}`))) {
      const url = `data/mortality/age_adjusted_data_${year}.csv.zip`
      data = await (await fetch(url)).blob()

      if (this.args.keepInMemory == "zipped") {
        this.dataMemoryMap.set(`mortality-data-${year}`, data)
      }
    } 

    if (data instanceof Blob) {
      const zip = new jszip()
      const contents = await zip.loadAsync(data)
      data = await d3.csvParse((await zip.file(`age_adjusted_data_${year}.csv`).async("string")))
    }

    data = aq.from(data)
    if (this.args.keepInMemory == "unzipped") {
      this.dataMemoryMap.set(`mortality-data-${year}`, data)
    }

    return data
  }

}