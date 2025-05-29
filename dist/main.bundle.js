/******/ (function() { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/@nciocpl/ncids-js/lib/esm/components/nci-header/extended-with-mega-menu/index.js":
/*!*******************************************************************************************************!*\
  !*** ./node_modules/@nciocpl/ncids-js/lib/esm/components/nci-header/extended-with-mega-menu/index.js ***!
  \*******************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   NCIExtendedHeaderWithMegaMenu: function() { return /* reexport safe */ _nci_header_component__WEBPACK_IMPORTED_MODULE_0__.NCIExtendedHeaderWithMegaMenu; }
/* harmony export */ });
/* harmony import */ var _nci_header_component__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./nci-header.component */ "./node_modules/@nciocpl/ncids-js/lib/esm/components/nci-header/extended-with-mega-menu/nci-header.component.js");



/***/ }),

/***/ "./node_modules/@nciocpl/ncids-js/lib/esm/components/nci-header/extended-with-mega-menu/nci-header.component.js":
/*!**********************************************************************************************************************!*\
  !*** ./node_modules/@nciocpl/ncids-js/lib/esm/components/nci-header/extended-with-mega-menu/nci-header.component.js ***!
  \**********************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   NCIExtendedHeaderWithMegaMenu: function() { return /* binding */ NCIExtendedHeaderWithMegaMenu; }
/* harmony export */ });
/* harmony import */ var _mega_menu_default_mega_menu_source__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../mega-menu/default-mega-menu-source */ "./node_modules/@nciocpl/ncids-js/lib/esm/components/nci-header/mega-menu/default-mega-menu-source.js");
/* harmony import */ var _mobile_menu_default_mobile_menu_source__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../mobile-menu/default-mobile-menu-source */ "./node_modules/@nciocpl/ncids-js/lib/esm/components/nci-header/mobile-menu/default-mobile-menu-source.js");
/* harmony import */ var _utils_mega_menu_mega_menu_nav__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../utils/mega-menu/mega-menu-nav */ "./node_modules/@nciocpl/ncids-js/lib/esm/components/nci-header/utils/mega-menu/mega-menu-nav.js");
/* harmony import */ var _utils_mobile_menu_mobile_menu__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../utils/mobile-menu/mobile-menu */ "./node_modules/@nciocpl/ncids-js/lib/esm/components/nci-header/utils/mobile-menu/mobile-menu.js");
/* harmony import */ var _utils_search__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../utils/search */ "./node_modules/@nciocpl/ncids-js/lib/esm/components/nci-header/utils/search.js");





class NCIExtendedHeaderWithMegaMenu {
    constructor(element, options) {
        this.searchInputFocusHandler = (event) => this.handleSearchFocus(event);
        this.searchInputBlurHandler = (event) => this.handleSearchBlur(event);
        this.element = element;
        this.options = options;
        this.megaMenuNav = this.wireUpMegaMenu();
        this.mobileMenu = this.wireUpMobileMenu();
        const searchFormEl = this.element.querySelector('form.nci-header-search');
        if (searchFormEl) {
            this.searchForm = new _utils_search__WEBPACK_IMPORTED_MODULE_4__.Search(searchFormEl, this.searchInputFocusHandler, this.searchInputBlurHandler);
        }
        const valid = _utils_search__WEBPACK_IMPORTED_MODULE_4__.Search.isSearchFormValid();
        if (valid) {
            this.searchDiv = this.element.querySelector('.nci-header-nav__secondary');
        }
        const existingComponent = NCIExtendedHeaderWithMegaMenu._components.get(this.element);
        if (existingComponent) {
            existingComponent.unregister();
        }
        NCIExtendedHeaderWithMegaMenu._components.set(this.element, this);
    }
    static create(element, options) {
        if (!(element instanceof HTMLElement)) {
            throw 'Element is not an HTMLElement';
        }
        return this._components.get(element) || new this(element, options);
    }
    static autoInit() {
        document.addEventListener('DOMContentLoaded', () => {
            const headers = Array.from(document.getElementsByClassName('nci-header'));
            headers.forEach((header) => {
                this.create(header, {
                    megaMenuSource: new _mega_menu_default_mega_menu_source__WEBPACK_IMPORTED_MODULE_0__.DefaultMegaMenuSource(),
                    mobileMenuSource: new _mobile_menu_default_mobile_menu_source__WEBPACK_IMPORTED_MODULE_1__.DefaultMobileMenuSource(),
                });
            });
        });
    }
    unregister() {
        if (this.searchForm) {
            this.searchForm.unregister();
        }
        this.megaMenuNav.unregister();
        this.mobileMenu.unregister();
        NCIExtendedHeaderWithMegaMenu._components.delete(this.element);
    }
    wireUpMegaMenu() {
        const navigation = this.element.querySelector('.nci-header-nav__primary');
        return new _utils_mega_menu_mega_menu_nav__WEBPACK_IMPORTED_MODULE_2__.MegaMenuNav(navigation, this.options.megaMenuSource);
    }
    wireUpMobileMenu() {
        const navigation = this.element;
        return new _utils_mobile_menu_mobile_menu__WEBPACK_IMPORTED_MODULE_3__.MobileMenu(navigation, this.options.mobileMenuSource);
    }
    handleSearchFocus(event) {
        event.preventDefault();
        this.searchDiv.classList.add('search-focused');
    }
    handleSearchBlur(event) {
        event.preventDefault();
        setTimeout(() => {
            this.searchDiv.classList.remove('search-focused');
        }, 250);
    }
}
NCIExtendedHeaderWithMegaMenu._components = new Map();


