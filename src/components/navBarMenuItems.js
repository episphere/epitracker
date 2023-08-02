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
/* 
  This function generates a page navigation bar with buttons for each page header.
  It creates a container element ('containerEl') with the "container" class to hold the navigation bar.
  The navigation bar consists of a list of buttons, each representing a page header.
  Each button has a link ('link') associated with it.
*/
export function pageNavBar(page, activeTab, ...pageHeaders) {
  // Create a container element 'containerEl' with the "container" class.
  const containerEl = document.createElement("div");
  containerEl.classList.add("container");

  // Create an outer div element 'outerDivEl' with specified classes.
  const outerDivEl = document.createElement("div");
  outerDivEl.classList.add("main-summary-row", "white-bg", "div-border");

  // Create an inner div element 'innerDivEl' with specified classes.
  const innerDivEl = document.createElement("div");
  innerDivEl.classList.add("main-summary-row", "white-bg", "div-border");

  // Append the 'innerDivEl' to the 'outerDivEl'.
  outerDivEl.appendChild(innerDivEl);

  // Append the 'outerDivEl' to the 'containerEl'.
  containerEl.appendChild(outerDivEl);

  // Iterate through each 'header' in 'pageHeaders' to create buttons for each page header.
  for (const header of pageHeaders) {
    // Create a button element 'btn' with the "sub-menu-btn" class.
    let btn = document.createElement("button");
    btn.classList.add("sub-menu-btn");

    // Create an anchor element 'link' with specified classes and set its 'href' attribute.
    let link = document.createElement("a");
    link.classList.add("nav-link", "black-font", "font-size-14", "font-weight-bold");
    link.href = `#${page}-${header.toLowerCase()}`;

    // Set the inner HTML of the link to the 'header'.
    link.innerHTML = header;

    // Append the 'link' to the 'btn'.
    btn.appendChild(link);

    // Append the 'btn' to the 'innerDivEl'.
    innerDivEl.appendChild(btn);
  }

  // Return the inner HTML content of the 'containerEl' as the result of the function.
  return containerEl.innerHTML;
}
