const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const contentScript = fs.readFileSync(path.join(__dirname, '..', 'content.js'), 'utf8');

let reactionCount = '0';
const emojiImage = {
  getAttribute(name) {
    return name === 'alt' ? 'Clapping Hands' : null;
  },
};
const countSpan = {
  get textContent() {
    return reactionCount;
  },
};
const reactionButton = {
  querySelector(selector) {
    return selector.includes('.ReactionStaticEmoji img.media[alt]') ? emojiImage : null;
  },
  querySelectorAll(selector) {
    return selector === ':scope > span' ? [countSpan] : [];
  },
  getAttribute() {
    return null;
  },
};
const textElement = { innerText: 'Test post' };
const messageElement = {
  getAttribute(name) {
    return name === 'data-message-id' ? 'channel/42' : null;
  },
  querySelector(selector) {
    return selector === '.text-content' ? textElement : null;
  },
  querySelectorAll(selector) {
    return selector === '.message-reaction' ? [reactionButton] : [];
  },
};

const context = {
  __messageElement: messageElement,
  console,
  document: { body: {} },
  MutationObserver: class {
    observe() {}
  },
  chrome: {
    runtime: {
      onMessage: { addListener() {} },
      sendMessage() {},
    },
  },
};

vm.createContext(context);
vm.runInContext(`${contentScript}\nthis.__extractPostData = extractPostData;\nthis.__absorbElement = absorbElement;\nthis.__getCollectedPost = id => collectedPosts.get(id);`, context);

reactionCount = '1';
let post = context.__extractPostData(messageElement);
assert.deepEqual(
  JSON.parse(JSON.stringify(post.reactions)),
  [{ emoji: 'Clapping Hands', count: 1 }],
);
assert.equal(post.totalReactions, 1);

reactionCount = '1.2K';
post = context.__extractPostData(messageElement);
assert.equal(post.totalReactions, 1200);

reactionCount = '0';
context.__absorbElement(messageElement);
assert.equal(context.__getCollectedPost('channel/42').totalReactions, 0);

reactionCount = '7';
context.__absorbElement(messageElement);
assert.equal(context.__getCollectedPost('channel/42').totalReactions, 7);

console.log('Reaction parser: OK');
console.log('Lazy-loaded reaction refresh: OK');