/***/ }),

/***/ "./node_modules/@nciocpl/ncids-js/lib/esm/components/nci-header/index.js":
/*!*******************************************************************************!*\
  !*** ./node_modules/@nciocpl/ncids-js/lib/esm/components/nci-header/index.js ***!
  \*******************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DefaultMegaMenuSource: function() { return /* reexport safe */ _mega_menu__WEBPACK_IMPORTED_MODULE_1__.DefaultMegaMenuSource; },
/* harmony export */   DefaultMobileMenuSource: function() { return /* reexport safe */ _mobile_menu__WEBPACK_IMPORTED_MODULE_2__.DefaultMobileMenuSource; },
/* harmony export */   NCIExtendedHeaderWithMegaMenu: function() { return /* reexport safe */ _extended_with_mega_menu__WEBPACK_IMPORTED_MODULE_0__.NCIExtendedHeaderWithMegaMenu; }
/* harmony export */ });
/* harmony import */ var _extended_with_mega_menu__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./extended-with-mega-menu */ "./node_modules/@nciocpl/ncids-js/lib/esm/components/nci-header/extended-with-mega-menu/index.js");
/* harmony import */ var _mega_menu__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./mega-menu */ "./node_modules/@nciocpl/ncids-js/lib/esm/components/nci-header/mega-menu/index.js");
/* harmony import */ var _mobile_menu__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./mobile-menu */ "./node_modules/@nciocpl/ncids-js/lib/esm/components/nci-header/mobile-menu/index.js");





/***/ }),

/***/ "./node_modules/@nciocpl/ncids-js/lib/esm/components/nci-header/mega-menu/default-mega-menu-source.js":
/*!************************************************************************************************************!*\
  !*** ./node_modules/@nciocpl/ncids-js/lib/esm/components/nci-header/mega-menu/default-mega-menu-source.js ***!
  \************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DefaultMegaMenuSource: function() { return /* binding */ DefaultMegaMenuSource; }
/* harmony export */ });
class DefaultMegaMenuSource {
    getMegaMenuContent(id) {
        console.warn(`Default Mega Menu Adapter does not support setting data-menu-id properties. Cannot fetch ${id}`);
        return null;
    }
}


/***/ }),

/***/ "./node_modules/@nciocpl/ncids-js/lib/esm/components/nci-header/mega-menu/index.js":
/*!*****************************************************************************************!*\
  !*** ./node_modules/@nciocpl/ncids-js/lib/esm/components/nci-header/mega-menu/index.js ***!
  \*****************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DefaultMegaMenuSource: function() { return /* reexport safe */ _default_mega_menu_source__WEBPACK_IMPORTED_MODULE_0__.DefaultMegaMenuSource; }
/* harmony export */ });
/* harmony import */ var _default_mega_menu_source__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./default-mega-menu-source */ "./node_modules/@nciocpl/ncids-js/lib/esm/components/nci-header/mega-menu/default-mega-menu-source.js");



/***/ }),

/***/ "./node_modules/@nciocpl/ncids-js/lib/esm/components/nci-header/mobile-menu/default-mobile-menu-source.js":
/*!****************************************************************************************************************!*\
  !*** ./node_modules/@nciocpl/ncids-js/lib/esm/components/nci-header/mobile-menu/default-mobile-menu-source.js ***!
  \****************************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DefaultMobileMenuSource: function() { return /* binding */ DefaultMobileMenuSource; }
/* harmony export */ });
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class DefaultMobileMenuSource {
    constructor() {
        this.useUrlForNavigationId = true;
        this.lang = document.documentElement.lang;
        this.primaryNavItems = Array.from(document.querySelectorAll('.nci-header-nav__primary-item a'));
        this.items = [
            {
                id: 0,
                label: 'Error',
                path: '/',
                langcode: this.lang,
                hasChildren: false,
            },
        ];
    }
    getInitialMenuId() {
        return __awaiter(this, void 0, void 0, function* () {
            return 0;
        });
    }
    getNavigationLevel(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.createDefaultMobileMenu(id);
        });
    }
    createDefaultMobileMenu(id) {
        this.items = this.primaryNavItems.map((item, index) => {
            const anchor = item;
            const path = anchor.href;
            const textContent = item.textContent;
            return {
                id: index,
                label: textContent,
                path: path,
                langcode: this.lang,
                hasChildren: false,
            };
        });
        return {
            id: id,
            label: '',
            path: '/',
            langcode: this.lang,
            hasChildren: true,
            items: this.items,
            parent: null,
        };
    }
}


