var isCollectionMode = false;
var collectedPosts = new Map();
var telegramCollectorMessageSelector = '.bubble[data-mid], [data-message-id], .tgme_widget_message[data-post]';

function getMessageId(el) {
  return el.getAttribute('data-message-id')
    || el.getAttribute('data-mid')
    || el.getAttribute('data-id')
    || el.getAttribute('data-post');
}

function isCollectableMessageId(id) {
  return !!id && !/^-\d+$/.test(String(id));
}

function parseCompactNumber(value) {
  if (value == null) return null;
  const normalized = String(value).trim().replace(/[\s\u00a0]/g, '');
  const match = normalized.match(/(\d+(?:[.,]\d+)?)\s*([kmb\u043a\u043c]?)/i);
  if (!match) return null;

  const suffix = match[2].toLowerCase();
  const multiplier = {
    k: 1_000,
    '\u043a': 1_000,
    m: 1_000_000,
    '\u043c': 1_000_000,
    b: 1_000_000_000,
  }[suffix] || 1;

  const numericPart = multiplier === 1
    ? match[1].replace(/[.,]/g, '')
    : match[1].replace(',', '.');
  const parsed = Number.parseFloat(numericPart);
  return Number.isFinite(parsed) ? Math.round(parsed * multiplier) : null;
}

function readReactionIdentity(reactionEl) {
  const bridgedIdentity = reactionEl.getAttribute('data-tgc-reaction');
  if (bridgedIdentity) return bridgedIdentity;

  try {
    const reaction = reactionEl.reactionCount?.reaction;
    if (reaction?._ === 'reactionEmoji' && reaction.emoticon) return reaction.emoticon;
    if (reaction?._ === 'reactionCustomEmoji' && reaction.document_id) {
      return `custom:${reaction.document_id}`;
    }
    if (reaction?._ === 'reactionPaid') return 'paid-star';
  } catch {
    // Custom-element state may be hidden from the extension's isolated world.
  }

  const emojiImg = reactionEl.querySelector(
    '.ReactionStaticEmoji img.media[alt], .ReactionStaticEmoji img[alt]:not([alt=""]), img.media[alt]:not([alt=""])'
  );
  const accessibleName = emojiImg?.getAttribute('alt')
    || reactionEl.getAttribute('aria-label')
    || reactionEl.getAttribute('title');
  if (accessibleName) return accessibleName;

  // Telegram Web K leaves alt empty for custom emoji, but keeps a stable
  // document id on the sticker wrapper. Retain it so different reactions do
  // not collapse into one "unknown" bucket.
  const sticker = reactionEl.querySelector('.reaction-sticker[data-doc-id], [data-doc-id]');
  const documentId = sticker?.getAttribute('data-doc-id');
  if (documentId) return `custom:${documentId}`;

  return reactionEl.classList?.contains('is-paid') ? 'paid-star' : null;
}

function readReactionCount(reactionEl) {
  const bridgedCount = reactionEl.getAttribute('data-tgc-count');
  if (bridgedCount !== null) {
    const parsed = parseCompactNumber(bridgedCount);
    if (parsed !== null) return parsed;
  }

  try {
    const modelCount = Number(reactionEl.reactionCount?.count);
    if (Number.isFinite(modelCount) && modelCount >= 0) return Math.round(modelCount);
  } catch {
    // Fall back to the rendered counter below.
  }

  const counter = reactionEl.querySelector('.reaction-counter');
  const explicitCount = parseCompactNumber(counter?.textContent);
  if (explicitCount !== null) return explicitCount;

  // Older Telegram markup uses a generated class for the counter, but the
  // counter remains a direct text span inside the reaction button.
  const countSpans = reactionEl.querySelectorAll(':scope > span');
  for (const span of countSpans) {
    const parsed = parseCompactNumber(span.textContent);
    if (parsed !== null) return parsed;
  }

  return 0;
}

function absorbElement(el) {
  const id = getMessageId(el);
  if (!isCollectableMessageId(id)) return;
  const data = extractPostData(el);
  if (!data.text && !data.hasMedia && data.totalReactions === 0) return;
  collectedPosts.set(id, data);
}

if (globalThis.__telegramCollectorObserver) {
  try { globalThis.__telegramCollectorObserver.disconnect(); } catch {}
}

var domObserver = new MutationObserver(mutations => {
  if (!isCollectionMode) return;
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== 1) continue;
      const messages = new Set();
      if (node.matches(telegramCollectorMessageSelector)) messages.add(node);
      const parentMessage = node.closest(telegramCollectorMessageSelector);
      if (parentMessage) messages.add(parentMessage);
      node.querySelectorAll(telegramCollectorMessageSelector).forEach(message => messages.add(message));
      messages.forEach(absorbElement);
    }
  }
});

domObserver.observe(document.body, { childList: true, subtree: true });
globalThis.__telegramCollectorObserver = domObserver;

