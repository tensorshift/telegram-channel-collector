/*
 * Standalone analytics engine.
 *
 * This is a browser-native port of bot/analyzer.py. It deliberately has no
 * network calls or third-party dependencies so the extension can be shared as
 * a self-contained folder/zip.
 */
(function attachTelegramAnalyzer(global) {
  'use strict';

  const EMOJI_MAP = {
    'Red Heart': '❤️',
    'Thumbs Up': '👍',
    'Thumbs Down': '👎',
    'Fire': '🔥',
    'Clapping Hands': '👏',
    'Thinking Face': '🤔',
    'Handshake': '🤝',
    'Smiling Face with Heart-Eyes': '😍',
    'Crying Face': '😢',
    'Laughing': '😂',
    'Angry Face': '😡',
    'Surprised Face': '😮',
    'Party Popper': '🎉',
    'Hundred Points': '💯',
    'Rocket': '🚀',
    'Money Bag': '💰',
    'Eyes': '👀',
    'Skull': '💀',
    'Pile of Poo': '💩',
    'Broken Heart': '💔',
    'Star': '⭐',
    'Zany Face': '🤪',
    'Smiling Face': '😊',
    'Neutral Face': '😐',
  };

  const copy = value => JSON.parse(JSON.stringify(value));
  const sum = values => values.reduce((total, value) => total + value, 0);
  const mean = values => values.length ? sum(values) / values.length : 0;
  const round = (value, digits = 0) => {
    const factor = 10 ** digits;
    return Math.round((Number(value) + Number.EPSILON) * factor) / factor;
  };

  function median(values) {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    return sorted.length % 2
      ? sorted[middle]
      : (sorted[middle - 1] + sorted[middle]) / 2;
  }

  function sampleStdDev(values) {
    if (values.length < 2) return 0;
    const average = mean(values);
    return Math.sqrt(sum(values.map(value => (value - average) ** 2)) / (values.length - 1));
  }

  function parseSubscribers(value) {
    if (value == null || value === '') return null;
    let normalized = String(value)
      .trim()
      .toLowerCase()
      .replace(/[\s,\u00a0]/g, '')
      .replace(/subscribers|\u043f\u043e\u0434\u043f\u0438\u0441\u0447\u0438\u043a\u043e\u0432|members|\u0443\u0447\u0430\u0441\u0442\u043d\u0438\u043a\u043e\u0432/g, '');

    const suffixes = {
      k: 1_000,
      '\u043a': 1_000,
      m: 1_000_000,
      '\u043c': 1_000_000,
    };
    const suffix = normalized.slice(-1);
    const multiplier = suffixes[suffix] || 1;
    if (multiplier !== 1) normalized = normalized.slice(0, -1);

    const parsed = Number.parseFloat(normalized.replace(',', '.'));
    return Number.isFinite(parsed) ? Math.trunc(parsed * multiplier) : null;
  }

  function entropy(counts) {
    const total = sum(counts);
    if (!total) return 0;
    return -sum(counts.filter(Boolean).map(count => {
      const probability = count / total;
      return probability * Math.log2(probability);
    }));
  }

  function analyzeViews(posts) {
    const values = posts
      .map(post => post.views)
      .filter(value => Number.isFinite(value));

    if (!values.length) {
      return {
        count: 0,
        mean: 0,
        median: 0,
        std_dev: 0,
        cv: 0,
        min: 0,
        max: 0,
        verdict: 'no-data',
        outlier_count: 0,
      };
    }

    const average = mean(values);
    const medianValue = median(values);
    const standardDeviation = sampleStdDev(values);
    const cv = average > 0 ? standardDeviation / average : 0;

    let verdict = 'unstable';
    if (cv < 0.05) verdict = 'suspicious';
    else if (cv < 0.15) verdict = 'stable';
    else if (cv < 0.40) verdict = 'normal';

    return {
      count: values.length,
      mean: round(average),
      median: round(medianValue),
      std_dev: round(standardDeviation),
      cv: round(cv, 3),
      min: Math.min(...values),
      max: Math.max(...values),
      verdict,
      outlier_count: values.filter(value => value > 3 * medianValue).length,
    };
  }

  function analyzeEngagement(posts, subscriberCount) {
    const rates = [];
    const shareRates = [];
    const commentRates = [];
    const views = [];

    for (const post of posts) {
      const postViews = Number(post.views) || 0;
      const reactions = Number(post.totalReactions) || 0;
      const shares = Number(post.shares) || 0;
      const comments = post.comments;

      if (Number.isFinite(post.views)) views.push(Number(post.views));
      if (postViews > 0) {
        rates.push(reactions / postViews);
        shareRates.push(shares / postViews);
        if (Number.isFinite(comments)) commentRates.push(Number(comments) / postViews);
      }
    }

    const avgViews = views.length ? round(mean(views)) : 0;
    const viewsToSubs = subscriberCount && avgViews > 0
      ? round(avgViews / subscriberCount * 100, 1)
      : null;

    return {
      engagement_rate: round(mean(rates) * 100, 3),
      share_rate: round(mean(shareRates) * 100, 3),
      comment_rate: commentRates.length ? round(mean(commentRates) * 100, 3) : null,
      avg_reactions: round(mean(posts.map(post => Number(post.totalReactions) || 0)), 1),
      avg_shares: round(mean(posts.map(post => Number(post.shares) || 0)), 1),
      total_reactions: sum(posts.map(post => Number(post.totalReactions) || 0)),
      total_shares: sum(posts.map(post => Number(post.shares) || 0)),
      views_to_subs_pct: viewsToSubs,
    };
  }

  function analyzeReactions(posts) {
    const totals = new Map();
    const entropies = [];

    for (const post of posts) {
      const reactions = Array.isArray(post.reactions) ? post.reactions : [];
      const counts = reactions
        .map(reaction => Number(reaction.count) || 0)
        .filter(count => count > 0);
      if (counts.length) entropies.push(entropy(counts));

      for (const reaction of reactions) {
        const name = reaction.emoji || '';
        totals.set(name, (totals.get(name) || 0) + (Number(reaction.count) || 0));
      }
    }

    const total = sum([...totals.values()]);
    const diversity = totals.size;
    const avgEntropy = mean(entropies);
    let authenticity = total > 0 ? 'suspicious' : 'no-data';
    if (total > 0 && avgEntropy > 1.0 && diversity >= 3) authenticity = 'organic';
    else if (total > 0 && (avgEntropy > 0.5 || diversity >= 3)) authenticity = 'neutral';

    const top5 = [...totals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        symbol: EMOJI_MAP[name] || (/\p{Extended_Pictographic}/u.test(name) ? name : ''),
        count,
        pct: total > 0 ? round(count / total * 100) : 0,
      }));

    return {
      diversity,
      avg_entropy: round(avgEntropy, 2),
      top5,
      authenticity,
      total,
    };
  }

  function analyzeSchedule(posts) {
    const hours = new Map();
    const minutes = [];

    for (const post of posts) {
      const match = String(post.time || '').match(/(\d{1,2}):(\d{2})/);
      if (!match) continue;
      const hour = Number(match[1]);
      const minute = Number(match[2]);
      if (hour > 23 || minute > 59) continue;
      hours.set(hour, (hours.get(hour) || 0) + 1);
      minutes.push(hour * 60 + minute);
    }

    if (!minutes.length) {
      return { peak_hours: [], regularity: 'unknown', hour_distribution: {} };
    }

    const peakHours = [...hours.entries()]
      .sort((a, b) => b[1] - a[1] || a[0] - b[0])
      .slice(0, 3)
      .map(([hour]) => `${String(hour).padStart(2, '0')}:00`);

    let regularity = 'unknown';
    if (minutes.length > 1) {
      const deviation = sampleStdDev(minutes);
      if (deviation < 30) regularity = 'cron-like';
      else if (deviation < 180) regularity = 'scheduled';
      else regularity = 'organic';
    }

    return {
      peak_hours: peakHours,
      regularity,
      hour_distribution: Object.fromEntries([...hours.entries()].sort((a, b) => a[0] - b[0])),
    };
  }

  function analyzeContent(posts) {
    const total = posts.length;
    const empty = {
      media_pct: 0,
      forwarded_pct: 0,
      polls_pct: 0,
      links_pct: 0,
      link_types: {},
      total_links: 0,
      avg_text_len: 0,
    };
    if (!total) return empty;

    const linkTypes = {};
    for (const post of posts) {
      for (const link of (post.links || [])) {
        const type = link.type || 'unknown';
        linkTypes[type] = (linkTypes[type] || 0) + 1;
      }
    }

    return {
      media_pct: round(posts.filter(post => post.hasMedia).length / total * 100),
      forwarded_pct: round(posts.filter(post => post.forwardFrom).length / total * 100),
      polls_pct: round(posts.filter(post => post.hasPoll).length / total * 100),
      links_pct: round(posts.filter(post => (post.links || []).length).length / total * 100),
      link_types: linkTypes,
      total_links: sum(Object.values(linkTypes)),
      avg_text_len: round(mean(posts.map(post => String(post.text || '').length))),
    };
  }

  function calculateFraudScore(views, engagement, reactions, content, lang) {
    let score = 0;
    const factors = [];
    const ru = lang === 'ru';
    const add = (points, russian, english) => {
      score += points;
      factors.push(ru ? russian : english);
    };

    // Do not penalize a channel for metrics that simply were not present in DOM.
    if (views.count > 1) {
      if (views.cv < 0.05) add(20, `CV просмотров очень низкий (${views.cv.toFixed(3)}) — подозрительно стабильно (+20)`, `View CV is extremely low (${views.cv.toFixed(3)}) — suspiciously stable (+20)`);
      else if (views.cv < 0.10) add(10, `CV просмотров низкий (${views.cv.toFixed(3)}) (+10)`, `View CV is low (${views.cv.toFixed(3)}) (+10)`);

      if (engagement.engagement_rate < 0.1) add(20, `Engagement rate ниже 0.1% (${engagement.engagement_rate.toFixed(3)}%) — очень низкий (+20)`, `Engagement rate is below 0.1% (${engagement.engagement_rate.toFixed(3)}%) (+20)`);
      else if (engagement.engagement_rate < 0.3) add(10, `Engagement rate низкий (${engagement.engagement_rate.toFixed(3)}%) (+10)`, `Engagement rate is low (${engagement.engagement_rate.toFixed(3)}%) (+10)`);
    }

    if (reactions.total > 0) {
      if (reactions.diversity < 3) add(15, `Мало типов реакций (${reactions.diversity}) — монотонно (+15)`, `Low reaction diversity (${reactions.diversity} types) (+15)`);
      if (reactions.avg_entropy < 0.5) add(15, `Энтропия реакций низкая (${reactions.avg_entropy.toFixed(2)}) — однообразные реакции (+15)`, `Reaction entropy is low (${reactions.avg_entropy.toFixed(2)}) (+15)`);
    }

    if (content.forwarded_pct > 40) add(10, `Много пересланных постов (${content.forwarded_pct}%) (+10)`, `High share of forwarded posts (${content.forwarded_pct}%) (+10)`);
    if (views.outlier_count > 0) add(10, `Выбросы просмотров (×3 медианы): ${views.outlier_count} постов (+10)`, `View outliers (>3× median): ${views.outlier_count} posts (+10)`);

    const urlLinks = content.link_types.url || 0;
    if (content.total_links > 0 && urlLinks / content.total_links > 0.7) {
      const density = round(urlLinks / content.total_links * 100);
      add(5, `Высокая плотность внешних ссылок (${density}%) (+5)`, `High external-link density (${density}%) (+5)`);
    }

    if (engagement.views_to_subs_pct != null && engagement.views_to_subs_pct > 80) {
      add(15, `Охват превышает 80% подписчиков (${engagement.views_to_subs_pct}%) — аномально высокий (+15)`, `Reach exceeds 80% of subscribers (${engagement.views_to_subs_pct}%) (+15)`);
    }

    score = Math.min(score, 100);
    let risk = 'низкий';
    let riskEmoji = '✅';
    if (score > 70) { risk = 'критический'; riskEmoji = '🔴'; }
    else if (score > 45) { risk = 'высокий'; riskEmoji = '🚨'; }
    else if (score > 20) { risk = 'умеренный'; riskEmoji = '⚠️'; }

    return { score, risk, risk_emoji: riskEmoji, factors };
  }

  function analyze(input, lang = 'en') {
    const data = copy(input || {});
    const posts = Array.isArray(data.posts) ? data.posts : [];
    const metadata = data.metadata || data.channel || {};
    const subscriberCount = parseSubscribers(metadata.subscribers || '');
    const views = analyzeViews(posts);
    const engagement = analyzeEngagement(posts, subscriberCount);
    const reactions = analyzeReactions(posts);
    const schedule = analyzeSchedule(posts);
    const content = analyzeContent(posts);

    return {
      metadata,
      total_posts: data.totalPosts || posts.length,
      subscriber_count: subscriberCount,
      views,
      engagement,
      reactions,
      schedule,
      content,
      fraud: calculateFraudScore(views, engagement, reactions, content, lang),
    };
  }

  global.TelegramAnalyzer = Object.freeze({ analyze, parseSubscribers });
})(typeof globalThis !== 'undefined' ? globalThis : window);