/***/ }),

/***/ "./node_modules/@nciocpl/ncids-js/lib/esm/components/nci-header/mobile-menu/index.js":
/*!*******************************************************************************************!*\
  !*** ./node_modules/@nciocpl/ncids-js/lib/esm/components/nci-header/mobile-menu/index.js ***!
  \*******************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DefaultMobileMenuSource: function() { return /* reexport safe */ _default_mobile_menu_source__WEBPACK_IMPORTED_MODULE_0__.DefaultMobileMenuSource; }
/* harmony export */ });
/* harmony import */ var _default_mobile_menu_source__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./default-mobile-menu-source */ "./node_modules/@nciocpl/ncids-js/lib/esm/components/nci-header/mobile-menu/default-mobile-menu-source.js");



/***/ }),

/***/ "./node_modules/@nciocpl/ncids-js/lib/esm/components/nci-header/utils/focus-trap.js":
/*!******************************************************************************************!*\
  !*** ./node_modules/@nciocpl/ncids-js/lib/esm/components/nci-header/utils/focus-trap.js ***!
  \******************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   FocusTrap: function() { return /* binding */ FocusTrap; }
/* harmony export */ });
class FocusTrap {
    constructor(element) {
        this.focusableContent = [];
        this.eventListener = (event) => this.checkTrap(event);
        this.element = element;
        this.focusableElements =
            "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";
    }
    toggleTrap(state, context) {
        if (state) {
            this.findFocusableElements(context);
            context.addEventListener('keydown', this.eventListener, true);
        }
        else {
            context.removeEventListener('keydown', this.eventListener, true);
        }
    }
    findFocusableElements(element) {
        this.context = element;
        this.focusableContent = Array.from(element.querySelectorAll(this.focusableElements));
        this.firstFocusableElement = (element.querySelectorAll(this.focusableElements)[0]);
        this.lastFocusableElement = (this.focusableContent[this.focusableContent.length - 1]);
    }
    checkTrap(event) {
        const eventKey = event;
        const isTabPressed = eventKey.key === 'Tab' || parseInt(eventKey.code, 10) === 9;
        if (!isTabPressed) {
            return;
        }
        if (eventKey.shiftKey) {
            if (document.activeElement === this.firstFocusableElement) {
                this.lastFocusableElement.focus();
                eventKey.preventDefault();
            }
        }
        else {
            if (document.activeElement === this.lastFocusableElement) {
                this.firstFocusableElement.focus();
                eventKey.preventDefault();
            }
        }
    }
}


/***/ }),

/***/ "./node_modules/@nciocpl/ncids-js/lib/esm/components/nci-header/utils/mega-menu/mega-menu-nav.js":
/*!*******************************************************************************************************!*\
  !*** ./node_modules/@nciocpl/ncids-js/lib/esm/components/nci-header/utils/mega-menu/mega-menu-nav.js ***!
  \*******************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   MegaMenuNav: function() { return /* binding */ MegaMenuNav; }
/* harmony export */ });
/* harmony import */ var _focus_trap__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../focus-trap */ "./node_modules/@nciocpl/ncids-js/lib/esm/components/nci-header/utils/focus-trap.js");
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

