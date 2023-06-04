export const renderMapVisualizationPage = () => {
    const template = `
    <div class="container-fluid p-5">
      <div class="row">
        <h1 class="mb-4">County Map Cancer Distribution</h1> 
        <label for="levelSelect">Level</label>
        <select id="levelSelect" class="form-select mb-2" aria-label="Level select" disabled>
          <option hidden >Awaiting data...</option>
          <option >County</option>
          <option >State</option>
        </select>
      </div>    
      `;
    return template;
  };
 