//create chart objects
bChart = dc.barChart("#dcPlot");
var chart = document.getElementById("dcPlot");
//load the data
const data = d3.csv("Pilot - BCRP_Summary_Results_AllSubjects_Edited.csv");
//create crossfilters

const crossdata = crossfilter(data);
const all = crossdata.groupAll();

const subjectsDimension = crossdata.dimension((d) => d.TotalSubjects);
const groupBySubjects = subjectsDimension
  .group()
  .reduceSum((d) => d.TotalSubjects / 100);
const ethnicityDimension = crossdata.dimension((d) => d.ethnicity);

//Define chart attributes
bChart
  .width(800)
  .height(500)
  .group(groupBySubjects)
  .x(d3.scaleLinear().domain([0, 10]))
  .dimension(ethnicityDimension)
  .centerBar(true)
  .gap(2)
  .yAxis()
  .ticks(1000000);

bChart.turnOnControls(true);

dc.renderAll();