const isNavBarMMItem = (item) => item.type === 'NavItemWithMM';
const isNavBarItemLink = (item) => item.type === 'NavItemLink';
class MegaMenuNav {
    constructor(primaryNavElement, adapter) {
        this.activeButton = null;
        this.activeMenu = null;
        this.customEvents = {};
        this.navItems = [];
        this.loader = document.createElement('div');
        this.loaderContainer = document.createElement('div');
        this.offsetMenuClickListener = (event) => this.handleOffsetMenuClick(event);
        this.offsetMenuKeyPressListener = (event) => this.handleOffsetKeypress(event);
        this.element = primaryNavElement;
        this.adapter = adapter;
        this.focusTrap = new _focus_trap__WEBPACK_IMPORTED_MODULE_0__.FocusTrap(this.element);
        this.content = document.createElement('template');
        this.loader.classList.add('nci-is-loading', 'hidden');
        this.loaderContainer.classList.add('nci-megamenu', 'hidden');
        this.loaderContainer.ariaLive = 'polite';
        this.loaderContainer.ariaBusy = 'true';
        this.loaderContainer.ariaAtomic = 'true';
        this.loaderContainer.appendChild(this.loader);
        this.initialize();
    }
    unregister() {
        this.navItems.forEach((item) => {
            this.unregisterMenuItem(item);
        });
        this.removeEventListeners();
        this.loader.remove();
        this.loaderContainer.remove();
    }
    unregisterMenuItem(item) {
        if (isNavBarMMItem(item)) {
            item.button.removeEventListener('click', item.buttonListener);
            item.button.replaceWith(item.link);
        }
        else if (isNavBarItemLink(item)) {
            item.link.removeEventListener('click', item.linkListener);
        }
    }
    initialize() {
        const listItems = this.element.querySelectorAll('.nci-header-nav__primary-link');
        this.navItems = Array.from(listItems).map((item) => {
            const button = this.createNavButton(item);
            if (button === null) {
                const linkListener = this.addLinkEventListeners(item);
                return {
                    type: 'NavItemLink',
                    link: item,
                    linkListener,
                };
            }
            const buttonListener = this.addButtonEventListeners(button);
            return {
                type: 'NavItemWithMM',
                link: item,
                button,
                buttonListener,
            };
        });
        this.createCustomEvents();
        this.addOffsetMenuListeners();
    }
    createNavButton(link) {
        const id = link.dataset.menuId;
        if (id == null) {
            return null;
        }
        const button = document.createElement('button');
        button.innerHTML = link.innerHTML;
        button.classList.add('usa-button', 'nci-header-nav__primary-button');
        button.setAttribute('aria-expanded', 'false');
        if (link.classList.contains('usa-current')) {
            button.classList.add('usa-current');
        }
        button.setAttribute('data-menu-id', id);
        button.setAttribute('aria-controls', `menu-${id}`);
        link.replaceWith(button);
        return button;
    }
    addButtonEventListeners(button) {
        const listener = (event) => __awaiter(this, void 0, void 0, function* () { return this.handleButtonClick(event); });
        button.addEventListener('click', listener);
        return listener;
    }
    handleButtonClick(event) {
        return __awaiter(this, void 0, void 0, function* () {
            const button = event.target;
            yield this.toggleMegaMenu(button);
        });
    }
    addLinkEventListeners(link) {
        const listener = (event) => __awaiter(this, void 0, void 0, function* () { return this.handleLinkClick(event); });
        link.addEventListener('click', listener);
        return listener;
    }
    handleLinkClick(event) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const link = event.currentTarget;
            const label = ((_a = link.textContent) !== null && _a !== void 0 ? _a : '').trim();
            this.element.dispatchEvent(this.customEvents['linkclick']({
                label,
                href: link.href,
                link,
            }));
        });
    }
    handleOffsetMenuClick(event) {
        if (this.activeButton && this.activeMenu) {
            const withinBoundaries = event.composedPath().includes(this.element);
            if (!withinBoundaries) {
                this.collapseMegaMenu();
            }
        }
    }
    handleOffsetKeypress(event) {
        if (this.activeButton && this.activeMenu) {
            const isEscapePressed = event.key === 'Escape';
            if (isEscapePressed) {
                this.collapseMegaMenu();
            }
        }
    }
    toggleMegaMenu(button) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.activeButton === button) {
                this.collapseMegaMenu();
            }
            else {
                if (this.activeButton) {
                    this.collapseMegaMenu();
                }
                yield this.expandMegaMenu(button);
            }
        });
    }
    collapseMegaMenu() {
        if (this.activeButton && this.activeMenu) {
            const collapseDetails = this.getDetailsForExpandCollapse(this.activeButton);
            this.focusTrap.toggleTrap(false, this.activeButton);
            this.activeButton.setAttribute('aria-expanded', 'false');
            this.activeButton = null;
            this.activeMenu.classList.add('hidden');
            this.activeMenu.setAttribute('aria-hidden', 'true');
            this.activeMenu.remove();
            this.activeMenu = null;
            this.element.dispatchEvent(this.customEvents['collapse'](collapseDetails));
        }
    }
    expandMegaMenu(button) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.createMenu(button);
            this.focusTrap.toggleTrap(true, button);
            this.activeButton = button;
            this.activeButton.setAttribute('aria-expanded', 'true');
            const menuId = this.activeButton.getAttribute('aria-controls');
            this.activeMenu = this.element.querySelector(`#${menuId}`);
            if (this.activeMenu) {
                this.activeMenu.classList.remove('hidden');
                this.activeMenu.setAttribute('aria-hidden', 'false');
                this.activeMenu.hidden = false;
            }
            this.element.dispatchEvent(this.customEvents['expand'](this.getDetailsForExpandCollapse(this.activeButton)));
        });
    }
    getDetailsForExpandCollapse(button) {
        var _a, _b;
        const btnText = ((_a = button.textContent) !== null && _a !== void 0 ? _a : '').trim();
        const id = (_b = button.dataset.menuId) !== null && _b !== void 0 ? _b : '';
        return {
            label: btnText,
            id,
            button,
        };
    }
    createMenu(button) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            button.after(this.loaderContainer);
            const timer = setTimeout(() => {
                this.loader.classList.remove('hidden');
                this.loaderContainer.classList.remove('hidden');
            }, 1000);
            const menuId = (_a = button.dataset.menuId) !== null && _a !== void 0 ? _a : '';
            const results = yield this.adapter.getMegaMenuContent(menuId);
            if (results) {
                clearTimeout(timer);
            }
            const id = `menu-${menuId.toString().replace(/[^\w\s]/gi, '')}`;
            this.content = results || document.createElement('div');
            this.content.setAttribute('id', id);
            this.content.classList.add('hidden');
            this.content.ariaLive = 'polite';
            this.content.ariaBusy = 'false';
            this.content.ariaAtomic = 'true';
            this.loader.classList.add('hidden');
            this.loaderContainer.classList.add('hidden');
            this.loaderContainer.replaceWith(this.content);
            button.setAttribute('aria-controls', id);
        });
    }
    addOffsetMenuListeners() {
        document.addEventListener('click', this.offsetMenuClickListener, false);
        document.addEventListener('keydown', this.offsetMenuKeyPressListener, false);
    }
    removeEventListeners() {
        document.removeEventListener('click', this.handleOffsetMenuClick, false);
        document.removeEventListener('keydown', this.handleOffsetKeypress, false);
    }
    createCustomEvents() {
        const events = ['collapse', 'expand'];
        [...events].forEach((event) => {
            this.customEvents[event] = (detail) => new CustomEvent(`nci-header:mega-menu:${event}`, {
                bubbles: true,
                detail,
            });
        });
        this.customEvents['linkclick'] = (detail) => new CustomEvent(`nci-header:primary-nav:linkclick`, {
            bubbles: true,
            detail,
        });
    }
}


