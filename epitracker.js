import { infoDeck } from "./src/pages/homePage.js";
import {
  hideAnimation,
  assignNavbarActive
} from "./src/shared.js";
import { aboutepitracker, renderOverView } from "./src/pages/about.js";
import { footerTemplate } from "./src/components/footer.js";
import { renderQuantileVisualizationPage } from "./src/pages/quantileVisualization.js"
import { renderMapVisualizationPage } from "./src/pages/mapVisualization.js"
import { InstructionPage } from "./src/pages/instruction.js"

import {start as startQuantilePage} from "./src/utils/quantiles.js"
import {start as startMapPage} from "./src/utils/map.js"

export const epitracker = async () => {
  if(window.navigator && navigator.serviceWorker) {
    navigator.serviceWorker.getRegistrations()
    .then(function(registrations) {
      for(let registration of registrations) {
        registration.unregister();
        console.log("Service worker removed.")
      }
    });
  }
  manageRouter();
};

const manageRouter = async () => {
  const epitrackerDiv = document.getElementById("epitrackerDiv");
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
    aboutepitracker("overview");
    renderOverView();
  } else if (hash === "#visualization/quantile") {
    const element = document.getElementById("quantile-visualization");
    if (!element) return;
    if (element.classList.contains("navbar-active")) return;
    document.title = "quantile-visualization";
    assignNavbarActive(element);
    epitrackerDiv.innerHTML = renderQuantileVisualizationPage()
    //loadQuantileData().then((data => quantileDataLoaded(...data)))
    startQuantilePage()
  } 
  else if (hash === "#visualization/map") {
    const element = document.getElementById("map-visualization");
    if (!element) return;
    if (element.classList.contains("navbar-active")) return;
    document.title = "map-visualization";
    assignNavbarActive(element);
    epitrackerDiv.innerHTML = renderMapVisualizationPage()
    startMapPage()
    //loadMapData().then(mapDataLoaded)
  } 
else if (hash === "#instruction") {
  const element = document.getElementById("instructionPage");
  if (!element) return;
  if (element.classList.contains("navbar-active")) return;
  document.title = "map-visualization";
  assignNavbarActive(element);
  //aboutepitracker("overview");
  epitrackerDiv.innerHTML = InstructionPage ();
}
 else window.location.hash = "#home";
};

window.onload = async () => {
  const epitrackerDiv = document.getElementById("epitrackerDiv");
  epitrackerDiv.innerHTML = "";
  await epitracker();
  console.log("Loading epitracker");
};

window.onhashchange = () => {
  manageRouter();
};

window.addEventListener("beforeinstallprompt", (e) => {
  e.userChoice.then((choiceResult) => {
    gtag("send", "event", "A2H", choiceResult.outcome);
  });
});
