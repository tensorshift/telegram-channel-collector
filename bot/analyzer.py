import math
import statistics
from collections import Counter, defaultdict


EMOJI_MAP = {
    "Red Heart": "❤️", "Thumbs Up": "👍", "Thumbs Down": "👎",
    "Fire": "🔥", "Clapping Hands": "👏", "Thinking Face": "🤔",
    "Handshake": "🤝", "Smiling Face with Heart-Eyes": "😍",
    "Crying Face": "😢", "Laughing": "😂", "Angry Face": "😡",
    "Surprised Face": "😮", "Party Popper": "🎉", "Hundred Points": "💯",
    "Rocket": "🚀", "Money Bag": "💰", "Eyes": "👀", "Skull": "💀",
    "Pile of Poo": "💩", "Broken Heart": "💔", "Star": "⭐",
    "Zany Face": "🤪", "Smiling Face": "😊", "Neutral Face": "😐",
}


def parse_subscribers(s: str) -> int | None:
    if not s:
        return None
    s = s.strip().lower().replace(",", "").replace(" ", "")
    # strip trailing label
    for suffix in ("subscribers", "подписчиков", "members", "участников"):
        s = s.replace(suffix, "").strip()
    try:
        if s.endswith("m"):
            return int(float(s[:-1]) * 1_000_000)
        if s.endswith("k"):
            return int(float(s[:-1]) * 1_000)
        return int(float(s)) if s else None
    except (ValueError, TypeError):
        return None


def _entropy(counts: list[int]) -> float:
    total = sum(counts)
    if total == 0:
        return 0.0
    return -sum((c / total) * math.log2(c / total) for c in counts if c > 0)


def analyze_views(posts: list[dict]) -> dict:
    views = [p["views"] for p in posts if p.get("views") is not None]
    if not views:
        return {"count": 0, "mean": 0, "median": 0, "std_dev": 0, "cv": 0, "min": 0, "max": 0, "verdict": "нет данных"}

    mean = statistics.mean(views)
    median = statistics.median(views)
    std_dev = statistics.stdev(views) if len(views) > 1 else 0
    cv = std_dev / mean if mean > 0 else 0

    if cv < 0.05:
        verdict = "suspicious"
    elif cv < 0.15:
        verdict = "stable"
    elif cv < 0.40:
        verdict = "normal"
    else:
        verdict = "unstable"

    # Outliers: posts with views > 3× median
    outlier_count = sum(1 for v in views if v > 3 * median)

    return {
        "count": len(views),
        "mean": round(mean),
        "median": round(median),
        "std_dev": round(std_dev),
        "cv": round(cv, 3),
        "min": min(views),
        "max": max(views),
        "verdict": verdict,
        "outlier_count": outlier_count,
    }


def analyze_engagement(posts: list[dict], subscriber_count: int | None = None) -> dict:
    rates = []
    share_rates = []
    comment_rates = []
    total_reactions = 0
    total_shares = 0

    for p in posts:
        views = p.get("views") or 0
        reactions = p.get("totalReactions") or 0
        shares = p.get("shares") or 0
        comments = p.get("comments")

        total_reactions += reactions
        total_shares += shares

        if views > 0:
            rates.append(reactions / views)
            share_rates.append(shares / views)
            if comments is not None:
                comment_rates.append(comments / views)

    avg_rate = statistics.mean(rates) if rates else 0
    avg_share_rate = statistics.mean(share_rates) if share_rates else 0
    avg_comment_rate = statistics.mean(comment_rates) if comment_rates else None

    views_list = [p.get("views") or 0 for p in posts if p.get("views") is not None]
    avg_views = round(statistics.mean(views_list)) if views_list else 0

    views_to_subs_pct = None
    if subscriber_count and subscriber_count > 0 and avg_views > 0:
        views_to_subs_pct = round(avg_views / subscriber_count * 100, 1)

    return {
        "engagement_rate": round(avg_rate * 100, 3),
        "share_rate": round(avg_share_rate * 100, 3),
        "comment_rate": round(avg_comment_rate * 100, 3) if avg_comment_rate is not None else None,
        "avg_reactions": round(statistics.mean([p.get("totalReactions") or 0 for p in posts]), 1),
        "avg_shares": round(statistics.mean([p.get("shares") or 0 for p in posts]), 1),
        "total_reactions": total_reactions,
        "total_shares": total_shares,
        "views_to_subs_pct": views_to_subs_pct,
    }


def analyze_reactions(posts: list[dict]) -> dict:
    emoji_totals: Counter = Counter()
    post_entropies = []

    for p in posts:
        reactions = p.get("reactions") or []
        counts = [r["count"] for r in reactions if r.get("count", 0) > 0]
        if counts:
            post_entropies.append(_entropy(counts))
        for r in reactions:
            name = r.get("emoji", "")
            emoji_totals[name] += r.get("count", 0)

    total_reactions = sum(emoji_totals.values())
    diversity = len(emoji_totals)
    avg_entropy = statistics.mean(post_entropies) if post_entropies else 0

    top5 = emoji_totals.most_common(5)
    top5_formatted = []
    for name, count in top5:
        pct = round(count / total_reactions * 100) if total_reactions > 0 else 0
        symbol = EMOJI_MAP.get(name, "")
        top5_formatted.append({"name": name, "symbol": symbol, "count": count, "pct": pct})

    if avg_entropy > 1.0 and diversity >= 3:
        authenticity = "organic"
    elif avg_entropy > 0.5 or diversity >= 3:
        authenticity = "neutral"
    else:
        authenticity = "suspicious"

    return {
        "diversity": diversity,
        "avg_entropy": round(avg_entropy, 2),
        "top5": top5_formatted,
        "authenticity": authenticity,
        "total": total_reactions,
    }


