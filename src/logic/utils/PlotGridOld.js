import { GridStack } from "gridstack";
import { addTippys, createDropdown, getContentHeight } from "./helper.js";


export class PlotGrid {
  constructor(options = {}) {
    options = {
      gridContainerElement: null,

      nRows: 1,
      nCols: 1,
      addHoverProximity: 80,

      ...options
    }
    Object.assign(this, options);

    this.nodeMatrix = Array.from({ length: this.nCols }, () => Array.from({ length: this.nRows }, () => null));

    this.listeners = {
      gridUpdated: d => d,
      editCardClicked: d => d,
      blankCardClicked: d => d,
      closeCardClicked: d => d,
      deleteRow: d => d,
      deleteColumn: d => d,
      ...options.listeners,
    }

    this.gridContainerElement.innerHTML = '';
    this.gridElement = document.createElement("div");
    this.gridElement.classList.add("grid-stack");
    this.gridContainerElement.appendChild(this.gridElement);

    this.grid = GridStack.init({
      row: options.nRows,
      column: options.nCols,
      disableResize: true,
      handle: ".fa-grip-horizontal"
    }, this.gridElement)
    this.grid.setAnimation(false);
    this.grid.removeAll();

    this.gridElement.style.height = "100%"

    const resizeObserver = new ResizeObserver(() => {
      const contentHeight = getContentHeight(this.gridContainerElement);
      this.grid.cellHeight(contentHeight / this.nRows )
      this.gridElement.style.height = "100%"
    })
    resizeObserver.observe(this.gridContainerElement)

    const addColumnButton = document.createElement("i")
    addColumnButton.setAttribute("class", "fa-solid fa-plus")
    addColumnButton.classList.add("plot-grid-add")
    addColumnButton.classList.add("plot-grid-add-col")
    addColumnButton.setAttribute("tip", "Add new column");
    addColumnButton.addEventListener("click", () => this.addColumn())
    this.gridElement.appendChild(addColumnButton)

    const addRowButton = document.createElement("i")
    addRowButton.setAttribute("class", "fa-solid fa-plus")
    addRowButton.classList.add("plot-grid-add")
    addRowButton.classList.add("plot-grid-add-row")
    addRowButton.setAttribute("tip", "Add new row");
    addRowButton.addEventListener("click", () => this.addRow())
    this.gridElement.appendChild(addRowButton)

    document.addEventListener("mousemove", e => {
      const bbox = this.gridElement.getBoundingClientRect()

      if (Math.abs(e.clientY - bbox.bottom) < this.addHoverProximity) {
        this.gridElement.classList.add("add-visible-row")
      } else {
        this.gridElement.classList.remove("add-visible-row")
      }

      if (Math.abs(e.clientX - bbox.right) < this.addHoverProximity) {
        this.gridElement.classList.add("add-visible-col")
      } else {
        this.gridElement.classList.remove("add-visible-col")
      }
    })

    this.grid.on("change", (e, gridNodes) => {
      console.log(gridNodes);

      // console.log(gridNodes);
      // gridNodes.forEach(gridNode => {
      //   const node = this.nodeMatrix[gridNode._orig.x][gridNode._orig.y];
      //   node.x = gridNode.x;
      //   node.y = gridNode.y;
      //   if (node.card) {
      //     node.card.x = gridNode.x;
      //     node.card.y = gridNode.y;
      //   }
      // })
      // const newNodeMatrix = this.nodeMatrix.map(d => [...d]);
      // for (let i = 0; i < this.nCols; i++) {
      //   for (let j = 0; j < this.nRows; j++) {
      //     const node = this.nodeMatrix[i][j];
      //     newNodeMatrix[node.x][node.y] = node;
      //   }
      // }
      // this.nodeMatrix = newNodeMatrix;
      // this.listeners.gridUpdated();
    })
  }


  addCard(content, options) {
    this.grid.batchUpdate(true);
    if (this.nodeMatrix[options.x]?.[options.y]) {
      this.grid.removeWidget(this.nodeMatrix[options.x][options.y].element);
    }
    const card = new PlotCard(content, options);

    const widget = this.grid.addWidget( options);
    const gridItemContent = widget.querySelector(".grid-stack-item-content");
    gridItemContent.appendChild(card.getElement());

    this.nodeMatrix[options.x][options.y] = { origX: options.x, origY: options.y, x: options.x, y: options.y, card, element: widget };
    this.tippyMap = addTippys();
    this.grid.batchUpdate(false);
  }

