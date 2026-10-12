/* =========================================================================
 * assets/js/data.js — FURI MONSTER content model (single source of truth)
 *
 * Every page reads from here. Character cards, character detail pages, the
 * relationship map, the Emotion Lab, story lists, collections, news and the
 * licensing snapshot are ALL generated from this file, so no content is
 * hardcoded inside a page.
 *
 * Trilingual fields are built with L(en, zh-Hant, zh-Hans).
 *
 * CONTENT RULE (brief §16): nothing here claims a completed partnership,
 * investor, award, product availability or licensing territory. Anything
 * speculative carries status: 'concept' | 'coming-soon' | 'placeholder'.
 * ========================================================================= */
(function (root) {
  'use strict';

  function L(en, ht, hs, th, ja) {
    return { en: en, 'zh-Hant': ht || en, 'zh-Hans': hs || ht || en,
             th: th || en, ja: ja || en };
  }

  /* the six guardians, in canonical order */
  var CHARACTERS = [
    {
      slug: 'furi-prince',
      name: 'Furi Prince',
      nameAlt: L('Furi Prince', '皇子', '皇子', 'ฟูริ พรินซ์', 'フーリー・プリンス'),
      index: 1,
      symbol: L('Memory', '記憶', '记忆', 'ความจำ', '記憶'),
      power: L('Memory', '記憶', '记忆', 'ความจำ', '記憶'),
      role: L('Guardian of Memory', '記憶守護者', '记忆守护者', 'ผู้พิทักษ์ความจำ', '記憶の守り手'),
      tagline: L('I keep what must not be forgotten.',
                 '我保留那些不能被忘記的。',
                 '我保留那些不能被忘记的。','ฉันเก็บสิ่งที่ไม่ควรถูกลืม','忘れてはいけないものを、僕は覚えている。'),
      shortLine: L('Past. Anger. Memory.', '過去、憤怒、記憶。', '过去、愤怒、记忆。', 'อดีต ความโกรธ ความจำ', '過去。怒り。記憶。'),
      personality: L('Quiet / Watchful / Carries too much',
                     '沉默 / 警覺 / 背負太多',
                     '沉默 / 警觉 / 背负太多','เงียบ / จับตาอยู่เสมอ / แบกรับไว้มากเกินไป','静か / 見守る / 自分で抱えこめすぎる'),
      likes: L('Old songs / Rain on stone / Being trusted',
               '老歌 / 石上的雨聲 / 被信任',
               '老歌 / 石上的雨声 / 被信任','เพลงเก่า / ฝนบนหิน / การได้รับความไว้วางใจ','昔の歌 / 石の上の雨 / 信頼されること'),
      dislikes: L('Forgetting / Loud crowds / Being asked to smile',
                  '遺忘 / 喧鬧的人群 / 被要求微笑',
                  '遗忘 / 喧闹的人群 / 被要求微笑','การลืม / ฝูงคนสั่งเสียงดัง / การถูกขอให้ยิ้ม','忘れられること / 騒がしい人ごみ / 笑ってと言われること'),
      fear: L('That the last memory fades before it can be passed on',
              '最後的記憶在傳下去之前就消散',
              '最后的记忆在传下去之前就消散','กลัวว่าความจำสุดท้ายจะเลือนหายไปก่อนที่จะได้ส่งต่อ','残される前に、最後の記憶が消えてしまうこと'),
      mission: L('Keep the memory of FURI PLANET alive long enough to rebuild it',
                 '讓 FURI PLANET 的記憶活到足以重建的那一天',
                 '让 FURI PLANET 的记忆活到足以重建的那一天','รักษาความจำของ FURI PLANET ให้มีชีวิตอยู่จนถึงวันที่สร้างมันขึ้นใหม่ได้','FURI PLANET の記憶を、再び築けるまで生かしておく'),
      ability: L('Memory Echo — replays a moment exactly as it happened',
                 '記憶回聲 —— 讓一個瞬間原樣重現',
                 '记忆回声 —— 让一个瞬间原样重现','เสียงสะท้อนความจำ — เล่าขณะหนึ่งซ้ำอย่างที่มันเคยเป็น','記憶のこだま — あの瞬間を、起きたとおりに再現する'),
      primaryEmotion: L('Grief / Resolve / Anger', '悲傷 / 決心 / 憤怒', '悲伤 / 决心 / 愤怒', 'ความโศกเศร้า / ความมุ่งมั่น / ความโกรธ', '悲しみ / 決意 / 怒り'),
      origin: L(
        'The Furi Prince was the first of the six to wake after the collapse, and the last to stop working. He was not built to rule. He was built to remember.',
        '皇子是崩塌之後最先醒來、也最晚停下工作的那一個。他不是為了統治而被造出來的。他是為了記得。',
        '皇子是崩塌之后最先醒来、也最晚停下工作的那一个。他不是为了统治而被造出来的。他是为了记得。','Furi Princeตื่นขึ้นเป็นคนแรกในหกคนหลังการล่มสลาย และเป็นคนสุดท้ายที่หยุดทำงาน เขาไม่ได้ถูกสร้างมาเพื่อปกครอง เขาถูกสร้างมาเพื่อจดจำ','Furi Princeは、崩壊のあとで六人の中で最初に目をさまし、最後まで働き続けた。彼は統治するために造られていない。覚えているために造られている。'),
      origin2: L(
        'When the extraction fleets took the planet core, he carried the last archive out through the fire. He has never told the others how much of it he lost on the way.',
        '當掠奪艦隊取走星球核心時，他帶著最後的檔案穿過火海走出來。他從未告訴其他人，他在途中失去了多少。',
        '当掠夺舰队取走星球核心时，他带着最后的档案穿过火海走出来。他从未告诉其他人，他在途中失去了多少。','เมื่อกองเรือบักตัดเอาแกนของดาวไป เขาหวนคลังข้อมูลชุดสุดท้ายออกมาท่ามกลางไฟ เขาไม่เคยบอกคนอื่นว่าเสียไปเท่าไหร่ระหว่างทาง','掴奪艘隊が星の核を持ち去ったとき、彼は最後の記録を炎の中から運び出した。途中でどれだけ失ったかは、誰にも言っていない。'),
      signatureMoment: L('He does not remember the world to bring it back. He remembers it so that it was real.',
                         '他記住這個世界，不是為了把它帶回來。他記住它，是為了證明它曾經真實存在。',
                         '他记住这个世界，不是为了把它带回来。他记住它，是为了证明它曾经真实存在。','เขาจดจำโลกไว้ไม่ใช่เพื่อดึงมันกลับมา เขาจดจำมันไว้ เพื่อให้มันเคยเป็นจริง','彼が世界を覚えているのは、戻すためではない。本当にあったと証するためだ。'),
      gallery: [
        L('Portrait', '主視覺', '主视觉', 'ภาพหลัก', 'メインビジュアル'),
        L('Three-view sheet', '三視圖', '三视图', 'แผนภาพสามมุม', '三面図'),
        L('Crown detail', '皇冠細節', '皇冠细节', 'รายละเอียดมงกุฏ', '王冠のディテール'),
        L('Expression set', '表情集', '表情集', 'ชุดสีหน้า', '表情集')
      ],
      downloads: [L('Wallpaper', '桌布', '壁纸', 'วอลเปเปอร์', '壁紙'), L('Sticker', '貼圖', '贴图', 'สติกเกอร์', 'スタンプ'), L('Share card', '分享卡', '分享卡', 'การ์ดแชร์', 'シェアカード')],
      theme: { base: '#FEC82A', deep: '#B88A08', glow: '#FFE880', ink: '#020202' }
    },
    {
      slug: 'pinki',
      name: 'Pinki',
      nameAlt: L('Pinki', '平奇', '平奇', 'พิงกิ้', 'ピンキー'),
      index: 2,
      symbol: L('Heartbeat', '心跳', '心跳', 'เสียงหัวใจเต้น', '心跳'),
      power: L('Heartbeat', '心跳', '心跳', 'เสียงหัวใจเต้น', '心跳'),
      role: L('Guardian of Connection', '連結守護者', '连结守护者', 'ผู้พิทักษ์ความเชื่อมโยง', '絋ぎの守り手'),
      tagline: L('Her heart is loud. That is the point.',
                 '她的心跳很大聲。那正是重點。',
                 '她的心跳很大声。那正是重点。','หัวใจของเธอเต้นดังๆ นั่นและคือจุดสำคัญของเรื่อง','彼女の心臓はさらけ出している。それがいい。'),
      shortLine: L('Emotion. Connection. Life.', '情感、連結、生命。', '情感、连结、生命。', 'อารมณ์ ความเชื่อมโยง ชีวิต', '感情。絋がり。生命。'),
      personality: L('Sensitive / Energetic / Caring', '敏感 / 有活力 / 體貼', '敏感 / 有活力 / 体贴', 'อ่อนไหว / เต็มไปด้วยพลัง / เอาใจเขามาใส่', '感じやすい / エネルギッシュ / 思いやりがある'),
      likes: L('Music / Friends / Dancing', '音樂 / 朋友 / 跳舞', '音乐 / 朋友 / 跳舞', 'เพลง / เพื่อน / การเต้นรำ', '音楽 / 友達 / 踊ること'),
      dislikes: L('Loneliness / Silence after an argument', '孤單 / 爭執之後的沉默', '孤单 / 争执之后的沉默', 'ความเหงาเหลือ / ความเงียบหลังการเถียงกัน', '孤独 / 口論の後の沈黙'),
      fear: L('Losing connection', '失去連結', '失去连结', 'การสูญเสียความเชื่อมโยง', '絋がりを失うこと'),
      mission: L('Protect the last heartbeat of FURI PLANET',
                 '守護 FURI PLANET 最後的心跳',
                 '守护 FURI PLANET 最后的心跳','ปกป้องเสียงหัวใจเต้นครั้งสุดท้ายของ FURI PLANET','FURI PLANET の最後の心跳を守る'),
      ability: L('Heart Pulse — lets every guardian feel what the others feel',
                 '心脈 —— 讓每位守護者感受到彼此的感受',
                 '心脉 —— 让每位守护者感受到彼此的感受','จังหวะใจ — ให้ผู้พิทักษ์ทุกคนรู้สึกสิ่งที่คนอื่นรู้สึก','心の脈 — みんながお互いの感情を感じられる'),
      primaryEmotion: L('Love / Anxiety / Excitement', '愛 / 焦慮 / 興奮', '爱 / 焦虑 / 兴奋', 'ความรัก / ความกังวล / ความตื่นเต้น', '愛 / 不安 / 興奮'),
      origin: L(
        'Pinki was built as a pulse monitor and became something else entirely. The first time the six stood together, her heartbeat synced to all of them at once.',
        '平奇原本只是一台脈搏監測器，後來完全變成了另一種存在。六個人第一次站在一起時，她的心跳同時與所有人同步。',
        '平奇原本只是一台脉搏监测器，后来完全变成了另一种存在。六个人第一次站在一起时，她的心跳同时与所有人同步。','Pinkiถูกสร้างขึ้นเป็นเครื่องวัดชีพจร แต่กลายเป็นสิ่งอื่นไปทั้งหมด ครั้งแรกที่ทั้งหกยืนหน้ากัน หัวใจของเธอเต้นตรงกับทุกคนพร้อมกัน','Pinkiは脈のモニターとして作られ、そして全く別の何かになった。六人が初めて並んだとき、彼女の心跳はみんなと一緒に同期した。'),
      origin2: L(
        'None of them have been able to hide how they feel since.',
        '從那之後，他們再也沒有人能藏住自己的感受。',
        '从那之后，他们再也没有人能藏住自己的感受。','ตั้งแต่นั้นมา ไม่มีใครในพวกเขาซ่อนความรู้สึกของตัวเองได้อีกต่อไป','それ以降、誰も自分の感情を隠せなくなった。'),
      signatureMoment: L('She is the reason the six did not scatter.',
                         '她是六個人沒有散開的原因。',
                         '她是六个人没有散开的原因。','เธอคือเหตุผลที่ทั้งหกไม่แยกกันไป','六人がばらばらにならなかったのは、彼女がいたからだ。'),
      gallery: [
        L('Portrait', '主視覺', '主视觉', 'ภาพหลัก', 'メインビジュアル'),
        L('Three-view sheet', '三視圖', '三视图', 'แผนภาพสามมุม', '三面図'),
        L('Pulse detail', '心脈細節', '心脉细节', 'รายละเอียดจังหวะใจ', '脈のディテール'),
        L('Expression set', '表情集', '表情集', 'ชุดสีหน้า', '表情集')
      ],
      downloads: [L('Wallpaper', '桌布', '壁纸', 'วอลเปเปอร์', '壁紙'), L('Sticker', '貼圖', '贴图', 'สติกเกอร์', 'スタンプ'), L('Share card', '分享卡', '分享卡', 'การ์ดแชร์', 'シェアカード')],
      theme: { base: '#F389A0', deep: '#CE6A81', glow: '#FF6BD4', ink: '#020202' }
    },
    {
      slug: 'winggo',
      name: 'Winggo',
      nameAlt: L('Winggo', '溫果', '温果', 'วิงโก้', 'ウィンゴ'),
      index: 3,
      symbol: L('Light of Nature', '自然之光', '自然之光', 'แสงแห่งธรรมชาติ', '自然の光'),
      power: L('Light of Nature', '自然之光', '自然之光', 'แสงแห่งธรรมชาติ', '自然の光'),
      role: L("Guardian of Nature's Light", '自然之光守護者', '自然之光守护者', 'ผู้พิทักษ์แสงแห่งธรรมชาติ', '自然の光の守り手'),
      tagline: L('He only lands when he is carrying someone.',
                 '他只有在載著別人的時候才會降落。',
                 '他只有在载着别人的时候才会降落。','เขาลงจอดเท่านั้นเมื่อกำลังพาใครสักคน','彼は誰かを乗せているときにしか降りない。'),
      shortLine: L('Nature. Hope. Light.', '自然、希望、光。', '自然、希望、光。', 'ธรรมชาติ ความหวัง แสง', '自然。希望。光。'),
      personality: L('Protective / Restless / Bright', '保護性強 / 停不下來 / 明亮', '保护性强 / 停不下来 / 明亮', 'คุ้มครอง / อยู่ไม่นิ่ง / สว่างสดใส', '守り屋 / 落ち着かない / 明るい'),
      likes: L('High places / Sunrise / Carrying people', '高處 / 日出 / 載著別人', '高处 / 日出 / 载着别人', 'ที่สูง / พระอาทิตย์ขึ้น / การพาคน', '高いところ / 日の出 / 誰かを乗せて飛ぶこと'),
      dislikes: L('Watching something small get hurt', '看著弱小的東西受傷', '看着弱小的东西受伤', 'การเห็นสิ่งเล็กๆ ถูกทำร้าย', '小さなものが傷つくのを見ること'),
      fear: L('Arriving too late', '來得太晚', '来得太晚', 'ไปถึงช้าเกินไป', '遅く到着すること'),
      mission: L('Light the planet again, one horizon at a time',
                 '一個地平線接著一個，把星球重新點亮',
                 '一个地平线接着一个，把星球重新点亮','จุดแสงให้ดาวสว่างอีกครั้ง ทีละขอบฟ้า','地平線をひとつずつ、もう一度星を灯す'),
      ability: L('Winglight — his wings store daylight and release it as a beacon',
                 '翼光 —— 翅膀儲存日光，並以燈塔的形式釋放',
                 '翼光 —— 翅膀储存日光，并以灯塔的形式释放','แสงปีก — ปีกของเขาเก็บแสงแดดไว้ แล้วปล่อยออกมาเป็นดาวนำทาง','羽の光 — 羽に日の光をためて、灯台として放つ'),
      primaryEmotion: L('Hope / Protective anger', '希望 / 保護性的憤怒', '希望 / 保护性的愤怒', 'ความหวัง / ความโกรธที่มุ่งปกป้อง', '希望 / 守りたいからの怒り'),
      origin: L(
        'Winggo was the last of the six to be given a body and the first to volunteer for the surface.',
        '溫果是六個人中最後獲得身體的，卻是最先自願前往地表的。',
        '温果是六个人中最后获得身体的，却是最先自愿前往地表的。','Winggoเป็นคนสุดท้ายในหกคนที่ได้รับร่างกาย แต่เป็นคนแรกที่อาสาสมัครลงไปผิวดาว','Winggoは六人の中で最後に体を与えられ、最初に地表へ行くと手を挙げた。'),
      origin2: L(
        'He flies the dead routes looking for anything still green, and he has not slept above ground in a long time.',
        '他飛越那些死去的航線，尋找任何還綠著的東西；他已經很久沒有在地面上睡過。',
        '他飞越那些死去的航线，寻找任何还绿着的东西；他已经很久没有在地面上睡过。','เขาบินเส้นทางที่ตายแล้วเพื่อมองหาสิ่งที่ยังเขียวอยู่ และเขาไม่ได้นอนบนพื้นดินมานานแล้ว','彼は死んだ航路を飛んで、まだ緑の残るものを探している。地上ではずっと眠っていない。'),
      signatureMoment: L('The light is still on. He checks. Every day.',
                         '光還亮著。他每天都會確認一次。',
                         '光还亮着。他每天都会确认一次。','แสงยังเปิดอยู่ เขาตรวจสอบ ทุกวัน','光はまだ点っている。彼は毎日確かめに行く。'),
      gallery: [
        L('Portrait', '主視覺', '主视觉', 'ภาพหลัก', 'メインビジュアル'),
        L('Three-view sheet', '三視圖', '三视图', 'แผนภาพสามมุม', '三面図'),
        L('Wing span detail', '翼展細節', '翼展细节', 'รายละเอียดช่วงปีก', '翼を広げたディテール'),
        L('Expression set', '表情集', '表情集', 'ชุดสีหน้า', '表情集')
      ],
      downloads: [L('Wallpaper', '桌布', '壁纸', 'วอลเปเปอร์', '壁紙'), L('Sticker', '貼圖', '贴图', 'สติกเกอร์', 'スタンプ'), L('Share card', '分享卡', '分享卡', 'การ์ดแชร์', 'シェアカード')],
      theme: { base: '#73FFC7', deep: '#2FA37A', glow: '#A3FF61', ink: '#020202' }
    },
    {
      slug: 'fluffu',
      name: 'Fluffu',
      nameAlt: L('Fluffu', '芙芙', '芙芙', 'ฟลัฟฟู่', 'フラッフ'),
      index: 4,
      symbol: L('Seed', '種子', '种子', 'เม็ดพันธุ์', '種'),
      power: L('Seed', '種子', '种子', 'เม็ดพันธุ์', '種'),
      role: L('Guardian of Growth', '成長守護者', '成长守护者', 'ผู้พิทักษ์การเติบโต', '成長の守り手'),
      tagline: L('She is the only one who is allowed to be slow.',
                 '她是唯一被允許慢下來的那一個。',
                 '她是唯一被允许慢下来的那一个。','เธอเป็นคนเดียวที่ได้รับอนุญาตให้ค่อยๆ ไป','ゆっくりしていいと許されているのは、彼女だけ。'),
      shortLine: L('Life. Growth. Future.', '生命、成長、未來。', '生命、成长、未来。', 'ชีวิต การเติบโต อนาคต', '生命。成長。未来。'),
      personality: L('Gentle / Stubborn / Hopeful', '溫柔 / 固執 / 懷抱希望', '温柔 / 固执 / 怀抱希望', 'อ่อนโยน / ดื้อรั้ง / เต็มไปด้วยความหวัง', '優しい / 意地っ張り / 希望を持つ'),
      likes: L('Soil / Small things / Waiting', '土壤 / 微小的東西 / 等待', '土壤 / 微小的东西 / 等待', 'ดิน / สิ่งเล็กๆ / การรอคอย', '土 / 小さなもの / 待つこと'),
      dislikes: L('Being hurried / Sterile places', '被催促 / 沒有生命的地方', '被催促 / 没有生命的地方', 'การถูกเร่งรัด / สถานที่ไม่มีชีวิต', '催されること / 生命のない場所'),
      fear: L('A world where nothing grows back', '一個什麼都長不回來世界', '一个什么都长不回来世界', 'โลกที่ไม่มีอะไรงอกลับมาได้อีก', 'なにも生えてこない世界'),
      mission: L('Carry the last seed until there is ground to plant it in',
                 '帶著最後的種子，直到有土地可以種下它',
                 '带着最后的种子，直到有土地可以种下它','เก็บรักษาเม็ดพันธุ์สุดท้ายไว้ จนกว่าจะมีดินให้ปลูกมัน','植える土が見つかるまで、最後の種を運ぶ'),
      ability: L('Seed Sleep — holds a living thing in stasis until conditions are right',
                 '種眠 —— 讓生命在條件合適之前保持靜止',
                 '种眠 —— 让生命在条件合适之前保持静止','การหลับของเม็ดพันธุ์ — เก็บสิ่งที่มีชีวิตไว้ในภาวะนิ่งจนกว่าเงื่อนไขจะเหมาะ','種の眠り — 条件が整うまで、生きものを静止させておく'),
      primaryEmotion: L('Patience / Longing', '耐心 / 渴望', '耐心 / 渴望', 'ความอดทน / ความโย่นหา', '耐えること / こがれる想い'),
      origin: L(
        'Fluffu carries the only surviving seed vault of FURI PLANET inside her fluff. She has been keeping it asleep for years.',
        '芙芙的絨毛裡藏著 FURI PLANET 唯一倖存的種子庫。她已經讓它沉睡了很多年。',
        '芙芙的绒毛里藏着 FURI PLANET 唯一幸存的种子库。她已经让它沉睡了很多年。','Fluffuเก็บรักษาคลังเม็ดพันธุ์แห่งเดียวของ FURI PLANET ที่รอดชีวิตไว้ในขนของเธอ เธอให้มันหลับมาหลายปี','Fluffuの毛の中には、FURI PLANET で唯一残った種の倉庫がある。彼女は何年もそれを眠らせ続けている。'),
      origin2: L(
        'She has never once opened it, because once it is open, it has to be planted somewhere.',
        '她一次也沒有打開過，因為一旦打開，就必須有地方可以種下它。',
        '她一次也没有打开过，因为一旦打开，就必须有地方可以种下它。','เธอไม่เคยเปิดมันแม้แต่ครั้งเดียว เพราะเมื่อเปิดแล้ว มันต้องได้ปลูกที่ใดสักแห่ง','開けたことは一度もない。一度開けたら、どこかに植えなければならないから。'),
      signatureMoment: L('She counts in seasons, not days.',
                         '她用季節計算時間，而不是用日子。',
                         '她用季节计算时间，而不是用日子。','เธอนับเวลาเป็นฤดู ไม่ใช่เป็นวัน','彼女は日ではなく、季節で数える。'),
      gallery: [
        L('Portrait', '主視覺', '主视觉', 'ภาพหลัก', 'メインビジュアル'),
        L('Three-view sheet', '三視圖', '三视图', 'แผนภาพสามมุม', '三面図'),
        L('Seed vault detail', '種子庫細節', '种子库细节', 'รายละเอียดคลังเม็ดพันธุ์', '種の倉庫のディテール'),
        L('Expression set', '表情集', '表情集', 'ชุดสีหน้า', '表情集')
      ],
      downloads: [L('Wallpaper', '桌布', '壁纸', 'วอลเปเปอร์', '壁紙'), L('Sticker', '貼圖', '贴图', 'สติกเกอร์', 'スタンプ'), L('Share card', '分享卡', '分享卡', 'การ์ดแชร์', 'シェアカード')],
      theme: { base: '#AAD387', deep: '#6E9B4E', glow: '#A3FF61', ink: '#020202' }
    },
    {
      slug: 'boxo',
      name: 'Boxo',
      nameAlt: L('Boxo', '盒子', '盒子', 'บอกโซ่', 'ボクソー'),
      index: 5,
      symbol: L('Material Cycle', '物質循環', '物质循环', 'วัฏจักรวัตถุ', '物質の循璇'),
      power: L('Material Cycle', '物質循環', '物质循环', 'วัฏจักรวัตถุ', '物質の循璇'),
      role: L('Guardian of the Cycle', '循環守護者', '循环守护者', 'ผู้พิทักษ์วัฏจักร', '循璇の守り手'),
      tagline: L('Nothing here is rubbish. It just has not been rebuilt yet.',
                 '這裡沒有垃圾。只是還沒有被重建而已。',
                 '这里没有垃圾。只是还没有被重建而已。','ที่นี่ไม่มีอะไรเป็นขยะ แค่ยังไม่ได้ถูกสร้างขึ้นใหม่เท่านั้น','ここにゴミはない。まだ作り直されていないだけ。'),
      shortLine: L('Cycle. Resource. Rebirth.', '循環、資源、重生。', '循环、资源、重生。', 'วัฏจักร ทรัพยากร การเกิดใหม่', '循璇。資源。再生。'),
      personality: L('Practical / Deadpan / Generous', '務實 / 冷面 / 大方', '务实 / 冷面 / 大方', 'เป็นจริง / หน้าเตย / ใจกว้าง', '実務的 / ボケ顔 / 気前'),
      likes: L('Repairing things / Trade / A full inventory', '修理東西 / 交易 / 庫存充足', '修理东西 / 交易 / 库存充足', 'การซ่อมแซมของ / การค้า / สต็อกของที่เต็มปริมาณ', '修理すること / 取引 / 在庫が満たなこと'),
      dislikes: L('Waste / Being called junk', '浪費 / 被叫做垃圾', '浪费 / 被叫做垃圾', 'ความสิ้นเปลือง / การถูกเรียกว่าขยะ', '浪費 / ガラクタと呼ばれること'),
      fear: L('Becoming useless', '變得沒有用', '变得没有用', 'กลายเป็นสิ่งที่ไม่มีประโยชน์', '役に立たなくなること'),
      mission: L('Turn what was destroyed into what is needed next',
                 '把被摧毀的，變成接下來需要的',
                 '把被摧毁的，变成接下来需要的','เปลี่ยนสิ่งที่ถูกทำลายไปแล้วให้เป็นสิ่งที่ต้องใช้ต่อไป','壊れたものを、次に役立つものに変える'),
      ability: L('Reforge — breaks any material down and rebuilds it as something useful',
                 '重鑄 —— 分解任何材料，重建成有用的東西',
                 '重铸 —— 分解任何材料，重建成有用的东西','การตีขึ้นรูปใหม่ — ย่อยวัตถุใดๆ แล้วประกอบขึ้นใหม่เป็นสิ่งที่มีประโยชน์','再鍘造 — どんな素材でも分解し、役立つものに作り直す'),
      primaryEmotion: L('Calm / Stubbornness', '平靜 / 固執', '平静 / 固执', 'ความสงบ / ความดื้อรั้ง', '沈着 / 意地っ張り'),
      origin: L(
        'Boxo was assembled from the wreckage of the extraction rigs that emptied the planet.',
        '盒子是由那些掏空星球的掠奪鑽機殘骸組裝而成的。',
        '盒子是由那些掏空星球的掠夺钻机残骸组装而成的。','Boxoถูกประกอบขึ้นจากซากเศษของเครื่องจักรบักตัดที่ดูดความสมบูรณ์ออกจากดาว','Boxoは、星を空っぽにした掴奪掘り機の残骸から組み立てられた。'),
      origin2: L(
        'He is the only guardian made of the thing that killed FURI PLANET, and he does not let anyone forget it.',
        '他是唯一由殺死 FURI PLANET 的東西做成的守護者，而且他不讓任何人忘記這件事。',
        '他是唯一由杀死 FURI PLANET 的东西做成的守护者，而且他不让任何人忘记这件事。','เขาเป็นผู้พิทักษ์เดียวที่ถูกสร้างจากสิ่งที่เป็นตัวฆ่า FURI PLANET และเขาไม่ยอมให้ใครลืมเรื่องนั้น','彼は FURI PLANET を殺したものから作られた唯一の守り手で、誰にもそれを忘れさせない。'),
      signatureMoment: L('He reuses everything. Including blame.',
                         '他什麼都回收再利用。包括責怪。',
                         '他什么都回收再利用。包括责怪。','เขาใช้ทุกอย่างซ้ำ รวมทั้งการโทษกัน','彼は何でも再利用する。責めることまで。'),
      gallery: [
        L('Portrait', '主視覺', '主视觉', 'ภาพหลัก', 'メインビジュアル'),
        L('Three-view sheet', '三視圖', '三视图', 'แผนภาพสามมุม', '三面図'),
        L('Hinge detail', '鉸鏈細節', '铰链细节', 'รายละเอียดบานพับ', 'ヒンジのディテール'),
        L('Expression set', '表情集', '表情集', 'ชุดสีหน้า', '表情集')
      ],
      downloads: [L('Wallpaper', '桌布', '壁纸', 'วอลเปเปอร์', '壁紙'), L('Sticker', '貼圖', '贴图', 'สติกเกอร์', 'スタンプ'), L('Share card', '分享卡', '分享卡', 'การ์ดแชร์', 'シェアカード')],
      theme: { base: '#F5A661', deep: '#C97B38', glow: '#FF8A4C', ink: '#020202' }
    },
    {
      slug: 'bubi',
      name: 'Bubi',
      nameAlt: L('Bubi', '布比', '布比', 'บูบี', 'ブビ'),
      index: 6,
      symbol: L('Water & Emotion', '水與情緒', '水与情绪', 'น้ำและอารมณ์', '水と感情'),
      power: L('Water / Emotion', '水 / 情緒', '水 / 情绪', 'น้ำ / อารมณ์', '水 / 感情'),
      role: L('Guardian of Feeling', '感受守護者', '感受守护者', 'ผู้พิทักษ์ความรู้สึก', '感情の守り手'),
      tagline: L('Let it flow. It was never yours to keep.',
                 '讓它流走。它從來就不是你能留住的。',
                 '让它流走。它从来就不是你能留住的。','ปล่อยให้มันไหล มันไม่เคยเป็นของคุณที่จะเก็บไว้','流していい。それはもともと君が持つものじゃない。'),
      shortLine: L('Flow. Emotion. Healing.', '流動、情緒、療癒。', '流动、情绪、疗愈。', 'การไหล อารมณ์ การฟื้นคืน', '流れ。感情。癒し。'),
      personality: L('Fluid / Empathetic / Hard to pin down', '流動 / 共感 / 難以捉摸', '流动 / 共感 / 难以捉摸', 'ไหลเป็นน้ำ / เข้าใจคนอื่น / จับตัวยาก', '流動的 / 共感する / つかみどころがない'),
      likes: L('Rain / Long conversations / Being near Pinki', '雨 / 長談 / 待在平奇身邊', '雨 / 长谈 / 待在平奇身边', 'ฝน / การคุยยาวๆ / อยู่ใกล้Pinki', '雨 / 長い会話 / Pinkiのそばにいること'),
      dislikes: L('Suppression / Being told to calm down', '壓抑 / 被叫去冷靜', '压抑 / 被叫去冷静', 'การกดทับ / การถูกบอกให้เงียบลง', '抑強 / 落ち着けと言われること'),
      fear: L('Feeling nothing at all', '什麼都感覺不到', '什么都感觉不到', 'ไม่รู้สึกอะไรเลย', '何も感じなくなること'),
      mission: L('Let nothing be swallowed and lost',
                 '不讓任何感受被吞下去然後消失',
                 '不让任何感受被吞下去然后消失','อย่าให้อะไรถูกกลืนลงแล้วหายไป','どんな感情も感じなくなって失われないように'),
      ability: L('Tide Read — reads an emotion and lets it move instead of holding it',
                 '潮讀 —— 讀取情緒，讓它流動而不是把它抓住',
                 '潮读 —— 读取情绪，让它流动而不是把它抓住','อ่านน้ำขึ้นน้ำลง — อ่านอารมณ์แล้วปล่อยให้มันไหล ไม่ใช่กักมันไว้','潮読み — 感情を読み取り、抱え込むのではなく流してやる'),
      primaryEmotion: L('Sadness / Relief / Joy', '悲傷 / 釋然 / 喜悅', '悲伤 / 释然 / 喜悦', 'ความเศร้า / ความโล่งใจ / ความยิ้มแย้ม', '悲しさ / 安心 / 喜び'),
      origin: L(
        'Bubi seeped out of the last ocean on FURI PLANET, after the water had already been written off as gone.',
        '布比從 FURI PLANET 最後一片海洋中滲出來 —— 那時候水早已被認定為消失了。',
        '布比从 FURI PLANET 最后一片海洋中渗出来 —— 那时候水早已被认定为消失了。','Bubiซึมออกมาจากมหาสมุทรแห่งสุดท้ายบน FURI PLANET หลังจากที่น้ำถูกบันทึกไปแล้วว่าหมดไปแล้ว','Bubiは、水がもう失われたものとされた後に、FURI PLANET の最後の海から渗み出てきた。'),
      origin2: L(
        'Where the others hold things — memory, light, seed, material — Bubi lets them go.',
        '其他人抓住東西 —— 記憶、光、種子、物質 —— 布比則讓它們離開。',
        '其他人抓住东西 —— 记忆、光、种子、物质 —— 布比则让它们离开。','ที่ที่คนอื่นกอดสิ่งต่างๆ — ความจำ แสง เม็ดพันธุ์ วัตถุ — Bubiปล่อยมันไป','他の守り手がさまざまなものを抱えるのに対し、— 記憶、光、種、物質 — Bubiは放してやる。'),
      signatureMoment: L('He is the only guardian who cries, and the only one who is not ashamed of it.',
                         '他是唯一會哭的守護者，也是唯一不為此感到羞愧的。',
                         '他是唯一会哭的守护者，也是唯一不为此感到羞愧的。','เขาเป็นผู้พิทักษ์เดียวที่ร้องไห้ และเป็นคนเดียวที่ไม่อยู่กับมัน','彼は涙を流す唯一の守り手で、それを恥じていない唯一の守り手だ。'),
      gallery: [
        L('Portrait', '主視覺', '主视觉', 'ภาพหลัก', 'メインビジュアル'),
        L('Three-view sheet', '三視圖', '三视图', 'แผนภาพสามมุม', '三面図'),
        L('Tide detail', '潮汐細節', '潮汐细节', 'รายละเอียดคลื่นน้ำ', '潮のディテール'),
        L('Expression set', '表情集', '表情集', 'ชุดสีหน้า', '表情集')
      ],
      downloads: [L('Wallpaper', '桌布', '壁纸', 'วอลเปเปอร์', '壁紙'), L('Sticker', '貼圖', '贴图', 'สติกเกอร์', 'スタンプ'), L('Share card', '分享卡', '分享卡', 'การ์ดแชร์', 'シェアカード')],
      theme: { base: '#6AC9CD', deep: '#47999E', glow: '#55C8F0', ink: '#020202' }
    }
  ];

  /* ---- relationship system (brief §7) ---------------------------------- *
   * Editable: the brief marks these pairings as 待最終確認 (to be confirmed).
   * Adding an entry automatically draws a new line on the relationship map.
   * -------------------------------------------------------------------- */
  var RELATION_TYPES = {
    bestFriend: L('Best friends', '摯友', '挚友', 'เพื่อนสนิท', '親友'),
    conflict:   L('Tension', '衝突', '冲突', 'ความตึงเครียด', '緊張'),
    protector:  L('Protects', '守護', '守护', 'ปกป้อง', '守る'),
    complement: L('Complementary', '互補', '互补', 'เติมกัน', '補い合う'),
    learnsFrom: L('Learns from', '向其學習', '向其学习', 'เรียนรู้จาก', '学ぶ'),
    team:       L('Team role', '團隊角色', '团队角色', 'บทบาทในทีม', 'チームの役割')
  };

  var RELATIONS = [
    { from: 'pinki', to: 'bubi', type: 'bestFriend',
      text: L('The loud heart and the open water. She feels it first; he lets it out.',
              '喧鬧的心與敞開的水。她先感受到，他則讓它流出去。',
              '喧闹的心与敞开的水。她先感受到，他则让它流出去。','หัวใจที่ดังก้องกับผืนน้ำที่เปิดกว้าง เธอรู้สึกก่อน ส่วนเขาปล่อยมันออกมา','さらけ出す心と、開かれた水。彼女が先に感じ、彼が流し出す。') },
    { from: 'winggo', to: 'fluffu', type: 'protector',
      text: L('He flies the dead routes so she never has to. She is the reason he comes back.',
              '他飛越死去的航線，讓她永遠不必去。而她是他回來的理由。',
              '他飞越死去的航线，让她永远不必去。而她是他回来的理由。','เขาบินเส้นทางที่ตายแล้วเพื่อให้เธอไม่ต้องไปเลย และเธอคือเหตุผลที่เขากลับมา','彼は死んだ航路を飛ぶ。彼女が行かなくてすむように。彼が戻ってくる理由は彼女だ。') },
    { from: 'boxo', to: 'fluffu', type: 'complement',
      text: L('He rebuilds the ground. She plants in it. Neither works alone.',
              '他重建土地，她在其中種植。少一個都不成立。',
              '他重建土地，她在其中种植。少一个都不成立。','เขาสร้างพื้นดินขึ้นใหม่ เธอปลูกลงในนั้น ขาดใครคนหนึ่งก็ไม่สำเร็จ','彼が地を築き、彼女がそこに植える。どちらも一人では動かない。') },
    { from: 'furi-prince', to: 'pinki', type: 'learnsFrom',
      text: L('He remembers everything and feels nothing. She is teaching him the second part.',
              '他記得一切，卻什麼都感覺不到。她正在教他第二部分。',
              '他记得一切，却什么都感觉不到。她正在教他第二部分。','เขาจดจำทุกอย่างแต่ไม่รู้สึกอะไร ส่วนเธอกำลังสอนส่วนที่สองให้เขา','彼は何でも覚えているが、何も感じない。彼女がその二つ目を教えている。') },
    { from: 'furi-prince', to: 'boxo', type: 'conflict',
      text: L('Boxo melts the past into new material. The Prince will not let him near the archive.',
              '盒子把過去熔成新材料。皇子不讓他靠近檔案。',
              '盒子把过去熔成新材料。皇子不让他靠近档案。','Boxoหลอมอดีตให้กลายเป็นวัตถุใหม่ แต่พรินซ์ไม่ยอมให้เขาเข้าใกล้คลัง','Boxoは過去を溶かして新しい素材にする。プリンスは彼を記録に近づけない。') },
    { from: 'winggo', to: 'bubi', type: 'conflict',
      text: L('Winggo wants to fix it now. Bubi wants it to be felt first. They are both right.',
              '溫果想立刻修好它，布比想先讓它被感受。他們兩個都對。',
              '温果想立刻修好它，布比想先让它被感受。他们两个都对。','Winggoอยากซ่อมแซมตอนนี้ Bubiอยากให้มันถูกรู้สึกก่อน ทั้งสองคนต่างก็ถูก','Winggoは今すぐ直したい。Bubiはまず感じてほしい。両方正しい。') }
  ];

  /* ---- philosophy (brief §4 module 04) --------------------------------- */
  var PHILOSOPHY = [
    { id: 'see',         step: '01', title: L('See it', '看見它', '看见它', 'มองเห็นมัน', '見つめる'),
      text: L('Name the feeling before it names you.', '在意緒定義你之前，先定義它。', '在情绪定义你之前，先定义它。', 'เรียกชื่อความรู้สึกก่อนที่มันจะเรียกชื่อคุณ', '感情に名前をつける。名前をつけられる前に。') },
    { id: 'understand',  step: '02', title: L('Understand it', '理解它', '理解它', 'เข้าใจมัน', '理解する'),
      text: L('Ask where it came from. It always came from somewhere real.', '問它從哪裡來。它總是來自某個真實的地方。', '问它从哪里来。它总是来自某个真实的地方。', 'ถามว่ามันมาจากไหน มันมาจากที่จริงเสมอ', 'どこから来たのか聞く。きっと本当の場所から来ている。') },
    { id: 'express',     step: '03', title: L('Express it', '表達它', '表达它', 'แสดงมันออกมา', '表現する'),
      text: L('Draw it, say it, move it. Unspoken anger does not disappear.', '畫出來、說出來、動起來。沒說出口的憤怒不會消失。', '画出来、说出来、动起来。没说出口的愤怒不会消失。', 'วาดมัน พูดมัน ขยับมัน ความโกรธที่ไม่ได้พูดออกมาไม่ได้หายไป', '描く、言う、動く。言わなかった怒りは消えない。') },
    { id: 'release',     step: '04', title: L('Release it', '釋放它', '释放它', 'ปล่อยมัน', '放つ'),
      text: L('Let it move through you instead of living in you.', '讓它穿過你，而不是住進你。', '让它穿过你，而不是住进你。', 'ปล่อยให้มันเคลื่อนผ่านตัวคุณ ไม่ใช่เข้ามาอาศัยอยู่ในตัวคุณ', '中に住ませるのではなく、通り抜けさせる。') },
    { id: 'transform',   step: '05', title: L('Transform it', '轉化它', '转化它', 'เปลี่ยนมัน', '変える'),
      text: L('Turn anger into the power to protect and change.', '把憤怒變成守護與改變的力量。', '把愤怒变成守护与改变的力量。', 'เปลี่ยนความโกรธให้เป็นพลังที่จะปกป้องและเปลี่ยนแปลง', '怒りを、守り、変える力にする。') }
  ];

  /* ---- Emotion Lab (brief §4 module 05) -------------------------------- */
  var EMOTIONS = [
    { id: 'angry',   emoji: '😡', label: L('Angry', '憤怒', '愤怒', 'โกรธ', '怒り'),
      character: 'furi-prince',
      line: L('Remember what you are protecting.',
              '記住你在守護什麼。',
              '记住你在守护什么。','จดจำสิ่งที่คุณกำลังปกป้องอยู่','君が守っているものを、思い出して。') },
    { id: 'sad',     emoji: '😢', label: L('Sad', '難過', '难过', 'เส้า', '悲しい'),
      character: 'bubi',
      line: L('Let it flow. It was never yours to keep.',
              '讓它流走。它從來就不是你能留住的。',
              '让它流走。它从来就不是你能留住的。','ปล่อยให้มันไหล มันไม่เคยเป็นของคุณที่จะเก็บไว้','流していい。それはもともと君が持つものじゃない。') },
    { id: 'anxious', emoji: '😰', label: L('Anxious', '焦慮', '焦虑', 'กังวลใจ', '不安'),
      character: 'winggo',
      line: L('The light is still on. I checked today.',
              '光還亮著。我今天確認過了。',
              '光还亮着。我今天确认过了。','แสงยังเปิดอยู่ วันนี้ฉันตรวจแล้ว','光はまだ点ってる。今日確かめた。') },
    { id: 'tired',   emoji: '😴', label: L('Tired', '疲倦', '疲倦', 'เหนื่อย', '疲れた'),
      character: 'fluffu',
      line: L('Rest. Then grow. Not both at once.',
              '先休息，再成長。不要同時做兩件事。',
              '先休息，再成长。不要同时做两件事。','พักก่อน แล้วค่อยเติบโต ไม่ใช่ทำทั้งสองอย่างพร้อมกัน','休む。それから育つ。両方一度には無理。') },
    { id: 'happy',   emoji: '🥰', label: L('Happy', '開心', '开心', 'มีความสุข', '嬉しい'),
      character: 'pinki',
      line: L('Keep the beat. Everyone can hear it.',
              '保持這個節奏。大家都聽得到。',
              '保持这个节奏。大家都听得到。','รักษาจังหวะไว้ ทุกคนได้ยินมัน','リズムを保って。みんな聞こえてる。') },
    { id: 'empty',   emoji: '😶', label: L('Empty', '空白', '空白', 'ว่างเปล่า', '空っぽ'),
      character: 'boxo',
      line: L('Nothing here is wasted. Not even this.',
              '這裡沒有東西是浪費的。連這個也不是。',
              '这里没有东西是浪费的。连这个也不是。','ที่นี่ไม่มีอะไรเสียเปล่า แม้แต่สิ่งนี้ก็ยังมีค่า','ここでは何も無駄にならない。これさえも。') }
  ];

  /* ---- FURI PLANET story scroll (brief §4 module 02, §8) --------------- */
  var PLANET_SCENES = [
    { id: 'before', step: '01',
      title: L('A planet with everything', '什麼都有的星球', '什么都有的星球', 'ดาวที่มีทุกสิ่ง', '何もかもあった星'),
      text: L('FURI PLANET was rich the way very few worlds are — water, ore, soil, and a light that reached the ground. Life did not struggle there. It sprawled.',
              'FURI PLANET 的豐饒是極少數世界才有的 —— 水、礦、土壤，還有一種能照到地面的光。那裡的生命不必掙扎，只是蔓延。',
              'FURI PLANET 的丰饶是极少数世界才有的 —— 水、矿、土壤，还有一种能照到地面的光。那里的生命不必挣扎，只是蔓延。','FURI PLANET อุดมสมบูรณ์ในแบบที่มีเพียงไม่กี่โลกจะมี — น้ำ แร่แม่ ดิน และแสงที่ส่องถึงพื้นดิน ชีวิตที่นั่นไม่ต้องดิ้นรน แค่แผ่ขยายไปเอง','FURI PLANET は、ほとんどの世界が持たないほど豊かだった—水、鉱石、土、そして地に届く光。そこで生命は苦しまなかった。ただ広がっていた。') },
    { id: 'extraction', step: '02',
      title: L('Then someone did the maths', '然後有人算了一筆帳', '然后有人算了一笔账', 'แล้วก็มีคนคิดเลขขึ้นมา', 'そして誰かが計算した'),
      text: L('The extraction fleets arrived with contracts. They took the core, the water and the light, and they called it development.',
              '掠奪艦隊帶著合約抵達。他們取走了核心、水和光，並稱之為開發。',
              '掠夺舰队带着合约抵达。他们取走了核心、水和光，并称之为开发。','กองเรือบักตัดมาถึงพร้อมสัญญา พวกเขาเอาแกน น้ำ และแสงไป แล้วเรียกสิ่งนั้นว่าการพัฒนา','掴奪艘隊は契約を持って来た。核と水と光を持ち去り、それを開発と呼んだ。') },
    { id: 'collapse', step: '03',
      title: L('The planet let go', '星球放手了', '星球放手了', 'ดาวปล่อยมือ', '星が手を離した'),
      text: L('Nothing dramatic. The ground stopped holding, the sky stopped arriving, and the green went out in less than one season.',
              '沒有什麼戲劇性的事。地面不再撐住，天空不再到來，綠色在不到一個季節裡就熄滅了。',
              '没有什么戏剧性的事。地面不再撑住，天空不再到来，绿色在不到一个季节里就熄灭了。','ไม่มีอะไรดูตื่นเต้น พื้นดินไม่ยึดเหนี่ยวอีก ท้องฟ้าไม่มาอีก และสีเขียวดับลงในไม่ถึงหนึ่งฤดู','劇的なことは何もなかった。地は支えるのをやめ、空は来なくなり、緑は一季節もたたないうちに消えた。') },
    { id: 'six', step: '04',
      title: L('Only six remain', '只剩下六個', '只剩下六个', 'เหลือเพียงหกคน', '残ったのは六人だけ'),
      text: L('Six did not leave. Each of them took one thing that could not be replaced, and each of them has been carrying it since.',
              '有六個沒有離開。他們各自帶走了一樣無法被取代的東西，並且從那時起一直帶著它。',
              '有六个没有离开。他们各自带走了一样无法被取代的东西，并且从那时起一直带着它。','มีหกคนที่ไม่ได้ไป แต่ละคนพาสิ่งหนึ่งที่ไม่สามารถทดแทนได้ไปด้วย และแต่ละคนก็แบกมันไว้ตั้งแต่นั้นมา','六人は去らなかった。それぞれが代わりのきかないものを一つずつ持ち、そのひとつをずっと抱えている。') },
    { id: 'mission', step: '05',
      title: L('Mission', '任務', '任务', 'ภารกิจ', '使命'),
      text: L('Hold the pieces until the pieces can be put back together. That is the whole plan. Nobody promised it would work.',
              '守住這些碎片，直到碎片能被重新拼起來。這就是全部的計畫。沒有人保證它會成功。',
              '守住这些碎片，直到碎片能被重新拼起来。这就是全部的计划。没有人保证它会成功。','ถือชิ้นส่วนไว้จนกว่าจะประกอบมันกลับคืนได้ นั่นคือแผนทั้งหมด ไม่มีใครรับปากว่ามันจะสำเร็จ','ピースを、もう一度組み立てるまで持ち続ける。それが全部の計画。うまくいくとは誰も約束していない。') }
  ];

  /* ---- Stories / FURI Universe (brief §9) ------------------------------ */
  var STORIES = [
    { id: 'ep01', ep: 'EP01', type: 'animation', status: 'coming-soon', duration: '45s',
      title: L('The Last Day of FURI PLANET', 'FURI PLANET 的最後一天', 'FURI PLANET 的最后一天', 'วันสุดท้ายของ FURI PLANET', 'FURI PLANET の最後の日'),
      logline: L('The sky goes out in the middle of an ordinary afternoon.',
                  '天空在一個平凡的午後熄滅了。',
                  '天空在一个平凡的午后熄灭了。','ท้องฟ้าดับสนิทกลางบ่ายวันธรรมดา','何でもない午後の真ん中で、空が消えた。'),
      characters: ['furi-prince', 'pinki'] },
    { id: 'ep02', ep: 'EP02', type: 'comic', status: 'coming-soon', duration: '12 pages',
      title: L('Only Six Remain', '只剩六個', '只剩六个', 'เหลือเพียงหกคน', '残されたのは六人'),
      logline: L('Six survivors meet for the first time and immediately disagree.',
                  '六個倖存者第一次見面，並且立刻意見不合。',
                  '六个幸存者第一次见面，并且立刻意见不合。','ผู้รอดชีวิตหกคนพบกันครั้งแรก แล้วก็เห็นต่างกันทันที','六人の生き残りが初めて出会い、すぐに意見が分かれた。'),
      characters: ['furi-prince', 'pinki', 'winggo', 'fluffu', 'boxo', 'bubi'] },
    { id: 'ep03', ep: 'EP03', type: 'animation', status: 'coming-soon', duration: '60s',
      title: L('The Last Seed', '最後的種子', '最后的种子', 'เม็ดพันธุ์สุดท้าย', '最後の種'),
      logline: L('Fluffu is asked to open the vault. She says no eleven times.',
                  '有人要求芙芙打開種子庫。她拒絕了十一次。',
                  '有人要求芙芙打开种子库。她拒绝了十一次。','มีคนขอให้Fluffuเปิดคลัง เธอปฏิเสธสิบเอ็ดครั้ง','Fluffuは倉庫を開けるように言われる。彼女は十一回断った。'),
      characters: ['fluffu', 'boxo', 'winggo'] },
    { id: 'ep04', ep: 'EP04', type: 'comic', status: 'coming-soon', duration: '16 pages',
      title: L('Memory of Furi Prince', '皇子的記憶', '皇子的记忆', 'ความจำของFuri Prince', 'Furi Princeの記憶'),
      logline: L('The archive is incomplete, and he is the only one who knows which part is missing.',
                  '檔案並不完整，而他是唯一知道缺了哪一部分的人。',
                  '档案并不完整，而他是唯一知道缺了哪一部分的人。','คลังข้อมูลไม่สมบูรณ์ และเขาเป็นคนเดียวที่รู้ว่าขาดส่วนไหนไป','記録は完全ではない。どこが欠けているか知っているのは彼だけだ。') },
    { id: 'ep05', ep: 'EP05', type: 'animation', status: 'coming-soon', duration: '40s',
      title: L('Pinki and the Last Heartbeat', '平奇與最後的心跳', '平奇与最后的心跳', 'Pinkiกับเสียงหัวใจเต้นครั้งสุดท้าย', 'Pinkiと最後の心跳'),
      logline: L('Her pulse stops for four seconds. Everyone feels it.',
                  '她的脈搏停了四秒。所有人都感覺到了。',
                  '她的脉搏停了四秒。所有人都感觉到了。','ชีพจรของเธอหยุดเต้นสี่วินาที ทุกคนรู้สึกได้','彼女の脈が四秒止まった。みんな感じた。') },
    { id: 'ep06', ep: 'EP06', type: 'animation', status: 'coming-soon', duration: '75s',
      title: L('When Anger Becomes Power', '當憤怒成為力量', '当愤怒成为力量', 'เมื่อความโกรธกลายเป็นพลัง', '怒りが力になるとき'),
      logline: L('The philosophy, in one sequence, with no narration.',
                  '整個理念，用一段畫面說完，沒有旁白。',
                  '整个理念，用一段画面说完，没有旁白。','แนวคิดทั้งหมด ในชุดภาพเดียว โดยไม่มีเสียงบรรยาย','この思想を、ナレーションなしの一つのシーンで。') }
  ];

  var STORY_TYPES = {
    animation: L('Mini animation', '短動畫', '短动画', 'อนิเมชันสั้น', 'ミニアニメ'),
    comic:     L('Comic', '漫畫', '漫画', 'การ์ตูน', 'コミック'),
    story:     L('Original story', '原創故事', '原创故事', 'เรื่องราวต้นฉบับ', 'オリジナルストーリー'),
    daily:     L('Furi Daily', 'FURI 日常', 'FURI 日常', 'FURI ประจำวัน', 'FURI の日々'),
    exhibition:L('Exhibition story', '展會故事', '展会故事', 'เรื่องเล่าในงานแสดง', '展示会の物語')
  };

  /* ---- Collections (brief §11.1) — all Concept, nothing claimed in stock */
  var COLLECTIONS = [
    { id: 'art-toys',   status: 'concept',
      title: L('Art Toys', '藝術玩具', '艺术玩具', 'อาร์ตทอย', 'アートトイ'),
      text: L('Vinyl and resin figures built from the same six silhouettes, with the outline rule intact at any scale.',
              '以同樣六個剪影製作的搪膠與樹脂公仔，無論尺寸大小都保持同一條輪廓線規則。',
              '以同样六个剪影制作的搪胶与树脂公仔，无论尺寸大小都保持同一条轮廓线规则。','ฟิกเกอร์ไวนิลและเรซินที่สร้างจากเงาทั้งหกแบบเดียวกัน โดยกฎเส้นรอบยังครบไม่ว่าจะขยายเท่าไหร่','同じ六つのシルエットから作るビニールとレジンのフィギュア。どんな尺でも輪廓線のルールはそのまま。') },
    { id: 'plush',      status: 'concept',
      title: L('Plush', '毛絨', '毛绒', 'ตุ๊กตาปลอม', 'ヌイグルミ'),
      text: L('Soft plush built to be held, not displayed. Boxo is heavier than he looks, on purpose.',
              '用來抱而不是用來展示的柔軟毛絨。盒子比看起來重，這是刻意的。',
              '用来抱而不是用来展示的柔软毛绒。盒子看起来重，这是刻意的。','ตุ๊กตานุ่มที่ทำมาเพื่อให้กอด ไม่ใช่เพื่อตั้งโชว์ Boxoหนักกว่าที่ดู และตั้งใจให้เป็นแบบนั้น','飾るためではなく、抱くための柔らかいヌイグルミ。Boxoは見た目より重い。意図的に。') },
    { id: 'fashion',    status: 'concept',
      title: L('Fashion', '服飾', '服饰', 'แฟชั่น', 'ファッション'),
      text: L('Apparel and accessories that use the six symbols rather than the six faces.',
              '使用六個符號、而不是六張臉的服裝與配件。',
              '使用六个符号、而不是六张脸的服装与配件。','เสื้อผ้าและเครื่องประดับที่ใช้สัญลักษณ์ทั้งหก แทนที่ใบหน้าทั้งหก','六つの顔ではなく、六つのシンボルを使う服とアクセサリー。') },
    { id: 'stationery', status: 'concept',
      title: L('Stationery', '文具', '文具', 'เครื่องเขียน', '文房具'),
      text: L('Notebooks, pens and desk objects, in the flat-fill palette.',
              '筆記本、筆與桌面物件，使用平塗色票。',
              '笔记本、笔与桌面物件，使用平涂色票。','สมุด ปากกา และของบนโต๊ะ ในโทนสีแบบลงสีทึบ','ノート、ペン、機辺の小物。塗りつぶしのパレットで。') },
    { id: 'drinkware',  status: 'concept',
      title: L('Drinkware', '飲具', '饮具', 'ภาชนะเครื่องดื่ม', 'ドリンクウェア'),
      text: L('Bottles, cups and cans. Bubi is the obvious one. We are trying not to do the obvious one.',
              '水瓶、杯子與罐裝。布比是最顯而易見的選擇，我們正試著不要做那個顯而易見的選擇。',
              '水瓶、杯子与罐装。布比是最显而易见的选择，我们正试着不要做那个显而易见的选择。','ขวด แก้ว และกระป๋อง Bubiคือตัวที่ชัดเจนที่สุด และเรากำลังพยายามไม่ทำสิ่งที่ชัดเจนนั้น','ボトル、カップ、缶。Bubiが一番分かりやすい。あえてそれを避けている。') },
    { id: 'lifestyle',  status: 'concept',
      title: L('Lifestyle', '生活', '生活', 'ไลฟ์สไตล์', 'ライフスタイル'),
      text: L('Home and travel objects for people who have already bought the plush.',
              '給已經買過毛絨的人用的家居與旅行物件。',
              '给已经买过毛绒的人用的家居与旅行物件。','ของใช้ในบ้านและการเดินทาง สำหรับคนที่ซื้อตุ๊กตาไปแล้ว','ヌイグルミをもう買った人のための、家と旅のもの。') },
    { id: 'digital',    status: 'coming-soon',
      title: L('Digital Collectibles', '數位收藏', '数字收藏', 'สิ่งสะสมดิจิตัล', 'デジタルコレクタブル'),
      text: L('Digital assets tied to the Emotion Lab results. No blockchain, no speculation — just something to keep.',
              '與情緒實驗室結果連動的數位資產。沒有區塊鏈，沒有炒作，只是留個紀念。',
              '与情绪实验室结果连动的数字资产。没有区块链，没有炒作，只是留个纪念。','สินค้าดิจิตัลที่ผูกกับผลลัพธ์จากห้องแล็บอารมณ์ ไม่มีบล็อกเชน ไม่มีการเก็งกำไร — เพียงแค่เก็บไว้เป็นที่ระลึก','感情ラボの結果と結びつくデジタル資産。ブロックチェーンも投機もなし—ただ残しておくもの。') },
    { id: 'collab-series', status: 'coming-soon',
      title: L('Collaboration Series', '聯名系列', '联名系列', 'ซีรีส์คอลแลบ', 'コラボシリーズ'),
      text: L('Reserved for confirmed partners only. Nothing is listed here until it is signed.',
              '僅保留給已確認的合作夥伴。在簽約之前，這裡不會列出任何東西。',
              '仅保留给已确认的合作伙伴。在签约之前，这里不会列出任何东西。','สงวนไว้สำหรับพาร์ทเนอร์ที่ยืนยันแล้วเท่านั้น จะไม่มีอะไรลงที่นี่จนกว่าจะเซ็นสัญญา','確定したパートナーのためだけの枠。署名するまで、ここには何も並ばない。') }
  ];

  /* ---- Collaborations (brief §11.2) — concepts, no partner logos ------- */
  var COLLAB_SECTORS = [
    { id: 'fashion',    title: L('Furi × Fashion', 'Furi × 時尚', 'Furi × 时尚', 'Furi × แฟชั่น', 'Furi × ファッション'),
      text: L('Silhouette-led apparel and accessories.', '以剪影為主的服裝與配件。', '以剪影为主的服装与配件。', 'เสื้อผ้าและเครื่องประดับที่ขับด้วยเงา', 'シルエットを主役にした服とアクセサリー。') },
    { id: 'beverage',   title: L('Furi × Beverage', 'Furi × 飲品', 'Furi × 饮品', 'Furi × เครื่องดื่ม', 'Furi × 飲料'),
      text: L('Cans, cups and limited flavours.', '罐裝、杯裝與限定口味。', '罐装、杯装与限定口味。', 'กระป๋อง ถ้วย และรสชาติจำกัด', '缶、カップ、限定味。') },
    { id: 'hotel',      title: L('Furi × Hotel', 'Furi × 酒店', 'Furi × 酒店', 'Furi × โรงแรม', 'Furi × ホテル'),
      text: L('Themed rooms and in-room objects.', '主題房與客房物件。', '主题房与客房物件。', 'ห้องพักธีมและของใช้ในห้อง', 'テーマルームと客室のもの。') },
    { id: 'mall',       title: L('Furi × Mall', 'Furi × 商場', 'Furi × 商场', 'Furi × ห้างสินค้า', 'Furi × モール'),
      text: L('Pop-ups, atriums and seasonal installations.', '快閃店、中庭與季節性裝置。', '快闪店、中庭与季节性装置。', 'ป็อปอัป โถงกลางห้าง และงานติดตั้งตามฤดู', 'ポップアップ、アトリウム、季節のインスタレーション。') },
    { id: 'education',  title: L('Furi × Education', 'Furi × 教育', 'Furi × 教育', 'Furi × การศึกษา', 'Furi × 教育'),
      text: L('Emotion-literacy materials built on the five philosophy steps.',
              '以五個理念步驟為基礎的情緒教育素材。',
              '以五个理念步骤为基础的情绪教育素材。','สื่อการเรียนรู้เรื่องอารมณ์ ที่สร้างจากห้าขั้นตอนของแนวคิด','五つの思想ステップを土台にした感情教育の素材。') },
    { id: 'esg',        title: L('Furi × ESG', 'Furi × ESG', 'Furi × ESG', 'Furi × ESG ความยั่งยืน', 'サステナビリティ'),
      text: L('Boxo is a recycling story that does not need to be explained twice.',
              '盒子本身就是一個不需要解釋兩次的回收故事。',
              '盒子本身就是一个不需要解释两次的回收故事。','Boxoคือเรื่องรีไซเคิลที่ไม่ต้องอธิบายสองครั้ง','Boxoは、二度説明しなくてもわかるリサイクルの物語。') },
    { id: 'technology', title: L('Furi × Technology', 'Furi × 科技', 'Furi × 科技', 'Furi × เทคโนโลยี', 'Furi × テクノロジー'),
      text: L('Interfaces, assistants and ambient characters.', '介面、助理與環境角色。', '界面、助理与环境角色。', 'อินเตอร์เฟส ผู้ช่วย และตัวละครที่อยู่รอบตัว', 'インターフェイス、アシスタント、周囲にいるキャラクター。') },
    { id: 'hologram',   title: L('Furi × Hologram', 'Furi × 全息', 'Furi × 全息', 'Furi × โฮโลแกรม', 'Furi × ホログラム'),
      text: L('Volumetric display of the six guardians for retail and events.',
              '為零售與活動提供的六位守護者立體顯示。',
              '为零售与活动提供的六位守护者立体显示。','การแสดงผู้พิทักษ์ทั้งหกแบบสามมิติ สำหรับงานค้าปลีกและงานอีเวนต์','展示とイベントのための、六人の立体表示。') }
  ];

  var PARTNERSHIP_TYPES = [
    { id: 'brand',       title: L('Brand Collaboration', '品牌聯名', '品牌联名', 'ความร่วมมือกับแบรนด์', 'ブランドコラボ') },
    { id: 'licensing',   title: L('Licensing', '授權', '授权', 'การให้ลิขสิทธิ์', 'ライセンス') },
    { id: 'retail',      title: L('Retail', '零售通路', '零售渠道', 'ร้านค้าปลีก', '小売') },
    { id: 'exhibition',  title: L('Exhibition', '展覽', '展览', 'นิทรรศการ', '展示会') },
    { id: 'animation',   title: L('Animation', '動畫', '动画', 'แอนิเมชัน', 'アニメーション') },
    { id: 'game',        title: L('Game', '遊戲', '游戏', 'เกม', 'ゲーム') },
    { id: 'advertising', title: L('Advertising', '廣告', '广告', 'โฆษณา', '広告') }
  ];

  /* ---- Licensing (brief §11.3) ---------------------------------------- */
  var LICENSING_CATEGORIES = [
    { id: 'toys',       title: L('Toys & Collectibles', '玩具與收藏品', '玩具与收藏品', 'ของเล่นและของสะสม', 'おもちゃとコレクタブル') },
    { id: 'fashion',    title: L('Fashion & Accessories', '服飾與配件', '服饰与配件', 'แฟชั่นและเครื่องประดับ', 'ファッションとアクセサリー') },
    { id: 'food',       title: L('Food & Beverage', '食品與飲品', '食品与饮品', 'อาหารและเครื่องดื่ม', '食品と飲料') },
    { id: 'stationery', title: L('Stationery & Publishing', '文具與出版', '文具与出版', 'เครื่องเขียนและการพิมพ์', '文房具と出版') },
    { id: 'digital',    title: L('Digital & Games', '數位與遊戲', '数字与游戏', 'ดิจิตัลและเกม', 'デジタルとゲーム') },
    { id: 'event',      title: L('Events & Location-based', '活動與實景娛樂', '活动与实景娱乐', 'งานอีเวนต์และสถานที่จริง', 'イベントとロケーション型') },
    { id: 'education',  title: L('Education & Wellbeing', '教育與身心健康', '教育与身心健康', 'การศึกษาและสุขภาพ', '教育とウェルビーイング') },
    { id: 'promotion',  title: L('Promotional', '推廣授權', '推广授权', 'สินค้าโปรโมชั่น', 'プロモーション') }
  ];

  var LICENSING_AUDIENCE = [
    { id: 'fans',      title: L('Designer-toy collectors', '潮玩收藏者', '潮玩收藏者', 'นักสะสมอาร์ตทอย', 'デザイナーズトイのコレクター'),
      text: L('Buy on character attachment and completeness.', '因為角色情感與完整性而購買。', '因为角色情感与完整性而购买。', 'ซื้อเพราะความผูกพันกับตัวละครและความครบชุด', 'キャラクターへの愛着とコンプリート度で買う。') },
    { id: 'young',     title: L('18–34 emotional-wellbeing audience', '18–34 歲情緒健康族群', '18–34 岁情绪健康人群', 'กลุ่มอายุ 18–34 ที่ดูแลสุขภาพจิต', '18–34 歳の心の健やかさを重んじる層'),
      text: L('Respond to the anger-into-power message.', '對「憤怒轉化為力量」的訊息有共鳴。', '对「愤怒转化为力量」的信息有共鸣。', 'ตอบสนองต่อสารที่ว่าความโกรธเปลี่ยนเป็นพลัง', '「怒りを力に」というメッセージに反応する。') },
    { id: 'gifting',   title: L('Gifting & desk culture', '送禮與桌面文化', '送礼与桌面文化', 'วัฒนธรรมการให้ของขวัญและโต๊ะทำงาน', '贈り物と機辺文化'),
      text: L('Small objects that carry a sentence.', '帶著一句話的小物件。', '带着一句话的小物件。', 'ของเล็กๆ ที่พาประโยคหนึ่งประโยคไว้', '一句を持ち歩く小さなもの。') },
    { id: 'b2b',       title: L('Brands needing an emotion story', '需要情緒故事的品牌', '需要情绪故事的品牌', 'แบรนด์ที่ต้องการเรื่องเล่าเกี่ยวกับอารมณ์', '感情の物語を必要とするブランド'),
      text: L('ESG, education and wellbeing campaigns.', 'ESG、教育與身心健康活動。', 'ESG、教育与身心健康活动。', 'แคมเปญ ESG ด้านสิ่งแวดล้อม สังคม และสุขภาพ', 'ESG、教育、ウェルビーイングのキャンペーン。') }
  ];

  var LICENSING_TERRITORIES_NOTE =
    L('Territory availability is not published yet. Tell us your market and we will confirm in writing.',
      '可合作地區尚未公佈。請告知您的市場，我們將以書面確認。',
      '可合作地区尚未公布。请告知您的市场，我们将以书面确认。','พื้นที่ที่เปิดให้ร่วมยังไม่ได้ประกาศ บอกตลาดของคุณมา แล้วเราจะยืนยันเป็นลายลักษณ์อักษร','対応地域はまだ公表していません。市場をお知らせください。書面で確認します。');

  /* ---- Creator (brief §12.1) ------------------------------------------ */
  var CREATOR = {
    name: 'Sherman',
    /* NEEDS-CONFIRM: bio specifics, portrait and credentials are placeholders. */
    isPlaceholder: true,
    portrait: '',
    role: L('Creator of FURI MONSTER', 'FURI MONSTER 創作者', 'FURI MONSTER 创作者', 'ผู้สร้าง FURI MONSTER', 'FURI MONSTER の制作者'),
    intro: L(
      'FURI MONSTER started with a bad day and a drawing tablet.',
      'FURI MONSTER 始於一個糟糕的日子和一台繪圖板。',
      'FURI MONSTER 始于一个糟糕的日子和一台绘图板。','FURI MONSTER เริ่มต้นจากวันที่แย่กับแท็บเล็ตวาดรูป','FURI MONSTER は、いいない日とペンタブレットから始まった。'),
    sections: [
      { id: 'why', step: '01', title: L('Why FURI was created', '為什麼創造 FURI', '为什么创造 FURI', 'ทำไมจึงสร้าง FURI', 'FURI を作った理由'),
        text: L('Anger is the emotion people are most often told to put away. That advice does not work, and it does not go anywhere. FURI exists to give it somewhere to go.',
                '憤怒是最常被要求收起來的情緒。這個建議沒有用，而且它哪裡也去不了。FURI 的存在，是為了給它一個可以去的地方。',
                '愤怒是最常被要求收起来的情绪。这个建议没有用，而且它哪里也去不了。FURI 的存在，是为了给它一个可以去的地方。','ความโกรธเป็นอารมณ์ที่คนมักถูกบอกให้เก็บไว้ซะมากที่สุด คำแนะนำนั้นไม่ได้ผล และความโกรธก็ไม่ได้ไปไหนเลย FURI มีอยู่เพื่อให้มันมีที่ไป','怒りは、いちばん「しまっておきなさい」と言われる感情だ。その助言は役に立たないし、怒りはどこへも行かない。FURI は、それの行き先を作るためにある。') },
      { id: 'from-anger', step: '02', title: L('From anger to creation', '從憤怒到創作', '从愤怒到创作', 'จากความโกรธสู่การสร้าง', '怒りから創造へ'),
        text: L('The first sketch was not cute. It was a shape that had been holding something in for too long. The six guardians came after — one for each thing worth keeping.',
                '第一張草圖並不可愛。它是一個把什麼東西憋得太久的形狀。六位守護者是後來才出現的 —— 每一隻代表一樣值得留下的東西。',
                '第一张草图并不可爱。它是一个把什么东西憋得太久的形状。六位守护者是后来才出现的 —— 每一只代表一样值得留下的东西。','ภาพร่างแรกไม่ได้น่ารัก มันเป็นรูปร่างที่เก็บกดบางสิ่งไว้นานเกินไป ผู้พิทักษ์ทั้งหกมาทีหลัง — หนึ่งตัวต่อสิ่งที่คุ้มค่าที่จะเก็บไว้','最初のラフはかわいくなかった。なかに何かを長く抱えすぎた形だった。六人の守り手はその後に生まれた—残す価値があるものに、ひとつずつ。') },
      { id: 'design-tech', step: '03', title: L('Design + technology + AI', '設計 + 科技 + AI', '设计 + 科技 + AI', 'การออกแบบ + เทคโนโลยี + AI', 'デザイン + テクノロジー + AI'),
        text: L('The characters, the outlines and the palette are supplied as original vector artwork, which means they stay identical from a 16-pixel sticker to a three-metre installation. AI is used in the studio the way a ruler is used — for the parts that should be repeatable, so the parts that should not be stay human.', '角色、輪廓與色票都以原創向量素材提供，這表示從 16 像素的貼圖到三公尺的裝置都完全一致。AI 在工作室裡的用途就像一把尺 —— 用在應該可重複的部分，好讓不該重複的部分保持人性。', '角色、轮廓与色票都以原创矢量素材提供，这意味着从 16 像素的贴图到三米的装置都完全一致。AI 在工作室里的用途就像一把尺 —— 用在应该可重复的部分，好让不该重复的部分保持人性。', 'ตัวละคร เส้นขอบ และชุดสี จัดทำเป็นงานเวกเตอร์ต้นฉบับ จึงคงที่ตั้งแต่สติกเกอร์ 16 พิกเซลถึงงานติดตั้งสามเมตร AI ในสตูดิโอใช้เหมือนไม้บรรทัด ใช้กับส่วนที่ควรทำซ้ำได้ เพื่อให้ส่วนที่ไม่ควรทำซ้ำยังเป็นมนุษย์', 'キャラクター・輪郭・パレットはすべてオリジナルのベクター素材でお届けするため、16ピクセルのステッカーから3メートルのインスタレーションまで同一です。スタジオでのAIは定規と同じで、繰り返すべき部分に使い、繰り返すべきでない部分は人の手に残します。') },
      { id: 'future', step: '04', title: L('The future of FURI', 'FURI 的未來', 'FURI 的未来', 'อนาคตของ FURI', 'FURI のこれから'),
        text: L('Animation, a playable world, and the Emotion Lab growing into something people actually use. The plan is to keep the six small enough to care about.',
                '動畫、一個可以玩的世界，以及讓情緒實驗室長成真正被人使用的東西。計畫是讓這六隻始終小到可以被在乎。',
                '动画、一个可以玩的世界，以及让情绪实验室长成真正被人使用的东西。计划是让这六只始终小到可以被在乎。','แอนิเมชัน โลกที่เล่นได้ และห้องแล็บอารมณ์ที่จะเติบโตไปเป็นสิ่งที่คนใช้จริง แผนคือเก็บคนทั้งหกให้เล็กพอที่จะให้คนห่วงได้','アニメーション、遊べる世界、そして、みんなが実際に使うものに育つ感情ラボ。六人を、大切に思えるくらい小さくしておくのが計画だ。') }
    ],
    experienceNote: L('Selected experience and exhibitions will be listed here once confirmed for publication.',
                      '精選經歷與展覽將於確認可公佈後列於此處。',
                      '精选经历与展览将于确认可公布后列于此处。','ประสบการณ์และนิทรรศการที่คัดเลือกจะลงที่นี่เมื่อยืนยันแล้วว่าเผยแพร่ได้','選ばれた経歴と展示会は、公表できることが確定したらここに記す。')
  };

  /* ---- News & Events (brief §12.2) ------------------------------------ *
   * SAMPLE entries, flagged so the page labels them unconfirmed. The brief
   * forbids claiming exhibitions, partners or dates that are not confirmed, so
   * each entry says only what is true of the site as built. No entry may carry
   * an instruction aimed at whoever maintains the site — that text used to be
   * visible to visitors.
   * -------------------------------------------------------------------- */
  var NEWS_CATEGORIES = {
    exhibition: L('Exhibition', '展覽', '展览', 'นิทรรศการ', '展示会'),
    collaboration: L('Collaboration', '合作', '合作', 'ความร่วมมือ', '協業'),
    media: L('Media', '媒體', '媒体', 'สื่อ', 'メディア'),
    release: L('Release', '發佈', '发布', 'การเปิดตัว', 'リリース'),
    behind: L('Behind the scenes', '幕後', '幕后', 'เบื้องหลังฉาก', 'メイキング')
  };

  var NEWS = [
    { id: 'n1', date: '2026-01-01', category: 'release', placeholder: true,
      title: L('Official website launch', '官方網站上線', '官网上线', 'เปิดเว็บไซต์ทางการ', '公式サイト公開'),
      text: L('The FURI MONSTER website opens with the story of FURI PLANET, the six guardians, the four-panel comic library and the Emotion Lab. Exhibition dates and partnerships are announced only once confirmed.',
              'FURI MONSTER 網站正式開放，包含 FURI PLANET 的故事、六位守護者、四格漫畫庫與情緒實驗室。展會日期與合作只在確認後才公佈。',
              'FURI MONSTER 网站正式开放，包含 FURI PLANET 的故事、六位守护者、四格漫画库与情绪实验室。展会日期与合作只在确认后才公布。','เว็บไซต์ FURI MONSTER เปิดแล้ว พร้อมเรื่องราวของ FURI PLANET ผู้พิทักษ์ทั้งหก คลังการ์ตูนสี่ช่อง และห้องแล็บอารมณ์ กำหนดการแสดงและความร่วมมือจะประกาศเมื่อยืนยันแล้วเท่านั้น','FURI MONSTER の公式サイトが公開。FURI PLANET の物語、六人の守護者、四コマ漫画ライブラリ、感情ラボを収録。展示会や協業は確定後のみ告知します。') },
    { id: 'n3', date: '2026-01-01', category: 'behind', placeholder: true,
      title: L('How the six were drawn', '六隻角色是怎麼畫出來的', '六只角色是怎么画出来的', 'ทั้งหกถูกวาดขึ้นมาได้อย่างไร', '六人はどう描かれたか'),
      text: L('A behind-the-scenes post about the outline rule and the flat-fill palette.',
              '一篇關於輪廓線規則與平塗色票的幕後文章。',
              '一篇关于轮廓线规则与平涂色票的幕后文章。','บทความเบื้องหลังเกี่ยวกับกฎเส้นรอบและชุดสีแบบลงสีเที่ยง','輪廓線のルールと塗りつぶしパレットについてのメイキング記事。') }
  ];

  /* ---- FURI LAB (brief §10) ------------------------------------------- */
  var LAB = [
    { id: 'emotion',   status: 'live',        phase: 1,
      title: L('Emotion Test', '情緒測試', '情绪测试', 'แบบทดสอบอารมณ์', '感情テスト'),
      text: L('Pick how you feel. Meet the guardian who carries it.', '選擇你現在的感受，認識承接它的守護者。', '选择你现在的感受，认识承接它的守护者。', 'เลือกว่าตอนนี้คุณรู้สึกอย่างไร แล้วพบผู้พิทักษ์ที่ดูแลความรู้สึกนั้น', '今の気持ちを選んで、それを抱える守り手に会おう。'),
      href: 'furi-lab.html#emotion', cta: L('Start', '開始', '开始', 'เริ่ม', 'スタート') },
    { id: 'personality', status: 'live',      phase: 1,
      title: L('Personality Quiz', '人格測驗', '人格测验', 'แบบทดสอบบุคลิกภาพ', '性格診断'),
      text: L('Eight questions. One of the six. No wrong answer.', '八個問題，六隻中的一隻。沒有錯誤答案。', '八个问题，六只中的一只。没有错误答案。', 'แปดคำถาม ได้หนึ่งในหกตัว ไม่มีคำตอบที่ผิด', '8問。六人のうちの一人。間違いなんてない。'),
      href: 'furi-lab.html#quiz', cta: L('Take the quiz', '開始測驗', '开始测验', 'ทำแบบทดสอบ', '診断を受ける') },
    { id: 'wallpapers', status: 'live',       phase: 1,
      title: L('Wallpapers', '桌布', '壁纸', 'วอลเปเปอร์', '壁紙'),
      text: L('Prepared from the original artwork at phone and desktop sizes.', '由原始素材製作手機與桌面尺寸。', '由原始素材制作手机与桌面尺寸。', 'เตรียมจากงานต้นฉบับทั้งขนาดมือถือและเดสก์ท็อป', '原本アートからスマホ用とPC用のサイズを用意しています。'),
      href: 'furi-lab.html#wallpapers', cta: L('Download', '下載', '下载', 'ดาวน์โหลด', 'ダウンロード') },
    { id: 'stickers',  status: 'live',        phase: 1,
      title: L('Stickers & GIFs', '貼圖與 GIF', '贴图与 GIF', 'สติกเกอร์และ GIF', 'スタンプと GIF'),
      text: L('Transparent PNG sticker sheets for chat apps.', '供聊天軟體使用的透明 PNG 貼圖包。', '供聊天软件使用的透明 PNG 贴图包。', 'ชุดสติกเกอร์ PNG พื้นโปร่งใสสำหรับแอปแชท', 'チャットアプリ向けの透明 PNG スタンプシート。'),
      href: 'furi-lab.html#stickers', cta: L('Download', '下載', '下载', 'ดาวน์โหลด', 'ダウンロード') },
    { id: 'colouring', status: 'live',        phase: 1,
      title: L('Colouring Pages', '著色頁', '涂色页', 'สีระบายภาพ', 'ぬりえ'),
      text: L('Line art derived from the original drawings — print it and colour it in.', '由原稿導出的線稿 —— 列印出來就可以著色。', '由原稿导出的线稿 —— 打印出来就可以涂色。', 'เส้นลายที่ดึงมาจากต้นฉบับ พิมพ์แล้วระบายสีได้เลย', '原画から書き出した線画。印刷してそのまま塗れます。'),
      href: 'furi-lab.html#colouring', cta: L('Print', '列印', '打印', 'พิมพ์', '印刷') },
    { id: 'ai',        status: 'coming-soon', phase: 2,
      title: L('AI Furi Generator', 'AI FURI 生成器', 'AI FURI 生成器', 'เครื่องสร้าง FURI ด้วย AI', 'AI FURI ジェネレーター'),
      text: L('Upload a photo, meet your Furi version. Needs a separate privacy design first.', '上傳照片，認識你的 FURI 版本。需要先完成獨立的隱私設計。', '上传照片，认识你的 FURI 版本。需要先完成独立的隐私设计。', 'อัปโหลดรูปถ่าย แล้วพบเวอร์ชัน FURI ของคุณ แต่ต้องออกแบบเรื่องความเป็นส่วนตัวก่อน', '写真をアップロードして、君の FURI を見つける。その前にプライバシー設計が必要。'),
      href: 'furi-lab.html#ai', cta: L('Coming soon', '即將推出', '即将推出', 'เร็วๆ นี้', '公開予定') }
  ];

  /* ---- FAQ (single source of truth) ----------------------------------- *
   * Rendered as the visible FAQ on the Furi Planet page, emitted as FAQPage
   * structured data, and used as the knowledge base for the on-site assistant.
   * One array, so the page, the schema and the assistant cannot drift apart.
   * `links` are optional follow-ups shown under an answer.
   * -------------------------------------------------------------------- */
  var FAQ = [
    { id: 'what',
      q: L('What is FURI MONSTER?', 'FURI MONSTER 是什麼？', 'FURI MONSTER 是什么？',
           'FURI MONSTER คืออะไร?', 'FURI MONSTER とは？'),
      a: L('FURI MONSTER is a character IP about turning anger into power. Six guardians each carry one way that anger needs to move: seen, understood, expressed, released, transformed. It is a world, a cast, and a method for handling an emotion people are usually told to hide.',
           'FURI MONSTER 是一個把憤怒轉化為力量的 IP。六位守護者各自承載憤怒需要走過的其中一步：被看見、被理解、被表達、被釋放、被轉化。它既是一個世界、一組角色，也是一套面對「通常被要求藏起來的情緒」的方法。',
           'FURI MONSTER 是一个把愤怒转化为力量的 IP。六位守护者各自承载愤怒需要走过的其中一步：被看见、被理解、被表达、被释放、被转化。它既是一个世界、一组角色，也是一套面对「通常被要求藏起来的情绪」的方法。',
           'FURI MONSTER คือ IP ตัวละครที่ว่าด้วยการเปลี่ยนความโกรธให้เป็นพลัง ผู้พิทักษ์ทั้งหกแต่ละตนดูแลหนึ่งขั้นที่ความโกรธต้องผ่าน: ถูกมองเห็น เข้าใจ แสดงออก ปล่อยวาง เปลี่ยนแปลง เป็นทั้งโลก ตัวละคร และวิธีรับมือกับอารมณ์ที่คนมักถูกบอกให้ซ่อน',
           'FURI MONSTER は、怒りを力に変えるキャラクターIPです。六人の守護者が、怒りが通るべき段階をひとつずつ担います——見られる、理解される、表現される、手放される、変わる。世界であり、キャラクターであり、普段は隠すように言われる感情への向き合い方です。') },
    { id: 'six',
      q: L('Who are the six guardians?', '六位守護者是誰？', '六位守护者是谁？',
           'ผู้พิทักษ์ทั้งหกคือใคร?', '六人の守護者とは？'),
      a: L('Furi Prince carries memory, Pinki carries connection, Winggo carries nature\u2019s light, Fluffu carries growth, Boxo carries the cycle, and Bubi carries feeling. Their names are written in Latin script in every language; the localised forms are shown alongside on each character page.',
           'Furi Prince 承載記憶，Pinki 承載連結，Winggo 承載自然之光，Fluffu 承載成長，Boxo 承載循環，Bubi 承載感受。他們的名字在每個語言中都寫成拉丁字母；各地語言的寫法會在各自的角色頁並列顯示。',
           'Furi Prince 承载记忆，Pinki 承载连接，Winggo 承载自然之光，Fluffu 承载成长，Boxo 承载循环，Bubi 承载感受。他们的名字在每个语言中都写成拉丁字母；各地语言的写法会在各自的角色页并列显示。',
           'Furi Prince ดูแลความทรงจำ Pinki ดูแลความเชื่อมโยง Winggo ดูแลแสงแห่งธรรมชาติ Fluffu ดูแลการเติบโต Boxo ดูแลวัฏจักร และ Bubi ดูแลความรู้สึก ชื่อของพวกเขาเขียนด้วยอักษรละตินในทุกภาษา ส่วนรูปแบบท้องถิ่นแสดงคู่กันในหน้าตัวละครแต่ละตน',
           'Furi Prince は記憶、Pinki はつながり、Winggo は自然の光、Fluffu は成長、Boxo は循環、Bubi は感情を担います。名前はどの言語でもラテン文字で表記し、各国語の表記は各キャラクターページに併記しています。'),
      links: [{ href: 'characters.html',
        label: L('Meet the six', '認識六位守護者', '认识六位守护者', 'พบผู้พิทักษ์ทั้งหก', '六人に会う') }] },
    { id: 'creator',
      q: L('Who created FURI MONSTER?', '誰創造了 FURI MONSTER？', '谁创造了 FURI MONSTER？',
           'ใครสร้าง FURI MONSTER?', 'FURI MONSTER を作ったのは？'),
      a: L('Sherman, and it started with a bad day and a drawing tablet. The creator page tells the story rather than listing a CV.',
           '是 Sherman，起點是一個糟糕的日子和一台繪圖板。創作者頁說的是這個故事，而不是一份履歷。',
           '是 Sherman，起点是一个糟糕的日子和一块绘图板。创作者页说的是这个故事，而不是一份简历。',
           'Sherman เริ่มจากวันที่แย่กับแท็บเล็ตวาดรูป หน้าผู้สร้างเล่าเรื่องนั้นมากกว่าจะเป็นประวัติย่อ',
           'Sherman です。始まりは、いいない日とペンタブレットでした。クリエイターページでは経歴ではなく、その物語を紹介しています。'),
      links: [{ href: 'creator.html',
        label: L('Read the creator story', '閱讀創作者的故事', '阅读创作者的故事', 'อ่านเรื่องของผู้สร้าง', 'クリエイターの物語を読む') }] },
    { id: 'licensing',
      q: L('Is FURI MONSTER available for licensing?', 'FURI MONSTER 可以授權嗎？', 'FURI MONSTER 可以授权吗？',
           'FURI MONSTER ให้ลิขสิทธิ์ได้ไหม?', 'FURI MONSTER のライセンスは可能？'),
      a: L('Yes. Toys and collectibles, fashion and accessories, food and beverage, stationery and publishing, digital and games, events and location-based projects, education and wellbeing.',
           '可以。包括玩具與收藏品、服飾與配件、食品與飲品、文具與出版、數位與遊戲、活動與實景娛樂、教育與身心健康。',
           '可以。包括玩具与收藏品、服饰与配件、食品与饮品、文具与出版、数字与游戏、活动与实景娱乐、教育与身心健康。',
           'ได้ ทั้งของเล่นและของสะสม แฟชั่นและเครื่องประดับ อาหารและเครื่องดื่ม เครื่องเขียนและการพิมพ์ ดิจิตัลและเกม งานอีเวนต์และสถานที่จริง การศึกษาและสุขภาพ',
           '可能です。おもちゃとコレクタブル、ファッションとアクセサリー、食品と飲料、文房具と出版、デジタルとゲーム、イベントとロケーション型、教育とウェルビーイング。'),
      links: [{ href: 'licensing.html',
        label: L('Licensing categories and how to start', '授權類別與洽談方式', '授权类别与洽谈方式', 'หมวดหมู่ลิขสิทธิ์และวิธีเริ่มต้น', 'ライセンスのカテゴリーと始め方') }] },
    { id: 'languages',
      q: L('What languages is this site in?', '這個網站有哪幾種語言？', '这个网站有哪几种语言？',
           'เว็บไซต์นี้มีกี่ภาษา?', 'このサイトの言語は？'),
      a: L('Five: English, Traditional Chinese, Simplified Chinese, Thai and Japanese. Switch at any time from the header — every page carries all five, so nothing reloads and no page is a translation of another.',
           '五種：英文、繁體中文、簡體中文、泰文與日文。可隨時在頁首切換 —— 每一頁都同時包含五種語言，所以不會重新載入，也沒有哪一頁是另一頁的翻譯。',
           '五种：英文、繁体中文、简体中文、泰文与日文。可随时在页首切换 —— 每一页都同时包含五种语言，所以不会重新加载，也没有哪一页是另一页的翻译。',
           'ห้าภาษา: อังกฤษ จีนตัวเต็ม จีนตัวย่อ ไทย และญี่ปุ่น สลับได้ทุกเมื่อจากส่วนหัว ทุกหน้ามีทั้งห้าภาษา จึงไม่ต้องโหลดใหม่ และไม่มีหน้าใดเป็นการแปลของอีกหน้า',
           '5言語：英語・繁体字中国語・簡体字中国語・タイ語・日本語。ヘッダーからいつでも切り替えられます。すべてのページが5言語を併せ持つため、再読み込みは不要で、どれかのページが別のページの翻訳という関係でもありません。') },
    { id: 'buy',
      q: L('Can I buy FURI MONSTER products?', '可以買到 FURI MONSTER 產品嗎？', '可以买到 FURI MONSTER 产品吗？',
           'ซื้อสินค้า FURI MONSTER ได้ไหม?', 'FURI MONSTER の商品は買えますか？'),
      a: L('Not yet. The collections on this site are concept directions, and nothing is on sale. A shop is planned; the order buttons stay disabled until then rather than taking an order that cannot be fulfilled.',
           '暫時未可以。本網站的系列屬於概念方向，目前沒有任何商品發售。網店已在規劃中；在此之前訂購按鈕會保持停用，而不會接受無法履行的訂單。',
           '暂时未可以。本网站的系列属于概念方向，目前没有任何商品发售。网店已在规划中；在此之前订购按钮会保持停用，而不会接受无法履行的订单。',
           'ยังไม่ได้ คอลเลกชันบนเว็บนี้เป็นแนวคิด ยังไม่มีสินค้าจำหน่าย มีแผนจะเปิดร้าน ปุ่มสั่งซื้อจะปิดไว้จนถึงตอนนั้น แทนที่จะรับออร์เดอร์ที่ส่งของไม่ได้',
           'まだです。このサイトのコレクションはコンセプト段階で、販売中の商品はありません。ショップは計画中で、それまでは注文ボタンは無効のままにします。') }
  ];

  /* ---- Games lobby ----------------------------------------------------- *
   * The lobby grid and each game's own header read from this list, so adding a
   * game is one entry. `art` points at the verified official character art
   * (assets/img/art), so the lobby always shows the real IP.
   * `bestKey` is the localStorage key a game writes its best score to. It is
   * only set for games that really keep one: the claw machine has an internal
   * save instead, so it gets no best-score line rather than one that would sit
   * at zero forever.
   * -------------------------------------------------------------------- */
  var GAMES = [
    { id: 'claw', status: 'live', href: 'play/claw.html',
      art: 'assets/img/art/furi-prince.webp', accent: 'var(--fur-teal)',
      name: L('The Claw Machine', '夾公仔機', '抓娃娃机', 'ตู้คีบ', 'クレーンゲーム'),
      desc: L('Six guardians, three cabinets, and a claw that behaves like a claw. You do not steer it home and you do not choose when to let go.',
              '六位守護者、三台機台，以及一隻「像夾公仔機一樣」的夾爪。你不能決定它幾時鬆手。',
              '六位守护者、三台机台，以及一只“像抓娃娃机一样”的抓爪。你不能决定它几时松手。',
              'ผู้พิทักษ์หกตน สามตู้ และตะขอที่ทำตัวเหมือนตะขอจริง คุณไม่ได้เลือกเวลาปล่อย',
              '6人の守護者、3台の筐体、そして“クレーンらしく”動くアーム。離すタイミングは選べません。') },
    { id: 'guess', status: 'live', href: 'play/guess.html',
      art: 'assets/img/art/winggo.webp', accent: 'var(--neon-mint)', bestKey: 'fm.guess.best',
      name: L('Guess the Guardian', '猜守護者', '猜守护者', 'ทายผู้พิทักษ์', '守護者を当てる'),
      desc: L('The artwork starts blurred and sharpens as the seconds pass. Name the guardian early and the points are higher.',
              '圖一開始係模糊嘅，隨住秒數過去會慢慢清晰。越早估中就越高分。',
              '图一开始是模糊的，随着秒数过去会慢慢清晰。越早猜中分越高。',
              'ภาพเริ่มจากเบลอแล้วค่อย ๆ ชัดขึ้นตามเวลา ทายเร็วได้คะแนนมากกว่า',
              'アートはぼやけた状態から秒数とともに鮮明になります。早く当てるほど高得点。') },
    { id: 'match', status: 'live', href: 'play/match.html',
      art: 'assets/img/art/pinki.webp', accent: 'var(--fur-pink)', bestKey: 'fm.match.best',
      name: L('FURI MATCH', 'FURI 三消', 'FURI 三消', 'FURI แมตช์', 'FURI マッチ'),
      desc: L('Swap the six faces to line up three. Six guardians is exactly the number a match-3 board needs — no invented tiles.',
              '交換六張臉，連成三個。三消盤啱啱好需要六種，唔需要虛構任何方塊。',
              '交换六张脸，连成三个。三消盘刚好需要六种，不需要虚构任何方块。',
              'สลับหน้าทั้งหกเพื่อเรียงสาม ผู้พิทักษ์หกตนคือจำนวนที่กระดานแมตช์สามต้องการพอดี',
              '6つの顔を入れ替えて3つそろえます。マッチ3の盤面に必要な数はちょうど6つ。') },
    { id: 'memory', status: 'live', href: 'play/memory.html',
      art: 'assets/img/art/fluffu.webp', accent: 'var(--fur-purple)', bestKey: 'fm.memory.best',
      name: L('Emotion Match', '情緒記憶', '情绪记忆', 'เกมความจำอารมณ์', '感情メモリー'),
      desc: L('Eighteen expression cards — six guardians, three faces each. Pair them and learn which face means what.',
              '十八張表情卡 —— 六位守護者，各三張臉。配對之餘，認識每個表情代表咩。',
              '十八张表情卡 —— 六位守护者，各三张脸。配对之余，认识每个表情代表什么。',
              'การ์ดสีหน้าสิบแปดใบ — หกผู้พิทักษ์ ตัวละสามหน้า จับคู่แล้วเรียนรู้ว่าแต่ละหน้าแทนอะไร',
              '18枚の表情カード——6人の守護者、それぞれ3つの顔。揃えながら、どの顔が何を意味するか学べます。') }
  ];

  /* ---- sticker packs --------------------------------------------------- *
   * Two packs, both built from artwork that already existed for the die-cut
   * sticker proof: the six finished die-cut stickers, and the same six as
   * line art you can colour in yourself.
   *
   * `dir` is scanned by tools/build.js, so a pack can never advertise a file
   * that is not on disk. `zip` is written by the same build step from the very
   * same file list, so the "download all" button cannot go stale either.
   *
   * The sizes are stated as they are: the die-cut masters are only 250 px, so
   * the note says plainly that WhatsApp and Telegram want 512 px. Claiming
   * otherwise would be the kind of overstatement the rest of the site avoids.
   * -------------------------------------------------------------------- */
  var STICKER_PACKS = [
    {
      id: 'die-cut',
      dir: 'assets/img/stickers',
      zip: 'assets/downloads/furimonster-stickers-pack-01.zip',
      zipName: 'furimonster-stickers-pack-01.zip',
      accent: 'var(--neon-mint)',
      badge: L('Pack 01', '第 01 包', '第 01 包', 'แพ็ก 01', 'パック 01'),
      name: L('The Six Guardians', '六位守護者', '六位守护者', 'ผู้พิทักษ์ทั้งหก', '6人の守護者'),
      kind: L('Die-cut sticker', '刀模貼圖', '刀模贴图', 'สติกเกอร์ไดคัท', 'ダイカットステッカー'),
      desc: L('One sticker per guardian, cut out on a white border with a transparent background — the same files used for the printed sticker sheet.',
              '每位守護者一張，白色刀模邊、透明背景 —— 同印刷貼圖稿用的是同一批檔案。',
              '每位守护者一张，白色刀模边、透明背景 —— 同印刷贴图稿用的是同一批文件。',
              'ผู้พิทักษ์ละหนึ่งใบ ไดคัทขอบขาว พื้นหลังโปร่งใส — ไฟล์ชุดเดียวกับที่ใช้พิมพ์สติกเกอร์จริง',
              '守護者ごとに1枚。白いダイカット縁、背景は透明。印刷したステッカーシートと同じファイルです。'),
      note: L('PNG, transparent background, 250 px on the long side. This is the master size, so nothing has been enlarged or sharpened. LINE and WeChat accept this size as it is; WhatsApp and Telegram ask for 512 px, so these will look a little soft there.',
              'PNG、透明背景、長邊 250 px。這是母檔尺寸，沒有放大或銳化過。LINE 與 WeChat 直接可用；WhatsApp 與 Telegram 要求 512 px，所以在該處會略為偏軟。',
              'PNG、透明背景、长边 250 px。这是母档尺寸，没有放大或锐化过。LINE 与 WeChat 直接可用；WhatsApp 与 Telegram 要求 512 px，所以在该处会略显偏软。',
              'PNG พื้นหลังโปร่งใส ด้านยาว 250 px นี่คือขนาดมาสเตอร์ ไม่ได้ขยายหรือ sharpen จึงใช้กับ LINE และ WeChat ได้ทันที ส่วน WhatsApp และ Telegram ต้องการ 512 px จึงจะดูนุ่มลงเล็กน้อย',
              'PNG・背景透明・長辺250px。マスターサイズそのままで、拡大も輪郭補正もしていません。LINEとWeChatはこのサイズで使えます。WhatsAppとTelegramは512pxを求めるため、やや柔らかく見えます。')
    },
    {
      id: 'colour-in',
      dir: 'assets/img/ip-line',
      zip: 'assets/downloads/furimonster-colour-in-pack-02.zip',
      zipName: 'furimonster-colour-in-pack-02.zip',
      accent: 'var(--fur-purple)',
      /* The line art is black on transparent, so it is unreadable on the dark
       * board the die-cut stickers use. This pack gets a light surface instead
       * — a property of the artwork, not a style choice. */
      surface: 'light',
      badge: L('Pack 02', '第 02 包', '第 02 包', 'แพ็ก 02', 'パック 02'),
      name: L('Colour-In Line Art', '線稿上色版', '线稿涂色版', 'ลายเส้นระบายสี', 'ぬりえ線画'),
      kind: L('Colouring sticker', '著色貼圖', '涂色贴图', 'สติกเกอร์ระบายสี', 'ぬりえステッカー'),
      desc: L('The same six guardians as outline-only line art, so you can colour them in yourself — on paper, in a drawing app, or as your own sticker.',
              '同樣六位守護者，只保留線稿，讓你自己上色 —— 可以印出來、用繪圖 App，或用來做自己的貼圖。',
              '同样六位守护者，只保留线稿，让你自己上色 —— 可以打印出来、用绘图 App，或用来做自己的贴图。',
              'ผู้พิทักษ์หกคนเดียวกันในแบบลายเส้นล้วน ให้คุณระบายสีเอง จะบนกระดาษ ในแอปวาดรูป หรือทำเป็นสติกเกอร์ของคุณเอง',
              '同じ6人の守護者を線画だけにしたもの。紙に、お絵かきアプリで、あるいは自分のステッカーとして色を塗れます。'),
      note: L('PNG line art, transparent background, no fill anywhere — so nothing can bleed into a print, and any colouring tool will work.',
              'PNG 線稿、透明背景、完全沒有填色 —— 所以列印時不會有顏色滲出，用任何上色工具都可以。',
              'PNG 线稿、透明背景、完全没有填色 —— 所以打印时不会有颜色渗出，用任何涂色工具都可以。',
              'PNG ลายเส้น พื้นหลังโปร่งใส ไม่มีการเติมสีเลย สีจึงไม่เลอะตอนพิมพ์ และใช้เครื่องมือระบายสีอะไรก็ได้',
              'PNGの線画、背景透明、塗りは一切なし。印刷時に色がにじまず、どんな着彩ツールでも使えます。')
    }
  ];

  var data = {
    characters: CHARACTERS,
    relations: RELATIONS,
    relationTypes: RELATION_TYPES,
    philosophy: PHILOSOPHY,
    emotions: EMOTIONS,
    planetScenes: PLANET_SCENES,
    faq: FAQ,
    games: GAMES,
    stickerPacks: STICKER_PACKS,
    stories: STORIES,
    storyTypes: STORY_TYPES,
    collections: COLLECTIONS,
    collabSectors: COLLAB_SECTORS,
    partnershipTypes: PARTNERSHIP_TYPES,
    licensing: {
      categories: LICENSING_CATEGORIES,
      audience: LICENSING_AUDIENCE,
      territoriesNote: LICENSING_TERRITORIES_NOTE
    },
    creator: CREATOR,
    news: NEWS,
    newsCategories: NEWS_CATEGORIES,
    lab: LAB,
    /* helpers used by every page */
    bySlug: function (slug) {
      for (var i = 0; i < CHARACTERS.length; i++) if (CHARACTERS[i].slug === slug) return CHARACTERS[i];
      return null;
    },
    relationsOf: function (slug) {
      return RELATIONS.filter(function (r) { return r.from === slug || r.to === slug; });
    }
  };

  root.FM = root.FM || {};
  root.FM.data = data;
  root.FM.L = L;
  if (typeof module !== 'undefined' && module.exports) module.exports = data;
})(typeof globalThis !== 'undefined' ? globalThis : this);