/***/ }),

/***/ "./node_modules/@nciocpl/ncids-js/lib/esm/components/nci-header/utils/mobile-menu/mobile-menu.js":
/*!*******************************************************************************************************!*\
  !*** ./node_modules/@nciocpl/ncids-js/lib/esm/components/nci-header/utils/mobile-menu/mobile-menu.js ***!
  \*******************************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   MobileMenu: function() { return /* binding */ MobileMenu; }
/* harmony export */ });
/* harmony import */ var _focus_trap__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../focus-trap */ "./node_modules/@nciocpl/ncids-js/lib/esm/components/nci-header/utils/focus-trap.js");
var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};

const locale = {
    close: {
        en: 'Close Menu',
        es: 'Cerrar menú',
    },
    nav: {
        en: 'Primary navigation.',
        es: 'Navegación primaria.',
    },
};
class MobileMenu {
    constructor(mobileNavElement, adapter) {
        this.menuData = null;
        this.sectionParent = null;
        this.loader = this.createDom('div', [
            'nci-is-loading',
            'hidden',
        ]);
        this.resizeWidth = 1024;
        this.customEvents = {};
        this.linkClickListener = (e) => this.handleLinkClick(e);
        this.menuOpenEventListener = (e) => this.handleOpenMenu(e);
        this.windowResizeEventListener = (query) => {
            if (query.matches) {
                this.handleCloseMenu('Close');
            }
        };
        this.menuCloseButtonEventListener = () => this.handleCloseMenu('Close');
        this.menuCloseOverlayEventListener = () => this.handleCloseMenu('Overlay');
        this.escapeKeyPressListener = (e) => __awaiter(this, void 0, void 0, function* () {
            if (this.activeMenu) {
                const isEscapePressed = e.key === 'Escape';
                if (isEscapePressed) {
                    yield this.closeMenu('Escape');
                }
            }
        });
        if (!adapter.getInitialMenuId) {
            throw new Error('getInitialMenuId required to return a Promise of string or number.');
        }
        if (!adapter.getNavigationLevel) {
            throw new Error('getNavigationLevel required to return a Promise of MobileMenuData.');
        }
        this.element = mobileNavElement;
        this.adapter = adapter;
        this.pageUrl = window.location.pathname;
        this.focusTrap = new _focus_trap__WEBPACK_IMPORTED_MODULE_0__.FocusTrap(this.element);
        this.activeMenu = false;
        this.mobileButton = (this.element.querySelector('.nci-header-mobilenav__open-btn'));
        this.resizeMediaQuery = matchMedia(`(min-width: ${this.resizeWidth}px)`);
        this.langCode = document.documentElement.lang;
        this.initialize();
    }
    unregister() {
        this.element.removeEventListener('click', this.linkClickListener);
        this.mobileButton.removeEventListener('click', this.menuOpenEventListener, true);
        this.mobileClose.removeEventListener('click', this.menuCloseButtonEventListener, true);
        this.mobileOverlay.removeEventListener('click', this.menuCloseOverlayEventListener, true);
        document.removeEventListener('keydown', this.escapeKeyPressListener, false);
        this.resizeMediaQuery.removeEventListener('change', this.windowResizeEventListener);
        this.mobileOverlay.remove();
        this.mobileClose.remove();
        this.mobileNav.remove();
        this.loader.remove();
    }
    initialize() {
        this.mobileNav = (this.createDom('div', ['nci-header-mobilenav'], [
            { tabindex: -1 },
            { role: 'dialog' },
            { 'aria-modal': true },
            { id: 'nci-header-mobilenav' },
        ]));
        this.mobileNav.ariaLive = 'polite';
        this.mobileNav.ariaBusy = 'true';
        this.mobileNav.removeAttribute('hidden');
        this.mobileOverlay = (this.createDom('div', ['nci-header-mobilenav__overlay'], []));
        const ariaLabel = locale['close'][this.langCode];
        this.mobileClose = this.createDom('button', ['nci-header-mobilenav__close-btn'], [
            {
                'aria-controls': 'nci-header-mobilenav',
            },
            {
                'aria-label': ariaLabel,
            },
        ]);
        this.mobileClose.addEventListener('click', this.menuCloseButtonEventListener, true);
        this.mobileOverlay.addEventListener('click', this.menuCloseOverlayEventListener, true);
        this.mobileButton.addEventListener('click', this.menuOpenEventListener, true);
        this.mobileNav.append(this.mobileClose);
        this.mobileNav.append(this.loader);
        this.element.append(this.mobileNav);
        this.element.append(this.mobileOverlay);
        document.addEventListener('keydown', this.escapeKeyPressListener, false);
        this.resizeMediaQuery.addEventListener('change', this.windowResizeEventListener);
        this.createCustomEvents();
    }
    handleOpenMenu(event) {
        return __awaiter(this, void 0, void 0, function* () {
            const menuCheck = this.element.querySelector('.nci-header-mobilenav__list');
            if (menuCheck)
                menuCheck.remove();
            this.mobileNav.ariaBusy = 'true';
            this.loader.classList.remove('hidden');
            const target = event.currentTarget;
            const label = (target.textContent || '').trim();
            yield this.openMenu(label);
        });
    }
    handleCloseMenu(action) {
        this.closeMenu(action);
    }
    openMenu(label) {
        return __awaiter(this, void 0, void 0, function* () {
            this.activeMenu = true;
            this.mobileNav.removeAttribute('hidden');
            this.mobileNav.classList.add('active');
            this.mobileOverlay.classList.toggle('active');
            const initialMenuId = yield this.adapter.getInitialMenuId();
            this.menuData = yield this.adapter.getNavigationLevel(initialMenuId);
            const menu = this.displayNavLevel(this.menuData);
            const menuNav = this.createDom('nav', ['nci-header-mobilenav__nav'], [{ 'aria-label': locale['nav'][this.langCode] }]);
            menuNav.appendChild(menu);
            this.mobileNav.append(menuNav);
            this.mobileClose.focus();
            this.focusTrap.toggleTrap(true, this.mobileNav);
            this.mobileNav.ariaBusy = 'false';
            this.element.dispatchEvent(this.customEvents['open']({
                label: label,
                initialMenu: this.menuData,
            }));
        });
    }
    closeMenu(action) {
        this.activeMenu = false;
        this.mobileNav.setAttribute('hidden', 'hidden');
        this.focusTrap.toggleTrap(false, this.mobileNav);
        this.mobileNav.classList.remove('active');
        this.mobileOverlay.classList.remove('active');
        const lastMenu = this.menuData;
        this.menuData = null;
        this.element.dispatchEvent(this.customEvents['close']({
            action: action,
            lastMenu: lastMenu || null,
        }));
    }
    handleLinkClick(event, action, index) {
        return __awaiter(this, void 0, void 0, function* () {
            const menuCheck = this.element.querySelector('.nci-header-mobilenav__list');
            if (menuCheck)
                menuCheck.remove();
            this.mobileNav.ariaBusy = 'true';
            this.loader.classList.remove('hidden');
            const link = event.target;
            const dataMenuID = link.getAttribute('data-menu-id');
            const target = event.currentTarget;
            const label = (target.textContent || '').trim();
            if (dataMenuID) {
                this.menuData = yield this.adapter.getNavigationLevel(dataMenuID);
                const menu = this.displayNavLevel(this.menuData);
                this.mobileNav.append(menu);
                this.focusTrap.toggleTrap(true, this.mobileNav);
            }
            this.element.dispatchEvent(this.customEvents['linkclick']({
                action: action || null,
                data: this.menuData,
                label: label,
                index: index || null,
            }));
        });
    }
    displayNavLevel(data) {
        const items = data.items;
        this.sectionParent = data.parent;
        const menu = this.createDom('ul', ['nci-header-mobilenav__list']);
        const childItems = items.map((item, index) => {
            index = this.sectionParent ? index + 1 : index;
            return item.hasChildren
                ? this.makeMenuNode(item, index)
                : this.makeMenuLink(item, index);
        });
        if (this.sectionParent) {
            const menuList = this.createDom('ul', ['nci-header-mobilenav__list']);
            const menuBack = this.makeBackNode(this.sectionParent);
            menu.append(menuBack);
            const menuHolder = this.createDom('li', [
                'nci-header-mobilenav__list-holder',
            ]);
            menuHolder.append(menuList);
            const exploreSection = this.makeMenuLink(data, 0);
            menuList.append(exploreSection);
            menu.append(menuHolder);
            menuList.append(...childItems);
        }
        else {
            menu.append(...childItems);
        }
        this.mobileNav.ariaBusy = 'false';
        this.loader.classList.add('hidden');
        return menu;
    }
    makeBackNode(item) {
        const dataMenuID = this.adapter.useUrlForNavigationId ? item.path : item.id;
        const listItem = this.createDom('li', ['nci-header-mobilenav__list-node', 'active'], []);
        const linkLabel = this.createDom('button', ['nci-header-mobilenav__list-msg'], [
            { 'data-menu-id': dataMenuID },
            { 'data-href': item.path },
            { 'data-options': 0 },
            { 'data-isroot': 'false' },
        ]);
        linkLabel.innerHTML = item.label;
        linkLabel.addEventListener('click', (this.linkClickListener = (event) => this.handleLinkClick(event, 'Back')), true);
        listItem.append(linkLabel);
        return listItem;
    }
    makeMenuNode(item, index) {
        const dataMenuID = this.adapter.useUrlForNavigationId ? item.path : item.id;
        const listItem = this.createDom('li', ['nci-header-mobilenav__list-node'], []);
        const linkLabel = this.createDom('button', ['nci-header-mobilenav__list-label'], [
            { 'data-href': item.path },
            { 'data-menu-id': dataMenuID },
            { 'data-options': 0 },
            { 'data-isroot': 'false' },
        ]);
        linkLabel.innerHTML = item.label;
        listItem.addEventListener('click', (this.linkClickListener = (event) => this.handleLinkClick(event, 'Child', index)), true);
        listItem.append(linkLabel);
        return listItem;
    }
    makeMenuLink(item, index) {
        const listItem = this.createDom('li', ['nci-header-mobilenav__list-item'], []);
        const linkItem = this.createDom('a', ['nci-header-mobilenav__list-link'], [{ href: item.path }, { 'data-options': 0 }]);
        if (this.pageUrl === item.path)
            linkItem.classList.add('current');
        linkItem.innerHTML = item.label;
        listItem.addEventListener('click', (this.linkClickListener = (event) => this.handleLinkClick(event, 'Child', index)), true);
        listItem.append(linkItem);
        return listItem;
    }
    createDom(dom, classes, options) {
        const element = document.createElement(dom);
        if (classes) {
            [...classes].forEach((name) => {
                element.classList.add(name);
            });
        }
        if (options) {
            [...options].forEach((opt) => {
                const key = Object.keys(opt)[0];
                const value = Object.values(opt)[0];
                element.setAttribute(key, value);
            });
        }
        return element;
    }
    createCustomEvents() {
        const events = ['close', 'open', 'linkclick'];
        [...events].forEach((event) => {
            this.customEvents[event] = (detail) => new CustomEvent(`nci-header:mobile-menu:${event}`, {
                bubbles: true,
                detail,
            });
        });
    }
}


