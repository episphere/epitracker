import { tsv2Json, tsv2Json2, csvJSON, getFile } from "../src/shared.js";

const txtid = "908521040771";

const data = await getFile(txtid);
const tsv2json = tsv2Json2(data);
const json = tsv2json.data;
const headers = tsv2json.headers;
const headerscatter = ["height", "weight"];
const gsel = ["Interval Bar Chart", "Ordinal Bar Chart", "Pie Chart"];
const variables0 = (headers) => {
  var theDiv = document.getElementById("graph0sel");
  var selectList = document.createElement("select");
  selectList.id = "select0";
  theDiv.appendChild(selectList);
  var option = document.createElement("option");
  option.text = "Choose Variable";
  option.selected = true;
  option.disabled = true;
  selectList.appendChild(option);

  for (var i = 1; i < headers.length; i++) {
    var option = document.createElement("option");
    option.value = headers[i];
    option.text = headers[i];
    selectList.appendChild(option);
  }
};

const variables1 = (headers) => {
  var theDiv = document.getElementById("graph1sel");
  var selectList = document.createElement("select");
  selectList.id = "select1";
  document.body.appendChild(selectList);
  theDiv.appendChild(selectList);
  var option = document.createElement("option");
  option.text = "Choose Variable";
  option.selected = true;
  option.disabled = true;
  selectList.appendChild(option);

  for (var i = 1; i < headers.length; i++) {
    var option = document.createElement("option");
    option.value = headers[i];
    option.text = headers[i];
    selectList.appendChild(option);
  }
};

const variables2 = (headers) => {
  var theDiv = document.getElementById("graph2sel");
  var selectList = document.createElement("select");
  selectList.id = "select2";
  document.body.appendChild(selectList);
  theDiv.appendChild(selectList);
  var option = document.createElement("option");
  option.text = "Choose Variable";
  option.selected = true;
  option.disabled = true;
  selectList.appendChild(option);

  for (var i = 1; i < headers.length; i++) {
    var option = document.createElement("option");
    option.value = headers[i];
    option.text = headers[i];
    selectList.appendChild(option);
  }
};

const variables3_0 = (headers) => {
  var theDiv = document.getElementById("graph3sel0");
  var selectList = document.createElement("select");
  selectList.id = "select3_0";
  document.body.appendChild(selectList);
  theDiv.appendChild(selectList);
  var option = document.createElement("option");
  option.text = "Choose X Variable";
  option.selected = true;
  option.disabled = true;
  selectList.appendChild(option);

  for (var i = 1; i < headers.length; i++) {
    var option = document.createElement("option");
    option.value = headers[i];
    option.text = headers[i];
    selectList.appendChild(option);
  }
};

const variables3_1 = (headers) => {
  var theDiv = document.getElementById("graph3sel0");
  var selectList = document.createElement("select");
  selectList.id = "select3_1";
  document.body.appendChild(selectList);
  theDiv.appendChild(selectList);
  var option = document.createElement("option");
  option.text = "Choose Y Variable";
  option.selected = true;
  option.disabled = true;
  selectList.appendChild(option);

  for (var i = 1; i < headers.length; i++) {
    var option = document.createElement("option");
    option.value = headers[i];
    option.text = headers[i];
    selectList.appendChild(option);
  }
};

const graphSel0 = (gsel) => {
  var theDiv = document.getElementById("graph0sel");
  var selectList = document.createElement("select");
  selectList.id = "selectType0";
  theDiv.appendChild(selectList);
  var option = document.createElement("option");
  option.text = "Choose Graph Type";
  option.selected = true;
  option.disabled = true;
  selectList.appendChild(option);

  for (var i = 0; i < gsel.length; i++) {
    var option = document.createElement("option");
    option.value = gsel[i];
    option.text = gsel[i];
    selectList.appendChild(option);
  }
};

const graphSel1 = (gsel) => {
  var theDiv = document.getElementById("graph1sel");
  var selectList = document.createElement("select");
  selectList.id = "selectType1";
  theDiv.appendChild(selectList);
  var option = document.createElement("option");
  option.text = "Choose Graph Type";
  option.selected = true;
  option.disabled = true;
  selectList.appendChild(option);

  for (var i = 0; i < gsel.length; i++) {
    var option = document.createElement("option");
    option.value = gsel[i];
    option.text = gsel[i];
    selectList.appendChild(option);
  }
};

