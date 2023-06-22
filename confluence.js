import { infoDeck } from "./src/pages/homePage.js";
import {
  hideAnimation,
  assignNavbarActive
} from "./src/shared.js";
import { aboutConfluence, renderOverView } from "./src/pages/about.js";
import { footerTemplate } from "./src/components/footer.js";
import { renderQuantileVisualizationPage } from "./src/pages/quantileVisualization.js"
import { renderMapVisualizationPage } from "./src/pages/mapVisualization.js"

import {loadData as loadQuantileData, dataLoaded as quantileDataLoaded} from "./src/utils/quantiles.js"
import {loadData as loadMapData, dataLoaded as mapDataLoaded} from "./src/utils/map.js"

export const confluence = async () => {
  // if ("serviceWorker" in navigator) {
  //   try {
  //     navigator.serviceWorker.register("./serviceWorker.js");
  //     console.log("Service Worker");
  //   } catch (error) {}
  // }
  manageRouter();
};

const manageRouter = async () => {
  const confluenceDiv = document.getElementById("confluenceDiv");
  const navBarOptions = document.getElementById("navBarOptions");
  document.querySelector("[role='contentinfo']").innerHTML = footerTemplate();
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

window.onload = async () => {
  const confluenceDiv = document.getElementById("confluenceDiv");
  confluenceDiv.innerHTML = "";
  await confluence();
  console.log("Loading Confluence");
};

window.onhashchange = () => {
  manageRouter();
};

window.addEventListener("beforeinstallprompt", (e) => {
  e.userChoice.then((choiceResult) => {
    gtag("send", "event", "A2H", choiceResult.outcome);
  });
});
