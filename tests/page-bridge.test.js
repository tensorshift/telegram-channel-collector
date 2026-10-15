const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const bridgeScript = fs.readFileSync(path.join(__dirname, '..', 'page-bridge.js'), 'utf8');
const attributes = new Map();
const reactionElement = {
  nodeType: 1,
  reactionCount: {
    count: 27,
    reaction: { _: 'reactionEmoji', emoticon: '🔥' },
  },
  matches(selector) { return selector === 'reaction-element'; },
  querySelectorAll() { return []; },
  setAttribute(name, value) { attributes.set(name, value); },
};

let observerCount = 0;
const context = {
  Node: { ELEMENT_NODE: 1 },
  document: {
    nodeType: 9,
    documentElement: {},
    querySelectorAll(selector) {
      return selector === 'reaction-element' ? [reactionElement] : [];
    },
  },
  MutationObserver: class {
    constructor() { observerCount += 1; }
    observe() {}
  },
};

vm.createContext(context);
vm.runInContext(bridgeScript, context);

assert.equal(attributes.get('data-tgc-reaction'), '🔥');
assert.equal(attributes.get('data-tgc-count'), '27');
assert.equal(observerCount, 1);

reactionElement.reactionCount = {
  count: 8,
  reaction: { _: 'reactionCustomEmoji', document_id: '123456789' },
};
vm.runInContext(bridgeScript, context);

assert.equal(attributes.get('data-tgc-reaction'), 'custom:123456789');
assert.equal(attributes.get('data-tgc-count'), '8');
assert.equal(observerCount, 1);

console.log('Main-world reaction bridge: OK');
