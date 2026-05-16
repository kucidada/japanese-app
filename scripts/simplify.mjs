import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const files = ['n5.json', 'n4.json', 'n3.json', 'n2.json', 'n1.json'];

// ===== 学术术语 → 简单说法 =====
function simplifyExplanation(text) {
  let s = text;

  // 格助词 → 标记词语关系的词
  s = s.replace(/格助词/g, '语法标记');

  // 主题标记助词 → 话题标记
  s = s.replace(/主题标记助词/g, '话题标记');

  // 主格助词 → 主语标记
  s = s.replace(/主格助词/g, '主语标记');

  // 礼貌断定助动词 → 礼貌的说法
  s = s.replace(/礼貌断定助动词/g, '礼貌说法');

  // 判断句 → 基本句型
  s = s.replace(/判断句/g, '基本句型');

  // 连体修饰 → 连接名词
  s = s.replace(/連体修饰|连体修饰/g, '修饰名词');

  // 简体 → 普通体
  s = s.replace(/简体(?!。)/g, '普通体');

  // 终止形 → 基本形
  s = s.replace(/终止形/g, '基本形');

  // 已然形 → 变化形
  s = s.replace(/已然形/g, '变化形');

  // 他动词 → 带宾语的动作
  s = s.replace(/他動詞/g, '带宾语的动词');

  // 自动词 → 不带宾语的动词
  s = s.replace(/自動詞/g, '不带宾语的动词');

  // 五段动词 → 一类动词
  s = s.replace(/五段动词/g, '一类动词（う段结尾）');

  // 上一段/下一段 → 二类动词
  s = s.replace(/上一段/g, '二类');
  s = s.replace(/下一段/g, '二类');

  // サ变动词/カ变动词 → 三类动词
  s = s.replace(/サ变动词/g, '三类动词（する）');
  s = s.replace(/カ变动词/g, '三类动词（来る）');

  // 敬体 → 礼貌说法
  s = s.replace(/敬体/g, '礼貌说法');

  // 丁寧形 → 礼貌形
  s = s.replace(/丁寧形/g, '礼貌形');

  // 辞书形/辞書形 → 基本形
  s = s.replace(/辞書形|辞书形/g, '基本形');

  // 连用形/連用形 → ます形去掉ます
  s = s.replace(/連用形|连用形/g, 'ます形去掉ます');

  // 未然形 → ない形
  s = s.replace(/未然形/g, 'ない形');

  // 假定形 → ば形
  s = s.replace(/假定形/g, 'ば形');

  // 方向助词 → 方向标记
  s = s.replace(/方向助词/g, '方向标记');

  // 目的格助词 → 动作对象标记
  s = s.replace(/目的格助词/g, '动作对象标记');

  // 主语标识 → 主语标记
  s = s.replace(/主语标识/g, '主语标记');

  // 主题标识 → 话题标记
  s = s.replace(/主题标识/g, '话题标记');

  // 表示 → 指/用来
  s = s.replace(/表示/g, '用来');

  // 活用 → 变化
  s = s.replace(/活用/g, '变化');

  // 连体修饰 → 修饰名词
  s = s.replace(/連体/g, '连体');

  // 逆接 → 转折
  s = s.replace(/逆接/g, '转折');

  // 语感 → 感觉
  s = s.replace(/语感/g, '感觉');

  // 简体否定 → 普通否定形
  s = s.replace(/简体否定/g, '普通否定形');

  // 他动词的宾语 → 动作的对象
  s = s.replace(/他动词的宾语/g, '动作的对象');

  return s;
}

