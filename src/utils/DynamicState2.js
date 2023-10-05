/**
 * Simple class which links a collection of properties to a collection of listeners. When any one
 * of the variables in the state is changed, all of the listeners are called. 
 */
export class State {

  constructor() {
    this.properties = {}
    this.listeners = []
    this._stack = new Set()
  }

  /**
   * Define a new property. When this property is updated (through this class) then all of the 
   * listeners will fire. If the property already exists, then it will remain as is (i.e. the given
   * value will be ignored). Defining a property will not trigger the listeners.
   * @param {string} property - The name of the property.
   * @param {*} value 
   */
  defineDynamicProperty(property, value) {
    if (!this.properties.hasOwnProperty(property)) {
      Object.defineProperty(this, property, {
        set: function(value) { this._setProperty(property, value) },
        get: function() { return this.properties[property] }
      })
      this.properties[property] = value
    }
  }

  /**
   * Add a listener, will fire when any of the defined properties are changed.
   * @param {function} f - Will be called with three arguments: property name, updated value, 
   * old value.
   */
  addListener(f, ...properties) {
    const key = properties.join(",")
    let listener = this.listeners.find(d => d.key == key)
    if (listener == null) {
      listener = {properties: new Set(properties), key, fs: []}
      this.listeners.push(listener)
    }
    //listener.fs.push(f)
    listener.fs = [f]
    this.listeners.sort((a,b) => a.properties.size - b.properties.size)
  }

  fireListeners(property) {
    const value = this.properties[property]
    const propertyListeners = this.listeners.filter(d => d.properties.has(property))
    propertyListeners.forEach(d => this._stack.add(d.key))
    propertyListeners.forEach(listener => {
      if (this._stack.has(listener.key)) {
        this._stack.delete(listener.key)
        listener.fs.forEach(f => f())
      }
    })
  }

  _setProperty(property, value, fire=true) {
    if (value != this.properties[property]) {
      this.properties[property] = value
      if (fire) {
        this.fireListeners(property)
      }
    }
  }
    
}