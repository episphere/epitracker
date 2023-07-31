const showProjectConceptForm = true;
const viewSubmissionsShow = true;
export const navBarMenutemplate = () => {
  return `
        <div class="grid-elements">
            <a class="nav-link nav-menu-links white-font" href="#home" title="DCEG Home" id="homePage">
                Home
            </a>
        </div>
        <div class="grid-elements">
            <a class="nav-link nav-menu-links white-font" href="#about/overview" id="aboutDCEG">
            About
            </a>            
        </div>
        <div class="grid-elements">
           <a class="nav-link nav-menu-links white-font" href="#quantile-visualization" title="Quantile Visualization" id="quantile-visualization">
           Quantile Visualization
           </a>
         </div>
         <div class="grid-elements">
         <a class="nav-link nav-menu-links white-font" href="#map-visualization" title="Map Visualization" id="map-visualization">
         Quantile Visualization
         </a>
       </div>
        <div class="grid-elements">
            <a class="nav-link nav-menu-links white-font" rel="noopener" target="_blank" href="https://github.com/episphere/dataplatform/issues" title="BCRPP github issues">
                Report issue
            </a>
        </div>
      </div>
    `;
};
export function pageNavBar(page, activeTab, ...pageHeaders) {
  const containerEl = document.createElement("div");
  containerEl.classList.add("container");

  const outerDivEl = document.createElement("div");
  outerDivEl.classList.add("main-summary-row", "white-bg", "div-border");

  const innerDivEl = document.createElement("div");
  innerDivEl.classList.add("main-summary-row", "white-bg", "div-border");

  outerDivEl.appendChild(innerDivEl);
  containerEl.appendChild(outerDivEl);

  for (const header of pageHeaders) {
    let btn = document.createElement("button");
    btn.classList.add("sub-menu-btn");
    let link = document.createElement("a");
    link.classList.add(
      "nav-link",
      "black-font",
      "font-size-14",
      "font-weight-bold"
    );
    if (header === "Chair Menu") {
      link.href = `#${page}/chairView`;
      if (activeTab === "chairView") link.classList.add("active");
    }
    if (header === "Accepted") {
      link.href = `#${page}/acceptedStudies`;
      if (activeTab === "acceptedStudies") link.classList.add("active");
    }

    if (header === "DACC Menu") {
      link.href = `#${page}/daccView`;
      if (activeTab === "daccView") link.classList.add("active");
    }

    if (header === "Description of Studies") {
      link.href = `#${page}/description`;
      if (activeTab === "description") link.classList.add("active");
    }
    if (header === "Scientific Committee") {
      link.href = `#${page}/contact`;
      if (activeTab === "contact") link.classList.add("active");
    }
    if (header === "Summary Statistics") {
      link.href = `#${page}/summary`;
      if (activeTab === "summary") link.classList.add("active");
    }
    if (header === "Dictionary") {
      link.href = `#${page}/dictionary`;
      if (activeTab === "dictionary") link.classList.add("active");
    }
    if (header === "Subset Statistics") {
      link.href = `#${page}/subset`;
      if (activeTab === "subset") link.classList.add("active");
    }

    link.innerText = header;
    btn.appendChild(link);
    innerDivEl.appendChild(btn);
  }
  if (page !== "data_exploration") {
    const overviewDiv = document.createElement("div");

    overviewDiv.id = "overview";
    containerEl.appendChild(overviewDiv);
  }

  return containerEl.innerHTML;
}