/***/ }),

/***/ "./node_modules/@nciocpl/ncids-js/lib/esm/components/nci-header/utils/search.js":
/*!**************************************************************************************!*\
  !*** ./node_modules/@nciocpl/ncids-js/lib/esm/components/nci-header/utils/search.js ***!
  \**************************************************************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   Search: function() { return /* binding */ Search; }
/* harmony export */ });
class Search {
    constructor(searchForm, searchInputFocusHandler, searchInputBlurHandler) {
        this.searchForm = searchForm;
        this.searchInputBlurHandler = searchInputBlurHandler;
        this.searchInputFocusHandler = searchInputFocusHandler;
        this.searchField = (this.searchForm.querySelector('#nci-header-search__field'));
        if (this.searchField) {
            this.initialize();
        }
    }
    initialize() {
        this.searchField.addEventListener('focus', this.searchInputFocusHandler, false);
        this.searchField.addEventListener('focusout', this.searchInputBlurHandler, false);
    }
    static isSearchFormValid() {
        const searchForm = document.querySelector('form.nci-header-search');
        const searchInput = document.querySelector('#nci-header-search__field');
        const searchButton = document.querySelector('button.nci-header-search__search-button');
        if (searchForm && searchInput && searchButton) {
            return true;
        }
        else {
            return false;
        }
    }
    unregister() {
        this.searchField.removeEventListener('focus', this.searchInputFocusHandler, false);
        this.searchField.removeEventListener('focusout', this.searchInputBlurHandler, false);
    }
}


