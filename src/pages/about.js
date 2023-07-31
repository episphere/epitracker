import { pageNavBar } from "../components/navBarMenuItems.js";

export const aboutConfluence = (activeTab, showDescripton) => {
  let navBarItems = showDescripton
    ? pageNavBar(
        "about",

        activeTab
      )
    : `<div id='overview'></div>`;
  console.log({ navBarItems });
  let template = `
        <div class="general-bg body-min-height padding-bottom-1rem">
            <div class="container">
                ${navBarItems}
                    <!---<button class="sub-menu-btn"><a class="nav-link ${
                      activeTab === "contact" ? "active" : ""
                    } black-font font-size-14" href="#contact"> <strong> Scientific Committee</strong></a></button>--->
               
            </div>
        </div>
    `;
  document.getElementById("confluenceDiv").innerHTML = template;
};

// Changes needed here for definitions
export const renderOverView = async () => {
  let template = `
  <div class="main-summary-row">
  <div class="align-left">
       <h1 class="page-header">Information on the Epitracker platform
       </h1>
  </div>
</div>
    <div class="home-page-stats font-size-18">
        <div class="main-summary-row">
            <div class="col align-left">
                </br>
                <b>Goal:</b>
                
                Developing an epidemiology data tracker platform with real-time interactive visual analytics. <br>  
              
              <b>Data:</b>
                The data comes from CBC national center of statistics for national health certificate data, CDC Wonder, a freely available platform where you can explore national health certificate data. 
                  
              
                </div>
        <div class="align-left" id="confluenceDataSummary"></div>
    </div>
`;
  document.getElementById("overview").innerHTML = template;
};
