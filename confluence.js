import { infoDeck, infoDeckAfterLoggedIn } from "./src/pages/homePage.js";
import {
  storeAccessToken,
  removeActiveClass,
  showAnimation,
  getCurrentUser,
  inactivityTime,
  filterConsortiums,
  getFolderItems,
  filterProjects,
  amIViewer,
  getCollaboration,
  hideAnimation,
  assignNavbarActive,
  getFileInfo,
  handleRangeRequests,
  applicationURLs,
  checkDataSubmissionPermissionLevel,
  uploadFormFolder,
  uploadFile,
  uploadWordFile,
  getFile,
} from "./src/shared.js";
import { aboutConfluence, renderOverView } from "./src/pages/about.js";
import { footerTemplate } from "./src/components/footer.js";
import { renderDescription } from "./src/pages/description.js";
import { renderQuantileVisualizationPage } from "./src/pages/quantileVisualization.js"
import { renderMapVisualizationPage } from "./src/pages/mapVisualization.js"

import {loadData as loadQuantileData, dataLoaded as quantileDataLoaded} from "./src/utils/quantiles.js"
import {loadData as loadMapData, dataLoaded as mapDataLoaded} from "./src/utils/map.js"

export const confluence = async () => {
  if ("serviceWorker" in navigator) {
    try {
      navigator.serviceWorker.register("./serviceWorker.js");
    } catch (error) {}
  }
  const confluenceDiv = document.getElementById("confluenceDiv");
  const navBarOptions = document.getElementById("navBarOptions");
  manageRouter();
};

const manageRouter = async () => {
  document.querySelector("[role='contentinfo']").innerHTML = footerTemplate();
  //if (localStorage.parms !== undefined) return;
  const hash = decodeURIComponent(window.location.hash);
  if (
    !document.getElementById("navBarBtn").classList.contains("collapsed") &&
    document.getElementById("navbarToggler").classList.contains("show")
  )
    document.getElementById("navBarBtn").click();
  if (hash === "#home") {
    const element = document.getElementById("homePage");
    console.log(element);
    if (!element) return;
    if (element.classList.contains("navbar-active")) return;
    document.title = "Epitracker";
    assignNavbarActive(element);
    infoDeck();
    hideAnimation();
  } else if (hash === "#about/overview") {
    const element = document.getElementById("aboutDCEG");
    if (!element) return;
    if (element.classList.contains("navbar-active")) return;
    document.title = "Epitracker - Overview";
    assignNavbarActive(element);
    aboutConfluence("overview");
    renderOverView();
  } else if (hash === "#quantile-visualization") {
    const element = document.getElementById("quantile-visualization");
    if (!element) return;
    if (element.classList.contains("navbar-active")) return;
    document.title = "quantile-visualization";
    assignNavbarActive(element);

    confluenceDiv.innerHTML = renderQuantileVisualizationPage()
    loadQuantileData().then((data => quantileDataLoaded(...data)))
  } 
  else if (hash === "#map-visualization") {
    const element = document.getElementById("map-visualization");
    if (!element) return;
    if (element.classList.contains("navbar-active")) return;
    document.title = "map-visualization";
    assignNavbarActive(element);

    confluenceDiv.innerHTML = renderMapVisualizationPage()
    loadMapData().then(mapDataLoaded)
  } else window.location.hash = "#home";
};

