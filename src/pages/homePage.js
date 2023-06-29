export const infoDeck = () => {
  let template = "";
  template += `
        <div class="secondary-bg padding-bottom-1rem">
            <div class="confluence-banner">
                <div class="banner-logo">
                    <div class="banner-overlay-text row justify-content-center text-center">
                        <div class="col-xl-12">
                            <h1 class="banner-overlay-h1">Epitracker Data Platform
                            </h1>
                            <div class="banner-overlay-line"></div>
                            <h2 class="banner-overlay-h3" style="font-size:2vw;"> Following FAIR principles in Support of Epidemiological Research
                            </h2>
                        </div>
                    </div>
                </div>
            </div>
            <div class="container align-middle text-center" style="margin-top: 70px;">
                <div class="card-group" id="infoDeck" style="min-height: 200px;">`;
                    template += cardContents({
                        header: "About Epitracker",
                        button: "Information on Epitracker Dataplatfrom",
                        href: "#about/overview",
                        icon: "fa-circle-info",
                        explanation: "",
                    });
                    template += cardContents({
                        header: "Geographic Visualization",
                        button: "Interact with Geographic Visualization",
                        href: "#visualization/map",
                        icon: "fa-map",
                        explanation: "",
                    });
                    template += cardContents({
                        header: "Quantile Graphs",
                        button: "Interact with Quantile Graphs",
                        href: "#visualization/quantile",
                        icon: "fa-chart-line",
                        explanation: "",
                    });
                    // template += cardContents({
                    //     header: "Death Rate",
                    //     button: "Death Rate",
                    //     href: "#publicationpage",
                    //     icon: "fa-database",
                    //     explanation: "",
                    // });
  template += `</div>
            </div>
        </div>
        <div class="secondary-bg inverse-triangle"></div>
        <div class="container align-center">
           <!---<div class="font-size-28 font-bold font-family-montserrat our-goals mt-3 mb-2">OUR GOALS</div>
            <div class="row">-->
                <div class="col-lg-3"></div>
                <!---<div class="col-lg-6 font-size-18 align-left">To build a large-scale collaborative research resource with data from over 1.5 million women of different race/ethnic backgrounds participating in prospective cohort studies or trials to:</div>-->
                <div class="col-lg-3"></div>
            </div>
            <br>
            <div class="row">
                <div class="col-lg-3"></div>
                <div class="col-lg-6 font-size-18 align-left mb-3">
                    <ul>
                        <!---<li>Develop comprehensive breast cancer risk prediction models for precision prevention in diverse populations</li>
                        <li>Validate newly developed models in integrated health care systems or breast cancer screening trials</li>-->
                    </ul>
                </div>
                <div class="col-lg-3"></div>
            </div>
        </div>
        <div class="ternary-bg">
            <div class="container align-left confluence-info font-family-montserrat">
                <div><a href="https://dceg.cancer.gov" target="__blank">The Division of Cancer Epidemiology and Genetics</a> (DCEG) is a research program of the National Cancer Institure (NCI), one of the National Institutes of Health (NIH).  The Division is the world’s most comprehensive cancer epidemiology research group. Its renowned epidemiologists, geneticists, and biostatisticians conduct population and multidisciplinary research to discover the genetic and environmental determinants of cancer and new approaches to cancer prevention.</a></div>
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
