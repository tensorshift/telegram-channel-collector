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
    return selector.includes('.text-content') ? textElement : null;
  },
  querySelectorAll(selector) {
    return selector === '.message-reaction' ? [reactionButton] : [];
  },
};

const context = {
  __messageElement: messageElement,
  __messageElements: [],
  console,
  document: {
    body: {},
    querySelectorAll() { return context.__messageElements; },
  },
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
vm.runInContext(`${contentScript}\nthis.__extractPostData = extractPostData;\nthis.__absorbElement = absorbElement;\nthis.__collectAllPosts = collectAllPosts;\nthis.__getCollectedPost = id => collectedPosts.get(id);`, context);

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

const modernTimeMeta = {
  getAttribute(name) {
    return name === 'title' ? 'Views: 12,345\nShares: 67' : null;
  },
};
const modernViews = {
  innerText: '12.3K',
  textContent: '12.3K',
  getAttribute() { return null; },
  closest(selector) { return selector === '.time-inner' ? modernTimeMeta : null; },
};
const modernMessage = {
  getAttribute(name) {
    return name === 'data-mid' ? '733' : null;
  },
  querySelector(selector) {
    if (selector.includes('.bubble-content .message')) return { innerText: 'Current Telegram Web post' };
    if (selector.includes('.post-views')) return modernViews;
    if (selector.includes('.message-time')) return { innerText: '12.3K 14:30', textContent: '12.3K 14:30' };
    return null;
  },
  querySelectorAll() { return []; },
};

context.__messageElements = [modernMessage];
vm.runInContext('collectedPosts.clear(); isCollectionMode = true;', context);
const modernPosts = context.__collectAllPosts();
assert.equal(modernPosts.length, 1);
assert.equal(modernPosts[0].id, '733');
assert.equal(modernPosts[0].text, 'Current Telegram Web post');
assert.equal(modernPosts[0].views, 12345);
assert.equal(modernPosts[0].shares, 67);
assert.equal(modernPosts[0].time, '14:30');

console.log('Reaction parser: OK');
console.log('Lazy-loaded reaction refresh: OK');
console.log('Current Telegram Web markup: OK');
