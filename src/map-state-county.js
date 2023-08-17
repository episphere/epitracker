const fs = require('fs');
const csv = require('./node_modules/csv-parser');

async function readCounties() {

  let myCounties = fs.readFileSync('./data/old-counties.json');
  let myStates = fs.readFileSync('./data/states.json');
  let newCounties = fs.readFileSync('./data/us-counties.json');
  const myCountiesData = JSON.parse(myCounties)
  const newCountiesData = JSON.parse(newCounties)
  const myStatesData = JSON.parse(myStates)

  const {features} = myCountiesData
  const {features: states} = myStatesData

  const data = features.map((feature) => {
    const {id} = feature
    const state = newCountiesData.find(item => item.county_fips === id)

    if (state) {
      const stateId = states.find(item => item.properties.name.toLowerCase() === state.state_name.toLowerCase())?.id
      return {
        state: {
          name: state.state_name,
          id: stateId
        },
        ...feature
      }
    } else {
      return {
        state: {},
        ...feature
      }
    }
    

  })

  const result = {
    type: "FeatureCollection",
    features: data
  }
  const dataJson = JSON.stringify(result)
  fs.writeFileSync('./data/counties.json', dataJson);

  fs.unlink('./data/us-counties.json', (err) => {
    if (err) {
      console.error('Error deleting the file:', err);
    } else {
      console.log('File deleted successfully.');
    }
  });
}

async function readCountiesCSV() {
  const inputFile = './data/us-counties.csv';
  const outputFile = './data/us-counties.json';

  const jsonArray = [];

  await fs.createReadStream(inputFile)
    .pipe(csv())
    .on('data', (data) => jsonArray.push(data))
    .on('end', () => {
      fs.writeFile(outputFile, JSON.stringify(jsonArray, null, 2), (err) => {
        if (err) {
          console.error('Error writing JSON file:', err);
        } else {
          console.log('CSV to JSON conversion complete.');
        }
      });
    });
}

// First run this line
// readCountiesCSV()

// After run readCountiesCSV function, then run this line
// readCounties()
