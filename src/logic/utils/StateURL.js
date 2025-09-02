import { State } from "./State.js";

const SET_REGEX = /^\{(.*)\}$/s;

/**
 * Manages state by extending the base State class, with the added functionality of synchronizing specified state 
 * properties with the URL's query parameters.
 * @extends State
 */
export class StateURL extends State {
  constructor (defaults = {}, urlProperties = []) {
    super();
    this.defaults = defaults;
    this.url = new URL(window.location.href);
    this.urlProperties = new Set(urlProperties);

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
      value = this.decodeValue(value);
    } else if (this.defaults[property]) {
      value = this.defaults[property];
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
    const url = this.url;
    if (this.defaults[param] != value) {
      url.searchParams.set(param, this.encodeValue(value));
    } else {
      url.searchParams.delete(param);
    }
    history.replaceState({}, "", this.url.toString());
  }

  encodeValue(value) {
    if (value instanceof Set) {
      return `{${[...value].join(",")}}`;
    } else {
      return value;
    }
  }

  decodeValue(value) {
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
