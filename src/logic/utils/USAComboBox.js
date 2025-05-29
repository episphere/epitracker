// import { ComboBoxUnselectedEventDetails } from './event-details/combo-box.unselected.event-details';
// import { ComboBoxSelectedEventDetails } from './event-details/combo-box.selected.event-details';
// import { ComboBoxTextChangeEventDetails } from './event-details/input.text-change.event-details';
// import { ComboBoxTextClearedEventDetails } from './event-details/input.text-cleared.event-details';
// import { ComboBoxCollapsedEventDetails } from './event-details/listbox.collapsed.event-details';
// import { ComboBoxExpandedEventDetails } from './event-details/listbox.expanded.event-details';
// import { ComboBoxNoResultsEventDetails } from './event-details/listbox.no-results.event-details';
/**
 * NOTE: This is a modification of the USAComboBox provided by the NCI design system. The changes are as follows:
 * - The behavior of filtering has been changed so that filters are applied only when the user modifies the textbox text.
 *    If they terminate that interaction, the filter is deactivated, and filtering will only be activated gain on
 *    subsequent interaction with the textbox.
 * - An option now must be selected. No blank selections.
 * - Added a method to the SDK for updating the options after creation.
 *
 * The USAComboBox component is used to initialize the `.usa-combo-box`
 * component.
 *
 * The combo box is a combination of two different user interface elements, an
 * [HTMLSelectElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLSelectElement)
 * for capturing options, and an
 * [HTMLInputElement](https://developer.mozilla.org/en-US/docs/Web/API/HTMLInputElement)
 * that allows users to filter the options.
 *
 * ## Default options
 * There are no options for USAComboBox.
 *
 * ## Initialization examples
 * The easiest way to user the combo box is to let the NCIDS automatically
 * initialize your combo box HTML.
 *
 * Add the following to the top of your main Javascript file, and it will add
 * trigger the Javascript initialization of the USAComboBox.
 *
 * @example
 * ```js
 * import '@nciocpl/ncids-js/usa-combo-box/auto-init';
 * ```
 *
 * If you need access to the combo box instance to further customize your site,
 * you can manually initialize the combo box:
 *
 * @example
 * ```js
 * import { USAComboBox } from '@nciocpl/ncids-js/usa-combo-box';
 *
 * // Find the combo box HTML element.
 * const comboBoxEl = document.querySelector('.usa-combo-box');
 *
 * // Initialize the component.
 * const comboBox = USAComboBox.create(comboBoxEl);
 * ```
 *
 * ## HTML Events
 *
 * The combo box component will dispatch the following
 * {@link https://developer.mozilla.org/docs/Web/API/CustomEvent | CustomEvent} types
 * that can be used to track analytics or other needs when a visitor interacts with
 * the combo box:
 *
 *  * `usa-combo-box:input:text-change` - Dispatched with {@link usa-combo-box~ComboBoxTextChangeEventDetails | ComboBoxTextChangeEventDetails} when the input value changes.
 *  * `usa-combo-box:input:text-cleared` - Dispatched with {@link usa-combo-box~ComboBoxTextClearedEventDetails | ComboBoxTextChangeEventDetails} when the input value is cleared without a new selection being made.
 *  * `usa-combo-box:listbox:expanded` - Dispatched with {@link usa-combo-box~ComboBoxExpandedEventDetails | ComboBoxExpandedEventDetails} when the listbox is opened.
 *  * `usa-combo-box:listbox:collapsed` - Dispatched with {@link usa-combo-box~ComboBoxCollapsedEventDetails | ComboBoxCollapsedEventDetails} when the listbox is closed.
 *  * `usa-combo-box:listbox:no-results` - Dispatched with {@link usa-combo-box~ComboBoxNoResultsEventDetails | ComboBoxNoResultsEventDetails} when the listbox shows the 'No Results Found' text.
 *  * `usa-combo-box:selected` - Dispatched with {@link usa-combo-box~ComboBoxSelectedEventDetails | ComboBoxSelectedEventDetails} when the user has selected an option from the listbox.
 *  * `usa-combo-box:unselected` - Dispatched with {@link usa-combo-box~ComboBoxUnselectedEventDetails | ComboBoxClearedEventDetails} when the selected option is unselected.
 *
 * @example
 * ```js
 * import { USAComboBox } from '@nciocpl/ncids-js/usa-combo-box';
 *
 * // Find the combo box HTML element.
 * const comboBoxEl = document.querySelector('.usa-combo-box');
 *
 * // Initialize the component.
 * const comboBox = USAComboBox.create(comboBoxEl);
 *
 * // Attach an event handler to the combo box to listen for custom events. g
 * comboBox.addEventListener('usa-combo-box:cleared', (event) => {
 *    // Add your analytics code here.
 *    console.log('Event occurred.');
 * });
 * ```
 */