/***/ }),

/***/ "./src/_includes/_megamenu.html":
/*!**************************************!*\
  !*** ./src/_includes/_megamenu.html ***!
  \**************************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
// Module
var code = "<div id=\"megamenu-layer\" class=\"nci-megamenu\" aria-live=\"polite\" aria-busy=\"false\" aria-atomic=\"true\"\n  aria-hidden=\"false\">\n  <div class=\"grid-container\">\n    <div class=\"grid-row grid-gap-1\">\n      <!-- <div class=\"grid-col-3 nci-megamenu__primary-pane\"><a class=\"nci-megamenu__primary-link\" href=\"/tools\">Explore\n          Tools and Resources</a></div> -->\n      <div class=\"nci-megamenu__items-pane grid-col-9\">\n        <div class=\"grid-row grid-gap\">\n          <div class=\"grid-col-4\">\n            <ul class=\"nci-megamenu__list\">\n              <li class=\"nci-megamenu__list-item\"><a class=\"nci-megamenu__list-item-link\"\n                  href=\"/tools/exposure-assessment-tools\">Cancer Mapping Tool</a></li>\n            </ul>\n          </div>\n          <div class=\"grid-col-4\">\n            <ul class=\"nci-megamenu__list\">\n              <li class=\"nci-megamenu__list-item\"><a class=\"nci-megamenu__list-item-link\"\n                  href=\"/tools/radiation-dosimetry-tools\">County Characteristics Tool</a></li>\n            </ul>\n          </div>\n          <div class=\"grid-col-4\">\n            <ul class=\"nci-megamenu__list\">\n              <li class=\"nci-megamenu__list-item\"><a class=\"nci-megamenu__list-item-link\"\n                  href=\"/tools/analysis\">Demographics Tool</a></li>\n            </ul>\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n</div>";
// Exports
/* harmony default export */ __webpack_exports__["default"] = (code);

