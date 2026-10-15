import json
import logging
import os
import sys

from dotenv import load_dotenv
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

sys.path.insert(0, os.path.dirname(__file__))
from analyzer import analyze
from formatter import format_report

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

BOT_TOKEN = os.getenv("BOT_TOKEN")

WELCOME = (
    "👋 Привет! Я *Аналитик Бот* — анализирую данные Telegram-каналов.\n\n"
    "📤 *Как использовать:*\n"
    "1. Собери данные расширением Chrome *Telegram Collector*\n"
    "2. Скачай JSON-файл `telegram_analytics_*.json`\n"
    "3. Отправь файл мне прямо в чат\n"
    "4. Получи полный отчёт за секунды 🚀\n\n"
    "📊 *Что анализирую:*\n"
    "• Статистика просмотров (CV, выбросы)\n"
    "• Вовлечённость (engagement rate, shares)\n"
    "• Реакции (топ эмодзи, энтропия, аутентичность)\n"
    "• Расписание публикаций\n"
    "• Контент-анализ (медиа, репосты, ссылки)\n"
    "• Оценка накрутки 0-100 с факторами риска\n\n"
    "/help — справка"
)

HELP_TEXT = (
    "🤖 *Аналитик Бот — Справка*\n\n"
    "Отправь JSON-файл с данными канала, и я построю отчёт:\n\n"
    "*Метрики:*\n"
    "📈 Просмотры — среднее, медиана, CV, выбросы\n"
    "💬 Вовлечённость — engagement/share/comment rate\n"
    "😊 Реакции — топ эмодзи, энтропия, аутентичность\n"
    "🕐 Расписание — пиковые часы, тип постинга\n"
    "📋 Контент — медиа, пересылки, ссылки, длина текстов\n"
    "🚨 Накрутка — итоговый балл риска 0-100 с объяснением\n\n"
    "*Команды:*\n"
    "/start — начать\n"
    "/help — эта справка"
)


async def cmd_start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(WELCOME, parse_mode="Markdown")


async def cmd_help(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(HELP_TEXT, parse_mode="Markdown")


async def handle_document(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    doc = update.message.document

    if not doc.file_name or not doc.file_name.endswith(".json"):
        await update.message.reply_text(
            "⚠️ Пожалуйста, отправь JSON-файл (`telegram_analytics_*.json`)",
            parse_mode="Markdown",
        )
        return

    status_msg = await update.message.reply_text("⏳ Загружаю файл...")

    try:
        file = await context.bot.get_file(doc.file_id)
        raw_bytes = await file.download_as_bytearray()
        data = json.loads(raw_bytes.decode("utf-8"))
    except json.JSONDecodeError:
        await status_msg.edit_text("❌ Не удалось разобрать JSON. Проверь файл.")
        return
    except Exception as e:
        logger.exception("Error downloading file")
        await status_msg.edit_text(f"❌ Ошибка загрузки файла: {e}")
        return

    await status_msg.edit_text("🔍 Анализирую данные...")

    try:
        result = analyze(data)
    except Exception as e:
        logger.exception("Error during analysis")
        await status_msg.edit_text(
            f"❌ Ошибка анализа: {e}\n\nПроверь что файл экспортирован расширением Telegram Collector."
        )
        return

    try:
        blocks = format_report(result)
    except Exception as e:
        logger.exception("Error during formatting")
        await status_msg.edit_text(f"❌ Ошибка форматирования отчёта: {e}")
        return

    await status_msg.delete()

    for block in blocks:
        await update.message.reply_text(block, parse_mode="Markdown")


async def handle_text(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    await update.message.reply_text(
        "📤 Отправь мне JSON-файл с данными канала.\nИспользуй /help для справки."
    )


def main() -> None:
    if not BOT_TOKEN:
        logger.error("BOT_TOKEN не найден. Создай файл .env с BOT_TOKEN=<твой_токен>")
        sys.exit(1)

    app = Application.builder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", cmd_start))
    app.add_handler(CommandHandler("help", cmd_help))
    app.add_handler(MessageHandler(filters.Document.ALL, handle_document))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text))

    logger.info("Бот запущен. Нажми Ctrl+C для остановки.")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
