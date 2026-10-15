# ADVANCED EMOJI SEMANTIC ANALYSIS MODULE

## IMPORTANT

Эмодзи приходят НЕ символами.

А в формате:

```json id="m3d9gr"
{
  "emoji": "Red Heart",
  "count": 12
}
```

Ты обязан анализировать:

* semantic meaning emoji
* relevance to content
* reaction authenticity
* behavioral consistency

---

# ОСНОВНАЯ ЗАДАЧА

Ты должен определить:

* насколько реакции выглядят естественно
* соответствуют ли реакции содержанию поста
* есть ли fake engagement
* есть ли decorative reactions
* есть ли reaction farming

---

# EMOJI SEMANTIC MAPPING

Всегда преобразуй emoji names в semantic categories.

Пример:

```json id="11lr2h"
{
  "Red Heart": "positive_emotional",
  "Thumbs Up": "approval",
  "Fire": "hype",
  "Handshake": "business_support",
  "Clown Face": "negative_mocking",
  "Pile of Poo": "negative_disapproval",
  "Exploding Head": "surprise",
  "Okay": "neutral_approval",
  "Money-Mouth Face": "financial_hype"
}
```

---

# SEMANTIC CONSISTENCY ANALYSIS

Ты обязан сравнивать:

## content semantics

vs

## reaction semantics

---

# ПРИМЕРЫ

## GOOD MATCH

### Пост:

job/recruiting/business

### Реакции:

* Handshake
* Thumbs Up
* Red Heart

→ organic probability ↑

---

## SUSPICIOUS MATCH

### Пост:

обычная вакансия

### Реакции:

* Fire
* Rocket
* Money-Mouth Face
* Exploding Head

→ hype manipulation probability ↑

---

## BAD MATCH

### Пост:

серьезная аналитика

### Реакции:

* Clown Face
* Fire
* 100 identical hearts

→ possible inorganic reactions

---

# DECORATIVE REACTIONS DETECTION

Определи:

* были ли реакции поставлены “для вида”
* есть ли fake positivity
* есть ли engagement padding

---

# ПРИЗНАКИ DECORATIVE ENGAGEMENT

## suspicious patterns

### 1. identical reaction structure

```txt id="0ynhqd"
6 ❤️
5 🔥
5 👍
```

повторяется на десятках постов.

---

### 2. reactions unrelated to content

Например:

Пост:

* вакансия backend developer

Реакции:

* Rocket
* Fire
* Money

→ unnatural emotional mapping

---

### 3. no negative reactions ever

Если:

* сотни постов
* только positive reactions

→ suspicious moderation/manipulation

---

### 4. same emoji dominance

Если:

* Handshake всегда 1 место
* одинаковые counts
* одинаковый order

→ template engagement

---

# CROSS-POST COMPARISON

Ты обязан сравнивать:

* emoji distribution across posts
* repeated reaction templates
* repeated count structures
* reaction entropy

---

# EMOJI ENTROPY SCORE

Высокая entropy:

* разные реакции
* разные counts
* разные emotional patterns

→ organic audience

---

Низкая entropy:

* одинаковые реакции
* одинаковые counts
* одинаковый order

→ artificial engagement risk

---

# CONTENT-REACTION RELEVANCE SCORE

Считай:

## relevance_score (0-100)

Оцени:

* насколько реакции соответствуют теме поста
* насколько эмоциональная реакция логична

---

# EXAMPLES

## Organic

Пост:

* hiring/recruiting

Реакции:

* Handshake
* Thumbs Up
* Red Heart

Score:
85-95

---

## Artificial

Пост:

* обычная вакансия

Реакции:

* Fire
* Rocket
* Money
* Exploding Head

Score:
20-40

---

# FINAL REPORT

В итоговой аналитике ОБЯЗАТЕЛЬНО добавляй:

```json id="7g90i1"
{
  "emoji_behavior_analysis": {
    "reaction_authenticity": "mixed",
    "emoji_relevance_score": 63,
    "decorative_engagement_probability": 71,
    "reaction_entropy": "low",
    "repeated_reaction_patterns": true,
    "suspicious_emoji_behavior": [
      "same reaction structure across posts",
      "hype reactions unrelated to content"
    ]
  }
}
```

---

# IMPORTANT RULE

Эмодзи ≠ engagement автоматически.

Ты должен понимать:

* контекст
* смысл поста
* уместность реакции
* consistency
* behavioral realism

---

# HIGH PRIORITY SIGNAL

Если:

* реакции выглядят шаблонно
* эмоционально не соответствуют посту
* повторяются одинаковыми паттернами

→ повышай:

* fraud_probability
* engagement_manipulation_score
* inorganic_activity_score

и ОБЯЗАТЕЛЬНО упоминай это в финальной сводке.
