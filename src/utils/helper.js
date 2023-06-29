import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";


export function addTooltip(svgSelect, elementSelect=null) {
    const mouseOffset = [10,10]
  
    const style = `
        .svg-tooltip {
        background-color: rgba(255, 255, 255, 0.7);
        position: absolute;
        transform: translate(178px, 410.19px);
        border-style: solid;
        border-color: black;
        border-width: 1px;
        border-radius: 2px;
        font-family: sans-serif;
        font-size: 10px;
        padding: 8px;
        visibility: hidden;
        max-width: 150px;
    }`
  
    svgSelect.append("style").text(style)
  
    const foreignObject = svgSelect.append("foreignObject")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("pointer-events", "none")
  
    const tooltip = foreignObject.append("xhtml:div")
        .attr("class", "svg-tooltip")
  
    function show(text, x, y) {
        let posX = x + mouseOffset[0]
        let posY = y + mouseOffset[1]
        
        tooltip.html(text)
        tooltip.style("visibility", "visible")
        
        const svgBox = svgSelect.node().getBBox()
        const tooltipBox = tooltip.node().getBoundingClientRect()
  
        if (posX > svgBox.width - tooltipBox.width) {
        posX = x - tooltipBox.width - mouseOffset[0]
        }
        if (posY > svgBox.height - tooltipBox.height) {
        posY = y - tooltipBox.height - mouseOffset[1]
        }
        
        tooltip.style("transform", `translate(${posX}px,${posY}px)`)
    }
  
    function hide() {
        tooltip.style("visibility", "hidden")
    }
  
    if (elementSelect != null) {
        elementSelect.on("mouseover", e => {
        const title = d3.select(e.target).select("title").text()
        const bbox = e.target.getBBox()
        const centroid = [bbox.x + bbox.width/2, bbox.y+bbox.height/2]
        show(title, centroid[0], centroid[1])
        })
        .on("mouseleave", () => hide())
    }
  
    return {show, hide}
  }

export function showTable(checkboxId, tableId) {
    let checkbox = document.getElementById(checkboxId);                    
    checkbox.addEventListener('change', (event) => {
      const isChecked = event.target.checked
      const tableWrapper = document.querySelector(`#${tableId}`)
      if (tableWrapper) {
          tableWrapper.style.display = isChecked ? 'block' : 'none'
      }
    }) 
}

export function changeGraphType(types = [], callback) {
    types.forEach((type) => {
        let typeRadioElement = document.getElementById(`${type}-graph`);
        typeRadioElement.addEventListener('change', () => callback(type)) 
    })
}

export function colorRampLegend(colorScale, valueExtent, label="", tickValues=null, size=null) {
    const nGrad = 16
    const margin = 30 

    if (size == null) {
        size = label ? [400, 60] : [400, 40]
    }
    const startY = label ? 20 : 0

    const svg = d3.create("svg")
        .attr("width", size[0])
        .attr("height", size[1])

    // Gradient

    // This is a terrible way to generate a unique ID, but it's unlikely to cause a problem.
    const gradientId = "ramp-gradient-"+Math.floor(Math.random()*10000000)

    const defs = svg.append("defs")
    const gradient = defs.append("linearGradient")
        .attr("id", gradientId)
        .attr("x1", "0%")
        .attr("x2", "100%")

    const pScale = d3.scaleLinear()
        .domain([0,nGrad])
        .range(valueExtent)

    gradient.append("stop")
        .attr("class", "start")
        .attr("offset", `0%`)
        .attr("stop-color", colorScale(valueExtent[0]))

    for (let i = 1; i < nGrad-1; i++) {
        gradient.append("stop")
        .attr("offset", `${100*i/nGrad}%`)
        .attr("stop-color", colorScale(pScale(i)))
    }

    gradient.append("stop")
        .attr("class", "end")
        .attr("offset", `100%`)
        .attr("stop-color", colorScale(valueExtent[1]))

    svg.append("rect")
        .attr("x", margin)
        .attr("y", startY)
        .attr("width", size[0]-margin*2)
        .attr("height", size[1]-23-startY)
        .attr("fill", `url(#${gradientId})`)



    // Ticks 

    const scale = d3.scaleLinear()
        .domain(valueExtent)
        .range([0, size[0]-margin*2])

    const axis = d3.axisBottom(scale)
        .tickSize(size[1]-15-startY)
        .tickSizeOuter(0)

    if (tickValues != null) {
        axis.tickValues(tickValues)
    } else {
        axis.ticks(5)
    }

    svg.append("g")
        .attr("transform", `translate(${margin},${startY})`)
        .style("font-size", 13)
        .style("color", "#424242")
        .style("stroke-width", "1px")
        .call(axis)

    svg.selectAll(".tick")
        .selectAll("line")
        .attr("stroke", "#424242")


    // Label

    if (label) {
        svg.append("g")
        .style("font-family", "sans-serif")
        .style("font-size", "12px")
        .append("text")
            .attr("x", margin)
            .attr("y", 15)
            .text(label)
    }


    return svg.node()
}

export function colorRampLegendMeanDiverge(values, schemeName, label=null, size=null, reverse=false) {
    const mean = d3.mean(values) 
    const extent = d3.extent(values) 
    const maxSide = Math.max(mean-extent[0], extent[1]-mean)

    const colorScale = d3.scaleSequential(d3["interpolate"+schemeName])
        .domain(reverse ? [mean+maxSide, mean-maxSide] : [mean-maxSide, mean+maxSide])

    return colorRampLegend(colorScale, extent, label, [extent[0], mean, extent[1]], size)
}

const reSizePlots = (id, large, scale = 1.5) => {
    const element = document.getElementById(id)
    const svgElements = element.querySelectorAll('svg')

    svgElements.forEach(svg => {
        const { clientWidth: width, clientHeight: height } = svg
        if (large) {
            svg.setAttribute("height", `${height * scale}px`);
            svg.setAttribute("width", `${width * scale}px`);
        } else {
            svg.setAttribute("height", `${height / scale}px`);
            svg.setAttribute("width", `${width / scale}px`);
        }
    })
}

export function toggleSidebar(graphId) {
    const button = document.getElementById('sidebar-toggle');
    if (!button) return;

    button.addEventListener('click', () => {
        const child = Array.from(button.childNodes)[0];
        if(child.classList.contains('fa-caret-left')) {
            reSizePlots(graphId, true);
            child.classList.remove('fa-caret-left');
            child.classList.add('fa-caret-right');
            document.getElementById('sidebar').classList.remove('col-xl-2');
            document.getElementById('sidebar').classList.add('d-none');
            document.getElementById('main-content').classList.remove('col-xl-10');
            document.getElementById('main-content').classList.add('col-xl-12');
        }
        else {
            reSizePlots(graphId, false);
            child.classList.remove('fa-caret-right');
            child.classList.add('fa-caret-left');
            document.getElementById('sidebar').classList.add('col-xl-2');
            document.getElementById('sidebar').classList.remove('d-none');
            document.getElementById('main-content').classList.add('col-xl-10');
            document.getElementById('main-content').classList.remove('col-xl-12');
        }
    })
}