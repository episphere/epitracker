// Major updates required
//test
// Need to update infoDeck and infoDeckAfterLoggedIn to match template
import { getFileInfo } from "./../shared.js";

export const infoDeck = () => {
  let template = "";
  template += `
        <div class="secondary-bg padding-bottom-1rem">
            <div class="confluence-banner">
                <!---<img src="./static/images/nci-vol-10623-150.jpg" class="banner-logo" style="min-height: 120px;  max-height=450px;" alt="Confluence logo">--->
                <div class="banner-overlay-text row justify-content-center text-center">
                    <div class="col-xl-12">
                        <h1 class="banner-overlay-h1">DCEG Epidemiology Data Platforms
                        </h1>
                        <div class="banner-overlay-line"></div>
                        <h2 class="banner-overlay-h3" style="font-size:2vw;"> Following FAIR principles in Support of Epidemiological Research
                        </h2>
                    </div>
                </div>
            </div>
            <div class="container align-middle text-center" style="margin-top: 70px;">
                <div class="card-deck" id="infoDeck" style="min-height: 200px;">`;
  template += cardContents({
    header: "Information on Accessing DCEG Data",
    button: "Information on Accessing DCEG Data",
    href: "#about/overview",
    icon: "fa-database",
    explanation: "",
  });
//   template += cardContents({
//     header: "About DCEG Data",
//     button: "Information on Accessing DCEG Data",
//     href: "#join",
//     icon: "fa-chart-bar",
//     explanation: "",
//   });
//   template += cardContents({
//     header: "Consortia Projects",
//     button: "Data Platform for Consortia Projects",
//     href: "#data_access/overview",
//     icon: "fa-database",
//     explanation: "",
//   });
//   template += cardContents({
//     header: "Research Studies",
//     button: "Data Platforms for DCEG studies",
//     href: "#researchStudies",
//     icon: "fa-database",
//     explanation: "",
//   });
//   template += cardContents({
//     header: "Datasets from DCEG Publications",
//     button: "Datasets from DCEG Publications available for request",
//     href: "#publicationpage",
//     icon: "fa-database",
//     explanation: "",
//   });
  template += `</div>
            </div>
        </div>
        <div class="secondary-bg inverse-triangle"></div>
        <div class="container align-center">
            <!--<div class="font-size-28 font-bold font-family-helvetica our-goals mt-3 mb-2">OUR GOALS</div>
            <div class="row">-->
                <div class="col-lg-3"></div>
                <div class="col-lg-6 font-size-18 align-left">To build a large-scale collaborative research resource with data from over 1.5 million women of different race/ethnic backgrounds participating in prospective cohort studies or trials to:</div>
                <div class="col-lg-3"></div>
            </div>
            <br>
            <div class="row">
                <div class="col-lg-3"></div>
                <div class="col-lg-6 font-size-18 align-left mb-3">
                    <ul>
                        <li>Develop comprehensive breast cancer risk prediction models for precision prevention in diverse populations</li>
                        <li>Validate newly developed models in integrated health care systems or breast cancer screening trials</li>
                    </ul>
                </div>
                <div class="col-lg-3"></div>
            </div>
        </div>
        <div class="ternary-bg">
            <div class="container align-left confluence-info font-family-montserrat">
                <div>The Division of Cancer Epidemiology and Genetics (DCEG) is a research program of the National Cancer Institure (NCI), one of the National Institutes of Health (NIH).</div>
            </div>
        </div>
    `;
  document.getElementById("confluenceDiv").innerHTML = template;
};

