document.addEventListener('DOMContentLoaded', () => {

  // ── DOM refs ───────────────────────────────────────────────
  const startBtn       = document.getElementById('startBtn');
  const finishBtn      = document.getElementById('finishBtn');
  const finishIcon     = document.getElementById('finishIcon');
  const analyzeBtn     = document.getElementById('analyzeBtn');
  const analyzeIcon    = document.getElementById('analyzeIcon');
  const resultsPanel   = document.getElementById('resultsPanel');
  const backBtn        = document.getElementById('backBtn');
  const btnGroup       = document.querySelector('.btn-group');
  const btnRow2        = document.querySelector('.btn-row-2');
  const mainDivider    = document.getElementById('mainDivider');
  const statusBadge    = document.getElementById('statusBadge');
  const statusDot      = document.getElementById('statusDot');
  const statusMsg      = document.getElementById('statusMsg');
  const postCount      = document.getElementById('postCount');
  const counterDisplay = document.getElementById('counterDisplay');
  const counterIcon    = document.getElementById('counterIcon');
  const waveContainer  = document.getElementById('waveContainer');
  const progressBar    = document.getElementById('progressBar');
  const progressFill   = document.getElementById('progressFill');
  const cardWrapper    = document.getElementById('cardWrapper');
  const tipText        = document.getElementById('tipText');
  const toast          = document.getElementById('toast');
  const toastIcon      = document.getElementById('toastIcon');
  const toastMsg       = document.getElementById('toastMsg');
  const introOverlay   = document.getElementById('introOverlay');
  const langScreen     = document.getElementById('langScreen');
  const stepsScreen    = document.getElementById('stepsScreen');
  const stepCard       = document.getElementById('stepCard');
  const stepIconEl     = document.getElementById('stepIcon');
  const stepTitleEl    = document.getElementById('stepTitle');
  const stepDescEl     = document.getElementById('stepDesc');
  const stepDots       = document.getElementById('stepDots');
  const introNextBtn   = document.getElementById('introNextBtn');
  const langSwitchBtn  = document.getElementById('langSwitchBtn');
  const mainLangBtn    = document.getElementById('mainLangBtn');
  const stopBtn        = document.getElementById('stopBtn');
  const clearBtn       = document.getElementById('clearBtn');
  const exportBtn      = document.getElementById('exportBtn');
  const tipBox         = document.getElementById('tipBox');
  const tipTitle       = document.getElementById('tipTitle');
  const tipDesc        = document.getElementById('tipDesc');
  const tipAffect      = document.getElementById('tipAffect');
  const localBadge     = document.getElementById('localBadge');

  let collecting    = false;
  let currentTabId  = null;
  let pollInterval  = null;
  let toastTimer    = null;
  let currentLang   = 'en';
  let currentStep   = 0;
  let lastPostCount = 0;
  let lastResult    = null;
  let lastSourceData = null;

  // ── Localization ───────────────────────────────────────────

  const i18n = {
    en: {
      steps: [
        {
          icon: '🌐',
          title: 'Open a Telegram Channel',
          desc: 'Go to <span class="step-hl">web.telegram.org</span> and open the channel you want to analyze.'
        },
        {
          icon: '▶️',
          title: 'Start & Scroll',
          desc: 'Click <span class="step-hl">Start Collection</span>, then scroll through the channel to load posts.\n\nRecommended: <span class="step-hl">60+ posts</span> for quality analytics.'
        },
        {
          icon: '💾',
          title: 'Save or Analyze',
          desc: 'Click <span class="step-hl">Finish &amp; Download</span> to save JSON, or <span class="step-hl">Analyze</span> to get instant charts right here.'
        }
      ],
      next:             'Next →',
      start:            "Let's go! →",
      statusReady:      'Ready to collect',
      statusCollecting: 'Collecting — scroll channel',
      statusProcessing: 'Processing data…',
      statusAnalyzing:  'Analyzing…',
      tipReady:         'Open a Telegram channel, then click Start',
      tipCollecting:    'Scroll up to load more posts, then click Finish',
      tipDone:          'JSON saved to your Downloads folder',
      tipAnalyzed:      'Scroll down to explore results',
      analyzeError:     'Could not analyze this data locally',
      counterLabel:     'Posts collected',
      startBtn:         'Start Collection',
      finishBtn:        'Finish & Download',
      analyzeBtn:       'Analyze',
      stopBtn:          'Stop',
      clearBtn:         'Clear',
      exportBtn:        'Export',
      statusStopped:    'Collection paused',
      tipStopped:       'Data saved — download or analyze',
      rBack:            'Back',
      rFraud:   'Fraud Score',  rViews:   'Views',
      rEngage:  'Engagement',   rReact:   'Reactions',
      rSched:   'Schedule',     rContent: 'Content',
      sMean: 'Mean', sMedian: 'Median', sCv: 'CV', sVerdict: 'Verdict',
      sER: 'Eng. Rate', sShares: 'Shares', sDiversity: 'Types', sEntropy: 'Entropy',
      sMedia: 'Media', sForward: 'Forwarded', sLinks: 'Links',
      vSuspicious: '⚠️ Bot-like', vStable: '✅ Stable', vNormal: '🔄 Normal', vUnstable: '📊 Volatile',
      regCron: '🤖 Scheduled', regPlanned: '📅 Planned', regOrganic: '🌱 Organic', regUnknown: '❓',
      authOrganic: '✅ Organic', authNeutral: '➖ Neutral', authSuspicious: '⚠️ Suspicious',
      riskLow: 'LOW', riskMod: 'MODERATE', riskHigh: 'HIGH', riskCrit: 'CRITICAL',
      noSignals: '✅ No suspicious signals found',
      sPeak: 'Peak',
      sPosts: 'posts', sViewsSubs: 'Views/Subs',
      localBadge: 'LOCAL',
      notTelegram: 'Open Telegram Web first',
      refreshTelegram: 'Refresh Telegram and try again',
      startFailed: 'Could not start collection',
      openChannel: 'Make sure a channel is open',
      noData: 'No data collected yet',
      noPosts: 'Scroll the channel to collect some posts',
      postsSaved: count => `${count} posts saved`,
      exportSuccess: count => `${count} posts exported`,
      analyzed: count => `${count} posts analyzed locally`,
      reportExported: 'Report exported',
      exportFailed: 'Could not export data',
      noDataVerdict: 'No data',
    },
    ru: {
      steps: [
        {
          icon: '🌐',
          title: 'Откройте Telegram канал',
          desc: 'Перейдите на <span class="step-hl">web.telegram.org</span> и откройте нужный канал.'
        },
        {
          icon: '▶️',
          title: 'Начните сбор',
          desc: 'Нажмите <span class="step-hl">Начать сбор</span>, затем прокручивайте канал для загрузки постов.\n\nРекомендуется собрать <span class="step-hl">от 60 постов</span> для качественной аналитики.'
        },
        {
          icon: '📊',
          title: 'Сохраните или проанализируйте',
          desc: 'Нажмите <span class="step-hl">Завершить и скачать</span> для сохранения JSON или <span class="step-hl">Анализировать</span> для мгновенных графиков прямо здесь.'
        }
      ],
      next:             'Далее →',
      start:            'Начать! →',
      statusReady:      'Готов к сбору',
      statusCollecting: 'Сбор — прокрутите канал',
      statusProcessing: 'Обработка данных…',
      statusAnalyzing:  'Анализирую…',
      tipReady:         'Откройте канал Telegram, затем нажмите «Начать сбор»',
      tipCollecting:    'Прокручивайте канал, затем нажмите «Стоп»',
      tipDone:          'JSON сохранён в папке Загрузки',
      tipAnalyzed:      'Прокрутите вниз чтобы изучить результаты',
      analyzeError:     'Не удалось выполнить локальный анализ',
      counterLabel:     'Постов собрано',
      startBtn:         'Начать сбор',
      finishBtn:        'Завершить и скачать',
      analyzeBtn:       'Анализировать',
      stopBtn:          'Стоп',
      clearBtn:         'Очистить',
      exportBtn:        'Экспорт',
      statusStopped:    'Сбор приостановлен',
      tipStopped:       'Данные сохранены — скачайте или анализируйте',
      rBack:            'Назад',
      rFraud:   'Накрутка',       rViews:   'Просмотры',
      rEngage:  'Вовлечённость',  rReact:   'Реакции',
      rSched:   'Расписание',     rContent: 'Контент',
      sMean: 'Среднее', sMedian: 'Медиана', sCv: 'CV', sVerdict: 'Вердикт',
      sER: 'Eng. Rate', sShares: 'Репосты', sDiversity: 'Типов', sEntropy: 'Энтропия',
      sMedia: 'Медиа', sForward: 'Пересланных', sLinks: 'Ссылок',
      vSuspicious: '⚠️ Накрутка', vStable: '✅ Стабильно', vNormal: '🔄 Норма', vUnstable: '📊 Волатильно',
      regCron: '🤖 Автопостинг', regPlanned: '📅 Плановый', regOrganic: '🌱 Органичный', regUnknown: '❓',
      authOrganic: '✅ Органично', authNeutral: '➖ Нейтрально', authSuspicious: '⚠️ Подозрительно',
      riskLow: 'НИЗКИЙ', riskMod: 'УМЕРЕННЫЙ', riskHigh: 'ВЫСОКИЙ', riskCrit: 'КРИТИЧЕСКИЙ',
      noSignals: '✅ Подозрительных сигналов не обнаружено',
      sPeak: 'Пик',
      sPosts: 'постов', sViewsSubs: 'Охват',
      localBadge: 'ЛОКАЛЬНО',
      notTelegram: 'Сначала откройте Telegram Web',
      refreshTelegram: 'Обновите страницу Telegram и повторите',
      startFailed: 'Не удалось начать сбор',
      openChannel: 'Убедитесь, что открыт канал',
      noData: 'Данные ещё не собраны',
      noPosts: 'Прокрутите канал, чтобы собрать посты',
      postsSaved: count => `Сохранено постов: ${count}`,
      exportSuccess: count => `Экспортировано постов: ${count}`,
      analyzed: count => `Локально проанализировано постов: ${count}`,
      reportExported: 'Отчёт экспортирован',
      exportFailed: 'Не удалось экспортировать данные',
      noDataVerdict: 'Нет данных',
    }
  };

  function t(key) { return i18n[currentLang][key] ?? i18n.en[key]; }

  function applyLang() {
    document.documentElement.lang = currentLang;
    document.getElementById('startBtnText').textContent   = t('startBtn');
    document.getElementById('finishBtnText').textContent  = t('finishBtn');
    document.getElementById('analyzeBtnText').textContent = t('analyzeBtn');
    document.getElementById('stopBtnText').textContent    = t('stopBtn');
    document.getElementById('clearBtnText').textContent   = t('clearBtn');
    document.getElementById('exportBtnText').textContent  = t('exportBtn');
    document.getElementById('counterLabel').textContent   = t('counterLabel');
    document.getElementById('backBtnText').textContent    = t('rBack');
    document.getElementById('rLabelFraud').textContent    = t('rFraud');
    document.getElementById('rLabelViews').textContent    = t('rViews');
    document.getElementById('rLabelEngage').textContent   = t('rEngage');
    document.getElementById('rLabelReact').textContent    = t('rReact');
    document.getElementById('rLabelSched').textContent    = t('rSched');
    document.getElementById('rLabelContent').textContent  = t('rContent');
    mainLangBtn.textContent = currentLang.toUpperCase();
    localBadge.textContent = t('localBadge');

    if (collecting) {
      setStatus('active', t('statusCollecting'));
      tipText.textContent = t('tipCollecting');
    } else if (lastPostCount > 0) {
      setStatus('done', t('postsSaved')(lastPostCount));
      tipText.textContent = t('tipStopped');
    } else {
      setStatus('idle', t('statusReady'));
      tipText.textContent = t('tipReady');
    }

    if (lastSourceData && !resultsPanel.classList.contains('hidden')) {
      lastResult = TelegramAnalyzer.analyze(lastSourceData, currentLang);
    }
    if (lastResult && !resultsPanel.classList.contains('hidden')) {
      renderResults(lastResult);
    }
  }

  // ── Intro logic ────────────────────────────────────────────

  function buildDots(total, active) {
    stepDots.innerHTML = '';
    for (let i = 0; i < total; i++) {
      const d = document.createElement('div');
      d.className = 'step-dot' + (i === active ? ' active' : '');
      stepDots.appendChild(d);
    }
  }

  function showStep(index) {
    const steps = i18n[currentLang].steps;
    currentStep = index;

    stepCard.style.animation = 'none';
    stepIconEl.style.animation = 'none';
    void stepCard.offsetWidth;
    stepCard.style.removeProperty('animation');
    stepIconEl.style.removeProperty('animation');

    stepIconEl.textContent   = steps[index].icon;
    stepTitleEl.textContent  = steps[index].title;
    stepDescEl.innerHTML     = steps[index].desc;
    introNextBtn.textContent = index < steps.length - 1 ? t('next') : t('start');
    buildDots(steps.length, index);
  }

  function closeIntro() {
    introOverlay.classList.add('hiding');
    setTimeout(() => { introOverlay.style.display = 'none'; }, 400);
    localStorage.setItem('tg_intro_done', '1');
  }

  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentLang = btn.dataset.lang;
      localStorage.setItem('tg_lang', currentLang);
      langScreen.classList.add('hidden');
      stepsScreen.classList.remove('hidden');
      langSwitchBtn.classList.remove('hidden');
      showStep(0);
    });
  });

  langSwitchBtn.addEventListener('click', () => {
    stepsScreen.classList.add('hidden');
    langScreen.classList.remove('hidden');
    langSwitchBtn.classList.add('hidden');
  });

  mainLangBtn.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'ru' : 'en';
    localStorage.setItem('tg_lang', currentLang);
    applyLang();
  });

  introNextBtn.addEventListener('click', () => {
    const steps = i18n[currentLang].steps;
    if (currentStep < steps.length - 1) {
      showStep(currentStep + 1);
    } else {
      applyLang();
      closeIntro();
    }
  });

  currentLang = localStorage.getItem('tg_lang') || 'en';
  if (localStorage.getItem('tg_intro_done')) {
    introOverlay.style.display = 'none';
    applyLang();
  }

  // ── Restore state if collection was active ─────────────────
  (async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.url || !tab.url.includes('web.telegram.org')) return;
      currentTabId = tab.id;
      const res = await chrome.tabs.sendMessage(tab.id, { action: 'getStatus' });
      if (!res) return;
      if (res.isCollecting) {
        collecting = true;
        startBtn.disabled   = true;
        stopBtn.disabled    = false;
        finishBtn.disabled  = false;
        clearBtn.disabled   = true;
        if (res.postCount > 0) {
          analyzeBtn.disabled = false;
          setCounter(res.postCount);
        }
        setStatus('active', t('statusCollecting'));
        setCollectingState(true);
        tipText.textContent = t('tipCollecting');
        startPolling(tab.id);
      } else if (res.postCount > 0) {
        lastPostCount = res.postCount;
        setCounter(res.postCount);
        finishBtn.disabled  = false;
        analyzeBtn.disabled = false;
        clearBtn.disabled   = false;
        setStatus('done', t('statusStopped'));
        tipText.textContent = t('tipStopped');
      }
    } catch { /* tab not ready or not on telegram */ }
  })();

  // ── Helpers ────────────────────────────────────────────────

  function addRipple(btn, e) {
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ripple = document.createElement('span');
    ripple.className = 'ripple';
    ripple.style.cssText =
      `width:${size}px;height:${size}px;left:${e.clientX-rect.left-size/2}px;top:${e.clientY-rect.top-size/2}px`;
    btn.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }

  function setStatus(type, text) {
    statusBadge.className = 'status-badge ' + type;
    statusMsg.textContent = text;
    statusDot.className   = 'dot' + (type === 'active' ? ' pulse' : '');
  }

  function showToast(type, text, duration = 3000) {
    toastIcon.textContent = type === 'success' ? '✓' : '✕';
    toastMsg.textContent  = text;
    toast.className = 'toast ' + (type === 'success' ? 'success' : 'error-t');
    requestAnimationFrame(() => requestAnimationFrame(() => toast.classList.add('show')));
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
  }

  function setCounter(value, animated = false) {
    postCount.textContent = value;
    if (animated) { postCount.classList.remove('visible'); void postCount.offsetWidth; }
    postCount.classList.add('visible');
  }

  function setCollectingState(active) {
    if (active) {
      cardWrapper.classList.add('active-glow');
      counterDisplay.classList.add('lit');
      waveContainer.classList.add('visible');
      counterIcon.style.display = 'none';
      progressBar.classList.add('visible');
      progressFill.classList.add('indeterminate');
    } else {
      cardWrapper.classList.remove('active-glow');
      counterDisplay.classList.remove('lit');
      waveContainer.classList.remove('visible');
      counterIcon.style.display = '';
      progressBar.classList.remove('visible');
      progressFill.classList.remove('indeterminate');
    }
  }

  function setDownloadingState(active) {
    finishBtn.disabled     = active;
    finishIcon.textContent = active ? '⟳' : '✓';
    finishBtn.classList.toggle('collecting', active);
  }

  // ── Results panel show/hide ────────────────────────────────

  function showResultsPanel() {
    btnGroup.classList.add('hidden');
    btnRow2.classList.add('hidden');
    mainDivider.classList.add('hidden');
    tipText.classList.add('hidden');
    counterDisplay.classList.add('hidden');
    progressBar.classList.add('hidden');
    resultsPanel.classList.remove('hidden');
  }

  function hideResultsPanel() {
    resultsPanel.classList.add('hidden');
    btnGroup.classList.remove('hidden');
    btnRow2.classList.remove('hidden');
    mainDivider.classList.remove('hidden');
    tipText.classList.remove('hidden');
    counterDisplay.classList.remove('hidden');
  }

  // ── Tooltip data ───────────────────────────────────────────

  const tips = {
    en: {
      cardFraud:    { title: 'Fraud Score Card',             desc: 'Overall assessment of artificial metric inflation. Combines view consistency, engagement anomalies and posting schedule.',                               affect: 'Use this as the primary signal when deciding on ad placement.' },
      fraudScore:   { title: 'Fraud Score (0–100)',          desc: 'Probability of bot-inflated audience. Calculated from CV, engagement patterns and time regularity.',                                                    affect: 'Above 60 → risky. Above 80 → do not buy ads without extra verification.' },
      fraudRisk:    { title: 'Risk Level',                   desc: 'Summary category derived from the Fraud Score: LOW / MODERATE / HIGH / CRITICAL.',                                                                       affect: 'HIGH or CRITICAL → channel likely uses purchased views or reactions.' },
      viewsMean:    { title: 'Mean Views',                   desc: 'Arithmetic average of views across all collected posts.',                                                                                                affect: 'High mean with low engagement rate (< 1%) hints at purchased views.' },
      viewsMedian:  { title: 'Median Views',                 desc: 'The middle value — 50% of posts got more, 50% got fewer. More robust than mean against viral outliers.',                                                affect: 'Large mean–median gap signals viral spikes or artificially boosted posts.' },
      viewsCV:      { title: 'CV — Coefficient of Variation', desc: 'Standard deviation ÷ mean. Below 0.5 = stable; 0.5–1.0 = normal; above 1.0 = volatile.',                                                            affect: 'Low CV on a strict cron-like schedule is a strong bot signal.' },
      viewsVerdict: { title: 'Views Verdict',                desc: 'Automated classification of the views distribution pattern.',                                                                                            affect: 'Stable = likely organic. Suspicious = statistical anomaly detected.' },
      engRate:      { title: 'Engagement Rate',              desc: 'Total reactions ÷ total views (%). Market norm: 1–5%.',                                                                                                  affect: 'Above 10% may indicate fake reactions. Below 0.3% = low audience loyalty.' },
      shareRate:    { title: 'Share Rate',                   desc: 'Shares ÷ total views (%). Shows viral potential of content.',                                                                                            affect: 'Healthy channels: 0.5–3%. Very low shares with high views = suspicious.' },
      diversity:    { title: 'Reaction Diversity',           desc: 'Number of distinct reaction types used across all posts.',                                                                                               affect: 'Only 1–2 types on the whole channel often signals bot-generated reactions.' },
      viewsSubs:    { title: 'Views / Subscribers',          desc: 'Average post views as % of subscriber count. Measures real organic reach.',                                                                              affect: 'Above 80% = excellent reach. Below 10% = inactive or purchased audience.' },
      entropy:      { title: 'Reaction Entropy',             desc: 'Shannon entropy of reaction distribution — how evenly spread reactions are across types.',                                                              affect: 'Very low entropy = one dominant reaction type, typical of bots.' },
      reactions:    { title: 'Top Reactions',                desc: 'Top 5 reaction types ranked by their share of total reactions.',                                                                                         affect: 'Unnatural dominance of a single reaction is a common bot activity pattern.' },
      authLabel:    { title: 'Reaction Authenticity',        desc: 'Pattern-based verdict on whether reactions come from real users.',                                                                                       affect: 'Suspicious → reactions likely purchased or bot-generated.' },
      regularity:   { title: 'Posting Regularity',           desc: 'How predictable the posting schedule is: cron-like (exact intervals) → planned → organic → unknown.',                                                  affect: 'Cron-like at millisecond precision strongly suggests automated bot posting.' },
      peakHours:    { title: 'Peak Hours',                   desc: 'Hours of the day with the most posts published.',                                                                                                        affect: 'Peaks at 3–6 AM local time may indicate foreign management or automation.' },
      hourChart:    { title: 'Hourly Distribution',          desc: 'Posts published per hour of the day (0–23h). Highlighted bars are peak hours.',                                                                         affect: 'Perfectly even distribution across all 24h is a bot posting pattern.' },
      mediaPct:     { title: 'Media Posts',                  desc: 'Share of posts containing images or video.',                                                                                                             affect: 'Visual content typically drives 3–5× higher engagement than text-only.' },
      forwardPct:   { title: 'Forwarded Posts',              desc: 'Share of posts forwarded from other channels.',                                                                                                          affect: 'High forward % = aggregator with little original content.' },
      linksPct:     { title: 'Posts with Links',             desc: 'Share of posts containing external links.',                                                                                                              affect: 'Very high links % (> 60%) is typical of spam or traffic-arbitrage channels.' },
    },
    ru: {
      cardFraud:    { title: 'Карточка Fraud Score',         desc: 'Общая оценка искусственной накрутки метрик. Объединяет стабильность просмотров, аномалии вовлечённости и регулярность постинга.',                    affect: 'Используйте как основной сигнал при принятии решения о размещении рекламы.' },
      fraudScore:   { title: 'Fraud Score (0–100)',          desc: 'Вероятность накрутки аудитории ботами. Рассчитывается из CV, паттернов вовлечённости и временной регулярности.',                                       affect: 'Выше 60 → рискованно. Выше 80 → не покупайте рекламу без дополнительной проверки.' },
      fraudRisk:    { title: 'Уровень риска',                desc: 'Итоговая категория на основе Fraud Score: НИЗКИЙ / УМЕРЕННЫЙ / ВЫСОКИЙ / КРИТИЧЕСКИЙ.',                                                                affect: 'ВЫСОКИЙ или КРИТИЧЕСКИЙ → канал, вероятно, использует накрученные метрики.' },
      viewsMean:    { title: 'Среднее просмотров',           desc: 'Среднее арифметическое просмотров по всем собранным постам.',                                                                                           affect: 'Высокое среднее при ER < 1% намекает на накрученные просмотры.' },
      viewsMedian:  { title: 'Медиана просмотров',           desc: '50% постов набрали больше, 50% — меньше. Устойчива к вирусным выбросам.',                                                                              affect: 'Большой разрыв среднее–медиана = редкие вирусные посты или накрутки.' },
      viewsCV:      { title: 'CV — коэффициент вариации',   desc: 'Стандартное отклонение ÷ среднее. < 0.5 = стабильно, 0.5–1.0 = норма, > 1.0 = волатильно.',                                                           affect: 'Низкий CV при cron-like расписании = сильный признак накрутки ботами.' },
      viewsVerdict: { title: 'Вердикт по просмотрам',       desc: 'Автоматическая классификация паттерна распределения просмотров.',                                                                                        affect: 'Стабильно = органика. Подозрительно = обнаружена статистическая аномалия.' },
      engRate:      { title: 'Engagement Rate',              desc: 'Сумма реакций ÷ просмотры (%). Рыночная норма: 1–5%.',                                                                                                  affect: 'Выше 10% → возможны фейковые реакции. Ниже 0.3% = низкая лояльность.' },
      shareRate:    { title: 'Репосты',                      desc: 'Репосты ÷ просмотры (%). Показывает вирусный потенциал контента.',                                                                                      affect: 'Норма: 0.5–3%. Мало репостов при высоких просмотрах — подозрительно.' },
      diversity:    { title: 'Разнообразие реакций',         desc: 'Количество различных типов реакций, встречающихся в постах канала.',                                                                                    affect: '1–2 типа на весь канал — типичный признак ботовых реакций.' },
      viewsSubs:    { title: 'Просмотры / Подписчики',       desc: 'Средние просмотры поста в % от числа подписчиков. Измеряет реальный охват.',                                                                           affect: '> 80% = отличный охват. < 10% = покупная или неактивная аудитория.' },
      entropy:      { title: 'Энтропия реакций',             desc: 'Энтропия Шеннона распределения реакций — насколько равномерно они распределены.',                                                                      affect: 'Очень низкая энтропия = одна доминирующая реакция, характерно для ботов.' },
      reactions:    { title: 'Топ реакций',                  desc: 'Топ-5 типов реакций по доле от общего числа.',                                                                                                           affect: 'Неестественное доминирование одного типа — распространённый паттерн ботов.' },
      authLabel:    { title: 'Аутентичность реакций',        desc: 'Оценка на основе паттернов — исходят ли реакции от реальных пользователей.',                                                                           affect: 'Подозрительно → реакции, вероятно, куплены или сгенерированы ботами.' },
      regularity:   { title: 'Регулярность постинга',        desc: 'Предсказуемость расписания: cron-like (точные интервалы) → плановый → органичный → неизвестный.',                                                     affect: 'Cron-like с точностью до секунды = автоматизированный бот-постинг.' },
      peakHours:    { title: 'Пиковые часы',                 desc: 'Часы суток с наибольшим количеством опубликованных постов.',                                                                                            affect: 'Пики в 3–6 ночи могут указывать на иностранное управление или автоматизацию.' },
      hourChart:    { title: 'Распределение по часам',       desc: 'Число постов по каждому часу суток (0–23). Пиковые столбцы выделены цветом.',                                                                          affect: 'Равномерное распределение по всем 24 часам — признак бот-постинга.' },
      mediaPct:     { title: 'Медиа-посты',                  desc: 'Доля постов, содержащих изображения или видео.',                                                                                                         affect: 'Визуальный контент обычно даёт в 3–5 раз больший охват, чем текстовые.' },
      forwardPct:   { title: 'Пересланные посты',            desc: 'Доля постов, пересланных из других каналов.',                                                                                                            affect: 'Высокий % = агрегатор с минимумом оригинального контента.' },
      linksPct:     { title: 'Посты со ссылками',            desc: 'Доля постов, содержащих внешние ссылки.',                                                                                                               affect: 'Очень высокий % (> 60%) типичен для спам-каналов или арбитража трафика.' },
    },
  };

  // ── renderResults ──────────────────────────────────────────

  function renderResults(r) {
    lastResult = r;

    // ── Channel header ──
    const meta = r.metadata || {};
    document.getElementById('rChannelName').textContent = meta.channelName || '—';
    const metaParts = [];
    if (meta.subscribers) metaParts.push(meta.subscribers);
    metaParts.push(`${r.total_posts} ${t('sPosts')}`);
    document.getElementById('rChannelMeta').textContent = metaParts.join(' · ');

    const fraud = r.fraud;
    const views = r.views;
    const eng   = r.engagement;
    const react = r.reactions;
    const sched = r.schedule;
    const cont  = r.content;

    // ── Fraud score ring ──
    const riskColorMap = {
      'низкий': '#00d4aa', 'умеренный': '#f0b429',
      'высокий': '#ff6b35', 'критический': '#ff3b3b'
    };
    const riskLabelMap = {
      'низкий':      t('riskLow'),
      'умеренный':   t('riskMod'),
      'высокий':     t('riskHigh'),
      'критический': t('riskCrit'),
    };
    const riskColor = riskColorMap[fraud.risk] || '#00d4aa';
    const deg = Math.round(Math.min(fraud.score, 100) * 3.6);

    document.getElementById('fraudRing').style.background =
      `conic-gradient(${riskColor} ${deg}deg, rgba(255,255,255,0.08) ${deg}deg)`;
    const scoreEl = document.getElementById('fraudScoreNum');
    scoreEl.textContent = fraud.score;
    scoreEl.style.color = riskColor;

    const riskLabelEl = document.getElementById('fraudRiskLabel');
    riskLabelEl.textContent = `${fraud.risk_emoji} ${riskLabelMap[fraud.risk] || fraud.risk.toUpperCase()}`;
    riskLabelEl.style.color = riskColor;

    const fill = document.getElementById('fraudProgFill');
    fill.style.width      = fraud.score + '%';
    fill.style.background = riskColor;

    document.getElementById('fraudFactors').innerHTML = fraud.factors.length
      ? fraud.factors.map(f => `<div class="fraud-factor">• ${f}</div>`).join('')
      : `<div class="fraud-factor" style="color:#00d4aa">${t('noSignals')}</div>`;

    // ── Views ──
    const cvColorMap = { suspicious: '#f0b429', stable: '#00d4aa', normal: '#4a9eff', unstable: '#ff6b35' };
    const cvLabelMap = {
      suspicious: t('vSuspicious'), stable: t('vStable'),
      normal: t('vNormal'), unstable: t('vUnstable'),
    };
    const cvColor = cvColorMap[views.verdict] || '#4a9eff';
    const cvLabel = views.verdict === 'no-data'
      ? t('noDataVerdict')
      : (cvLabelMap[views.verdict] || views.verdict);

    document.getElementById('viewsGrid').innerHTML = `
      <div class="stat-item">
        <div class="stat-label" data-tip="viewsMean">${t('sMean')}</div>
        <div class="stat-value">${views.mean.toLocaleString()}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label" data-tip="viewsMedian">${t('sMedian')}</div>
        <div class="stat-value">${views.median.toLocaleString()}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label" data-tip="viewsCV">${t('sCv')}</div>
        <div class="stat-value">${views.cv}</div>
      </div>
      <div class="stat-item">
        <div class="stat-label" data-tip="viewsVerdict">${t('sVerdict')}</div>
        <span class="stat-badge" style="background:${cvColor}22;color:${cvColor}">${cvLabel}</span>
      </div>
    `;

    // ── Engagement ──
    const viewsSubsItem = eng.views_to_subs_pct != null
      ? `<div class="stat-item">
           <div class="stat-label" data-tip="viewsSubs">${t('sViewsSubs')}</div>
           <div class="stat-value">${eng.views_to_subs_pct}%</div>
         </div>`
      : `<div class="stat-item">
           <div class="stat-label" data-tip="entropy">${t('sEntropy')}</div>
           <div class="stat-value">${react.avg_entropy}</div>
         </div>`;

    document.getElementById('engageGrid').innerHTML = `
      <div class="stat-item">
        <div class="stat-label" data-tip="engRate">${t('sER')}</div>
        <div class="stat-value">${eng.engagement_rate}%</div>
      </div>
      <div class="stat-item">
        <div class="stat-label" data-tip="shareRate">${t('sShares')}</div>
        <div class="stat-value">${eng.share_rate}%</div>
      </div>
      <div class="stat-item">
        <div class="stat-label" data-tip="diversity">${t('sDiversity')}</div>
        <div class="stat-value">${react.diversity}</div>
      </div>
      ${viewsSubsItem}
    `;

    // ── Reactions bars ──
    const authColorMap = { organic: '#00d4aa', neutral: '#f0b429', suspicious: '#ff6b35' };
    const authLabelMap = {
      organic: t('authOrganic'), neutral: t('authNeutral'), suspicious: t('authSuspicious'),
    };
    const authColor = authColorMap[react.authenticity] || '#4a9eff';
    const authLabel = react.authenticity === 'no-data'
      ? t('noDataVerdict')
      : (authLabelMap[react.authenticity] || react.authenticity);

    document.getElementById('reactionsBars').innerHTML =
      react.top5.map(rx => `
        <div class="react-row">
          <div class="react-emoji">${rx.symbol || '●'}</div>
          <div class="react-bar-wrap">
            <div class="react-bar-fill" style="width:${rx.pct}%"></div>
          </div>
          <div class="react-pct">${rx.pct}%</div>
        </div>
      `).join('') +
      `<div style="font-size:10.5px;color:${authColor};margin-top:6px" data-tip="authLabel">${authLabel}</div>`;

    // ── Schedule ──
    const regLabelMap = {
      'cron-like': t('regCron'), scheduled: t('regPlanned'),
      organic: t('regOrganic'), unknown: t('regUnknown'),
    };
    const peaks = sched.peak_hours.join(', ') || '—';
    document.getElementById('schedMeta').innerHTML =
      `<span data-tip="regularity">${regLabelMap[sched.regularity] || sched.regularity}</span>` +
      `<span style="color:rgba(255,255,255,0.3);margin:0 6px">·</span>` +
      `<span data-tip="peakHours">${t('sPeak')}: ${peaks}</span>`;

    const hourDist = sched.hour_distribution || {};
    const maxCount = Math.max(...Object.values(hourDist), 1);
    const peakNums = sched.peak_hours.map(h => parseInt(h));

    document.getElementById('hourChart').innerHTML = Array.from({ length: 24 }, (_, h) => {
      const count  = hourDist[h] || 0;
      const hPct   = Math.round((count / maxCount) * 100);
      const isPeak = peakNums.includes(h);
      return `<div class="h-bar-wrap" title="${h}:00 — ${count}" data-tip="hourChart">
        <div class="h-bar${isPeak ? ' peak' : ''}" style="height:${Math.max(hPct, count > 0 ? 5 : 0)}%"></div>
      </div>`;
    }).join('');

    // ── Content bars ──
    document.getElementById('contentBars').innerHTML = [
      { label: t('sMedia'),   pct: cont.media_pct,    tip: 'mediaPct'   },
      { label: t('sForward'), pct: cont.forwarded_pct, tip: 'forwardPct' },
      { label: t('sLinks'),   pct: cont.links_pct,     tip: 'linksPct'   },
    ].map(item => `
      <div class="content-row">
        <div class="content-label" data-tip="${item.tip}">${item.label}</div>
        <div class="content-bar-wrap">
          <div class="content-bar-fill" style="width:${item.pct}%"></div>
        </div>
        <div class="content-pct">${item.pct}%</div>
      </div>
    `).join('');
  }

  // ── Tooltip ────────────────────────────────────────────────

  resultsPanel.addEventListener('mouseover', e => {
    const el = e.target.closest('[data-tip]');
    if (!el) return;
    const tip = (tips[currentLang] || tips.en)[el.dataset.tip] || tips.en[el.dataset.tip];
    if (!tip) return;
    tipTitle.textContent  = tip.title;
    tipDesc.textContent   = tip.desc;
    tipAffect.textContent = tip.affect;
    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const tipTop = spaceBelow > 145 ? rect.bottom + 6 : Math.max(4, rect.top - 150);
    tipBox.style.top  = tipTop + 'px';
    tipBox.style.left = Math.max(4, Math.min(rect.left, window.innerWidth - 222)) + 'px';
    tipBox.classList.add('visible');
  });
  resultsPanel.addEventListener('mouseleave', () => tipBox.classList.remove('visible'));
  resultsPanel.addEventListener('scroll',     () => tipBox.classList.remove('visible'));

  // ── Export report ──────────────────────────────────────────

  async function generateReport(r) {
    const meta  = r.metadata || {};
    const fraud = r.fraud, views = r.views, eng = r.engagement;
    const react = r.reactions, sched = r.schedule, cont = r.content;
    const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

    const riskColors = { 'низкий':'#00d4aa','умеренный':'#f0b429','высокий':'#ff6b35','критический':'#ff3b3b' };
    const cvColors   = { suspicious:'#f0b429', stable:'#00d4aa', normal:'#4a9eff', unstable:'#ff6b35' };
    const authColors = { organic:'#00d4aa', neutral:'#f0b429', suspicious:'#ff6b35' };
    const riskLabelMap2 = { 'низкий':t('riskLow'),'умеренный':t('riskMod'),'высокий':t('riskHigh'),'критический':t('riskCrit') };
    const cvLabelMap2   = { suspicious:t('vSuspicious'),stable:t('vStable'),normal:t('vNormal'),unstable:t('vUnstable') };
    const regLabelMap2  = { 'cron-like':t('regCron'),scheduled:t('regPlanned'),organic:t('regOrganic'),unknown:t('regUnknown') };
    const authLabelMap2 = { organic:t('authOrganic'),neutral:t('authNeutral'),suspicious:t('authSuspicious'),'no-data':t('noDataVerdict') };

    const riskColor = riskColors[fraud.risk] || '#00d4aa';
    const cvColor   = cvColors[views.verdict] || '#4a9eff';
    const authColor = authColors[react.authenticity] || '#4a9eff';
    const deg = Math.round(Math.min(fraud.score, 100) * 3.6);

    const hourDist2 = sched.hour_distribution || {};
    const maxCount2 = Math.max(...Object.values(hourDist2), 1);
    const peakNums2 = sched.peak_hours.map(h => parseInt(h));
    const hourBars  = Array.from({ length: 24 }, (_, h) => {
      const cnt = hourDist2[h] || 0;
      const hPct = Math.round((cnt / maxCount2) * 100);
      const pk   = peakNums2.includes(h);
      return `<div class="hb-wrap" title="${h}:00 — ${cnt}"><div class="hb${pk?' pk':''}" style="height:${Math.max(hPct,cnt>0?5:0)}%"></div></div>`;
    }).join('');

    const rxBars = react.top5.map(rx =>
      `<div class="rb-row"><div class="rb-emoji">${rx.symbol||'●'}</div><div class="rb-wrap"><div class="rb-fill" style="width:${rx.pct}%"></div></div><div class="rb-pct">${rx.pct}%</div></div>`
    ).join('');

    const ctBars = [
      { label:t('sMedia'),   pct:cont.media_pct },
      { label:t('sForward'), pct:cont.forwarded_pct },
      { label:t('sLinks'),   pct:cont.links_pct },
    ].map(item =>
      `<div class="cb-row"><div class="cb-lbl">${esc(item.label)}</div><div class="cb-track"><div class="cb-fill" style="width:${item.pct}%"></div></div><div class="cb-pct">${item.pct}%</div></div>`
    ).join('');

    const ffHtml = fraud.factors.length
      ? fraud.factors.map(f=>`<div class="ff">• ${esc(f)}</div>`).join('')
      : `<div class="ff ok">${t('noSignals')}</div>`;

    const vsRow = eng.views_to_subs_pct != null
      ? `<div class="sg-item"><div class="sg-lbl">${t('sViewsSubs')}</div><div class="sg-val">${eng.views_to_subs_pct}%</div></div>`
      : `<div class="sg-item"><div class="sg-lbl">${t('sEntropy')}</div><div class="sg-val">${react.avg_entropy}</div></div>`;

    const peaks2 = sched.peak_hours.join(', ') || '—';
    const metaParts2 = [];
    if (meta.subscribers) metaParts2.push(`<span>👥 ${esc(meta.subscribers)}</span>`);
    metaParts2.push(`<span>📊 ${r.total_posts} ${t('sPosts')}</span>`);
    metaParts2.push(`<span>📅 ${new Date().toLocaleString()}</span>`);

    let embeddedFont = '';
    try {
      const fontResponse = await fetch(chrome.runtime.getURL('assets/fonts/PixelifySans-Variable.ttf'));
      const fontBytes = new Uint8Array(await fontResponse.arrayBuffer());
      let binary = '';
      for (let offset = 0; offset < fontBytes.length; offset += 8192) {
        binary += String.fromCharCode(...fontBytes.subarray(offset, offset + 8192));
      }
      embeddedFont = `@font-face{font-family:'Pixelify Sans';src:url(data:font/truetype;base64,${btoa(binary)}) format('truetype');font-style:normal;font-weight:400 700}`;
    } catch (error) {
      console.warn('Could not embed report font:', error);
    }

    return `<!DOCTYPE html>
<html lang="${currentLang}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Telegram Analytics — ${esc(meta.channelName||'Channel')}</title>
<style>
${embeddedFont}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0d0d16;color:#e8e8e8;font-family:'Bahnschrift','Trebuchet MS','Segoe UI',Arial,sans-serif;padding:28px 16px;font-weight:500}
.wrap{max-width:780px;margin:0 auto}
.hdr{text-align:center;padding:24px 20px 20px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;margin-bottom:16px}
.hdr-logo{font-family:'Pixelify Sans',monospace;font-size:12px;font-weight:700;color:rgba(255,255,255,0.38);letter-spacing:1px;text-transform:uppercase;margin-bottom:8px}
.hdr-ch{font-family:'Pixelify Sans',monospace;font-size:25px;font-weight:700;margin-bottom:10px}
.hdr-meta{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}
.hdr-meta span{background:rgba(255,255,255,0.07);padding:4px 10px;border-radius:6px;font-size:12px;font-weight:600;color:rgba(255,255,255,0.55)}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.card{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:9px;padding:16px 18px}
.full{grid-column:1/-1}
.ch{font-family:'Pixelify Sans',monospace;font-size:12px;font-weight:700;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:.7px;margin-bottom:14px}
.fr-body{display:flex;align-items:center;gap:16px;margin-bottom:10px}
.fr-ring{width:80px;height:80px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:conic-gradient(${riskColor} ${deg}deg,#1e1e32 ${deg}deg)}
.fr-inner{width:60px;height:60px;border-radius:50%;background:#0d0d16;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:800;color:${riskColor}}
.fr-info{flex:1}
.fr-risk{font-size:15px;font-weight:700;color:${riskColor};margin-bottom:8px}
.fr-pt{height:6px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden}
.fr-pf{height:100%;width:${fraud.score}%;background:${riskColor};border-radius:3px}
.ff{font-size:12px;font-weight:500;color:rgba(255,255,255,0.5);padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.05);line-height:1.5}
.ff:last-child{border:none}.ff.ok{color:#00d4aa}
.sg{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.sg-item{background:rgba(255,255,255,0.03);border-radius:5px;padding:9px 11px}
.sg-lbl{font-size:10.5px;font-weight:600;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:.5px;margin-bottom:3px}
.sg-val{font-size:17px;font-weight:700}
.sg-badge{font-size:11px;padding:3px 7px;border-radius:4px;display:inline-block;margin-top:3px;font-weight:700;background:${cvColor}22;color:${cvColor}}
.rb-row{display:flex;align-items:center;gap:8px;margin-bottom:7px}
.rb-emoji{font-size:14px;width:22px;text-align:center;flex-shrink:0}
.rb-wrap{flex:1;height:8px;background:rgba(255,255,255,0.07);border-radius:4px;overflow:hidden}
.rb-fill{height:100%;border-radius:4px;background:linear-gradient(90deg,#4a9eff,#9b59b6)}
.rb-pct{font-size:10px;color:rgba(255,255,255,0.4);width:32px;text-align:right;flex-shrink:0}
.auth{font-size:10.5px;margin-top:8px;color:${authColor}}
.sm{font-size:11px;color:rgba(255,255,255,0.48);margin-bottom:10px}
.hchart{display:flex;align-items:flex-end;gap:2px;height:64px;margin-top:4px}
.hb-wrap{flex:1;display:flex;flex-direction:column;align-items:center;height:100%;justify-content:flex-end}
.hb{width:100%;border-radius:2px 2px 0 0;background:rgba(0,212,170,0.45);min-height:2px}
.hb.pk{background:linear-gradient(to top,#00d4aa,#00a8ff)}
.cb-row{display:flex;align-items:center;gap:9px;margin-bottom:7px}
.cb-lbl{font-size:10.5px;color:rgba(255,255,255,0.45);width:90px;flex-shrink:0}
.cb-track{flex:1;height:6px;background:rgba(255,255,255,0.07);border-radius:3px;overflow:hidden}
.cb-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,#4a9eff,#7c3aed)}
.cb-pct{font-size:10px;color:rgba(255,255,255,0.45);width:32px;text-align:right}
footer{text-align:center;margin-top:22px;font-size:10px;color:rgba(255,255,255,0.18);line-height:1.8}
@media(max-width:520px){.grid{grid-template-columns:1fr}}
</style></head>
<body><div class="wrap">
<div class="hdr">
  <div class="hdr-logo">Telegram Collector · Analytics Report</div>
  <div class="hdr-ch">${esc(meta.channelName||'—')}</div>
  <div class="hdr-meta">${metaParts2.join('')}</div>
</div>
<div class="grid">
<div class="card">
  <div class="ch">🚨 ${t('rFraud')}</div>
  <div class="fr-body">
    <div class="fr-ring"><div class="fr-inner">${fraud.score}</div></div>
    <div class="fr-info">
      <div class="fr-risk">${fraud.risk_emoji} ${riskLabelMap2[fraud.risk]||fraud.risk.toUpperCase()}</div>
      <div class="fr-pt"><div class="fr-pf"></div></div>
    </div>
  </div>
  <div>${ffHtml}</div>
</div>
<div class="card">
  <div class="ch">📈 ${t('rViews')}</div>
  <div class="sg">
    <div class="sg-item"><div class="sg-lbl">${t('sMean')}</div><div class="sg-val">${views.mean.toLocaleString()}</div></div>
    <div class="sg-item"><div class="sg-lbl">${t('sMedian')}</div><div class="sg-val">${views.median.toLocaleString()}</div></div>
    <div class="sg-item"><div class="sg-lbl">${t('sCv')}</div><div class="sg-val">${views.cv}</div></div>
    <div class="sg-item"><div class="sg-lbl">${t('sVerdict')}</div><span class="sg-badge">${cvLabelMap2[views.verdict]||views.verdict}</span></div>
  </div>
</div>
<div class="card">
  <div class="ch">💬 ${t('rEngage')}</div>
  <div class="sg">
    <div class="sg-item"><div class="sg-lbl">${t('sER')}</div><div class="sg-val">${eng.engagement_rate}%</div></div>
    <div class="sg-item"><div class="sg-lbl">${t('sShares')}</div><div class="sg-val">${eng.share_rate}%</div></div>
    <div class="sg-item"><div class="sg-lbl">${t('sDiversity')}</div><div class="sg-val">${react.diversity}</div></div>
    ${vsRow}
  </div>
</div>
<div class="card">
  <div class="ch">😊 ${t('rReact')}</div>
  ${rxBars}
  <div class="auth">${authLabelMap2[react.authenticity]||react.authenticity}</div>
</div>
<div class="card full">
  <div class="ch">🕐 ${t('rSched')}</div>
  <div class="sm"><span>${regLabelMap2[sched.regularity]||sched.regularity}</span><span style="color:rgba(255,255,255,0.3);margin:0 8px">·</span><span>${t('sPeak')}: ${peaks2}</span></div>
  <div class="hchart">${hourBars}</div>
</div>
<div class="card full">
  <div class="ch">📋 ${t('rContent')}</div>
  ${ctBars}
</div>
</div>
<footer>Generated by <strong>Telegram Collector</strong> · ${esc(meta.channelName||'')} · ${new Date().toLocaleString()}</footer>
</div></body></html>`;
  }

  exportBtn.addEventListener('click', async () => {
    if (!lastResult) return;
    const html      = await generateReport(lastResult);
    const channelId = lastResult.metadata?.channelId || 'channel';
    const filename  = `tg_report_${channelId}_${Date.now()}.html`;
    chrome.runtime.sendMessage({ type: 'download_report', html, filename });
    showToast('success', t('reportExported'), 3000);
  });

  // ── Polling ────────────────────────────────────────────────

  function startPolling(tabId) {
    stopPolling();
    pollInterval = setInterval(async () => {
      try {
        const res = await chrome.tabs.sendMessage(tabId, { action: 'getCount' });
        if (res && res.postCount !== undefined) {
          setCounter(res.postCount);
          if (res.postCount > 0) analyzeBtn.disabled = false;
        }
      } catch { stopPolling(); }
    }, 1500);
  }

  function stopPolling() {
    if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
  }

  // ── Tab helpers ────────────────────────────────────────────

  async function getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  }

  async function sendToContent(action) {
    const tab = await getCurrentTab();
    if (!tab.url || !tab.url.includes('web.telegram.org')) {
      setStatus('error', t('notTelegram'));
      showToast('error', t('notTelegram'));
      return false;
    }
    currentTabId = tab.id;
    try {
      return await chrome.tabs.sendMessage(tab.id, { action });
    } catch {
      setStatus('error', t('refreshTelegram'));
      showToast('error', t('refreshTelegram'));
      return false;
    }
  }

  // ── Button handlers ────────────────────────────────────────

  startBtn.addEventListener('click', async (e) => {
    addRipple(startBtn, e);
    const res = await sendToContent('startCollection');
    if (res && res.status === 'started') {
      collecting = true;
      startBtn.disabled   = true;
      stopBtn.disabled    = false;
      finishBtn.disabled  = false;
      analyzeBtn.disabled = true;
      clearBtn.disabled   = true;
      setStatus('active', t('statusCollecting'));
      setCollectingState(true);
      setCounter(0);
      lastResult = null;
      lastSourceData = null;
      tipText.textContent = t('tipCollecting');
      startPolling(currentTabId);
    } else if (res !== false) {
      setStatus('error', t('startFailed'));
      showToast('error', t('openChannel'));
    }
  });

  stopBtn.addEventListener('click', async (e) => {
    addRipple(stopBtn, e);
    await sendToContent('stopCollection');
    collecting = false;
    stopPolling();
    const count = parseInt(postCount.textContent, 10) || 0;
    startBtn.disabled   = false;
    stopBtn.disabled    = true;
    finishBtn.disabled  = count === 0;
    analyzeBtn.disabled = count === 0;
    clearBtn.disabled   = count === 0;
    setCollectingState(false);
    setStatus('done', t('statusStopped'));
    tipText.textContent = t('tipStopped');
  });

  clearBtn.addEventListener('click', async (e) => {
    addRipple(clearBtn, e);
    await sendToContent('clearCollection');
    collecting = false;
    stopPolling();
    startBtn.disabled   = false;
    stopBtn.disabled    = true;
    finishBtn.disabled  = true;
    analyzeBtn.disabled = true;
    clearBtn.disabled   = true;
    setCollectingState(false);
    setCounter(0);
    counterIcon.textContent = '📊';
    lastPostCount = 0;
    lastResult = null;
    lastSourceData = null;
    setStatus('idle', t('statusReady'));
    tipText.textContent = t('tipReady');
  });

  finishBtn.addEventListener('click', async (e) => {
    addRipple(finishBtn, e);
    stopPolling();
    setStatus('active', t('statusProcessing'));
    setDownloadingState(true);

    const res = await sendToContent('finishAndDownload');

    if (res && res.status === 'finished') {
      collecting = false;
      setCollectingState(false);
      setDownloadingState(false);
      startBtn.disabled = false;
      stopBtn.disabled  = true;
      clearBtn.disabled = false;
      lastPostCount     = res.postCount;
      setCounter(res.postCount, true);
      counterIcon.textContent = '✅';
      setStatus('done', t('postsSaved')(res.postCount));
      tipText.textContent = t('tipDone');
      showToast('success', t('exportSuccess')(res.postCount), 4000);
    } else {
      setDownloadingState(false);
      setStatus('error', t('exportFailed'));
      showToast('error', t('exportFailed'));
      if (collecting) startPolling(currentTabId);
    }
  });

  analyzeBtn.addEventListener('click', async (e) => {
    addRipple(analyzeBtn, e);

    const res = await sendToContent('getData');
    if (!res || res.status !== 'data_ready' || !res.data) {
      showToast('error', t('noData'));
      return;
    }
    if (!res.data.posts || res.data.posts.length === 0) {
      showToast('error', t('noPosts'));
      return;
    }

    lastPostCount = res.data.posts.length;
    lastSourceData = res.data;

    setStatus('active', t('statusAnalyzing'));
    analyzeBtn.disabled = true;
    analyzeIcon.textContent = '⏳';
    analyzeBtn.classList.add('analyzing');

    try {
      // Let the loading state paint before running the dependency-free analyzer.
      await new Promise(resolve => requestAnimationFrame(resolve));
      const result = TelegramAnalyzer.analyze(res.data, currentLang);
      renderResults(result);
      showResultsPanel();
      setStatus('done', t('tipAnalyzed'));
      showToast('success', t('analyzed')(res.data.posts.length), 3000);
    } catch (err) {
      console.error('Local analysis failed:', err);
      setStatus('error', t('analyzeError'));
      showToast('error', t('analyzeError'), 4500);
    } finally {
      analyzeBtn.disabled = false;
      analyzeIcon.textContent = '📊';
      analyzeBtn.classList.remove('analyzing');
    }
  });

  backBtn.addEventListener('click', () => {
    hideResultsPanel();
    if (lastPostCount > 0) {
      setStatus('done', t('postsSaved')(lastPostCount));
    } else {
      setStatus('idle', t('statusReady'));
    }
  });
});
