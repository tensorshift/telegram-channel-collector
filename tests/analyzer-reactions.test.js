const assert = require('node:assert/strict');
const path = require('node:path');

require(path.join(__dirname, '..', 'analyzer.js'));

const result = global.TelegramAnalyzer.analyze({
  metadata: { subscribers: '1,000 subscribers' },
  posts: [
    {
      views: 100,
      reactions: [
        { emoji: '🔥', count: 12 },
        { emoji: '❤️', count: 4 },
      ],
      totalReactions: 16,
      links: [],
    },
    {
      views: 120,
      reactions: [
        { emoji: '🔥', count: 7 },
        { emoji: '👍', count: 3 },
      ],
      totalReactions: 10,
      links: [],
    },
  ],
}, 'en');

assert.equal(result.reactions.total, 26);
assert.equal(result.reactions.diversity, 3);
assert.equal(result.reactions.distribution.length, 3);
assert.deepEqual(result.reactions.distribution.map(item => [item.name, item.count]), [
  ['🔥', 19],
  ['❤️', 4],
  ['👍', 3],
]);
assert.equal(result.reactions.top5.length, 3);

console.log('Full reaction distribution: OK');