function extractPostData(messageEl) {
  const msgId = getMessageId(messageEl);

  // 1. TEXT
  const textEl = messageEl.querySelector('.text-content, .bubble-content .message, .message');
  const text = textEl ? textEl.innerText.trim() : '';

  // 2. VIEWS & SHARES
  let views = null;
  let shares = null;
  const viewsEl = messageEl.querySelector('.message-views, .post-views');
  if (viewsEl) {
    const timeMetaEl = viewsEl.closest?.('.time-inner') || messageEl.querySelector('.time-inner');
    const viewsText = timeMetaEl?.getAttribute('title')
      || viewsEl.getAttribute('title')
      || viewsEl.innerText
      || viewsEl.textContent
      || '';
    const viewsMatch = viewsText.match(/Views:\s*([\d\s\u00a0,.]+(?:[KMB\u041a\u041c])?)/i);
    if (viewsMatch) views = parseCompactNumber(viewsMatch[1]);
    const sharesMatch = viewsText.match(/Shares:\s*([\d\s\u00a0,.]+(?:[KMB\u041a\u041c])?)/i);
    if (sharesMatch) shares = parseCompactNumber(sharesMatch[1]);
    if (views === null) {
      views = parseCompactNumber(viewsEl.innerText || viewsEl.textContent);
    }
  }

  // 3. TIME
  let time = null;
  const timeEl = messageEl.querySelector('.message-time, .time-inner, .time');
  if (timeEl) {
    const timeText = (timeEl.innerText || timeEl.textContent || '').trim();
    const timeMatches = timeText.match(/\b\d{1,2}:\d{2}\b/g);
    time = timeMatches?.at(-1) || timeText;
  }

  // 4. REACTIONS
  const reactions = [];
  messageEl.querySelectorAll('.message-reaction, reaction-element').forEach(reactionEl => {
    const emoji = readReactionIdentity(reactionEl);
    const count = readReactionCount(reactionEl);

    // A paid-star chip currently exposes no count in Telegram's DOM. Omitting
    // that chip is more accurate than inventing a value of one.
    if (count > 0) reactions.push({ emoji: emoji || 'unknown', count });
  });

  // 5. LINKS
  const links = [];
  messageEl.querySelectorAll('a.text-entity-link, .message a[href]').forEach(link => {
    const linkText = link.innerText.trim();
    const href = link.getAttribute('href');
    if (linkText) {
      links.push({
        text: linkText,
        url: href || null,
        type: linkText.startsWith('@') ? 'mention' : (href ? 'url' : 'text')
      });
    }
  });

  // 6. MEDIA
  const hasMedia = !!messageEl.querySelector(
    '.bubble-content .attachment, .bubble-content .media-photo, .bubble-content video, '
    + '.bubble-content .document, .bubble-content .audio, .bubble-content .poll'
  );

  // 7. FORWARD
  let forwardFrom = null;
  const forwardEl = messageEl.querySelector('.forwarded-name');
  if (forwardEl) forwardFrom = forwardEl.innerText.trim();

  // 8. POLL
  const hasPoll = !!messageEl.querySelector('.poll');

  // 9. COMMENTS
  let comments = null;
  const commentsEl = messageEl.querySelector('.comments-button, replies-element.replies, replies-element[aria-label]');
  if (commentsEl) {
    const commentsText = commentsEl.getAttribute('aria-label')
      || commentsEl.innerText
      || commentsEl.textContent
      || '';
    comments = parseCompactNumber(commentsText) ?? 0;
  }

  const timestampValue = Number.parseInt(messageEl.getAttribute('data-timestamp'), 10);

  return {
    id: msgId,
    timestamp: Number.isFinite(timestampValue) ? timestampValue : null,
    text,
    views,
    shares,
    time,
    reactions,
    totalReactions: reactions.reduce((sum, r) => sum + (r.count || 0), 0),
    links,
    hasMedia,
    forwardFrom,
    hasPoll,
    comments
  };
}

function collectAllPosts() {
  if (isCollectionMode) {
    const elements = document.querySelectorAll(telegramCollectorMessageSelector);

    Array.from(elements).forEach(el => {
      const id = getMessageId(el);
      if (!isCollectableMessageId(id)) return;
      const data = extractPostData(el);
      if (!data.text && !data.hasMedia && data.totalReactions === 0) return;
      collectedPosts.set(id, data);
    });
  }

  let idx = 1;
  return Array.from(collectedPosts.values()).map(p => ({ ...p, index: idx++ }));
}

