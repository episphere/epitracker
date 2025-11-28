import { State } from "./State.js";

const SET_REGEX = /^\{(.*)\}$/s;

export const SetCoder = {
  encode: (value) => {
    return value != null ? `{${[...value].join(",")}}` : "";
  },
  decode: (value) => {
    try {
      if (SET_REGEX.test(value)) {
        const match = value.match(SET_REGEX);
        if (match) {
          return new Set(match[1].split(","));
        }
      } else {
        return value; 
      }
    } catch (e) {
      console.error(e.message); 
    } 
  }
}

export const ObjectCoder = {
  encode: (value) => {
    return JSON.stringify(value);
  },
  decode: (value) => {
    return JSON.parse(value);
  }
}

/**
 * Manages state by extending the base State class, with the added functionality of synchronizing specified state 
 * properties with the URL's query parameters. Also tracks history, but only for properties synchronized to the URL.
 * @extends State
 */
export class StateURL extends State {
  constructor (defaults = {}, urlProperties = [], propertyCoders={}) {
    super();
    this.defaults = structuredClone(defaults);
    this.url = new URL(window.location.href);
    this.urlProperties = new Set(urlProperties);
    this.propertyCoders = propertyCoders;
    this.urlHistory = [];
    this.urlHistory.index = -1;

    for (const [property, value] of Object.entries(defaults)) {
      this.defineProperty(property);
    }
  }

  /**
   * Defines a state property, optionally initializing it from a URL search parameter, and subscribes it to URL updates.
   * @param {string} property - The name of the property to define.
   * @param {*} [value] - The default value of the property. If not provided, it will check the URL.
   * @param {string[]} [parentProperties] - An array of parent property names.
   */
  defineProperty(property, value, parentProperties) {
    if (!value && this.url.searchParams.has(property)) {
      value = this.url.searchParams.get(property);
      value = this.propertyCoders[property] ? this.propertyCoders[property].decode(value) : value;
    } else if (this.defaults[property]) {
      value = structuredClone(this.defaults[property]);
    }
    super.defineProperty(property, value, parentProperties);
    if (this.urlProperties.has(property)) {
      this.subscribe(property, (value, property) => this.updateURLParam(value, property));
    }
  }

   /**
   * Updates a URL search parameter based on a property's value.
   * If the value is the initial default, the parameter is removed.
   * @param {*} value - The new value for the parameter.
   * @param {string} param - The URL search parameter to update.
   */
  updateURLParam(value, param) {
    if (this.updatingHistory) return;

    const encodedDefaultValue = this.propertyCoders[param] ? this.propertyCoders[param].encode(this.defaults[param]) : this.defaults[param];
    const encodedValue = this.propertyCoders[param] ? this.propertyCoders[param].encode(value) : value;

    const url = this.url;
    if (encodedDefaultValue != encodedValue) {
      url.searchParams.set(param, encodedValue);
    } else {
      url.searchParams.delete(param);
    }

    if (this.urlHistory.index < this.urlHistory.length-1) {
      const index = this.urlHistory.index 
      this.urlHistory = this.urlHistory.slice(0, this.urlHistory.index+1);
      this.urlHistory.index = index;
    } 

    const targetUrl = this.url.toString()
    if (this.urlHistory.at(-1) != targetUrl) {
      history.replaceState({}, "", targetUrl);
      this.urlHistory.push(targetUrl);
      this.urlHistory.index = this.urlHistory.length-1;
    }
  }

  syncStateToUrl() {
    for (const property of this.urlProperties) {
      let value = null;
      if (this.url.searchParams.has(property)) {
        const coder = this.propertyCoders[property];
        value = this.url.searchParams.get(property);
        if (coder) {
          value = coder.decode(value);
        }     
      } else {
        value = structuredClone(this.defaults[property]);
      } 
      this[property] = value;
    }
  }

  undo() {
    this.updatingHistory = true;
    if (this.urlHistory.index > 0) {
      this.urlHistory.index--;
      const targetUrlString = this.urlHistory[this.urlHistory.index];
      history.replaceState({}, "",targetUrlString);
      this.url = new URL(targetUrlString); 
      this.syncStateToUrl();
    }
    this.updatingHistory = false;
  }

  redo() {
    this.updatingHistory = true;
    if (this.urlHistory.index < this.urlHistory.length-1) {
      this.urlHistory.index++;
      const targetUrlString = this.urlHistory[this.urlHistory.index];
      history.replaceState({}, "",targetUrlString);
      this.url = new URL(targetUrlString); 
      this.syncStateToUrl();
    }
    this.updatingHistory = false;
  }
}
