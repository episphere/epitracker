export const instruction = () => {
  return `
        <div class="general-bg padding-bottom-1rem">
            <div class="container body-min-height">
                <div class="main-summary-row">
                    <div class="align-left">
                        <h1 class="page-header">Uploading Publication Data to the DCEG Publication Data Repository (PDR)</h1>
                    </div>
                </div>
                <div class="main-summary-row white-bg div-border">
                    <div class="col font-size-18 align-left">
                        </br>
                        <div><b>NOTE: Before you can upload data to the DCEG PDR you need to have an approved <a href="https://nih.sharepoint.com/sites/NCI-DCEG-myDCEG/SitePages/Data-Sharing-and-Management-(DSM)-Policy.aspx/" target="__blank"> data sharing and management (DSM)
                        </a> plan and an <a href="https://nih.sharepoint.com/sites/NCI-DCEG-myDCEG/SitePages/Data-Sharing-and-Management-(DSM)-Policy.aspx" target="__blank"> Institutional Certificate (IC)</a> for the data you are uploading. If you have questions about the IC, please contact your Data Sharing Administrator (DSA).</b>
                        </br>
                        Questions about the DCEG PDR can be emailed to <a href="mailto:thomas.ahearn@nih.gov">thomas.ahearn@nih.gov</a>
                        <h2 class="page-header"> Data upload Process(PDR)</h2>
                        <ol>
                        <br>
                        <li>Select the approved data sharing management (DSM) plan for your data. This can either be a specific DSM for your publication data or a DSM (or multiple DSMs) for the study(ies) that generated the data you are uploading.
                        </br>
                        <br>
                        <img src="static/images/step1.png" alt="Instruction-step1">
                        </br>
                        </li>
                        <br><li>Select the appropriate data use restrictions/requirements that are associated with your data. This information will come from the Institutional Certification for the study(ies) that generated the data you are uploading to the PDR. If you are uncertain about the data use restrictions/requirements <b>do not</b> upload your data to the PDR. Contact your <a href="https://nih.sharepoint.com/sites/NCI-DCEG-myDCEG/SitePages/Data-Sharing-and-Management-(DSM)-Policy.aspx" target="__blank"> Data Sharing Administrator (DSA)</a>to review the IC for your study(ies) or to learn how to obtain an IC.
                        </br>
                        <br>
                        <img src="static/images/step2.png" alt="Instruction-step2">
                        </br>
                        </li>
                        <br><li>Provide information about your manuscript and the journal in which it is being published. Please provide the journal acronym that is used by the <a href="https://www.ncbi.nlm.nih.gov/nlmcatalog/journals/" target="__blank"> National Library of Medicine Catalog</a>. The information provided in this section will be used to create a Box folder that will store the data and metadata being uploaded to the PDR. The only people with access to this folder will be the person uploading the data/metadata and DCEG DSAs Geoff Tobias and Rebecca Troisi.
                        </br>
                        <br>
                        <img src="static/images/step3.png" alt="Instruction-step3">
                        </br>
                        </li>
                        <br><li>Select the data and metadata that should be uploaded to the PDR. Provide a file description for each of the files that are being uploaded. Note, the description will be viewable by all approved researchers that are given access to the data/metadata.
                        </br>
                        <br>
                        <img src="static/images/step4.png" alt="Instruction-step4">
                        </br>
                        </li>
                        <br><li>Review that your data/metadata were properly uploaded to Box.
                        </br>
                        <br>
                        <img src="static/images/step5.png" alt="Instruction-step5">
                        </br>
                        </li>
                        </ol>
                    <div>
                <div>
            <div>
        <div>
    `;
}

