import jszip from 'jszip';
import * as aq from 'arquero';
import * as d3 from 'd3';

export class EpiTrackerData {
  constructor(args = {}) {
    this.args = {
      keepInMemory: "unzipped", // "zipped", "unzipped", or "none",
      postProcessCountyMortalityData: (table) => table, // Function takes an arquero table
      ...args,
    };

    this.dataMemoryMap = new Map();
    this.postProcessCountyMortalityData =
      this.args.postProcessCountyMortalityData;
  }

  async getPopulationData(query, args = {}) {
    query = {
      sex: "*",
      race: "*",
      year: "2020",
      state_fips: "*",
      county_fips: "*",
      ...query
    };

    args = {
      includeTotals: true,
      ...args,
    };

    const year = query.year;
    delete query.year;

    const data = await this.#smartLoadZipData(
      `/data/population/population_data_${year}.csv.zip`,
      `population_data_${year}.csv`
    );


    const aqFilter = [];
    for (const [k, v] of Object.entries(query)) {
      if (v != "*") {
        aqFilter.push(`row.${k} == "${v}"`);
      } else if (!args.includeTotals) {
        aqFilter.push(`row.${k} != "All"`);
      }
    }

    const filterString = aqFilter.length > 0 ? `row => ` + aqFilter.join(" && ") : "row => true";
    return data.filter(filterString).derive({
      population: (d) => d.aq.op.parse_int(d.population),
    }).objects();
  }

  async getQuantileMortalityData(query, args) {
    args = {
      includeTotals: true,
      includeReduntantFields: true, // TODO: Implement
      ...args,
    };

    query = {
      sex: "*",
      race: "*",
      cause: "*",
      year: "2020",
      quantile_year: "2020",
      quantile_field: "*",
      num_quantiles: "*",
      ...query,
    };

    const year = query.year;
    delete query.year;

    const numQuantiles = query.num_quantiles
    delete query.num_quantiles

    const quantileYear = query.quantile_year
    delete query.quantile_year


    let quantileMortalityData = (
      await this.#loadQuantileMortalityData(year, quantileYear, numQuantiles)
    ).rename({
      //race_ethnicity: "race",
    });

    // TODO: Fix this to allow all states
    const aqFilter = [];
    for (const [k, v] of Object.entries(query)) {
      if (v != "*") {
        aqFilter.push(`row.${k} == "${v}"`);
      } else if (!args.includeTotals) {
        aqFilter.push(`row.${k} != "All"`);
      }
    }

    const filterString =
      aqFilter.length > 0 ? `row => ` + aqFilter.join(" && ") : "row => true";

    return this.postProcessCountyMortalityData(
      quantileMortalityData.filter(filterString).derive({
        deaths: (d) => d.aq.op.parse_int(d.deaths),
        population: (d) => d.aq.op.parse_int(d.population),
        crude_rate: (d) => aq.op.parse_float(d.crude_rate),
        age_adjusted_rate: (d) => aq.op.parse_float(d.age_adjusted_rate),
        quantile: d => aq.op.parse_int(d.quantile)
      })
        .orderby("quantile")
    ).objects();
  }

  // TODO: Support multiple selection queries
  async getCountyMortalityData(query, args = {}) {
    args = {
      includeCountyFips: false,
      includeTotals: true,
      includeReduntantFields: true, // TODO: Implement
      ...args,
    };

    query = {
      sex: "*",
      race: "*",
      state_fips: "*",
      county_fips: "*",
      cause: "*",
      year: "2020",
      ...query,
    };

    const year = query.year;
    delete query.year;

    // console.time("Query")
    let countyMortalityData = await this.#loadCountyMortalityData(year);
    // console.timeEnd("Query")


    // TODO: Fix this to allow all states
    const aqFilter = [];
    for (const [k, v] of Object.entries(query)) {
      if (v != "*") {
        if (k !== "county_fips" || !args.includeCountyFips) {
          aqFilter.push(`row.${k} == "${v}"`);
        }
      } else if (!args.includeTotals) {
        aqFilter.push(`row.${k} != "All"`);
      }
    }

    const filterString =
      aqFilter.length > 0 ? `row => ` + aqFilter.join(" && ") : "row => true";

    const data = this.postProcessCountyMortalityData(
      countyMortalityData.filter(filterString).derive({
        deaths: (d) => d.aq.op.parse_float(d.deaths),
        population: (d) => d.aq.op.parse_float(d.population),
        crude_rate: (d) => aq.op.parse_float(d.crude_rate),
        age_adjusted_rate: (d) => aq.op.parse_float(d.age_adjusted_rate),
      })
    ).objects();

    if (args?.counties && args?.states) {
      // const statesMap = d3.index(args.states, (d) => d["value"]);
      // let countiesMap = d3.index(args.counties, (d) => d["value"]);

      // TODO: Please explain about this
      // if (query.state_fips === "*") {
      //   const integratedCounties = args.counties.reduce((pv, cv) => {
      //     return [...pv, ...cv.choices];
      //   }, []);
      //   countiesMap = d3.index(integratedCounties, (d) => d["value"]);
      // }

      return data.map((item) => ({
        ...item,
        // state: statesMap.get(item.state_fips).label,
        // county: countiesMap.get(item.county_fips)?.label,
      }));
    }

    return data;
  }

  async getDemographicMortalityData(query, args = {}) {
    args = {
      includeTotals: true,
      includeReduntantFields: true, // TODO: Implement
      ...args,
    };

    query = {
      sex: "*",
      race: "*",
      state_fips: "*",
      cause: "*",
      year: "2020",
      age_group: "*",
      ...query,
    };

    const year = query.year;
    delete query.year;

    let demographicData = await this.#loadDemographicData(year);

    // TODO: Fix this to allow all states
    const aqFilter = [];
    for (const [k, v] of Object.entries(query)) {
      if (v != "*") {
        aqFilter.push(`row.${k} == "${v}"`);
      } else if (!args.includeTotals) {
        aqFilter.push(`row.${k} != "All"`);
      }
    }

    const filterString =
      aqFilter.length > 0 ? `row => ` + aqFilter.join(" && ") : "row => true";

    return demographicData
      .filter(filterString)
      .derive({
        deaths: (d) => d.aq.op.parse_float(d.deaths),
        population: (d) => d.aq.op.parse_float(d.population),
        crude_rate: (d) => aq.op.parse_float(d.crude_rate),
        age_adjusted_rate: (d) => aq.op.parse_float(d.age_adjusted_rate),
      })
      .objects();
  }

  async #loadDemographicData(year) {
    // Year currently takes "2018", "2019", "2020", and "2018-2020"

    return this.#smartLoadZipData(
      `/data/demographic/demographic_data_${year}.csv.zip`,
      `demographic_data_${year}.csv`
    );
  }

  async #loadCountyMortalityData(year) {
    // Year currently takes "2018", "2019", "2020", and "2018-2020"

    // let data
    // if (!(data = this.dataMemoryMap.get(`mortality-data-${year}`))) {
    //   const url = `/data/geospatial/age_adjusted_data_${year}.csv.zip`
    //   data = await (await fetch(url)).blob()

    //   if (this.args.keepInMemory == "zipped") {
    //     this.dataMemoryMap.set(`mortality-data-${year}`, data)
    //   }
    // }

    // if (data instanceof Blob) {
    //   const zip = new jszip()
    //   await zip.loadAsync(data)
    //   data = await d3.csvParse((await zip.file(`age_adjusted_data_${year}.csv`).async("string")))
    // }

    // data = aq.from(data)
    // if (this.args.keepInMemory == "unzipped") {
    //   this.dataMemoryMap.set(`mortality-data-${year}`, data)
    // }

    return this.#smartLoadZipData(
      `/data/geospatial/age_adjusted_data_${year}.csv.zip`,
      `age_adjusted_data_${year}.csv`
    );
  }

  async #loadQuantileMortalityData(year, quantileYear, nQuantiles) {
    // Year currently takes "2018", "2019", "2020", and "2018-2020"

    // let data
    // if (!(data = this.dataMemoryMap.get(`quantile-data-${year}`))) {
    //   const url = `/data/quantile/quantile_data_${year}.csv.zip`
    //   data = await (await fetch(url)).blob()

    //   if (this.args.keepInMemory == "zipped") {
    //     this.dataMemoryMap.set(`quantile-data-${year}`, data)
    //   }
    // }

    // if (data instanceof Blob) {
    //   const zip = new jszip()
    //   await zip.loadAsync(data)
    //   data = await d3.csvParse((await zip.file(`quantile_data_${year}.csv`).async("string")))
    // }

    // data = aq.from(data)
    // if (this.args.keepInMemory == "unzipped") {
    //   this.dataMemoryMap.set(`quantile-data-${year}`, data)
    // }

    // return data

    const filename = `quantile_data_${year}_ref-${quantileYear}_q${nQuantiles}.csv`
    return this.#smartLoadZipData(
      `/data/quantile/${filename}.zip`,
      filename
    );
  }

  async #smartLoadZipData(url, filename) {
    let data;
    if (!(data = this.dataMemoryMap.get(url))) {
      data = await (await fetch(url)).blob();

      if (this.args.keepInMemory == "zipped") {
        this.dataMemoryMap.set(url, data);
      }
    }

    if (data instanceof Blob) {
      const zip = new jszip();
      await zip.loadAsync(data);
      data = await d3.csvParse(await zip.file(filename).async("string"));
    }

    data = aq.from(data);
    if (this.args.keepInMemory == "unzipped") {
      this.dataMemoryMap.set(url, data);
    }

    return data;
  }
}