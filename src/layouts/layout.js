export const loadHeaderTemplate = () => {
  fetch("../src/layouts/header/header.html")
    .then((response) => response.text())
    .then((data) => {
      const headerPage = document.createElement("div");
      headerPage.innerHTML = data;
      const headerContent = headerPage.getElementsByTagName("header")[0];
      document
        .querySelector("header")
        .insertAdjacentElement("beforebegin", headerContent);
      document.getElementsByTagName("header")[1].remove();
    });
};

export const loadFooterTemplate = () => {
  fetch("../src/layouts/footer/footer.html")
    .then((response) => response.text())
    .then((data) => {
      const footerPage = document.createElement("div");
      footerPage.innerHTML = data;
      const footerContent = footerPage.getElementsByTagName("footer")[0];
      document
        .querySelector("footer")
        .insertAdjacentElement("beforebegin", footerContent);
      document.getElementsByTagName("footer")[1].remove();
    });
};