/***/ }),

/***/ "./src/images/card_demographics.png":
/*!******************************************!*\
  !*** ./src/images/card_demographics.png ***!
  \******************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

module.exports = __webpack_require__.p + "images/card_demographics.png";

/***/ }),

/***/ "./src/images/card_map.png":
/*!*********************************!*\
  !*** ./src/images/card_map.png ***!
  \*********************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

module.exports = __webpack_require__.p + "images/card_map.png";

/***/ }),

/***/ "./src/images/card_quantile.png":
/*!**************************************!*\
  !*** ./src/images/card_quantile.png ***!
  \**************************************/
/***/ (function(module, __unused_webpack_exports, __webpack_require__) {

module.exports = __webpack_require__.p + "images/card_quantile.png";

/***/ }),

/***/ "./src/style/index.scss":
/*!******************************!*\
  !*** ./src/style/index.scss ***!
  \******************************/
/***/ (function(__unused_webpack_module, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	!function() {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = function(exports, definition) {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	!function() {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	!function() {
/******/ 		__webpack_require__.o = function(obj, prop) { return Object.prototype.hasOwnProperty.call(obj, prop); }
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	!function() {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = function(exports) {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	}();
/******/ 	
/******/ 	/* webpack/runtime/publicPath */
/******/ 	!function() {
/******/ 		var scriptUrl;
/******/ 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
/******/ 		var document = __webpack_require__.g.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript && document.currentScript.tagName.toUpperCase() === 'SCRIPT')
/******/ 				scriptUrl = document.currentScript.src;
/******/ 			if (!scriptUrl) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) {
/******/ 					var i = scripts.length - 1;
/******/ 					while (i > -1 && (!scriptUrl || !/^http(s?):/.test(scriptUrl))) scriptUrl = scripts[i--].src;
/******/ 				}
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/^blob:/, "").replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
/******/ 		__webpack_require__.p = scriptUrl;
/******/ 	}();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
!function() {
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _style_index_scss__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./style/index.scss */ "./src/style/index.scss");
/* harmony import */ var _includes_megamenu_html__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./_includes/_megamenu.html */ "./src/_includes/_megamenu.html");
/* harmony import */ var _images_card_map_png__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./images/card_map.png */ "./src/images/card_map.png");
/* harmony import */ var _images_card_quantile_png__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./images/card_quantile.png */ "./src/images/card_quantile.png");
/* harmony import */ var _images_card_demographics_png__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./images/card_demographics.png */ "./src/images/card_demographics.png");
/* harmony import */ var _nciocpl_ncids_js_nci_header__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! @nciocpl/ncids-js/nci-header */ "./node_modules/@nciocpl/ncids-js/lib/esm/components/nci-header/index.js");
 
// import '@nciocpl/ncids-js/nci-header/extended-with-mega-menu/auto-init';


 
 
 





// import '@nciocpl/ncids-js/usa-combo-box/auto-init'

// const megaMenuContent = document.querySelector("#megamenu-layer");

function getTemplateElements() {
  const template = document.createElement("template");
  template.innerHTML = _includes_megamenu_html__WEBPACK_IMPORTED_MODULE_1__["default"];
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

_nciocpl_ncids_js_nci_header__WEBPACK_IMPORTED_MODULE_5__.NCIExtendedHeaderWithMegaMenu.create(header, {
  megaMenuSource: new MegaMenuSource(),
  mobileMenuSource: new _nciocpl_ncids_js_nci_header__WEBPACK_IMPORTED_MODULE_5__.DefaultMobileMenuSource(),
});

// fetch("./_megamenu.html").then(file => file.text()).then(megaMenuHTML => {
//   console.log("H", megaMenuHTML)
//   const parser = new DOMParser();
//   const content = parser.parseFromString(megaMenuHTML, "text/html");
//   console.log(content)
// }) 
}();
/******/ })()
;
//# sourceMappingURL=main.bundle.js.map