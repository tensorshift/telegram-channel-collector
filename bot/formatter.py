def _pct_bar(pct: int, width: int = 10) -> str:
    filled = round(pct / 100 * width)
    return "█" * filled + "░" * (width - filled)


def _cv_label(cv: float) -> str:
    if cv < 0.05:
        return "⚠️ Подозрительно стабильно"
    if cv < 0.15:
        return "✅ Стабильно"
    if cv < 0.40:
        return "🔄 Нормально"
    return "📊 Нестабильно"


def _regularity_label(r: str) -> str:
    return {"cron-like": "🤖 Автопостинг", "scheduled": "📅 Плановый", "organic": "🌱 Органичный", "unknown": "❓ Неизвестно"}.get(r, r)


def _authenticity_label(a: str) -> str:
    return {"organic": "✅ Органично", "neutral": "➖ Нейтрально", "suspicious": "⚠️ Подозрительно"}.get(a, a)


def format_report(result: dict) -> list[str]:
    meta = result["metadata"]
    total_posts = result["total_posts"]
    views = result["views"]
    eng = result["engagement"]
    react = result["reactions"]
    sched = result["schedule"]
    content = result["content"]
    fraud = result["fraud"]

    channel_name = meta.get("channelName") or "Неизвестный канал"
    subscribers = meta.get("subscribers") or "—"
    url = meta.get("url") or ""

    messages = []

    # ── Block 1: Header ──────────────────────────────────────────────────
    header = (
        f"📊 *{_esc(channel_name)}*\n"
        f"👥 Подписчиков: *{_esc(subscribers)}* | 📝 Проанализировано постов: *{total_posts}*"
    )
    if url:
        header += f"\n🔗 {_esc(url)}"
    messages.append(header)

    # ── Block 2: Views ───────────────────────────────────────────────────
    views_block = (
        "📈 *ПРОСМОТРЫ*\n"
        f"├ Среднее: *{views['mean']:,}* | Медиана: *{views['median']:,}*\n"
        f"├ Мин: {views['min']:,} | Макс: {views['max']:,}\n"
        f"├ Стд. откл.: {views['std_dev']:,}\n"
        f"└ CV: *{views['cv']:.3f}* → {_cv_label(views['cv'])}"
    )
    messages.append(views_block)

    # ── Block 3: Engagement ──────────────────────────────────────────────
    er = eng["engagement_rate"]
    sr = eng["share_rate"]
    cr = eng.get("comment_rate")

    er_bar = _pct_bar(min(int(er * 10), 100))
    eng_block = (
        "💬 *ВОВЛЕЧЁННОСТЬ*\n"
        f"├ Engagement rate: *{er:.3f}%* {er_bar}\n"
        f"├ Share rate: *{sr:.3f}%*\n"
    )
    if cr is not None:
        eng_block += f"├ Comment rate: *{cr:.3f}%*\n"
    eng_block += (
        f"├ Среднее реакций на пост: *{eng['avg_reactions']}*\n"
        f"└ Среднее репостов на пост: *{eng['avg_shares']}*"
    )
    messages.append(eng_block)

    # ── Block 4: Reactions ───────────────────────────────────────────────
    top_line = "  ".join(
        f"{r['symbol'] or r['name']} {r['pct']}%"
        for r in react["top5"]
    )
    react_block = (
        "😊 *РЕАКЦИИ*\n"
        f"├ Топ: {top_line}\n"
        f"├ Разнообразие: *{react['diversity']}* типов\n"
        f"├ Средняя энтропия: *{react['avg_entropy']}*\n"
        f"└ Аутентичность: {_authenticity_label(react['authenticity'])}"
    )
    messages.append(react_block)

    # ── Block 5: Schedule ────────────────────────────────────────────────
    peaks = ", ".join(sched["peak_hours"]) if sched["peak_hours"] else "—"
    sched_block = (
        "🕐 *РАСПИСАНИЕ ПУБЛИКАЦИЙ*\n"
        f"├ Пиковые часы: *{peaks}*\n"
        f"└ Регулярность: {_regularity_label(sched['regularity'])}"
    )
    messages.append(sched_block)

    # ── Block 6: Content ─────────────────────────────────────────────────
    link_types = content.get("link_types") or {}
    mentions = link_types.get("mention", 0)
    urls = link_types.get("url", 0)
    total_links = content.get("total_links", 0)

    link_line = ""
    if total_links > 0:
        parts = []
        if mentions:
            parts.append(f"упоминания: {round(mentions/total_links*100)}%")
        if urls:
            parts.append(f"URL: {round(urls/total_links*100)}%")
        link_line = f"\n├ Ссылки ({total_links}): {', '.join(parts)}"

    content_block = (
        "📋 *КОНТЕНТ*\n"
        f"├ С медиа: *{content['media_pct']}%* {_pct_bar(content['media_pct'])}\n"
        f"├ Пересланных: *{content['forwarded_pct']}%*\n"
        f"├ С опросами: *{content['polls_pct']}%*"
        f"{link_line}\n"
        f"└ Средняя длина текста: *{content['avg_text_len']}* симв."
    )
    messages.append(content_block)

    # ── Block 7: Fraud Score ─────────────────────────────────────────────
    fraud_score = fraud["score"]
    risk = fraud["risk"]
    risk_emoji = fraud["risk_emoji"]
    bar = _pct_bar(fraud_score)

    fraud_block = (
        f"🚨 *ОЦЕНКА НАКРУТКИ: {fraud_score}/100* {bar}\n"
        f"Риск: {risk_emoji} *{risk.upper()}*"
    )
    if fraud["factors"]:
        factors_text = "\n".join(f"  • {f}" for f in fraud["factors"])
        fraud_block += f"\n\nФакторы риска:\n{factors_text}"
    else:
        fraud_block += "\n\n✅ Подозрительных сигналов не обнаружено"

    messages.append(fraud_block)

    return messages


def _esc(text: str) -> str:
    # Escape Markdown V2 special characters for Telegram MarkdownV2 parse mode.
    # We use plain Markdown (parse_mode=Markdown) so only * and _ matter for bold/italic.
    # Just escape backslash and backtick to be safe.
    return str(text).replace("\\", "\\\\").replace("`", "\\`")