class USAComboBox {
    /**
     * Sets component variables and initializes component.
     *
     * @param comboBox The combo box HTMLElement.
     * @protected
     */
    constructor(comboBox) {
        /** The base language of the document <html> element. */
        this.lang = document.documentElement.lang;
        this.lastValidValue = null;
        /** Mouse click listener for toggling the listbox. */
        this.toggleClickListener = () => this.handleToggle();
        /** Mouse click listener for clearing the combo box. */
        this.clearClickListener = () => this.handleClear();
        /** Mouse over listener for highlighting an option. */
        this.mouseoverListener = (e) => this.handleMouseover(e);
        /** Mouse click listener for selecting an option. */
        this.optionClickListener = (e) => this.handleOptionClick(e);
        /** Mouse click listener for showing the listbox. */
        this.inputClickListener = (e) => this.handleInputClick(e);
        /** Keydown event listener for the combo box keyboard interaction. */
        this.inputKeydownListener = (e) => this.handleInputKeydown(e);
        /** Input event listener for filtering the listbox on the combo box. */
        this.inputEventListener = (e) => this.handleInputChange(e);
        /** Callback for handling clicks outside of active listbox */
        this.outsideClickListener = (e) => this.handleOutsideClick(e);
        this.comboBox = comboBox;
        const existingComponent = USAComboBox._components.get(this.comboBox);
        if (existingComponent) {
            existingComponent.unregister();
        }
        const selectEl = this.comboBox.querySelector('select');
        if (!selectEl) {
            throw new Error('Combo box is missing inner select');
        }
        this.isOutside = false;
        this.select = selectEl;
        this.selectEl = selectEl.cloneNode(true);
        this.listboxId = `${this.select.id}--list`;
        this.assistiveHintID = `${this.select.id}--assistiveHint`;
        const label = document.querySelector(`label[for='${this.select.id}']`);
        if (!label) {
            throw new Error('Combo box is missing accessible label');
        }
        this.label = label;
        this.labelEl = label.cloneNode(true);
        this.label.id = `${this.select.id}-label`;
        this.lastValidValue = this.select.value || null;
        this.createComboBox();
        USAComboBox._components.set(this.comboBox, this);
    }
    /**
     * Instantiates the combo box.
     *
     * @param comboBox Element to initialize.
     */
    static create(comboBox) {
        if (!(comboBox instanceof HTMLElement)) {
            throw 'Element is not an HTMLElement';
        }
        return this._components.get(comboBox) || new this(comboBox);
    }
    /**
     * Creates all combo box components in document.
     * @internal
     */
    static createAll() {
        const comboBoxes = Array.from(document.getElementsByClassName('usa-combo-box'));
        return comboBoxes.map((comboBox) => this.create(comboBox));
    }
    /**
     * Auto initializes the combo box.
     * @internal
     */
    static autoInit() {
        document.addEventListener('DOMContentLoaded', () => {
            const comboBoxes = Array.from(document.getElementsByClassName('usa-combo-box'));
            comboBoxes.forEach((comboBox) => {
                this.create(comboBox);
            });
        });
    }
    /**
     * Resets component to a clean state.
     */
    unregister() {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        this.removeEventListeners();
        this.resetSelectState();
        (_a = this.input) === null || _a === void 0 ? void 0 : _a.remove();
        (_b = this.clearButtonWrapper) === null || _b === void 0 ? void 0 : _b.remove();
        (_c = this.clearButton) === null || _c === void 0 ? void 0 : _c.remove();
        (_d = this.buttonSeparator) === null || _d === void 0 ? void 0 : _d.remove();
        (_e = this.toggleButtonWrapper) === null || _e === void 0 ? void 0 : _e.remove();
        (_f = this.toggleButton) === null || _f === void 0 ? void 0 : _f.remove();
        (_g = this.listbox) === null || _g === void 0 ? void 0 : _g.remove();
        (_h = this.announcer) === null || _h === void 0 ? void 0 : _h.remove();
        (_j = this.assistiveHint) === null || _j === void 0 ? void 0 : _j.remove();
    }
    /**
     * Removes all event listeners.
     */
    removeEventListeners() {
        if (this.input) {
            this.input.removeEventListener('click', this.inputClickListener);
            this.input.removeEventListener('keydown', this.inputKeydownListener);
            this.input.removeEventListener('change', this.inputEventListener);
        }
        if (this.toggleButton) {
            this.toggleButton.removeEventListener('click', this.toggleClickListener);
        }
        if (this.listOptions) {
            this.listOptions.forEach((option) => {
                option.removeEventListener('mouseover', this.mouseoverListener);
            });
        }
        document.removeEventListener('click', this.outsideClickListener, true);
    }
    /**
     * A string reflecting the value of the form control.
     */
    getValue() {
        return this.select.value;
    }
    /**
     * An Array representing the set of <option> elements that are
     * selected.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLSelectElement/selectedOptions
     */
    getSelectedOptions() {
        return Array.from(this.select.selectedOptions);
    }
    /**
     * An Array representing the set of <option> elements
     * contained by this element.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/API/HTMLSelectElement/options
     */
    getOptions() {
        return Array.from(this.select.options);
    }
    /**
     * Sets the combo box and select by value if match found.
     * @param value Value of option to be selected.
     */
    setSelectedByValue(value) {
        const option = this.comboBox.querySelector(`[data-value='${value}']`);
        if (option) {
            this.setComboBox(option);
            this.hideListbox();
        }
    }
    /**
     * Triggers the creation of the majority of the elements needed to build the
     * combo box and adds them to the DOM.
     */
    createComboBox() {
        this.comboBox.appendChild(this.createInput());
        // this.comboBox.appendChild(this.createClearButtonWrapper());
        this.comboBox.appendChild(this.createButtonSeparator());
        this.comboBox.appendChild(this.createToggleButtonWrapper());
        this.comboBox.appendChild(this.createAnnouncer());
        this.comboBox.appendChild(this.createListbox());
        this.comboBox.appendChild(this.createAssistiveHint());
        this.hideSelect();
        this.hideListbox();
        document.addEventListener('click', this.outsideClickListener, true);
    }
    /**
     * Hides the original select element to be replaced by the combo box input.
     */
    hideSelect() {
        this.select.setAttribute('aria-hidden', 'true');
        this.select.setAttribute('tabindex', '-1');
        this.select.setAttribute('autocomplete', 'off');
        this.select.classList.add('usa-sr-only', 'usa-combo-box__select');
        this.select.id = '';
    }
    /**
     * Resets the select and label elements when unregistering.
     */
    resetSelectState() {
        this.select.replaceWith(this.selectEl);
        this.label.replaceWith(this.labelEl);
    }
    /**
     * Creates the combo box input element.
     */
    createInput() {
        this.input = document.createElement('input');
        this.input.setAttribute('id', this.select.id);
        this.input.setAttribute('aria-owns', this.listboxId);
        this.input.setAttribute('aria-controls', this.listboxId);
        this.input.setAttribute('aria-autocomplete', 'list');
        this.input.setAttribute('aria-describedby', this.assistiveHintID);
        this.input.setAttribute('aria-expanded', 'false');
        this.input.setAttribute('aria-activedescendant', '');
        this.input.setAttribute('autocapitalize', 'off');
        this.input.setAttribute('autocomplete', 'off');
        this.input.setAttribute('class', 'usa-combo-box__input');
        this.input.setAttribute('type', 'text');
        this.input.setAttribute('role', 'combobox');
        this.input.required = this.select.required;
        this.input.disabled = this.select.disabled;
        this.input.addEventListener('click', this.inputClickListener);
        this.input.addEventListener('keydown', this.inputKeydownListener);
        this.input.addEventListener('input', this.inputEventListener);
        return this.input;
    }
    /**
     * Creates a stylistic button separator for clear and toggle buttons.
     */
    createButtonSeparator() {
        this.buttonSeparator = document.createElement('span');
        this.buttonSeparator.setAttribute('class', 'usa-combo-box__input-button-separator');
        this.buttonSeparator.innerHTML = '&nbsp;';
        return this.buttonSeparator;
    }
    /**
     * Creates wrapper element for the toggle button for styling and triggers the
     * creation of the toggle button.
     */
    createToggleButtonWrapper() {
        this.toggleButtonWrapper = document.createElement('span');
        this.toggleButtonWrapper.setAttribute('class', 'usa-combo-box__toggle-list__wrapper');
        this.toggleButtonWrapper.setAttribute('tabindex', '-1');
        this.toggleButtonWrapper.appendChild(this.createToggleButton());
        return this.toggleButtonWrapper;
    }
    /**
     * Creates button element that will toggle the listbox.
     */
    createToggleButton() {
        const label = this.lang === 'es'
            ? 'Pulse la tecla de flecha hacia abajo para desplegar la lista de las opciones'
            : 'Toggle the dropdown list';
        this.toggleButton = document.createElement('button');
        this.toggleButton.setAttribute('tabindex', '-1');
        this.toggleButton.setAttribute('class', 'usa-combo-box__toggle-list');
        this.toggleButton.setAttribute('aria-label', label);
        this.toggleButton.setAttribute('aria-controls', this.listboxId);
        this.toggleButton.setAttribute('aria-expanded', 'false');
        this.toggleButton.setAttribute('type', 'button');
        this.toggleButton.addEventListener('click', this.toggleClickListener);
        this.toggleButton.innerHTML = '&nbsp;';
        this.toggleButton.disabled = this.select.disabled;
        return this.toggleButton;
    }
    /**
     * Creates combo box listbox and triggers option list creation.
     */
    createListbox() {
        this.listbox = document.createElement('ul');
        this.listbox.setAttribute('tabindex', '-1');
        this.listbox.setAttribute('id', this.listboxId);
        this.listbox.setAttribute('class', 'usa-combo-box__list');
        this.listbox.setAttribute('role', 'listbox');
        this.listbox.setAttribute('aria-labelledby', this.label.id);
        const options = this.createOptions();
        this.updateListbox(options);
        const selectedOption = [...options].find((option) => option.dataset.selected === 'true');
        if (selectedOption) {
            this.setComboBox(selectedOption);
            this.hideListbox();
        }
        return this.listbox;
    }
    /**
     * Creates list of options.
     */
    createOptions() {
        const selectOptions = Array.from(this.select.options);
        const filteredOptions = [...selectOptions].filter((option) => !option.disabled &&
            option.hasAttribute('value') &&
            option.value &&
            option.value.trim() !== '');
        this.listOptions = [...filteredOptions].map((option, index) => {
            const optionId = `${this.listboxId}--option-${index + 1}`;
            const li = document.createElement('li');
            li.setAttribute('aria-setsize', `${filteredOptions.length}`);
            li.setAttribute('aria-posinset', `${index + 1}`);
            li.setAttribute('aria-selected', 'false');
            li.setAttribute('id', optionId);
            li.setAttribute('class', 'usa-combo-box__list-option');
            li.setAttribute('tabindex', '-1');
            li.setAttribute('role', 'option');
            li.setAttribute('data-selected', `${option.selected}`);
            li.setAttribute('data-value', option.value);
            li.textContent = option.textContent;
            li.addEventListener('mouseover', this.mouseoverListener);
            li.addEventListener('click', this.optionClickListener);
            return li;
        });
        return this.listOptions;
    }
    /**
     * Creates status announcer for users with assistive technologies.
     */
    createAnnouncer() {
        this.announcer = document.createElement('div');
        this.announcer.setAttribute('class', 'usa-combo-box__status usa-sr-only');
        this.announcer.setAttribute('role', 'status');
        return this.announcer;
    }
    /**
     * Creates instructional hint for users with assistive technologies on how to
     * use the combo box.
     */
    createAssistiveHint() {
        this.assistiveHint = document.createElement('span');
        this.assistiveHint.setAttribute('id', this.assistiveHintID);
        this.assistiveHint.setAttribute('class', 'usa-sr-only');
        this.assistiveHint.textContent =
            this.lang === 'es'
                ? 'Si hay campos que se autocompletan, use las teclas de flecha para conocer las opciones y pulse la tecla Enter para seleccionar. En los dispositivos táctiles, navegue por la pantalla al tacto o deslizando un dedo.'
                : 'When autocomplete results are available use up and down arrows to review and enter to select. Touch device users, explore by touch or with swipe gestures.';
        return this.assistiveHint;
    }
    /**
     * Updates status announcer with number of options available to select. Clears
     * announcer if no options are available.
     * @param termCount Number of options available in list.
     */
    updateAnnouncer(termCount) {
        if (!this.announcer) {
            this.unregister();
            throw new Error('Combo box announcer error');
        }
        if (termCount >= 1) {
            this.announcer.textContent =
                this.lang === 'es'
                    ? `${termCount.toString()} sugerencias automáticas. Use flecha arriba o flecha abajo para escuchar las opciones.`
                    : `${termCount.toString()} suggestions found, use up and down arrows to review.`;
        }
        else {
            this.announcer.textContent = '';
        }
    }
    /**
     * Handles mouse click event of input and toggle button. Toggles listbox.
     */
    handleToggle() {
        this.toggleListbox();
        // if (this.input && this.input.value) {
        // 	this.filterListbox(this.input.value);
        // }
    }
    /**
     * Handles mouse click event of clear button. Clears the combo box.
     */
    handleClear() {
        this.unsetComboBox();
    }
    /**
     * Handles mouse over event of option. Places visual focus to hovered option.
     * @param event Mouse event of hovered option.
     */
    handleMouseover(event) {
        const mouseEvent = event;
        const target = mouseEvent.currentTarget;
        this.highlightOption(target);
    }
    /**
     * Handles mouse click event of option. Sets combo box to clicked option.
     * @param event Mouse event of clicked option.
     */
    handleOptionClick(event) {
        const mouseEvent = event;
        const target = mouseEvent.currentTarget;
        this.setComboBox(target);
        this.hideListbox();
    }
    /**
     * Handles mouse click event of the input. Shows listbox and sets focus.
     * @param event Mouse event of clicked input.
     */
    handleInputClick(event) {
        const mouseEvent = event;
        const input = mouseEvent.currentTarget;
        input.focus();
        this.showListbox();
        this.selectedOption = undefined;
        // if (input.value) {
        // 	this.filterListbox(input.value);
        // }
    }
    /**
     * Handles accessible keyboard events on the input element.
     *
     * See comments for a11y requirements for:
     * * Arrow up
     * * Arrow down
     * * Enter
     * * Escape
     * @param event Keyboard event made on the input element.
     */
    handleInputKeydown(event) {
        const keyboardEvent = event;
        const input = keyboardEvent.currentTarget;
        switch (keyboardEvent.key) {
            case 'ArrowDown': {
                keyboardEvent.preventDefault();
                this.showListbox();
                // if (input.value) {
                // 	this.filterListbox(input.value);
                // }
                /*
                  Moves focus to and selects the next option. If focus is on the last
                  option, either returns focus to the combobox or does nothing.
                 */
                /*
                    If the autocomplete behavior automatically selected a suggestion
                    before Down Arrow was pressed, [visual] focus is placed on the
                    suggestion following the automatically selected suggestion.
                 */
                if (this.selectedOption) {
                    this.highlightOption(this.selectedOption);
                    this.scrollToOption(this.selectedOption);
                    this.selectedOption = undefined;
                }
                /*
                  Otherwise, places [visual] focus on the first focusable element
                  in the popup.
                 */
                if (!this.selectedOption) {
                    const firstChild = this.listbox && !this.highlightedOption
                        ? this.listbox.firstChild
                        : undefined;
                    const nextSibling = this.highlightedOption
                        ? this.highlightedOption.nextSibling
                        : undefined;
                    const option = nextSibling || firstChild;
                    if (option) {
                        this.highlightOption(option);
                        this.scrollToOption(option);
                    }
                }
                break;
            }
            case 'ArrowUp': {
                keyboardEvent.preventDefault();
                this.showListbox();
                // if (input.value) {
                // 	this.filterListbox(input.value);
                // }
                /*
                  Moves focus to and selects the previous option. If focus is on the
                  first option, either returns focus to the combobox or does nothing.

                  If the popup is available, places [visual] focus on the last
                  focusable element in the popup.
                 */
                const lastChild = this.listbox && !this.highlightedOption
                    ? this.listbox.lastChild
                    : undefined;
                const prevSibling = this.highlightedOption
                    ? this.highlightedOption.previousSibling
                    : undefined;
                const option = prevSibling || lastChild;
                if (option) {
                    this.highlightOption(option);
                    this.scrollToOption(option);
                }
                break;
            }
            case 'Enter': {
                keyboardEvent.preventDefault();
                /*
                  If the combobox is editable and an autocomplete suggestion is selected
                  in the popup, accepts the suggestion either by placing the input
                  cursor at the end of the accepted value in the combobox or by
                  performing a default action.

                  Accepts the focused option in the listbox by closing the popup,
                  placing the accepted value in the combobox, and if the combobox is
                  editable, placing the input cursor at the end of the value.
                 */
                if (this.highlightedOption) {
                    this.setComboBox(this.highlightedOption);
                    this.hideListbox();
                }
                break;
            }
            case 'Escape': {
                /*
                  Dismisses the popup if it is visible. Optionally, if the popup is
                  hidden before Escape is pressed, clears the combobox.
                 */
                if (this.listbox) {
                    this.isOutside = true;
                    this.listbox.hidden ? this.unsetComboBox() : this.hideListbox(true);
                }
                break;
            }
            case 'Tab': {
                /*
                  Tab rules have been copied from W3: Editable combobox with list
                    autocomplete example.

                    Tab causes the active selection to be removed and closes the listbox.

                    Shift tab acts as "go back" without losing current progress, as in
                    leaving the active selection the listbox open.
                 */
                if (!keyboardEvent.shiftKey) {
                    this.hideListbox(true);
                }
                break;
            }
        }
    }
    /**
     * Handles users editing the combo box input to filter results. Dispatches the
     * `usa-combo-box:input:text-change` event.
     */
    handleInputChange(event) {
        const inputEvent = event;
        const input = inputEvent.currentTarget;
        this.showListbox();
        this.filterListbox(input.value);
        if (this.listbox && this.listbox.firstChild) {
            this.highlightOption(this.listbox.firstChild);
        }
        else {
            this.removeHighlightedOption(); // Ensure nothing is highlighted if no results/no-results message
        }
        this.comboBox.dispatchEvent(new CustomEvent('usa-combo-box:input:text-change', {
            bubbles: true,
            detail: {
                comboBox: this.comboBox,
                inputValue: input.value,
            },
        }));
    }
    /**
     * Handles clicks outside an active listbox and closes it.
     * @param event click event
     */
    handleOutsideClick(event) {
        const target = event.target;
        if (this.listbox &&
            !this.listbox.hidden &&
            !this.comboBox.contains(target)) {
            this.isOutside = true;
            this.hideListbox(true);
        }
    }
    /**
     * Toggles listbox visibility based on hidden state.
     */
    toggleListbox() {
        if (this.listbox) {
            this.listbox.hidden ? this.showListbox() : this.hideListbox(true);
        }
        if (this.input) {
            this.input.focus();
        }
    }
    /**
     * Shows listbox.
     *
     * Checks if listbox is already shown before triggering. Dispatches the
     * `usa-combo-box:listbox:expanded` event.
     */
    showListbox() {
        if (!this.listbox || !this.input || !this.toggleButton) {
            this.unregister();
            throw new Error('Combo box show listbox error');
        }
        if (!this.listbox.hidden) {
            return;
        }
        this.input.setAttribute('aria-expanded', 'true');
        this.toggleButton.setAttribute('aria-expanded', 'true');
        this.listbox.hidden = false;
        this.isOutside = false;
        this.comboBox.dispatchEvent(new CustomEvent('usa-combo-box:listbox:expanded', {
            bubbles: true,
            detail: {
                comboBox: this.comboBox,
                inputValue: this.input.value,
            },
        }));
    }
    /**
     * Hides listbox.
     *
     * Checks if listbox is already hidden before triggering. Dispatches the
     * `usa-combo-box:listbox:collapsed` event.
     *
     * @param validateOption If true, after closing the listbox, checks if the
     *   value entered is valid. Default: false
     */
    hideListbox(validateOption = false) {
        if (!this.listbox || !this.input || !this.toggleButton) {
            this.unregister();
            throw new Error('Combo box hide listbox error');
        }
        if (this.listbox.hidden) {
            return;
        }
        this.input.setAttribute('aria-expanded', 'false');
        this.toggleButton.setAttribute('aria-expanded', 'false');
        this.listbox.hidden = true;
        this.listbox.scrollTop = 0;
        // Reset listbox with unfiltered results.
        this.removeHighlightedOption();
        if (this.listbox && this.listOptions) {
            this.listbox.replaceChildren(...this.listOptions);
            this.updateAnnouncer(this.listOptions.length);
        }
        if (validateOption) {
            this.checkComboBoxOption();
        }
        this.comboBox.dispatchEvent(new CustomEvent('usa-combo-box:listbox:collapsed', {
            bubbles: true,
            detail: {
                comboBox: this.comboBox,
                inputValue: this.input.value,
            },
        }));
    }
    /**
       * Populates the listbox with filtered list of items via editable combo box.
       * Dispatches the `usa-combo-box:listbox:no-results` event if the filter
       * finds no results.
       *
       * @param {string} value Text input used to filter the listbox.
       */
    filterListbox(value) {
        if (!this.listOptions || !this.input) {
            this.unregister();
            throw new Error('Combo box filterListbox error');
        }
        this.filteredListOptions = this.listOptions
            .filter((option) => option.textContent.toLowerCase().includes(value.toLowerCase()))
            .map((option, index, filtered) => {
            option.setAttribute('aria-posinset', `${index + 1}`);
            option.setAttribute('aria-setsize', `${filtered.length}`);
            return option;
        });
        if (this.filteredListOptions && this.filteredListOptions.length) {
            this.updateListbox(this.filteredListOptions);
        }
        else {
            const li = document.createElement('li');
            li.setAttribute('class', 'usa-combo-box__list-option usa-combo-box__list-option--no-results');
            li.setAttribute('tabindex', '-1');
            li.setAttribute('role', 'option');
            li.textContent =
                this.lang === 'es' ? 'No hay resultados' : 'No results found';
            if (this.listbox) {
                this.listbox.replaceChildren(li);
                this.updateAnnouncer(0);
            }
            this.removeHighlightedOption();
            this.comboBox.dispatchEvent(new CustomEvent('usa-combo-box:listbox:no-results', {
                bubbles: true,
                detail: {
                    comboBox: this.comboBox,
                    inputValue: this.input.value,
                },
            }));
        }
    }
    /**
     * Populates the listbox with filtered list of items via editable combo box.
     * Dispatches the `usa-combo-box:listbox:no-results` event if the filter
     * finds no results.
     *
     * @param {string} value Text input used to filter the listbox.
     */
    checkComboBoxOption() {
        if (!this.input || !this.listOptions)
            return; // Safety check
        const currentInputValue = this.input.value;
        const currentSelectValue = this.select.value;
        let isValid = false;
        let matchingOption = undefined;
        if (currentInputValue) {
            matchingOption = this.listOptions.find(opt => opt.textContent === currentInputValue);
        }
        if (matchingOption) {
            if (matchingOption.dataset.value === currentSelectValue && currentSelectValue) {
                isValid = true;
            }
            else {
                this.setComboBox(matchingOption);
                isValid = true;
            }
        }
        else if (currentSelectValue && !currentInputValue) {
            const selectedLi = this.listOptions.find(opt => opt.dataset.value === currentSelectValue);
            if (selectedLi) {
                this.input.value = selectedLi.textContent || '';
                isValid = true;
            }
        }
        else if (currentSelectValue && currentInputValue) {
            const selectedLi = this.listOptions.find(opt => opt.dataset.value === currentSelectValue);
            if (selectedLi) {
                this.input.value = selectedLi.textContent || '';
                isValid = true;
            }
        }
        if (!isValid) {
            if (this.lastValidValue) {
                this.setSelectedByValue(this.lastValidValue);
            }
            else {
                const firstEnabledOption = this.listOptions.find(opt => opt.dataset.value); // Find first valid list item
                if (firstEnabledOption && firstEnabledOption.dataset.value) {
                    this.setSelectedByValue(firstEnabledOption.dataset.value);
                }
                else {
                    console.error("USAComboBox: Cannot enforce mandatory selection - no valid options found.");
                    this.input.value = '';
                    this.select.value = '';
                    if (this.input.required) {
                        this.input.setCustomValidity("Please select a valid option from the list.");
                    }
                }
            }
        }
        else {
            this.input.setCustomValidity("");
        }
    }
    /**
     * Replaces options with filtered list and updates status announcer.
     * @param options Filtered list of options.
     */
    updateListbox(options) {
        if (this.listbox) {
            this.listbox.replaceChildren(...options);
            this.updateAnnouncer(options.length);
        }
    }
    /**
     * Sets visual focus and aria-select to specified option.
     * @param listItem Option to be highlighted.
     */
    highlightOption(listItem) {
        if (!listItem || !listItem.getAttribute('data-value')) {
            return;
        }
        this.removeHighlightedOption();
        this.highlightedOption = listItem;
        this.highlightedOption.classList.add('usa-combo-box__list-option--focused', 'usa-combo-box__list-option--selected');
        // Set visual focus on the item. Not DOM focus. The active element should remain in the input.
        if (this.input) {
            const activeDescendant = listItem.id;
            this.input.setAttribute('aria-activedescendant', activeDescendant);
        }
        // For single-select widgets, selection should follow focus.
        // Multiselect will need adjustments, see comments in PR.
        this.highlightedOption.setAttribute('aria-selected', 'true');
    }
    /**
     * Removes visual focus and aria-select from options.
     */
    removeHighlightedOption() {
        var _a, _b;
        (_a = this.highlightedOption) === null || _a === void 0 ? void 0 : _a.classList.remove('usa-combo-box__list-option--focused', 'usa-combo-box__list-option--selected');
        // Remove visual focus
        if (this.input) {
            this.input.setAttribute('aria-activedescendant', '');
        }
        // Remove selection
        (_b = this.highlightedOption) === null || _b === void 0 ? void 0 : _b.setAttribute('aria-selected', 'false');
        this.highlightedOption = undefined;
    }
    /**
     * Scrolls option into view if not visible to the user.
     * @param listItem Option to be scrolled into view.
     */
    scrollToOption(listItem) {
        if (this.listbox) {
            const listbox = this.listbox;
            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('is-visible');
                        observer.unobserve(entry.target);
                    }
                    else {
                        listItem.scrollIntoView({
                            behavior: 'instant',
                            block: 'nearest',
                            inline: 'start',
                        });
                    }
                });
            }, {
                root: listbox,
                threshold: 0.5,
            });
            observer.observe(listItem);
        }
    }
    /**
     * Clears the input if there is an invalid option left in the input field.
     * Dispatches the `usa-combo-box:input:text-cleared` event.
     *
     * @param {HTMLInputElement} input The input element.
     */
    clearInput(input) {
        // The previous value of the combo box input before the text was cleared.
        const previousInputValue = input.value;
        this.resetComboBox();
        this.comboBox.dispatchEvent(new CustomEvent('usa-combo-box:input:text-cleared', {
            bubbles: true,
            detail: {
                comboBox: this.comboBox,
                selected: this.getSelectedOptions(),
                previousInputValue: previousInputValue,
            },
        }));
    }
    /**
     * Sets combo box input and select values. Dispatches `usa-combo-box:selected`
     * event.
     *
     * @param listItem Option being selected.
     */
    setComboBox(listItem) {
        // Clone of the previously selected options for the dispatched event.
        const previouslySelected = Object.assign({}, this.getSelectedOptions());
        this.selectedOption = listItem;
        const value = listItem.dataset.value;
        const text = listItem.textContent;
        this.select.value = value;
        this.lastValidValue = value;
        this.comboBox.classList.add('usa-combo-box--pristine');
        if (this.input) {
            this.input.value = text;
        }
        if (!this.isOutside) {
            this.comboBox.dispatchEvent(new CustomEvent('usa-combo-box:selected', {
                bubbles: true,
                detail: {
                    comboBox: this.comboBox,
                    previouslySelected: previouslySelected,
                    selected: this.getSelectedOptions(),
                    inputValue: text,
                },
            }));
        }
    }
    /**
     * Clears combo box input and select values and dispatches
     * `usa-combo-box:unselected` event.
     */
    unsetComboBox() {
        // Clone of the previously selected options for the dispatched event.
        const previouslySelected = Object.assign({}, this.getSelectedOptions());
        this.resetComboBox();
        this.comboBox.dispatchEvent(new CustomEvent('usa-combo-box:unselected', {
            bubbles: true,
            detail: {
                comboBox: this.comboBox,
                previouslySelected: previouslySelected,
            },
        }));
    }
    /**
     * Resets combo box UI to clean state.
     */
    resetComboBox() {
        this.selectedOption = undefined;
        this.removeHighlightedOption();
        this.comboBox.classList.remove('usa-combo-box--pristine');
        this.select.value = '';
        if (this.listbox && this.listOptions) {
            this.listbox.replaceChildren(...this.listOptions);
            this.updateAnnouncer(this.listOptions.length);
        }
        if (this.clearButton) {
            this.clearButton.hidden = true;
        }
        if (this.input) {
            this.input.value = '';
            this.input.focus();
        }
    }

    /**
     * Updates the options in the combo box after creation.
     * @param {HTMLOptionElement[]} newOptions A list of HTML option elements.
     */
    updateOptions(newOptions) {
        this.select.innerHTML = '';

        newOptions.forEach(option => {
            this.select.appendChild(option);
        });

        this.listOptions = this.createOptions();

        this.updateListbox(this.listOptions);

        const currentSelectValue = this.select.value;
        const valueExists = Array.from(this.select.options).some(option => option.value === currentSelectValue);
        if (!valueExists) {
            this.resetComboBox(); 
        } else if (this.input) {
            const selectedOption = Array.from(this.select.options).find(option => option.value === currentSelectValue);
            this.input.value = selectedOption ? selectedOption.textContent : '';
            this.lastValidValue = currentSelectValue;
        }
    }

    /**
     * Enables the ComboBox, making it interactive.
     */
    enable() {
        if (this.input) {
            this.input.disabled = false;
        }
        if (this.toggleButton) {
            this.toggleButton.disabled = false;
        }
        if (this.select) {
            this.select.disabled = false;
        }
        this.comboBox.classList.remove('usa-combo-box--disabled');
    }

    /**
     * Disables the ComboBox, preventing user interaction.
     */
    disable() {
        if (this.input) {
            this.input.disabled = true;
        }
        if (this.toggleButton) {
            this.toggleButton.disabled = true;
        }
        if (this.listbox) {
            this.hideListbox(true); 
        }
        if (this.select) {
            this.select.disabled = true;
        }
        this.comboBox.classList.add('usa-combo-box--disabled');
    }
}
/** Map to store HTMLElements and corresponding instances of USAComboBox. */
USAComboBox._components = new Map();
export { USAComboBox };