  addColumn() {
    this.grid.column(this.nCols + 1, "none")
    this.nodeMatrix.push([])
    this.grid.batchUpdate();
    for (let i = 0; i < this.nRows; i++) {
      this.addBlank({ y: i });
    }
    this.grid.batchUpdate(false);
    this.nCols = this.nCols + 1;
    this.listeners.gridUpdated();
  }

  addRow() {
    this.grid.cellHeight(getContentHeight(this.gridContainerElement) / (this.nRows + 1));
    this.grid.batchUpdate();
    this.grid.engine.maxRow = this.nRows + 1;
    for (let i = 0; i < this.nCols; i++) {
      this.addBlank({ x: i });
    }
    this.grid.batchUpdate(false);
    this.nRows = this.nRows + 1;
    this.listeners.gridUpdated();
  }

  removeRow(y) {
    console.log("Remove Row: ", y);

    this.nRows--;

    this.grid.batchUpdate();
    for (const widget of this.grid.engine.nodes.filter(d => d.y == y)) {
      this.grid.removeWidget(widget.el, true, true);
    }
    this.grid.engine.maxRow = this.nRows - 1;

    this.grid.cellHeight(getContentHeight(this.gridContainerElement) / this.nRows);
    this.grid.batchUpdate(false);
  }

  removeColumn(x) {
    console.log("Remove Col: ", x);

    this.nCols--;

    this.grid.batchUpdate();
    for (const widget of this.grid.engine.nodes.filter(d => d.x == x)) {
      this.grid.removeWidget(widget.el, true, true);
    }
    // this.grid.engine.maxCol = this.nCols - 1;
    this.grid.column(this.nCols);

    this.grid.updateOptions({
      columnOpts: {
        columnWidth: 1000 // New target width
      }
    });

    this.grid.compact();

    console.log(this.grid)

    this.grid.cellWidth(this.gridContainerElement.getBoundingClientRect().width / this.nCols);
    this.grid.batchUpdate(false);
  }

  addBlank(pos) {
    let openedBatch = false;
    if (!this.grid.engine.batchMode) {
      openedBatch = true;
      this.grid.batchUpdate(true);
    }
    if (this.nodeMatrix[pos.x]?.[pos.y]) {
      this.grid.removeWidget(this.nodeMatrix[pos.x][pos.y].element);
    }
    const blankElement = this.#blankItemElement();
    const widget = this.grid.addWidget( pos );
    const gridItemContent = widget.querySelector(".grid-stack-item-content");
    gridItemContent.appendChild(blankElement);
    const internalNode = this.grid.engine.addedNodes.at(-1);
    const node = { origX: internalNode.x, origY: internalNode.y, x: internalNode.x, y: internalNode.y, element: blankElement };
    this.nodeMatrix[node.x][node.y] = node;
    blankElement.addEventListener("click", () => {
      this.listeners.blankCardClicked(node.x, node.y)
    });
    blankElement.addEventListener("mouseover", () => {
      blankElement.classList.add("hover")
    })
    blankElement.addEventListener("mouseleave", () => {
      blankElement.classList.remove("hover")
    })

    const dropdown = createDropdown(blankElement, blankElement.querySelector(".plot-grid-blank-delete-button"), [
      {
        label: "Delete card row", action: () => this.removeRow(node.y)
      },
      {
        label: "Delete card column",  action: () => this.removeColumn(node.x)
      }
    ]);

    if (openedBatch) {
      this.grid.batchUpdate(false);
    }
  }

  getCards() {
    const cards = [];
    for (let i = 0; i < this.nodeMatrix[0].length; i++) {
      for (let j = 0; j < this.nodeMatrix.length; j++) {
        cards.push(this.nodeMatrix[j][i]?.card);
      }
    }
    return cards;
  }

  renderCards() {
    this.getCards().forEach(card => card?.render());
  }

  addListener(type, listener) {
    this.listeners[type] = listener;
  }

  #blankItemElement() {

    const gridItem = document.createElement("div");
    gridItem.classList.add("plot-grid-item");

