(() => {
  function getReactionIdentity(reaction) {
    if (!reaction) return null;
    if (reaction._ === 'reactionEmoji' && reaction.emoticon) return reaction.emoticon;
    if (reaction._ === 'reactionCustomEmoji' && reaction.document_id) {
      return `custom:${reaction.document_id}`;
    }
    if (reaction._ === 'reactionPaid') return 'paid-star';
    return null;
  }

  function annotateReaction(element) {
    try {
      const reactionCount = element.reactionCount;
      if (!reactionCount?.reaction) return;

      const identity = getReactionIdentity(reactionCount.reaction);
      if (identity) element.setAttribute('data-tgc-reaction', identity);

      const count = Number(reactionCount.count);
      if (Number.isFinite(count) && count >= 0) {
        element.setAttribute('data-tgc-count', String(Math.round(count)));
      }
    } catch {
      // Telegram can replace a custom element while it is being rendered.
    }
  }

  function scan(root = document) {
    if (root.nodeType === Node.ELEMENT_NODE && root.matches?.('reaction-element')) {
      annotateReaction(root);
    }
    root.querySelectorAll?.('reaction-element').forEach(annotateReaction);
  }

  if (globalThis.__telegramCollectorReactionBridge) {
    globalThis.__telegramCollectorReactionBridge.scan();
    return;
  }

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      const owner = mutation.target.nodeType === Node.ELEMENT_NODE
        ? mutation.target.closest?.('reaction-element')
        : mutation.target.parentElement?.closest?.('reaction-element');
      if (owner) annotateReaction(owner);
      mutation.addedNodes.forEach(scan);
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    characterData: true,
    subtree: true,
  });

  globalThis.__telegramCollectorReactionBridge = { scan, observer };
  scan();
})();