// ===== 加一个口语例句 =====
const colloquialExamples = {
  'n5-hai-ji': { jp: '俺は学生だ。', cn: '我是学生（朋友间说法）。' },
  'n5-hai-jya-nai': { jp: 'それは俺のじゃないよ。', cn: '那不是我的哦（口语）。' },
  'n5-hai-desuka': { jp: 'これ、本？', cn: '这是书吗？（口语省略か）' },
  'n5-no': { jp: 'それ、私んちの本だよ。', cn: '那是我家的书哦（口语省略）。' },
  'n5-ga': { jp: '誰がやったの？', cn: '谁干的？（疑问词+が）' },
  'n5-wa': { jp: '俺は行かないよ。', cn: '我是不去的（对比/强调）。' },
  'n5-wo': { jp: 'これをちょうだい。', cn: '给我这个（口语）。' },
  'n5-ni': { jp: '今、学校にいる。', cn: '现在在学校。' },
  'n5-de': { jp: 'これ、ペンで書いたの？', cn: '这是用笔写的吗？' },
  'n5-e': { jp: 'そっちに行くよ。', cn: '我去那边（口语へ→に）。' },
  'n5-iru-aruiwa': { jp: 'ここに猫がいるよ。', cn: '这里有猫哦（口语）。' },
  'n5-masu': { jp: '毎日勉強します。', cn: '每天学习。' },
  'n5-masen': { jp: '今日は行かないです。', cn: '今天不去（口语否定）。' },
  'n5-mashita': { jp: '昨日見たよ。', cn: '昨天看了（口语过去）。' },
  'n5-masen-deshita': { jp: '昨日は行かなかった。', cn: '昨天没去（口语）。' },
  'n5-te-form': { jp: '待って！', cn: '等等！（口语て形单用）' },
  'n5-te-kudasai': { jp: 'ちょっと待って。', cn: '稍等一下（熟人之间）。' },
  'n5-nai-de-kudasai': { jp: 'そこ、触らないで。', cn: '别碰那里（口语）。' },
  'n5-te-mo-ii': { jp: 'もう帰っていい？', cn: '可以回去了吗？（口语省略）' },
  'n5-te-wa-ikenai': { jp: 'ここ、入っちゃダメだよ。', cn: '这里不能进哦（口语）。' },
  'n5-te-iru': { jp: '今ご飯食べてる。', cn: '正在吃饭（てる省略）。' },
  'n5-te-aru': { jp: '窓、開けてあるよ。', cn: '窗户开着呢（准备好的）。' },
  'n5-te-oku': { jp: '予約しとくね。', cn: '我先预约（とく口语）。' },
  'n5-te-miru': { jp: 'これ、食べてみて！', cn: '尝尝这个！' },
  'n5-te-shimau': { jp: 'やばい、忘れちゃった！', cn: '糟了，忘了！（口语缩略）' },
  'n5-te-kara': { jp: '風呂入ってから行くわ。', cn: '洗完澡去。' },
  'n5-ta-form': { jp: '昨日、映画見た。', cn: '昨天看电影了（普通体）。' },
  'n5-nai-form': { jp: '今日は行かない。', cn: '今天不去（普通体）。' },
  'n5-tai': { jp: '日本、行きてぇな〜。', cn: '好想去日本啊（超口语）。' },
  'n5-hoshii': { jp: '新しいカメラほしいな。', cn: '好想要新相机啊。' },
  'n5-tagaru': { jp: '彼も行きたがってるよ。', cn: '他也想去呢。' },
  'n5-ta-koto-ga-aru': { jp: '富士山、登ったことある？', cn: '爬过富士山吗？（口语）' },
  'n5-koto-ga-dekiru': { jp: '日本語、話せる？', cn: '会说日语吗？（可能动词口语）' },
  'n5-kanou-doushi': { jp: 'これ、読める？', cn: '这个能读吗？（口语可能形）' },
  'n5-omou': { jp: '明日、雨かな〜と思う。', cn: '我觉得明天可能下雨。' },
  'n5-to-iimasu': { jp: '彼、来ないって言ってた。', cn: '他说他不来（口语引用）。' },
  'n5-kara': { jp: '安いから、買っちゃった。', cn: '因为便宜就买了（口语）。' },
  'n5-node': { jp: '雨なんで、やめとくわ。', cn: '因为下雨就算了（口语）。' },
  'n5-ga-conjunction': { jp: '聞きたいんだけどさ…', cn: '我想问一下哈…（口语铺垫）' },
  'n5-kedo': { jp: 'これ、美味しいんだけどね。', cn: '这个好吃是好吃啦（转折/铺垫）。' },
  'n5-toki': { jp: '子供の時、よくここで遊んだな。', cn: '小时候经常在这里玩。' },
  'n5-mae-ni': { jp: '寝る前に、歯磨かないと。', cn: '睡觉前得刷牙。' },
  'n5-ta-form-ato': { jp: '仕事終わったあと、飲みに行こう！', cn: '工作结束后去喝酒吧！' },
  'n5-juuryoku': { jp: 'これ、全部でいくら？', cn: '这些总共多少钱？' },
  'n5-wa-mo': { jp: '俺も行く！', cn: '我也去！' },
  'n5-dake': { jp: 'これだけ？もっとないの？', cn: '只有这些？没多的了吗？' },
  'n5-shikanai': { jp: '百円しかない…やばい。', cn: '只有100日元…糟了。' },
  'n5-kurai': { jp: '十分ぐらいで着くよ。', cn: '大约十分钟到。' },
  'n5-hodo': { jp: '今日は昨日ほど寒くないね。', cn: '今天没有昨天冷呢。' },
  'n5-yori': { jp: '犬より猫のほうが好き。', cn: '比起狗更喜欢猫。' },
  'n5-ichiban': { jp: '日本でどこが一番好き？', cn: '在日本你最喜欢哪里？' },
  'n5-sou-desu-hearsay': { jp: 'ねえ聞いて、あの二人、結婚したんだって！', cn: '哎你听说了吗，那两个人结婚了！（口语传闻）' },
  'n5-yasui-nikui': { jp: 'このペン、書きやすいよ。', cn: '这支笔很好写。' },
  'n5-sugiru': { jp: '食べすぎて、お腹が苦しい…', cn: '吃太多了肚子好撑…' },
  'n5-nagara': { jp: 'ご飯食べながら、テレビ見ちゃう。', cn: '总是一边吃饭一边看电视。' },
  'n5-mashou': { jp: 'そろそろ行こうか！', cn: '差不多该走了吧！' },
  'n5-mashouka': { jp: '手伝おうか？', cn: '要我帮忙吗？' },
  'n5-i-adjective': { jp: 'このラーメン、美味しくない…', cn: '这个拉面不好吃…' },
  'n5-na-adjective': { jp: '静かじゃなくて、うるさいよ。', cn: '不是安静，是吵。' },
  'n5-desu-ne': { jp: '今日、暑いですね。', cn: '今天好热啊。' },
  'n5-desu-yo': { jp: 'その映画、面白いですよ！', cn: '那部电影很有意思哦！' },
  'n5-ne-yo': { jp: 'あの店、美味しいんだよね。', cn: '那家店很好吃的你知道嘛。' },
  'n5-darou': { jp: '明日は晴れるだろうね。', cn: '明天会是晴天吧。' },
  'n5-kamoshirenai': { jp: '明日、雨かもしれないな。', cn: '明天可能会下雨。' },
  'n5-mashou-omou': { jp: '行こうかな、どうしようかな…', cn: '要不要去呢…' },
  'n5-sou-youtai': { jp: 'そのケーキ、美味しそう！', cn: '那个蛋糕看起来好好吃！' },
  'n5-ba-form': { jp: '安ければ買うんだけどね。', cn: '如果便宜就买（但贵）。' },
  'n5-tara-form': { jp: '東京着いたら、連絡してね。', cn: '到了东京联系我。' },
  'n5-nara': { jp: '行くなら、私も行きたい！', cn: '要去的话，我也想去！' },
  'n5-to-condition': { jp: 'あのボタン押すと、出るよ。', cn: '按那个按钮就会出来。' },
  'n5-sae': { jp: 'これさえあれば、大丈夫。', cn: '只要有这个就没问题。' },
  'n5-kara-jp': { jp: '日本から来ました。', cn: '从日本来。' },
  'n5-made': { jp: '駅まで一緒に行こう！', cn: '一起走到车站吧！' },
  'n5-made-ni': { jp: '五時までに帰るね。', cn: '五点之前回来。' },
  'n5-ikura-demo': { jp: 'いくらでも食べられる！', cn: '吃多少都行！' },
  'n5-ikaga': { jp: 'コーヒーはいかがですか？', cn: '要喝杯咖啡吗？' },
  'n5-ga-nai': { jp: '仕方ないね。', cn: '没办法呢。' },
  'n5-wo-toshite': { jp: '勉強を通して学びました。', cn: '通过学习学到了。' },
};

const dir = resolve(__dirname, '../src/data/grammar');

for (const file of files) {
  const path = resolve(dir, file);
  const data = JSON.parse(readFileSync(path, 'utf-8'));

  for (const entry of data) {
    // 1) Simplify explanation
    entry.explanation = simplifyExplanation(entry.explanation);

    // 2) Add colloquial example
    const col = colloquialExamples[entry.id];
    if (col) {
      entry.examples.push(col);
    }
  }

  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  console.log(`✓ ${file} processed (${data.length} entries)`);
}

console.log('Done!');
