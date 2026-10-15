const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const contentScript = fs.readFileSync(path.join(__dirname, '..', 'content.js'), 'utf8');
const listeners = new Set();
const observers = [];

class FakeMutationObserver {
  constructor(callback) {
    this.callback = callback;
    this.disconnected = false;
    observers.push(this);
  }

  observe() {}

  disconnect() {
    this.disconnected = true;
  }
}

const context = {
  console,
  document: {
    body: {},
    querySelectorAll() { return []; },
    querySelector() { return null; },
  },
  location: { href: 'https://web.telegram.org/k/#test' },
  MutationObserver: FakeMutationObserver,
  chrome: {
    runtime: {
      onMessage: {
        addListener(listener) { listeners.add(listener); },
        removeListener(listener) { listeners.delete(listener); },
      },
      sendMessage() {},
    },
  },
};

vm.createContext(context);
vm.runInContext(contentScript, context);
const firstListener = [...listeners][0];

vm.runInContext(contentScript, context);

assert.equal(observers.length, 2);
assert.equal(observers[0].disconnected, true);
assert.equal(listeners.size, 1);
assert.notEqual([...listeners][0], firstListener);

let response;
[...listeners][0]({ action: 'startCollection' }, {}, value => { response = value; });
assert.equal(response.status, 'started');

console.log('Content-script reinjection: OK');
