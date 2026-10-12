'use strict';
/* =========================================================================
 * js/i18n.js — every piece of interface text, in English and Traditional
 * Chinese (Hong Kong).  The reference game ships both, and the whole UI is
 * laid out to survive the switch: the Chinese strings are deliberately short.
 * ========================================================================= */
(function (root) {
  var S = {
    /* ---- shell ---------------------------------------------------------- */
    title:        { en: 'FURIMONSTER', zh: 'FURI MONSTER' },
    subtitle:     { en: 'REALISTIC CRANE SIMULATION', zh: 'FURI MONSTER 真實模擬夾娃娃機' },
    pressStart:   { en: 'INSERT COIN', zh: '投幣開始' },
    fullscreen:   { en: 'FULLSCREEN', zh: '全螢幕' },
    loading:      { en: 'LOADING', zh: '載入中' },
    anyKey:       { en: 'ENTER / SPACE', zh: 'ENTER / 空白鍵' },

    /* ---- navigation ----------------------------------------------------- */
    floor:        { en: 'ARCADE FLOOR', zh: '遊戲機中心' },
    play:         { en: 'PLAY', zh: '開始遊玩' },
    collection:   { en: 'COLLECTION', zh: '獎品圖鑑' },
    shop:         { en: 'SHOP', zh: '升級商店' },
    trophies:     { en: 'TROPHIES', zh: '成就' },
    shelf:        { en: 'PRIZE SHELF', zh: '展示架' },
    back:         { en: 'BACK', zh: '返回' },
    resume:       { en: 'RESUME', zh: '繼續' },
    quit:         { en: 'LEAVE MACHINE', zh: '離開機台' },
    pause:        { en: 'PAUSED', zh: '暫停' },
    help:         { en: 'CONTROLS', zh: '操作說明' },
    close:        { en: 'CLOSE', zh: '關閉' },

    /* ---- wallet / HUD --------------------------------------------------- */
    credit:       { en: 'CREDIT', zh: '代幣' },
    credits:      { en: 'CREDITS', zh: '代幣' },
    money:        { en: 'CASH', zh: '現金' },
    difficulty:   { en: 'DIFFICULTY', zh: '難度' },
    machinePanel: { en: 'FURI LINE', zh: '機台資訊' },
    statusPanel:  { en: 'STATUS', zh: '夾取狀態' },
    prizeValue:   { en: 'PRIZE VALUE', zh: '獎品價值' },
    grabStrength: { en: 'GRIP', zh: '夾力' },
    gripOk:       { en: 'HOLDING', zh: '抓緊中' },
    gripWeak:     { en: 'SLIPPING', zh: '正在滑落' },
    gripLost:     { en: 'DROPPED!', zh: '滑落！' },
    firmGrab:     { en: 'FIRM GRAB!', zh: '穩固抓取！' },
    emptyClaw:    { en: 'NOTHING THERE', zh: '夾空了' },
    moveClaw:     { en: 'MOVE', zh: '移動' },
    dropping:     { en: 'DROPPING', zh: '下降中' },
    closing:      { en: 'CLOSING', zh: '夾合中' },
    lifting:      { en: 'LIFTING', zh: '上升中' },
    returning:    { en: 'RETURNING', zh: '回程中' },
    releasing:    { en: 'RELEASING', zh: '放開' },
    ready:        { en: 'READY', zh: '待機' },
    attempts:     { en: 'PLAYS', zh: '遊玩次數' },

    /* ---- controls ------------------------------------------------------- */
    ctrlMove:     { en: 'Arrows / WASD move the claw', zh: '方向鍵 / WASD 移動夾爪' },
    ctrlDrop:     { en: 'SPACE drops the claw', zh: 'SPACE 放下夾爪' },
    ctrlGrab:     { en: 'The claw closes by itself, then carries home', zh: '夾爪自動夾合，然後自動返回' },
    ctrlHome:     { en: 'It always returns over the chute and lets go', zh: '夾爪會回到出物口上方並鬆開' },
    ctrlAlt:      { en: 'Hold SHIFT to creep slowly', zh: '按住 SHIFT 微調慢速' },
    ctrlPause:    { en: 'ESC pause    M mute    L language    F11 fullscreen', zh: 'ESC 暫停    M 靜音    L 語言    F11 全螢幕' },

    /* ---- prizes --------------------------------------------------------- */
    prizes:       { en: 'In box', zh: '機內獎品' },
    atStake:      { en: 'UNDER THE CLAW', zh: '爪下獎品' },
    won:          { en: 'YOU WON', zh: '恭喜獲得' },
    newPrize:     { en: 'NEW!', zh: '新獎品！' },
    duplicate:    { en: 'DUPLICATE', zh: '重複' },
    noPrize:      { en: 'NO PRIZE', zh: '沒有獎品' },
    betterLuck:   { en: 'BETTER LUCK NEXT TIME', zh: '下次再努力' },
    keepGoing:    { en: 'CONTINUE', zh: '繼續' },
    soldFor:      { en: 'sold for', zh: '售出' },
    sellDup:      { en: 'SELL DUPLICATES', zh: '賣出重複獎品' },
    soldCount:    { en: 'sold', zh: '已售出' },
    owned:        { en: 'OWNED', zh: '已擁有' },
    display:      { en: 'DISPLAY', zh: '展示' },
    remove:       { en: 'REMOVE', zh: '收回' },
    weightG:      { en: 'g', zh: '克' },
    catalogue:    { en: 'CATALOGUE', zh: '圖鑑' },
    shelfFull:    { en: 'The shelf is full.', zh: '展示架已滿。' },
    value:        { en: 'Value', zh: '價值' },
    weight:       { en: 'Weight', zh: '重量' },
    grip:         { en: 'Grip', zh: '抓力' },
    rarity:       { en: 'Rarity', zh: '稀有度' },

    /* ---- shop ----------------------------------------------------------- */
    level:        { en: 'LV', zh: '等級' },
    buy:          { en: 'BUY', zh: '購買' },
    maxed:        { en: 'MAX', zh: '滿級' },
    needMoney:    { en: 'NOT ENOUGH CASH', zh: '現金不足' },
    buyCredits:   { en: 'BUY 5 CREDITS', zh: '購買 5 個代幣' },
    cashOut:      { en: 'CASH OUT PRIZES', zh: '獎品兌換現金' },
    cashOutHint:  { en: 'Sell everything you own more than once.', zh: '賣出所有重複的獎品。' },
    spent:        { en: 'SPENT', zh: '已花費' },
    earned:       { en: 'EARNED', zh: '已賺取' },

    /* ---- stats ---------------------------------------------------------- */
    stats:        { en: 'STATISTICS', zh: '統計資料' },
    plays:        { en: 'Plays', zh: '遊玩次數' },
    wins:         { en: 'Wins', zh: '成功次數' },
    winRate:      { en: 'Win rate', zh: '成功率' },
    bestStreak:   { en: 'Best streak', zh: '最佳連勝' },
    streak:       { en: 'Streak', zh: '連勝' },
    slips:        { en: 'Slipped away', zh: '滑落次數' },
    unique:       { en: 'Unique prizes', zh: '不重複獎品' },
    totalValue:   { en: 'Collection value', zh: '收藏總值' },

    /* ---- achievements --------------------------------------------------- */
    unlocked:     { en: 'UNLOCKED', zh: '已解鎖' },
    achProgress:  { en: 'unlocked', zh: '已解鎖' },
    achNew:       { en: 'TROPHY!', zh: '成就達成！' },

    /* ---- settings ------------------------------------------------------- */
    music:        { en: 'MUSIC', zh: '音樂' },
    sfx:          { en: 'SOUND', zh: '音效' },
    language:     { en: 'LANGUAGE', zh: '語言' },
    on:           { en: 'ON', zh: '開' },
    off:          { en: 'OFF', zh: '關' },
    english:      { en: 'ENGLISH', zh: 'ENGLISH' },
    chinese:      { en: '繁體中文', zh: '繁體中文' },
    reset:        { en: 'ERASE SAVE', zh: '清除存檔' },
    resetAsk:     { en: 'Erase everything? ENTER to confirm.', zh: '確定要清除所有進度？按 ENTER 確認。' }
  };

  function T(key, lang) {
    var e = S[key];
    if (!e) return key;
    return e[lang] || e.en;
  }

  /* prize and machine names carry their own bilingual pairs and use this */
  function pick(pair, lang) {
    if (!pair) return '';
    if (typeof pair === 'string') return pair;
    return pair[lang] || pair.en || '';
  }

  root.CM = root.CM || {};
  root.CM.I18N = { strings: S, T: T, pick: pick, LANGS: ['en', 'zh'] };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.CM.I18N;
})(typeof globalThis !== 'undefined' ? globalThis : this);