const graphSel2 = (gsel) => {
  var theDiv = document.getElementById("graph2sel");
  var selectList = document.createElement("select");
  selectList.id = "selectType2";
  theDiv.appendChild(selectList);
  var option = document.createElement("option");
  option.text = "Choose Graph Type";
  option.selected = true;
  option.disabled = true;
  selectList.appendChild(option);

  for (var i = 0; i < gsel.length; i++) {
    var option = document.createElement("option");
    option.value = gsel[i];
    option.text = gsel[i];
    selectList.appendChild(option);
  }
};

variables0(headers);
variables1(headers);
variables2(headers);
variables3_0(headers);
variables3_1(headers);
graphSel0(gsel);
graphSel1(gsel);
graphSel2(gsel);

const button = () => {
  var theDiv = document.getElementById("createGraphs");
  let btn = document.createElement("button");
  btn.innerHTML = "Create Graphs";
  btn.onclick = async () => {
    dc.config.defaultColors(d3.schemeCategory10);
    var var0 = document.querySelector("#select0");
    var var1 = document.querySelector("#select1");
    var var2 = document.querySelector("#select2");
    var var3_0 = document.querySelector("#select3_0");
    var var3_1 = document.querySelector("#select3_1");
    var out0 = var0.value;
    var out1 = var1.value;
    var out2 = var2.value;
    var out3_0 = var3_0.value;
    var out3_1 = var3_1.value;
    var keys = [out0, out1, out2, out3_0, out3_1, "race", "study"];
    var gsel0 = document.querySelector("#selectType0").value;
    var gsel1 = document.querySelector("#selectType1").value;
    var gsel2 = document.querySelector("#selectType2").value;

    let data = json.map((element) =>
      Object.assign({}, ...keys.map((key) => ({ [key]: element[key] })))
    );

    data.forEach(function (d) {
      if (out0 !== "race") {
        d[out0] = +d[out0];
      }
      if (out1 !== "race") {
        d[out1] = +d[out1];
      }
      if (out2 !== "race") {
        d[out2] = +d[out2];
      }
      if (out3_0 !== "race") {
        d[out3_0] = +d[out3_0];
      }
      if (out3_1 !== "race") {
        d[out3_1] = +d[out3_1];
      }
      d["study"] = "NHS2";
    });

    for (const obj of data) {
      if (obj.race === "1") {
        obj.race = "White";
      }
      if (obj.race === "2") {
        obj.race = "Black/African American";
      }
      if (obj.race === "3") {
        obj.race = "Asian";
      }
      if (obj.race === "4") {
        obj.race = "Native Hawaiian/Pacific Islander";
      }
      if (obj.race === "5") {
        obj.race = "American Indian/Alaska Native";
      }
      if (obj.race === "6") {
        obj.race = "Other, including multiracial";
      }
    }

    if (gsel0 === "Pie Chart") {
      var graph0 = new dc.PieChart("#graph0in");
    } else {
      var graph0 = new dc.BarChart("#graph0in");
    }

    if (gsel1 === "Pie Chart") {
      var graph1 = new dc.PieChart("#graph1in");
    } else {
      var graph1 = new dc.BarChart("#graph1in");
    }

    if (gsel2 === "Pie Chart") {
      var graph2 = new dc.PieChart("#graph2in");
    } else {
      var graph2 = new dc.BarChart("#graph2in");
    }

    // var graph1 = dc.barChart('#graph1in');
    //var graph2 = dc.barChart('#graph2in');
    var sMenu = new dc.SelectMenu("#sMenu");
    var dataCount = new dc.DataCount(".data-count");
    var avg0 = new dc.NumberDisplay("#avg0");
    var avg1 = new dc.NumberDisplay("#avg1");
    var avg2 = new dc.NumberDisplay("#avg2");
    var graph3 = new dc.ScatterPlot("#graph3in");

    data = data.filter((d) => {
      if (d[out0] === 888) return false;
      if (d[out0] === 777) return false;
      if (d[out1] === 888) return false;
      if (d[out1] === 777) return false;
      if (d[out2] === 888) return false;
      if (d[out2] === 777) return false;
      if (d[out3_0] === 888) return false;
      if (d[out3_0] === 777) return false;
      if (d[out3_1] === 888) return false;
      if (d[out3_1] === 777) return false;
      if (d.race === "888") return false;
      if (d.race === "") return false;
      return true;
    });

    const crossdata = crossfilter(data);
    const all = crossdata.groupAll();

    const out0Dimension = crossdata.dimension((d) => d[out0]);
    const groupByout0 = out0Dimension.group();

    const out1Dimension = crossdata.dimension((d) => d[out1]);
    const groupByout1 = out1Dimension.group();

    const out2Dimension = crossdata.dimension((d) => d[out2]);
    const groupByout2 = out2Dimension.group();

    const raceDimension = crossdata.dimension((d) => d.race);
    const raceGroup = raceDimension.group();

    const out3Dimension = crossdata.dimension(function (d) {
      return [d[out3_0], d[out3_1]];
    });
    const groupByout3 = out3Dimension.group();

    var avgGroup0 = crossdata.groupAll().reduce(
      function (p, v) {
        ++p.n;
        p.tot += v[out0];
        return p;
      },
      function (p, v) {
        --p.n;
        p.tot -= v[out0];
        return p;
      },
      function () {
        return { n: 0, tot: 0 };
      }
    );

    var avgGroup1 = crossdata.groupAll().reduce(
      function (p, v) {
        ++p.n;
        p.tot += v[out1];
        return p;
      },
      function (p, v) {
        --p.n;
        p.tot -= v[out1];
        return p;
      },
      function () {
        return { n: 0, tot: 0 };
      }
    );

    var avgGroup2 = crossdata.groupAll().reduce(
      function (p, v) {
        ++p.n;
        p.tot += v[out2];
        return p;
      },
      function (p, v) {
        --p.n;
        p.tot -= v[out2];
        return p;
      },
      function () {
        return { n: 0, tot: 0 };
      }
    );

    var average = function (d) {
      return d.n ? d.tot / d.n : 0;
    };

    avg0.formatNumber(d3.format(".2f")).valueAccessor(average).group(avgGroup0);

    avg1.formatNumber(d3.format(".2f")).valueAccessor(average).group(avgGroup1);

    avg2.formatNumber(d3.format(".2f")).valueAccessor(average).group(avgGroup2);
    let w = 640,
      h = 320;

    graph3
      .width(w)
      .height(h)
      .x(
        d3.scaleLinear().domain([
          d3.min(data, (d) => {
            return d[out3_0];
          }) - 1,
          d3.max(data, (d) => {
            return d[out3_0];
          }),
        ])
      )
      //.brushOn(false)
      //.symbolSize(8)
      .clipPadding(10)
      .xAxisLabel(out3_0)
      .yAxisLabel(out3_1)
      .highlightedSize(10)
      .excludedOpacity(0.5)
      .excludedColor("#ddd")
      .dimension(out3Dimension)
      .group(groupByout3);

    if (gsel0 === "Interval Bar Chart") {
      dcBarChart(
        graph0,
        out0Dimension,
        groupByout0,
        w,
        h,
        true,
        d3.scaleLinear().domain([
          0,
          d3.max(data, (d) => {
            return d[out0];
          }),
        ]),
        "# of Subjects",
        out0
      );
    } else if (gsel0 === "Ordinal Bar Chart") {
      dcBarChartOrdinal(
        graph0,
        out0Dimension,
        groupByout0,
        w,
        h,
        "# of Subjects",
        out0
      );
    } else {
      dcPieChart(graph0, out0Dimension, groupByout0, w, h);
    }

    if (gsel1 === "Interval Bar Chart") {
      dcBarChart(
        graph1,
        out1Dimension,
        groupByout1,
        w,
        h,
        true,
        d3.scaleLinear().domain([
          0,
          d3.max(data, (d) => {
            return d[out1];
          }),
        ]),
        "# of Subjects",
        out1
      );
    } else if (gsel1 === "Ordinal Bar Chart") {
      dcBarChartOrdinal(
        graph1,
        out1Dimension,
        groupByout1,
        w,
        h,
        "# of Subjects",
        out1
      );
    } else {
      dcPieChart(graph1, out1Dimension, groupByout1, w, h);
    }

    if (gsel2 === "Interval Bar Chart") {
      dcBarChart(
        graph2,
        out2Dimension,
        groupByout2,
        w,
        h,
        true,
        d3.scaleLinear().domain([
          0,
          d3.max(data, (d) => {
            return d[out2];
          }),
        ]),
        "# of Subjects",
        out2
      );
    } else if (gsel2 === "Ordinal Bar Chart") {
      dcBarChartOrdinal(
        graph2,
        out2Dimension,
        groupByout2,
        w,
        h,
        "# of Subjects",
        out2
      );
    } else {
      dcPieChart(graph2, out2Dimension, groupByout2, w, h);
    }

    sMenu
      .dimension(raceDimension)
      .group(raceGroup)
      .multiple(true)
      .numberVisible(20);

    graph0.controlsUseVisibility(true);
    graph1.controlsUseVisibility(true);
    graph2.controlsUseVisibility(true);
    sMenu.controlsUseVisibility(true);

    dataCount
      .crossfilter(crossdata)
      .groupAll(all)
      .html({
        some:
          "<strong>%filter-count</strong> selected out of <strong>%total-count</strong> records" +
          " | <a href='javascript:dc.filterAll(); dc.renderAll();'>Reset All</a>",
        all: "All records selected. Please click on the graph to apply filters.",
      });

    document.getElementById("raceTitle").removeAttribute("hidden");

    dc.renderAll();
  };
  theDiv.appendChild(btn);
};