function collectChannelMetadata() {
  // Scope the lookup to the header of the open chat. A global `.peer-title`
  // also matches names in the dialogs sidebar and can return the wrong person.
  const chatInfo = document.querySelector('#column-center .chat-info-container')
    || document.querySelector('.chat-info-container');

  let channelName = '';
  let channelNameEl = chatInfo?.querySelector('.chat-info .user-title .peer-title, .user-title .peer-title') || null;
  const nameSelectors = ['.ChatInfo .info .fullName', '.ChatInfo h3', '.tgme_page_title span', '.channel-info .title'];
  for (const sel of nameSelectors) {
    if (channelNameEl) break;
    const el = document.querySelector(sel);
    if (el && el.innerText.trim()) channelNameEl = el;
  }
  if (channelNameEl?.innerText.trim()) channelName = channelNameEl.innerText.trim();

  let subscribers = '';
  let subscribersEl = chatInfo?.querySelector('.chat-info .bottom .info, .bottom .info') || null;
  const subSelectors = ['.ChatInfo .group-status', '.ChatInfo .status', '.tgme_page_extra'];
  for (const sel of subSelectors) {
    if (subscribersEl) break;
    const el = document.querySelector(sel);
    if (el && el.innerText.trim()) subscribersEl = el;
  }
  if (subscribersEl?.innerText.trim()) subscribers = subscribersEl.innerText.trim();

  const descEl   = document.querySelector('.tgme_page_description');
  const urlParts = window.location.href.split('/');
  const peerId = channelNameEl?.getAttribute('data-peer-id')
    || chatInfo?.querySelector('[data-peer-id]')?.getAttribute('data-peer-id')
    || '';

  return {
    channelName,
    subscribers,
    description: descEl ? descEl.innerText.trim() : '',
    channelId: peerId || urlParts[urlParts.length - 1] || '',
    url: window.location.href
  };
}

function convertToCSV(posts) {
  const headers = ['index', 'timestamp', 'text', 'views', 'shares', 'time', 'totalReactions', 'reactions', 'hasMedia', 'forwardFrom', 'comments'];
  const rows = posts.map(post => [
    post.index,
    post.timestamp ?? '',
    `"${(post.text || '').replace(/\n/g, ' ').replace(/"/g, '""').substring(0, 500)}"`,
    post.views ?? '',
    post.shares ?? '',
    post.time || '',
    post.totalReactions || '',
    `"${(post.reactions || []).map(reaction => `${reaction.emoji}:${reaction.count}`).join(' | ').replace(/"/g, '""')}"`,
    post.hasMedia,
    post.forwardFrom || '',
    post.comments ?? ''
  ]);
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function calculateCollectionStats(posts) {
  const viewValues = posts.map(post => post.views).filter(Number.isFinite);
  const reactionTotals = new Map();
  for (const post of posts) {
    for (const reaction of post.reactions || []) {
      const name = reaction.emoji || 'unknown';
      reactionTotals.set(name, (reactionTotals.get(name) || 0) + (Number(reaction.count) || 0));
    }
  }

  return {
    avgViews: viewValues.length
      ? Math.round(viewValues.reduce((sum, value) => sum + value, 0) / viewValues.length)
      : 0,
    postsWithViews: viewValues.length,
    postsWithReactions: posts.filter(post => post.totalReactions > 0).length,
    totalReactions: posts.reduce((sum, post) => sum + (post.totalReactions || 0), 0),
    totalShares: posts.reduce((sum, post) => sum + (post.shares || 0), 0),
    postsWithMedia: posts.filter(post => post.hasMedia).length,
    reactionDistribution: [...reactionTotals.entries()]
      .sort((left, right) => right[1] - left[1])
      .map(([reaction, count]) => ({ reaction, count })),
  };
}

if (globalThis.__telegramCollectorMessageHandler) {
  try { chrome.runtime.onMessage.removeListener(globalThis.__telegramCollectorMessageHandler); } catch {}
}

var telegramCollectorMessageHandler = (request, sender, sendResponse) => {
  if (request.action === 'getStatus') {
    const posts = collectAllPosts();
    sendResponse({ isCollecting: isCollectionMode, postCount: posts.length });
  } else if (request.action === 'getCount') {
    const posts = collectAllPosts();
    sendResponse({ postCount: posts.length });
  } else if (request.action === 'startCollection') {
    isCollectionMode = true;
    collectedPosts.clear();
    sendResponse({ status: 'started' });
  } else if (request.action === 'stopCollection') {
    isCollectionMode = false;
    sendResponse({ status: 'stopped', postCount: collectedPosts.size });
  } else if (request.action === 'clearCollection') {
    isCollectionMode = false;
    collectedPosts.clear();
    sendResponse({ status: 'cleared' });
  } else if (request.action === 'finishAndDownload') {
    const posts = collectAllPosts();
    isCollectionMode = false;
    const metadata = collectChannelMetadata();

    const outputData = {
      timestamp: new Date().toISOString(),
      metadata,
      posts,
      totalPosts: posts.length,
      stats: calculateCollectionStats(posts),
      csv: convertToCSV(posts)
    };

    chrome.runtime.sendMessage({ type: 'download_data', data: outputData });
    sendResponse({ status: 'finished', postCount: posts.length });
  } else if (request.action === 'getData') {
    const posts = collectAllPosts();
    sendResponse({
      status: 'data_ready',
      data: {
        timestamp: new Date().toISOString(),
        metadata: collectChannelMetadata(),
        posts,
        totalPosts: posts.length
      }
    });
  }

  return true;
};

chrome.runtime.onMessage.addListener(telegramCollectorMessageHandler);
globalThis.__telegramCollectorMessageHandler = telegramCollectorMessageHandler;