export const infoDeckAfterLoggedIn = async () => {
  const studyDescription = await getFileInfo(761599566277);
  let template = "";
  template += `
        <div class="secondary-bg padding-bottom-1rem">
            <div class="confluence-banner">
                <!---<img src="./static/images/nci-vol-10623-150.jpg" class="banner-logo" style="min-height: 120px;  max-height=250px;" alt="Confluence logo">--->
                <div class="banner-overlay-text row justify-content-center text-center">
                    <div class="col-md-12">
                        <h1 class="banner-overlay-h1">DCEG Epidemiology Data Platforms
                        </h1>
                        <div class="banner-overlay-line"></div>
                        <h2 class="banner-overlay-h3" style="font-size:2vw;">  Following FAIR principles in Support of Epidemiological Research
                        </h2>
                    </div>
                </div>
            </div>
            <div class="container align-middle text-center" style="margin-top: 70px;">
                <div class="card-deck" id="infoDeck" style="min-height: 200px;">`;
  if (studyDescription)
    template += cardContents({
      header: "Study Description",
      button: "Study Description",
      href: "#about/description",
      icon: "fa-file-alt",
      explanation: "View descriptions of participating studies.",
    });
//   template += cardContents({
//     header: "Consortia Projects",
//     button: "Data Platforms for Consortia Projects",
//     href: "#data_access/overview",
//     icon: "fa-handshake",
//     explanation: "",
//   });
  // template += cardContents({
  //   header: "Data Platforms for Consortia Projects",
  //   button: "Data Platforms for Consortia Projects",
  //   href: "#data_access/overview",
  //   icon: "fa-handshake",
  //   explanation: "",
  // });
//   template += cardContents({
//     header: "Research Studies",
//     button: "Data Platforms for Datasets from DCEG Studies",
//     href: "#researchStudies",
//     icon: "fa-database",
//     explanation: "",
//   });
//   template += cardContents({
//     header: "Publication",
//     button: "My Manuscript Datasets from DCEG Publications",
//     href: "#publicationpage",
//     icon: "fa-database",
//     explanation: "",
//   });
  // template += cardContents({
  //   header: "Explore Data",
  //   button: "Explore Data",
  //   href: "#data_exploration/summary",
  //   icon: "fa-chart-bar",
  //   explanation: "Explore summary-level data to plan analyses.",
  // });
  template += `</div>
            </div>
        </div>
        <div class="secondary-bg inverse-triangle"></div>
        <div class="container align-center">
            <!---<div class="font-size-28 font-bold font-family-montserrat our-goals mt-3 mb-2">OUR GOALS</div>
            <div class="row">-->
                <div class="col-lg-3"></div>
                <div class="col-lg-6 font-size-18 align-left">To build a large-scale collaborative research resource with data from over 1.5 million women of different race/ethnic backgrounds participating in prospective cohort studies or trials to:</div>
                <div class="col-lg-3"></div>
            </div>
            <br>
            <div class="row">
                <div class="col-lg-3"></div>
                <div class="col-lg-6 font-size-18 align-left mb-3">
                    <ul>
                        <li>Develop comprehensive breast cancer risk prediction models for precision prevention in diverse populations</li>
                        <li>Validate newly developed models in integrated health care systems or breast cancer screening trials</li>
                    </ul>
                </div>
                <div class="col-lg-3"></div>
            </div>
        </div>
        <div class="ternary-bg">
            <div class="container align-left confluence-info font-family-montserrat">
                <div>The Division of Cancer Epidemiology and Genetics (DCEG) is a research program of the National Cancer Institure (NCI), one of the National Institutes of Health (NIH).</div>
            </div>
        </div>
    `;
  document.getElementById("confluenceDiv").innerHTML = template;
};

const cardContents = (obj) => {
  return `
        <div class="col-xl card confluence-cards" style="min-width:225px">
            <div class="primary-bg rounded-circle" style="margin-top: -40px; padding: 10px;">
                <i class="fas ${obj.icon} fa-2x icon-padding font-white"></i>
            </div>
            <div class="card-body">
                <div class="card-title" style="color: #333B4D">
                    <div class="font-size-28"><b>${obj.header}</b></div>
                </div>
                <p class="text-secondary card-text font-size-14">
                    ${obj.explanation}
                </p>
            </div>

            <div class="white-bg border-top-0 card-footer" style="width: 100%;">
                <a class="stretched-link font-white my-2 border border-0 font-bold btn primary-bg" style="width: 90%;" href="${obj.href}" style="text-decoration: none;">${obj.button}</a>
            </div>
        </div>
        `;
};