def analyze_schedule(posts: list[dict]) -> dict:
    hours: Counter = Counter()
    minutes_all = []

    for p in posts:
        time_str = p.get("time", "")
        if not time_str:
            continue
        # Handle "edited HH:MM"
        parts = time_str.replace("edited", "").strip().split(":")
        if len(parts) == 2:
            try:
                h = int(parts[0])
                m = int(parts[1])
                hours[h] += 1
                minutes_all.append(h * 60 + m)
            except ValueError:
                pass

    if not minutes_all:
        return {"peak_hours": [], "regularity": "unknown", "hour_distribution": {}}

    peak_hours = [f"{h:02d}:00" for h, _ in hours.most_common(3)]

    # Regularity: if std_dev of minute-of-day < 10 → cron-like
    if len(minutes_all) > 1:
        std = statistics.stdev(minutes_all)
        if std < 30:
            regularity = "cron-like"
        elif std < 180:
            regularity = "scheduled"
        else:
            regularity = "organic"
    else:
        regularity = "unknown"

    return {
        "peak_hours": peak_hours,
        "regularity": regularity,
        "hour_distribution": dict(sorted(hours.items())),
    }


def analyze_content(posts: list[dict]) -> dict:
    total = len(posts)
    if total == 0:
        return {}

    with_media = sum(1 for p in posts if p.get("hasMedia"))
    forwarded = sum(1 for p in posts if p.get("forwardFrom"))
    with_polls = sum(1 for p in posts if p.get("hasPoll"))
    with_links = sum(1 for p in posts if p.get("links"))

    link_types: Counter = Counter()
    for p in posts:
        for link in p.get("links") or []:
            link_types[link.get("type", "unknown")] += 1

    total_links = sum(link_types.values())

    text_lengths = [len(p.get("text") or "") for p in posts]
    avg_text_len = round(statistics.mean(text_lengths)) if text_lengths else 0

    return {
        "media_pct": round(with_media / total * 100),
        "forwarded_pct": round(forwarded / total * 100),
        "polls_pct": round(with_polls / total * 100),
        "links_pct": round(with_links / total * 100),
        "link_types": dict(link_types),
        "total_links": total_links,
        "avg_text_len": avg_text_len,
    }


def calculate_fraud_score(views: dict, engagement: dict, reactions: dict, content: dict) -> dict:
    score = 0
    factors = []

    cv = views.get("cv", 0)
    if cv < 0.05:
        score += 20
        factors.append(f"CV просмотров очень низкий ({cv:.3f}) — подозрительно стабильно (+20)")
    elif cv < 0.10:
        score += 10
        factors.append(f"CV просмотров низкий ({cv:.3f}) (+10)")

    er = engagement.get("engagement_rate", 0)
    if er < 0.1:
        score += 20
        factors.append(f"Engagement rate ниже 0.1% ({er:.3f}%) — очень низкий (+20)")
    elif er < 0.3:
        score += 10
        factors.append(f"Engagement rate низкий ({er:.3f}%) (+10)")

    diversity = reactions.get("diversity", 0)
    if diversity < 3:
        score += 15
        factors.append(f"Мало типов реакций ({diversity}) — монотонно (+15)")

    entropy = reactions.get("avg_entropy", 0)
    if entropy < 0.5:
        score += 15
        factors.append(f"Энтропия реакций низкая ({entropy:.2f}) — однообразные реакции (+15)")

    forwarded_pct = content.get("forwarded_pct", 0)
    if forwarded_pct > 40:
        score += 10
        factors.append(f"Много пересланных постов ({forwarded_pct}%) (+10)")

    outliers = views.get("outlier_count", 0)
    if outliers > 0:
        score += 10
        factors.append(f"Выбросы просмотров (×3 медианы): {outliers} постов (+10)")

    url_links = content.get("link_types", {}).get("url", 0)
    total_links = content.get("total_links", 0)
    if total_links > 0 and url_links / total_links > 0.7:
        score += 5
        factors.append(f"Высокая плотность рекламных ссылок ({round(url_links/total_links*100)}%) (+5)")

    views_to_subs = engagement.get("views_to_subs_pct")
    if views_to_subs is not None and views_to_subs > 80:
        score += 15
        factors.append(f"Охват превышает 80% подписчиков ({views_to_subs}%) — нереалистично высокий (+15)")

    score = min(score, 100)

    if score <= 20:
        risk = "низкий"
        risk_emoji = "✅"
    elif score <= 45:
        risk = "умеренный"
        risk_emoji = "⚠️"
    elif score <= 70:
        risk = "высокий"
        risk_emoji = "🚨"
    else:
        risk = "критический"
        risk_emoji = "🔴"

    return {
        "score": score,
        "risk": risk,
        "risk_emoji": risk_emoji,
        "factors": factors,
    }


def analyze(data: dict) -> dict:
    posts = data.get("posts") or []
    metadata = data.get("metadata") or {}
    subscriber_count = parse_subscribers(metadata.get("subscribers", ""))

    views = analyze_views(posts)
    engagement = analyze_engagement(posts, subscriber_count)
    reactions = analyze_reactions(posts)
    schedule = analyze_schedule(posts)
    content = analyze_content(posts)
    fraud = calculate_fraud_score(views, engagement, reactions, content)

    return {
        "metadata": metadata,
        "total_posts": data.get("totalPosts") or len(posts),
        "subscriber_count": subscriber_count,
        "views": views,
        "engagement": engagement,
        "reactions": reactions,
        "schedule": schedule,
        "content": content,
        "fraud": fraud,
    }