const manageHash = async () => {
  document.querySelector("[role='contentinfo']").innerHTML = footerTemplate();
  if (localStorage.parms === undefined) return;
  const hash = decodeURIComponent(window.location.hash);
  if (
    !document.getElementById("navBarBtn").classList.contains("collapsed") &&
    document.getElementById("navbarToggler").classList.contains("show")
  )
    document.getElementById("navBarBtn").click();
  if (hash === "#data_exploration/summary") {
    const element = document.getElementById("dataSummary");
    if (!element) return;
    element.click();
  } else if (
    hash === "#data_exploration/subset" &&
    !location.origin.match(applicationURLs.prod)
  ) {
    const element = document.getElementById("dataSummarySubset");
    if (!element) return;
    element.click();
  } else if (hash === "#data_exploration/dictionary") {
    const element = document.getElementById("dataDictionary");
    if (!element) return;
    element.click();
  } else if (hash === "#userSubmissions") {
    const element = document.getElementById("userSubmissions");
    if (!element) return;
    element.click();
  } 
  else if (hash === "#quantile-visualization") {
    const element = document.getElementById("quantile-visualization");
    element.click();
  } 
  else if (hash === "#map-visualization") {
    const element = document.getElementById("map-visualization");
    element.click();
  } 
  // else if (hash === "#data_access/overview") {
  //   const element = document.getElementById("dataRequest");
  //   element.click();
  // } 
  // else if (hash === "#researchStudies") {
  //   const element = document.getElementById("data2");
  //   element.click();
  // } 
  // else if (hash === "#publicationpage") {
  //   const element = document.getElementById("publicationID");
  //   element.click();
  // } 
  else if (hash === "#myDCEG") {
    const element = document.getElementById("myDCEGID");
    element.click();
  } else if (hash === "#uploadinstruction") {
    const element = document.getElementById("instructionID");
    element.click();
  } else if (hash === "#myDCEG/upload") {
    const element = document.getElementById("myDCEGID_upload");
    element.click();
  } 
  // else if (hash === "#data_access/form") {
  //   const element = document.getElementById("dataForm");
  //   if (!element) return;
  //   element.click();
  // } 
  else if (hash === "#data_access/acceptedStudies") {
    const element = document.getElementById("acceptedStudies");
    if (!element) return;
    element.click();
  } else if (hash === "#data_access/chairView") {
    const element = document.getElementById("chairView");
    if (!element) return;
    element.click();
  } else if (hash === "#data_access/daccView") {
    const element = document.getElementById("daccView");
    if (!element) return;
    element.click();
  } else if (hash === "#data_submission") {
    const element = document.getElementById("dataSubmission");
    element.click();
  } else if (hash === "#data_governance") {
    const element = document.getElementById("dataGovernance");
    if (element) {
      element.click();
    } else window.location.hash = "#";
  } else if (hash === "#my_projects") {
    const element = document.getElementById("myProjects");
    if (element) {
      element.click();
    } else window.location.hash = "#";
  } else if (hash === "#logout") {
    const element = document.getElementById("logOutBtn");
    element.click();
  } else if (hash === "#home") {
    const element = document.getElementById("homePage");
    if (!element) return;
    if (element.classList.contains("navbar-active")) return;
    assignNavbarActive(element);
    document.title = "Epitracker";
    infoDeckAfterLoggedIn();
    hideAnimation();
  } else if (hash === "#about/overview") {
    const element = document.getElementById("aboutDCEG");
    if (!element) return;
    assignNavbarActive(element);
    document.title = "DCEG - Overview";

    //const fileInfo = await getFileInfo(904897189551);
    //aboutConfluence("overview", fileInfo ? true : false);
    aboutConfluence("overview");
    renderOverView();
    hideAnimation();
  // } else if (hash === "#about/contact") {
  //   const element = document.getElementById("aboutBCRPP");
  //   console.log({ element });
  //   if (!element) return;
  //   assignNavbarActive(element);
  //   document.title = "BCRP - Scientific Committe";
  //   // const fileInfo = await getFileInfo(904897189551);
  //   // console.log({ fileInfo });
  //   //aboutConfluence("contact", fileInfo ? true : false);
  //   //aboutConfluence("contact");
  //   confluenceContactPage();
  //   hideAnimation();
  } 
  else if (hash === "#quantile-visualization") {
    const element = document.getElementById("quantile-visualization");
    if (!element) return;
    assignNavbarActive(element);
    document.title = "Quantile Visualization";
    // aboutConfluence("overview");
    // renderOverView();
    hideAnimation();
  }
  else if (hash === "#map-visualization") {
    const element = document.getElementById("map-visualization");
    if (!element) return;
    assignNavbarActive(element);
    document.title = "Map Visualization";
    // aboutConfluence("overview");
    // renderOverView();
    hideAnimation();
  }
   else if (hash === "#about/description") {
    const element = document.getElementById("aboutDCEG");
    if (!element) return;
    assignNavbarActive(element);
    document.title = "About Epitracker";
    showAnimation();
    //const fileInfo = await getFileInfo(904897189551); //new: 904897189551; original: 881144462693
    aboutConfluence("description", fileInfo ? true : false);
    renderDescription(fileInfo["content_modified_at"]);
    hideAnimation();
  } 
  // else if (hash === "#map-visualization") {
  //   const element = document.getElementById("map-visualization/overview");
  //   if (!element) return;
  //   if (element.classList.contains("navbar-active")) return;
  //   assignNavbarActive(element);
  //   document.title = "Map Visualization";
  //   // confluenceResources();
  //   hideAnimation();
  // }
  // else if (hash === "#join") {
  //   const element = document.getElementById("resourcesBCRPP");
  //   if (!element) return;
  //   if (element.classList.contains("navbar-active")) return;
  //   assignNavbarActive(element);
  //   document.title = "DCEG - Resources";
  //   confluenceResources();
  //   hideAnimation();
  // }
  // else if (hash === "#contact") {
  //   const element = document.getElementById("contactBCRPP");
  //   if (!element) return;
  //   if (element.classList.contains("navbar-active")) return;
  //   assignNavbarActive(element, 1);
  //   document.title = "BCRP - Committee";
  //   confluenceDiv.innerHTML = confluenceContactPage();
  //   hideAnimation();
  // }
  else window.location.hash = "#home";
};

window.onload = async () => {
  const confluenceDiv = document.getElementById("confluenceDiv");
  confluenceDiv.innerHTML = "";
  // if (localStorage.parms && JSON.parse(localStorage.parms).access_token) {
  //   await checkAccessTokenValidity();
  //   inactivityTime();
  // }
  await confluence();
  console.log("Loading Confluence");
};

window.onhashchange = () => {
  manageHash();
  manageRouter();
};

// window.onstorage = () => {
//   if (localStorage.parms === undefined) logOut();
//   else {
//     confluence();
//     // document.getElementById("loginBoxAppDev").hidden = true;
//     document.getElementById("loginBoxAppStage").hidden = true;
//     document.getElementById("loginBoxAppEpisphere").hidden = true;
//     document.getElementById("loginBoxAppProd").hidden = true;
//   }
// };

window.addEventListener("beforeinstallprompt", (e) => {
  e.userChoice.then((choiceResult) => {
    gtag("send", "event", "A2H", choiceResult.outcome);
  });
});
