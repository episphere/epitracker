
/**
 * @file A state object which allows properties to be linked to listeners. It also supports a dependency tree between
 * the different properties, allowing the user to ensure that certain updates are handled before others and reduntant 
 * updates aren't made. 
 * 
 * @author Lee Mason <masonlk@nih.gov>
 */

export class State {
  
  constructor() {
    this.properties = {}
    this.dependencyTree = new Tree()

    //this.updatePropertyStack = new Set()
    //this.updateScheduled = false
    this.scheduled = new Set()
  }


  defineProperty(property, value, parentProperties) {
    if (parentProperties) {
      for (const parentProperty of parentProperties) {
        if (!this.properties.hasOwnProperty(parentProperty)) {
          throw Error(`Unable to define property '${property}', parent property '${parentProperty}' does not exist.`);
        }
      }
    }

    if (this.hasOwnProperty(property)) {
      this.dependencyTree.removeNode(property);
    } else {
       Object.defineProperty(this, property, {
        set: function(value) { this._setProperty(property, value) },
        get: function() { return this.properties[property] }
      })
      this.properties[property] = value
    }

    // Special behavior: if property value has a "subscribe" function when defined, we use it to trigger property updates.
    if (typeof value?.subscribe == "function") {
      value.subscribe(() => this.trigger(property));
    }

    this.dependencyTree.addNode(property, {listeners: [], parents: parentProperties}, parentProperties)
  }

  defineJointProperty(name, properties) {
    this.defineProperty(name, null, properties)

    const updateProperties = () => {
      const obj = {}
      for (const property of properties) {
        obj[property] = this.properties[property]
      }
      this[name] = obj 
    }
    
    const listener = () => {
     updateProperties()
    }
    updateProperties()
    for (const property of properties) {
      this.subscribe(property, listener)
    }
    this.subscribe(name, listener)
  }

  linkProperties(childProperty, parentProperties) {
    if (!Array.isArray(parentProperties)) {
      parentProperties = [parentProperties]
    }

    const childNode = this.dependencyTree.getNode(childProperty)
    for (const parentProperty of parentProperties) {
      const parentNode = this.dependencyTree.getNode(parentProperty)
      parentNode.children.set(childProperty, childNode)
    }
  }

  subscribe(property, f) {
    if (!this.dependencyTree.getNode(property)) {
      throw Error(`property '${property}' does not exist.`)
    }

    this.dependencyTree.getNode(property).content.listeners.push(f)
  }

  trigger(property) {
    this._setProperty(property, this.properties[property])
  }

  triggerAll() {
    const rootNodes = this.dependencyTree.getRootNodes();
    for (const rootNode of rootNodes) {
      this.trigger(rootNode.key);
    }
  }

  hasProperty(property) {
    return this.properties.hasOwnProperty(property)
  }

  _setProperty(property, value) {
    this.properties[property] = value 

    if (!this.scheduled.has(property)) {
      let listenerQueue = this.dependencyTree.getAllNodes(property)
      listenerQueue = listenerQueue.filter(node => !this.scheduled.has(node.key))
      listenerQueue.forEach(node => this.scheduled.add(node.key))
      this.runListenerQueue(listenerQueue)
    }
  }

  async runListenerQueue(listenerQueue) {
    try { 
      for (const node of listenerQueue) {
        for (const listener of node.content.listeners) {
          await listener(this.properties[node.key], node.key)
        }
      }
    } finally {
      listenerQueue.forEach(node => this.scheduled.delete(node.key))
    }
  }
}

class Node {
  constructor(key, content) {
    this.key = key 
    this.content = content 
    this.children = new Map() 
  }
}

class Tree {
  constructor() {
    this.nodes = new Map()
  }
  
  addNode(key, content, parents=[]) {
    if (this.nodes.has(key)) {
      throw new Error("Node already exists")
    }

    if (!Array.isArray(parents)) {
      parents = [parents]
    }

    const node = new Node(key, content)
    this.nodes.set(key, node)
    
    for (const parent of parents) {
      if (!this.nodes.has(key)) {
        throw new Error("Parent node doesn't exist")
      }

      this.nodes.get(parent).children.set(key, node)
    }

    this.trimTree()
  }
  
  getNode(key) {
    return this.nodes.get(key)
  }

  getAllNodes(key) {
    return this.breadthFirstSearch(this.getNode(key))
  }

  removeNode(key) {
    if (!this.nodes.has(key)) {
      console.warn(`Node with key '${key}' not found.`);
      return false;
    }

    for (const parentNode of this.nodes.values()) {
      if (parentNode.children.has(key)) {
        parentNode.children.delete(key);
      }
    }

    this.nodes.delete(key);
    this.trimTree();

    return true;
  }

  getRootNodes() {
    const allNodeKeys = new Set(this.nodes.keys());
    for (const node of this.nodes.values()) {
      for (const childKey of node.children.keys()) {
        allNodeKeys.delete(childKey);
      }
    }
    return Array.from(allNodeKeys).map(key => this.nodes.get(key));
  }
  

  breadthFirstSearch(root) {
    let visitedSet = new Set()
    let visited = []
    let queue = []
  
    queue.push(root)
  
    while (queue.length > 0) {
      let currentNode = queue.shift()

      if (!visitedSet.has(currentNode.key)) {
        visitedSet.add(currentNode.key)
        visited.push(currentNode.key)

        currentNode.children.forEach(child => {
          queue.push(child)
        })
      }
      
    }
  
    return visited.map(d => this.nodes.get(d))
  }

  trimTree() {
    // This is inefficient, e.g. we could improve by tracking root nodes.
    for (const node of this.nodes.values()) {
      this.trimNodePaths(node)
    }
  }

  trimNodePaths(node) {
    let visited = new Map(); // Map to store visited nodes to avoid cycles
  
    // Helper function to find all super-paths for a given node
    function findAllSuperPaths(currentNode, visited) {
      visited.set(currentNode.key, true);
      let childrenKeys = Array.from(currentNode.children.keys());
  
      // If no children or all children visited, it's the end of a path
      if (childrenKeys.length === 0 || childrenKeys.every(key => visited.has(key))) {
        return [[currentNode.key]];
      }
  
      // Find all paths for children
      let paths = [];
      for (let childKey of childrenKeys) {
        if (!visited.has(childKey)) {
          let childPaths = findAllSuperPaths(currentNode.children.get(childKey), new Map(visited));
          for (let path of childPaths) {
            paths.push([currentNode.key].concat(path));
          }
        }
      }
      return paths;
    }
  
    // Helper function to remove direct relationships with valid super-paths
    function removeDirectRelationships(node, superPaths) {
      for (let childKey of node.children.keys()) {
        let shouldBeRemoved = superPaths.some(path => {
          let index = path.indexOf(node.key);
          return index !== -1 && path.indexOf(childKey) > index + 1;
        });
  
        if (shouldBeRemoved) {
          node.children.delete(childKey);
        }
      }
    }
  
    // Find all the super-paths for the given node
    let superPaths = findAllSuperPaths(node, visited);
    // Remove direct relationships that have a longer super-path
    removeDirectRelationships(node, superPaths);
  
    // For simplicity, this implementation doesn't remove nodes that have become leaves
    // because of the removal but are not end nodes of any super-path. 
  }
}