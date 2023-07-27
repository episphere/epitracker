import { addEventConsortiaFilter } from "../event.js";
import {
  getPublicFile,
  numberWithCommas,
  publicDataFileId,
} from "./../shared.js";
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
                <!-- <span>
                DCEG is committed to sharing research data according to the <a href= "https://sharing.nih.gov/data-management-and-sharing-policy/about-data-management-and-sharing-policies/data-management-and-sharing-policy-overview" target="__blank">NIH Data Sharing Policy</a> to further advance science, improve public health, while maximizing contributions from research participants. This site provides a suite of epidemiology data platforms to facilitate collaborations and share data from consortia, individual studies and publications led by DCEG investigators. 

                </span>
                </br>-->
                <b>Goal:</b>
                
                Developing an epidemiology data tracker platform with real-time interactive visual analytics. <br>  
              
              <b>Data:</b>
                The data comes from CBC national center of statistics for national health certificate data, CDC Wonder, a freely available platform where you can explore national health certificate data. 
                  
              
                </div>
                <!--</br>
                <div style="margin-left: 40px">
                <ul> 
                <li> DCEG Quintiles
                </li> 
                </ul>
                </i></div>
                </ul>
                </br>
                <div style="margin-left: 40px">
                <ul> 
                <li> DCEG Publications</li> 
                </ul>
                </i></div>
                </ul>
                </br>
               <b> How to request and access data:</b>
               </span>
                </br></br>
                DCEG epidemiology data platforms provide information about the data and controlled data access to individual-level data from study participants. Procedures of data access are described under each of the data platforms according to applicable data sharing policies. 
               </i> </div>
                </br>
            </div>
        </div>-->
        <div class="align-left" id="confluenceDataSummary"></div>
    </div>
`;
  document.getElementById("overview").innerHTML = template;
  // const response = await fetch("./publicDataSet.json");
  // countPublicStatistics(await response.json(), true);
};

const countPublicStatistics = (d, caseControl) => {
  const data = JSON.parse(JSON.stringify(d));
  const element = document.getElementById("confluenceDataSummary");
  let totalConsortia = 0;
  let totalPatients = 0;
  let totalWomen = 0;
  // let summary = `
  //   </br>
  //       <div class="align-center">
  //           <div class="main-summary-row" style="margin: 0px 15px;margin-bottom:10px">
  //               <div class="col-md-3" style="padding: 0px">
  //                   <div class="custom-border allow-overflow align-left" style="height:100%; padding-left: 5px !important; margin-right: 15px;">
  //                   <span class="font-size-17 font-bold">Cohort:</span></br>
  //                   <!---<span class="font-size-15">Cohort:</span></br>--->
  //                   <ul class="about-consortia" id='about-consortia-check'>
  //   `;
  for (let key in data) {
    if (!caseControl && key !== "CIMBA") continue;
    if (key === "dataModifiedAt") continue;
    ++totalConsortia;
    totalPatients += data[key].numPatients;
    totalWomen += data[key].numWomen;
    summary += `<div class="row font-size-16" style="margin:2px 2px;">
            ${
              key !== "CIMBA"
                ? `
                <input type="checkbox" data-consortia="${
                  data[key].name
                }" id="label${data[key].name}" class="checkbox-consortia"/>
                    <label for="label${
                      data[key].name
                    }" class="study-name" title="${data[key].name}">${
                    data[key].name.length > 10
                      ? `${data[key].name.substr(0, 10)}...`
                      : data[key].name
                  }</label>
            `
                : ``
            }
            </div>`;
  }
  summary += `</ul></div></div>
                <div class="col-md-9 align-center" style="padding: 0px">
                    <div class="custom-border" style="margin-right: 15px; height: 100%;" id="renderDataSummaryCounts"></div>
                </div></div>
                <div class="col data-last-modified align-left">Data last modified at - ${new Date(
                  data["dataModifiedAt"]
                ).toLocaleString()}</div></div>
                `;
  element.innerHTML = summary;
  addEventOverviewConsortiumSelection(d);
  addEventConsortiaFilter(d);
  renderDataSummary({ totalConsortia, totalWomen, totalPatients }, caseControl);
};

const addEventOverviewConsortiumSelection = (data) => {
  const select = document.getElementById("overviewConsortiumSelection");
  if (!select) return;
  select.addEventListener("change", () => {
    const selectedValue = select.value;
    countPublicStatistics(data, true);
  });
};
export const renderDataSummary = (obj, caseControl) => {
  document.getElementById("renderDataSummaryCounts").innerHTML = `
        <div class="row">
            <div class="col">
                <span class="font-size-22">Cohorts</span></br>
                <span class="font-size-32">${numberWithCommas(
                  obj.totalConsortia
                )}</span>
            </div>
            <div class="col">
                <span class="font-size-22">Study Participants</span></br>
                <span class="font-size-32">${numberWithCommas(
                  obj.totalWomen
                )}</span>
            </div>
            <div class="col">
                <span class="font-size-22">Breast Cancer Cases</span></br>
                <span class="font-size-32">${numberWithCommas(
                  obj.totalPatients
                )}</span>
            </div>
        </div>
    `;
};