button();

function dcBarChart(
  chartname,
  dim,
  group,
  width,
  height,
  cenbar,
  xinput,
  yaxis,
  xaxis
) {
  return chartname
    .width(width)
    .height(height)
    .group(group)
    .dimension(dim)
    .centerBar(cenbar)
    .x(xinput)
    .margins({ top: 10, right: 50, bottom: 30, left: 40 })
    .elasticY(true)
    .elasticX(true)
    .yAxisLabel(yaxis)
    .xAxisLabel(xaxis);
}

function dcBarChartOrdinal(chartname, dim, group, width, height, yaxis, xaxis) {
  return chartname
    .width(width)
    .height(height)
    .x(d3.scaleBand())
    .xUnits(dc.units.ordinal)
    .elasticY(true)
    .elasticX(true)
    .yAxisLabel(yaxis)
    .xAxisLabel(xaxis)
    .brushOn(false)
    .barPadding(0.1)
    .outerPadding(0.05)
    .dimension(dim)
    .group(group);
}

function dcPieChart(chartname, dim, group, width, height) {
  return chartname
    .width(width)
    .height(height)
    .radius(width)
    .dimension(dim)
    .group(group);
}

// const dcBarChart = (chartname, dim, group, width, height, cenbar, xinput, yaxis, xaxis) => {
//     chartname
//     .width(width)
//     .height(height)
//     .group(group)
//     .dimension(dim)
//     .centerBar(cenbar)
//     .x(xinput)
//     .margins({top: 10, right: 50, bottom: 30, left: 40})
//     .elasticY(true)
//     .elasticX(true)
//     .yAxisLabel(yaxis)
//     .xAxisLabel(xaxis)
// }

// const dcBarChartOrdinal = (chartname, dim, group, width, height, yaxis, xaxis) => {
//     chartname
//     .width(width)
//     .height(height)
//     .x(d3.scaleBand())
//     .xUnits(dc.units.ordinal)
//     .elasticY(true)
//     .elasticX(true)
//     .yAxisLabel(yaxis)
//     .xAxisLabel(xaxis)
//     .brushOn(false)
//     .barPadding(0.1)
//     .outerPadding(0.05)
//     .dimension(dim)
//     .group(group)
// }

// const dcPieChart = (chartname, dim, group, width, height) => {
//     chartname
//     .width(width)
//     .height(height)
//     .radius(width)
//     .dimension(dim)
//     .group(group)
// }
