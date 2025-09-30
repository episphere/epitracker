import './style/index.scss'; 
import './style/gridette.css';
// import '@nciocpl/ncids-js/nci-header/extended-with-mega-menu/auto-init';
import megaMenuHTML from './_includes/_megamenu.html';

import './images/card_map.png'; 
import './images/card_quantile.png'; 
import './images/card_demographics.png'; 


import { DefaultMobileMenuSource } from '@nciocpl/ncids-js/nci-header';
import { NCIExtendedHeaderWithMegaMenu } from '@nciocpl/ncids-js/nci-header';

// import '@nciocpl/ncids-js/usa-combo-box/auto-init'

// const megaMenuContent = document.querySelector("#megamenu-layer");

function getTemplateElements() {
  const template = document.createElement("template");
  template.innerHTML = megaMenuHTML;
  const megaMenuElement = template.content.firstElementChild;
  return { megaMenuElement };
}

// const parser = new DOMParser();
// const megaMenuContent =  parser.parseFromString(megaMenuHTML, "text/html");
// const template = document.createElement("")
// console.log(megaMenuContent)
const { megaMenuElement } = getTemplateElements();

class MegaMenuSource {
  async getMegaMenuContent(id) {
    console.log(megaMenuElement)
    return megaMenuElement
  }
}

// Find the header HTML element.
const header = document.querySelector('#header-with-mega-menu');

NCIExtendedHeaderWithMegaMenu.create(header, {
  megaMenuSource: new MegaMenuSource(),
  mobileMenuSource: new DefaultMobileMenuSource(),
});

// fetch("./_megamenu.html").then(file => file.text()).then(megaMenuHTML => {
//   console.log("H", megaMenuHTML)
//   const parser = new DOMParser();
//   const content = parser.parseFromString(megaMenuHTML, "text/html");
//   console.log(content)
// }) 