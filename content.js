let isCollectionMode = false;
const collectedPosts = new Map();

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

function absorbElement(el) {
  const id = el.getAttribute('data-message-id') || el.getAttribute('data-id');
  if (!id || collectedPosts.has(id)) return;
  const data = extractPostData(el);
  if (!data.text && !data.hasMedia && data.totalReactions === 0) return;
  collectedPosts.set(id, data);
}

const domObserver = new MutationObserver(mutations => {
  if (!isCollectionMode) return;
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== 1) continue;
      if (node.matches('[data-message-id]')) {
        absorbElement(node);
      } else {
        node.querySelectorAll('[data-message-id]').forEach(absorbElement);
      }
    }
  }
});

domObserver.observe(document.body, { childList: true, subtree: true });

function extractPostData(messageEl) {
  const msgId = messageEl.getAttribute('data-message-id') || messageEl.getAttribute('data-id');

  // 1. TEXT
  const textEl = messageEl.querySelector('.text-content');
  const text = textEl ? textEl.innerText.trim() : '';

  // 2. VIEWS & SHARES
  let views = null;
  let shares = null;
  const viewsEl = messageEl.querySelector('.message-views');
  if (viewsEl) {
    const viewsText = viewsEl.getAttribute('title') || viewsEl.innerText;
    const viewsMatch = viewsText.match(/Views:\s*([\d,.]+\s*[KMB]?)/i);
    if (viewsMatch) views = parseCompactNumber(viewsMatch[1]);
    const sharesMatch = viewsText.match(/Shares:\s*([\d,.]+\s*[KMB]?)/i);
    if (sharesMatch) shares = parseCompactNumber(sharesMatch[1]);
    if (views === null && viewsEl.innerText) {
      views = parseCompactNumber(viewsEl.innerText);
    }
  }

  // 3. TIME
  let time = null;
  const timeEl = messageEl.querySelector('.message-time');
  if (timeEl) time = timeEl.innerText.trim();

  // 4. REACTIONS
  const reactions = [];
  messageEl.querySelectorAll('.message-reaction').forEach(btn => {
    const emojiImg = btn.querySelector('.ReactionStaticEmoji img.media');
    const countSpan = btn.querySelector('.tgKbsVmz');
    const emoji = emojiImg ? emojiImg.getAttribute('alt') : null;
    const count = countSpan ? (parseCompactNumber(countSpan.innerText) || 0) : 0;
    if (emoji || count) {
      reactions.push({ emoji: emoji || 'unknown', count: count || 0 });
    }
  });

  // 5. LINKS
  const links = [];
  messageEl.querySelectorAll('a.text-entity-link').forEach(link => {
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
  const hasMedia = !!messageEl.querySelector('img:not(.emoji), video, .document, .photo');

  // 7. FORWARD
  let forwardFrom = null;
  const forwardEl = messageEl.querySelector('.forwarded-name');
  if (forwardEl) forwardFrom = forwardEl.innerText.trim();

  // 8. POLL
  const hasPoll = !!messageEl.querySelector('.poll');

  // 9. COMMENTS
  let comments = null;
  const commentsEl = messageEl.querySelector('.comments-button');
  if (commentsEl) {
    comments = parseCompactNumber(commentsEl.innerText);
  }

  return {
    id: msgId,
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
    let elements = document.querySelectorAll('.tgme_widget_message');
    if (elements.length === 0) elements = document.querySelectorAll('[data-message-id]');

    Array.from(elements).forEach(el => {
      const id = el.getAttribute('data-message-id') || el.getAttribute('data-id');
      if (!id || collectedPosts.has(id)) return;
      const data = extractPostData(el);
      if (!data.text && !data.hasMedia && data.totalReactions === 0) return;
      collectedPosts.set(id, data);
    });
  }

  let idx = 1;
  return Array.from(collectedPosts.values()).map(p => ({ ...p, index: idx++ }));
}

function collectChannelMetadata() {
  // Channel name — new K interface first, then legacy
  let channelName = '';
  const nameSelectors = [
    '.ChatInfo .info .fullName',
    '.ChatInfo h3',
    '.chat-info .title',
    '.tgme_page_title span',
    '.channel-info .title',
    '.chat-title',
    '.peer-title',
  ];
  for (const sel of nameSelectors) {
    const el = document.querySelector(sel);
    if (el && el.innerText.trim()) { channelName = el.innerText.trim(); break; }
  }

  // Subscribers — new K interface first, then legacy
  let subscribers = '';
  const subSelectors = [
    '.ChatInfo .group-status',
    '.ChatInfo .status',
    '.tgme_page_extra',
  ];
  for (const sel of subSelectors) {
    const el = document.querySelector(sel);
    if (el && el.innerText.trim()) { subscribers = el.innerText.trim(); break; }
  }

  const descEl   = document.querySelector('.tgme_page_description');
  const urlParts = window.location.href.split('/');

  return {
    channelName,
    subscribers,
    description: descEl ? descEl.innerText.trim() : '',
    channelId: urlParts[urlParts.length - 1] || '',
    url: window.location.href
  };
}

function convertToCSV(posts) {
  const headers = ['index', 'text', 'views', 'shares', 'time', 'totalReactions', 'hasMedia', 'forwardFrom', 'comments'];
  const rows = posts.map(post => [
    post.index,
    `"${(post.text || '').replace(/\n/g, ' ').replace(/"/g, '""').substring(0, 500)}"`,
    post.views ?? '',
    post.shares ?? '',
    post.time || '',
    post.totalReactions || '',
    post.hasMedia,
    post.forwardFrom || '',
    post.comments ?? ''
  ]);
  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
    const total = posts.reduce((sum, p) => sum + (p.views || 0), 0);

    const outputData = {
      timestamp: new Date().toISOString(),
      metadata,
      posts,
      totalPosts: posts.length,
      stats: {
        avgViews: posts.length ? Math.round(total / posts.length) : 0,
        totalReactions: posts.reduce((sum, p) => sum + (p.totalReactions || 0), 0),
        postsWithMedia: posts.filter(p => p.hasMedia).length
      },
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
});