    const blankItem = document.createElement("div");
    blankItem.classList.add("plot-grid-blank-item");
    gridItem.appendChild(blankItem);

    const plus = document.createElement("i");
    plus.className = "fas fa-plus-square plot-grid-blank-plus-button";
    blankItem.appendChild(plus);

    const plusText = document.createElement("span");
    plusText.className = "plot-grid-blank-info";
    plusText.innerText = "Click here to add a new plot.";
    blankItem.appendChild(plusText);

    const handle = document.createElement("div");
    handle.className = "fas fa-arrows-alt";
    handle.style.display = "none";
    blankItem.appendChild(handle);

    const deleteButton = document.createElement("i");
    deleteButton.setAttribute("tip", "Delete card, row, or column");
    deleteButton.className = "fas fa-trash-alt plot-grid-blank-delete-button";

    deleteButton.addEventListener("mouseover", (e) => {
      e.stopPropagation();
      gridItem.classList.remove("hover");
      deleteButton.classList.add("hover");
    });

    deleteButton.addEventListener("mouseleave", () => {
      deleteButton.classList.remove("hover");
    });

    deleteButton.addEventListener("click", e => {
      e.stopPropagation();
    });

    blankItem.appendChild(deleteButton);

    this.tippyMap = addTippys(); 

    return gridItem;
  }
}


class PlotCard {
  constructor(content, options) {
    options = {
      actions: [],
      ...options,
    };
    Object.assign(this, options);

    if (typeof content !== "function") {
      content = () => this.content;
    }
    this.content = content;
    this.#createElement(options);

    this.listeners = {

    };

    let timeout = null;
    const resizeObserver = new ResizeObserver(() => {
      this.contentElement.innerHTML = "";
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        this.render();
      }, 200);
    });
    resizeObserver.observe(this.cardElement);
  }

  render() {
    const bbox = this.contentElement.getBoundingClientRect();
    this.contentElement.innerHTML = '';
    let renderedContent = this.content(bbox.width, bbox.height);

    if (renderedContent instanceof Promise) {
      this.contentElement.innerText = "Loading...";
      renderedContent.then((content) => {
        this.contentElement.innerHTML = '';
        this.contentElement.appendChild(content);
      });
    } else if (renderedContent instanceof Element) {
      this.contentElement.appendChild(renderedContent);
    }
  }

  getElement() {
    return this.cardElement;
  }

  setTitle(title) {
    this.titleElement.innerText = title;
  }

  /**
   * TODO: Write this
   * @param {*} type 
   * @param {*} listener 
   */
  addListener(type, listener) {
    this.listeners[type] = listener;
  }

  triggerListener(name) {
    if (this.listeners.has(name)) {
      this.listeners[name](this);
    }
  }


  #createElement(options) {
    const gridCard = document.createElement("div");
    gridCard.className = "grid-card";
    gridCard.innerHTML = /*html*/`
      <div class="grid-card-topbar">
        <div class="grid-card-topbar-buttons-lrg"></div>
        <div class="grid-card-topbar-title">${this.title ? this.title : ""}</div>
        <div class="grid-card-topbar-buttons">
          <i class="fas fa-times highlightable-button"></i>
          <i class="fas fa-expand highlightable-button"></i>
          <i class="fas fa-arrows-alt card-handle highlightable-button"></i>
        </div>
      </div>
      <div class="grid-card-content-container"><div class="grid-card-content"></div></div>
    `;

    gridCard.querySelector(".fas.fa-expand").addEventListener("click", () => this.listeners.buttonClickedExpand(this));
    gridCard.querySelector(".fas.fa-times").addEventListener("click", () => this.listeners.buttonClickedClose(this));

    // Create a dropdown for data download (JSON/CSV)
    // createDropdownButton( gridCard.querySelector(".fas.fa-image"), [
    //   { text: "Download image (PNG)", callback: () => this.eventButtonImageClicked("png") },
    //   { text: "Download image (SVG)", callback: () => this.eventButtonImageClicked("svg") },
    // ]);

    // gridCard.querySelector(".fas.fa-table").addEventListener("click", () => this.#buttonClickedTable(options));

    this.cardElement = gridCard;
    this.contentElement = gridCard.querySelector(".grid-card-content");
    this.titleElement = gridCard.querySelector(".grid-card-topbar-title");
  }


}
