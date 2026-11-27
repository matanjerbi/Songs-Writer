// עוזר AI — Claude דרך מפתח API של המשתמש
(function (global) {
  const SYSTEM = [
    'אתה עורך שירה עברית מנוסה ורגיש, שעובד יחד עם משורר על השירים שלו.',
    'כתוב תמיד בעברית עכשווית וטבעית. שמור על הקול, המשלב והסגנון של המשורר — אל תהפוך את השיר לשלך.',
    'הימנע מקלישאות, ממליצה ומפאתוס מיותר. העדף דימויים מוחשיים ומפתיעים על פני הצהרות רגשיות.',
    'שים לב למשקל, לקצב, לאורך השורות ולתבנית החריזה הקיימת, והמשך אותם אם יש כאלה.',
    'כשמבקשים ממך JSON — החזר JSON תקין בלבד, בלי טקסט לפניו או אחריו ובלי ```.'
  ].join('\n');

  function settings() { return global.App ? global.App.settings() : {}; }

  async function call(user, opts) {
    opts = opts || {};
    const s = settings();
    if (!s.apiKey) throw new Error('NO_KEY');
    let res;
    try {
      res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': s.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: s.model || 'claude-sonnet-5-5',
          max_tokens: opts.maxTokens || 1500,
          system: SYSTEM + (s.style ? '\nעל הסגנון של המשורר: ' + s.style : ''),
          messages: [{ role: 'user', content: user }]
        })
      });
    } catch (e) {
      throw new Error('אין חיבור לאינטרנט');
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = (data.error && data.error.message) || ('שגיאה ' + res.status);
      if (res.status === 401) throw new Error('מפתח ה-API לא תקין');
      throw new Error(msg);
    }
    return (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
  }

  function parseJSON(text) {
    const t = text.replace(/```(json)?/g, '').trim();
    try { return JSON.parse(t); } catch (e) {}
    const m = t.match(/\[[\s\S]*\]/);
    if (m) { try { return JSON.parse(m[0]); } catch (e) {} }
    // נפילה: שורה לכל פריט
    return t.split('\n').map(s => s.replace(/^[\s\-\*\d\.\)"]+|[",]+$/g, '').trim()).filter(Boolean);
  }

  function poemBlock(p) {
    return 'כותרת: ' + (p.title || '(ללא)') + '\n\nהשיר עד עכשיו:\n"""\n' + (p.text || '') + '\n"""';
  }

  const Actions = {
    async continueLines(p, n) {
      const t = await call(poemBlock(p) +
        '\n\nהצע 4 אפשרויות שונות זו מזו להמשך השיר — כל אפשרות היא ' + (n || 2) +
        ' שורות שבאות מיד אחרי השורה האחרונה. שמור על החריזה, הקצב והקול. ' +
        'החזר מערך JSON של מחרוזות, כאשר השורות בתוך כל אפשרות מופרדות ב-\\n.');
      return parseJSON(t);
    },
    async rephrase(p, line) {
      const t = await call(poemBlock(p) + '\n\nהשורה/הקטע שאני רוצה לשפר:\n"' + line + '"\n\n' +
        'הצע 5 ניסוחים חלופיים לקטע הזה בלבד: שניים קרובים למקור, שניים נועזים יותר, ואחד שמשנה את הדימוי. ' +
        'שמור על החרוז אם יש. החזר מערך JSON של מחרוזות.');
      return parseJSON(t);
    },
    async rhymes(p, word) {
      const t = await call(poemBlock(p) + '\n\nאני מחפש חרוזים למילה "' + word + '" שיתאימו לשיר הזה. ' +
        'הצע 15 מילים או צירופים קצרים שמתחרזים איתה באמת (בצליל, לא רק באות האחרונה), ' +
        'מהמפתיעים והמתאימים ביותר לשיר. החזר מערך JSON של מחרוזות.');
      return parseJSON(t);
    },
    async images(p) {
      const t = await call(poemBlock(p) + '\n\nהצע 6 דימויים או מטפורות מקוריים ומוחשיים שיכולים להעמיק את השיר הזה, ' +
        'כל אחד כשורה אחת שאפשר לשלב בשיר. החזר מערך JSON של מחרוזות.');
      return parseJSON(t);
    },
    async titles(p) {
      const t = await call(poemBlock(p) + '\n\nהצע 6 כותרות אפשריות לשיר — קצרות, לא מתבקשות מדי. החזר מערך JSON של מחרוזות.');
      return parseJSON(t);
    },
    async unblock(p) {
      const t = await call(poemBlock(p) + '\n\nאני תקוע ולא יודע איך להמשיך. ' +
        'תן לי 5 כיוונים להמשך — כל אחד כשאלה או הצעה קצרה שמכוונת אותי (למשל: "מה הוא לא אמר לה?"), בלי לכתוב את השיר במקומי. ' +
        'החזר מערך JSON של מחרוזות.');
      return parseJSON(t);
    },
    async critique(p) {
      return call(poemBlock(p) + '\n\nתן לי משוב כן ומקצועי על השיר, כמו עורך טוב ולא כמו מעריץ:\n' +
        '1. מה הכי חזק בשיר (ציטוט קצר ולמה).\n2. מה חלש או קלישאתי.\n3. קצב, משקל וחריזה — איפה זה נשבר.\n' +
        '4. שלוש הצעות קונקרטיות לשיפור.\nכתוב בקצרה, בנקודות, בלי הקדמות. אפשר להשתמש ב-**הדגשה**.', { maxTokens: 1800 });
    },
    async free(p, request) {
      return call(poemBlock(p) + '\n\nהבקשה שלי: ' + request, { maxTokens: 1800 });
    },
    async fromPrompt(prompt) {
      const t = await call('תן לי 3 שורות פתיחה אפשריות לשיר חדש על פי ההשראה הבאה:\n' + prompt +
        '\nכל פתיחה 1–2 שורות. החזר מערך JSON של מחרוזות.');
      return parseJSON(t);
    }
  };

  global.AI = { call, Actions };
})(window);
