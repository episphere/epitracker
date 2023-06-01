export const confluenceContactPage = () => {
  const template = `
        <div class="general-bg padding-bottom-1rem">
            <div class="body-min-height">
                <div class="main-summary-row">
                    <div class="align-left">
                         <h1 class="page-header">Scientific Committee</h1>
                    </div>
                </div>
                <div class="main-summary-row confluence-resources white-bg div-border font-size-18">
                    <div class="col">
                        <span>For questions about the Breast Cancer Risk Prediction Project</span></br>
                        <span>send mail to: Pete Kraft at </strong> <a href="">pkraft@hsph.harvard.edu</a></span></br>
                        </br></br>
                        <div class="row">
                            <div class="col">
                                <table class="table table-bordered table-responsive w-100 d-block d-md-table">
                                    <thead>
                                        <tr><th>Member</th><th>Affiliation</th></tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td>Pete Kraft</td>
                                            <td>Harvard T.H. Chan School of Public Health</td>
                                        </tr>
                                        <tr>
                                            <td>Montserrat Garcia-Closas</td>
                                            <td>Division of Cancer Epidemiology and Genetics, USA</td>
                                        </tr>
                                        <tr>
                                            <td>Nilanjan Chatterjee</td>
                                            <td>Johns Hopkins University</td>
                                        </tr>
                                        <tr>
                                            <td>Lauren Teras</td>
                                            <td>American Cancer Society</td>
                                        </tr>
                                        <tr>
                                            <td>James Lacey</td>
                                            <td>City of Hope</td>
                                        </tr>
                                        <tr>
                                            <td>Mia Gaudet</td>
                                            <td>Division of Cancer Epidemiology and Genetics</td>
                                        </tr>
                                        <tr>
                                            <td>Chris Haiman</td>
                                            <td>University of South California</td>
                                        </tr>
                                        <tr>
                                            <td>Diana Buist</td>
                                            <td>Kaiser Pemanente Washington Health Research Institute</td>
                                        </tr>
                                        <tr>
                                            <td>Julie Palmer</td>
                                            <td>Boston University</td>
                                        </tr>
                                        <tr>
                                            <td>Mary Beth Terry</td>
                                            <td>Columbia University Mailman School of Public Health</td>
                                        </tr>
                                        <tr>
                                            <td>Stephanie Smith-Warner</td>
                                            <td>Harvard T.H. Chan School of Public Health</td>
                                        </tr>
                                        <tr>
                                            <td>Celine Vachon</td>
                                            <td>Mayo Clinic</td>
                                        </tr>
                                        <tr>
                                            <td>Lisa Gallicchio</td>
                                            <td>Division of Cancer Control and Population Sciences</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
  document.getElementById("overview").innerHTML = template;
};
