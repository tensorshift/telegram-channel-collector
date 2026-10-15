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
    return selector === '.message-reaction, reaction-element' ? [reactionButton] : [];
  },
};

const context = {
  __messageElement: messageElement,
  __messageElements: [],
  console,
  document: {
    body: {},
    querySelector() { return null; },
    querySelectorAll() { return context.__messageElements; },
  },
  window: { location: { href: 'https://web.telegram.org/k/#test-channel' } },
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
vm.runInContext(`${contentScript}\nthis.__extractPostData = extractPostData;\nthis.__absorbElement = absorbElement;\nthis.__collectAllPosts = collectAllPosts;\nthis.__collectChannelMetadata = collectChannelMetadata;\nthis.__getCollectedPost = id => collectedPosts.get(id);`, context);

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
    return name === 'title' ? '15 October 2026, 13:31:25\nViews: 1\u00a0555\nShares: 7' : null;
  },
};
const modernViews = {
  innerText: '1.6K',
  textContent: '1.6K',
  getAttribute() { return null; },
  closest() { return null; },
};
const modernSticker = {
  getAttribute(name) {
    return name === 'data-doc-id' ? '5100483636361167223' : null;
  },
};
const modernReaction = {
  reactionCount: { count: 4, reaction: { _: 'reactionEmoji', emoticon: '🔥' } },
  classList: { contains() { return false; } },
  getAttribute() { return null; },
  querySelector(selector) {
    if (selector === '.reaction-counter') return { textContent: '4' };
    if (selector.includes('[data-doc-id]')) return modernSticker;
    return null;
  },
  querySelectorAll() { return []; },
};
const modernCustomReaction = {
  classList: { contains() { return false; } },
  getAttribute() { return null; },
  querySelector(selector) {
    if (selector === '.reaction-counter') return { textContent: '2' };
    if (selector.includes('[data-doc-id]')) return modernSticker;
    return null;
  },
  querySelectorAll() { return []; },
};
const modernReplies = {
  innerText: '',
  textContent: '',
  getAttribute(name) {
    return name === 'aria-label' ? '1 Comment' : null;
  },
};
const modernMessage = {
  getAttribute(name) {
    if (name === 'data-mid') return '4294968580';
    if (name === 'data-timestamp') return '1792045885';
    return null;
  },
  querySelector(selector) {
    if (selector.includes('.bubble-content .message')) return { innerText: 'Current Telegram Web post' };
    if (selector.includes('.post-views')) return modernViews;
    if (selector === '.time-inner') return modernTimeMeta;
    if (selector.includes('.message-time')) return { innerText: '1.6K 13:31', textContent: '1.6K 13:31' };
    if (selector.includes('replies-element')) return modernReplies;
    if (selector.includes('.bubble-content .attachment')) return {};
    return null;
  },
  querySelectorAll(selector) {
    return selector === '.message-reaction, reaction-element' ? [modernReaction, modernCustomReaction] : [];
  },
};

context.__messageElements = [modernMessage];
vm.runInContext('collectedPosts.clear(); isCollectionMode = true;', context);
const modernPosts = context.__collectAllPosts();
assert.equal(modernPosts.length, 1);
assert.equal(modernPosts[0].id, '4294968580');
assert.equal(modernPosts[0].timestamp, 1792045885);
assert.equal(modernPosts[0].text, 'Current Telegram Web post');
assert.equal(modernPosts[0].views, 1555);
assert.equal(modernPosts[0].shares, 7);
assert.equal(modernPosts[0].time, '13:31');
assert.deepEqual(
  JSON.parse(JSON.stringify(modernPosts[0].reactions)),
  [
    { emoji: '🔥', count: 4 },
    { emoji: 'custom:5100483636361167223', count: 2 },
  ],
);
assert.equal(modernPosts[0].totalReactions, 6);
assert.equal(modernPosts[0].comments, 1);
assert.equal(modernPosts[0].hasMedia, true);

const channelTitle = {
  innerText: 'Работа в ставках | Betting, Gambling, IGaming вакансии',
  getAttribute(name) { return name === 'data-peer-id' ? '-1248828959' : null; },
};
const channelSubscribers = { innerText: '12\u00a0654 subscribers' };
const chatInfo = {
  querySelector(selector) {
    if (selector.includes('.user-title .peer-title')) return channelTitle;
    if (selector.includes('.bottom .info')) return channelSubscribers;
    return null;
  },
};
context.document.querySelector = selector => {
  if (selector === '#column-center .chat-info-container') return chatInfo;
  if (selector === '.peer-title') return { innerText: 'Sofi' };
  return null;
};
const metadata = context.__collectChannelMetadata();
assert.equal(metadata.channelName, channelTitle.innerText);
assert.equal(metadata.subscribers, '12\u00a0654 subscribers');
assert.equal(metadata.channelId, '-1248828959');

console.log('Reaction parser: OK');
console.log('Lazy-loaded reaction refresh: OK');
console.log('Current Telegram Web markup: OK');
console.log('Active channel metadata scope: OK');
