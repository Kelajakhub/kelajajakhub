create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  youtube_id text not null,
  category text not null,
  title text not null,
  author text not null,
  channel text not null,
  about text not null default '',
  topic text not null default '',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant all on public.lessons to service_role;
alter table public.lessons enable row level security;

insert into public.lessons (youtube_id, category, title, author, channel, about, topic, sort_order) values
('fj_GLU344bQ','dasturlash','Python: o''rnatish va birinchi dastur','Botir Ziyatov','Botir Ziyatov','Botir Ziyatov — o''zbek tilida Python, Django va Telegram bot darslari bilan tanilgan dasturchi va ustoz.','Python''ni kompyuterga o''rnatish, interpretator, print bilan birinchi dastur',10),
('_DE6yNyu_sQ','dasturlash','Python dasturlash tili — 4-dars','Transformers Education jamoasi','Transformers Education','Transformers Education — Toshkentdagi bolalar va yoshlar uchun dasturlash va robototexnika ta''lim markazi.','Python asoslari: o''zgaruvchilar, amallar, oddiy dasturlar',20),
('nitlLnbp7ak','dasturlash','Python darslari: kirish va mohirdev.uz bilan tanishuv','Anvar Narzullayev','Sariq dev','Anvar Narzullayev — Sariq dev kanali va mohirdev.uz platformasi asoschilaridan.','Dasturlashni o''rganishga kirish, o''rganish yo''li',5),
('5-nfh6ILj90','dizayn','Figma''da veb-sayt dizaynini chizish (1-qism)','Muhammadaziz Xabibullayev','Muhammadaziz Xabibullayev','Talabalar uchun Figma va veb-dizayn bo''yicha amaliy darslar tayyorlovchi muallif.','Figma: frame, shakllar, matn, veb-sayt maketini chizish',10),
('atttjLrCFeI','startup','Nega ko''p startaplar o''ladi?','Usmon Rahimjonov, Ulug''bek Ismatov','Founder''s cafe','Founder''s cafe — UzCombinator podkasti.','Startap muvaffaqiyati sabablari, nega startaplar yopiladi',10),
('zfjh71MJUkc','startup','Startapga pul beramiz!','Muhammad Xalil','Founder''s cafe','Muhammad Xalil — Startup Garage asoschisi.','Startapga investitsiya, akselyatorlar, jamoa',20),
('GlUMcqjw54g','startup','O''zbekistonda startup uchun pul bor, lekin sizga bermaydi','Abdulazal Toshxo''jayev','Founder''s cafe','Venchur investitsiya bo''yicha mutaxassis.','Venchur investitsiya, VC qanday startapni tanlaydi, product-market fit',30),
('UhDerZAYM48','startup','Start up''lar uchun pul ko''p, g''oya kam','Muhammad Xalil, Dilmurod Khodiev','Alohida mavzu','Suhbat «Alohida mavzu» loyihasi tomonidan tayyorlangan.','Startap nima, TAM, traction, MRR, venchur fondlar',40),
('nqrMRfbgJ_4','startup','Startapingiz yo''lida birinchi qadam — «Noldan Milliongacha» audio qo''llanma','Yoshlar Ventures jamoasi','Yoshlar Ventures','Yoshlar Ventures — yosh ta''sischilar uchun venchur fond, 500 mln dan 2 mlrd so''mgacha sarmoya va ustozlik beradi.','Startapni noldan qurish, birinchi qadamlar',50),
('w_oKwBaxk9U','startup','«Noldan Milliongacha: Startap qanday quriladi?» — 1-bob','Yoshlar Ventures jamoasi','Yoshlar Ventures','Yoshlar Ventures — yosh ta''sischilar uchun venchur fond.','Startap g''oyasi, muammo va yechim',60),
('IgXGqCHt5rw','startup','Minimal Viable Product (MVP) nima va qanday yaratiladi?','Yoshlar Ventures jamoasi','Yoshlar Ventures','Yoshlar Ventures — yosh ta''sischilar uchun venchur fond.','MVP tushunchasi, birinchi mahsulotni tez yaratish',70),
('ysqsLLpC3vA','startup','Y Combinator — 2-dars','Yoshlar Ventures jamoasi','Yoshlar Ventures','Yoshlar Ventures Y Combinator darslarini o''zbek tilida taqdim etadi.','Y Combinator startap maktabi darslari',80),
('g2ak58QoHVc','startup','Y Combinator — 3-dars','Yoshlar Ventures jamoasi','Yoshlar Ventures','Yoshlar Ventures Y Combinator darslarini o''zbek tilida taqdim etadi.','Y Combinator startap maktabi darslari',90),
('ywSBl-diAcY','startup','Odamlar xohlaydigan narsa yaratganingizni qanday bilasiz? — Y Combinator 4-dars','Yoshlar Ventures jamoasi','Yoshlar Ventures','Yoshlar Ventures Y Combinator darslarini o''zbek tilida taqdim etadi.','Product-market fit, foydalanuvchi ehtiyojini tekshirish',100),
('e0Xb8zypjk4','startup','Jamoa qurish va rahbarlik','Yoshlar Ventures jamoasi','Yoshlar Ventures','Yoshlar Ventures — yosh ta''sischilar uchun venchur fond.','Jamoa yig''ish, rahbarlik, hamkor asoschilar',110),
('9eU9nLzpapY','startup','Biznes model va moliya asoslari','Yoshlar Ventures jamoasi','Yoshlar Ventures','Yoshlar Ventures — yosh ta''sischilar uchun venchur fond.','Biznes model, daromad, xarajat, moliya asoslari',120),
('VhrSxj5_H4w','startup','Hamkor asoschilar o''rtasida aksiya taqsimoti','Yoshlar Ventures jamoasi','Yoshlar Ventures','Yoshlar Ventures — yosh ta''sischilar uchun venchur fond.','Ulush taqsimoti, asoschilar nizolari',130),
('kScOW-tIAfA','startup','Kompaniya ochyapsizmi? Bilishingiz kerak bo''lgan asosiy atamalar','Yoshlar Ventures jamoasi','Yoshlar Ventures','Yoshlar Ventures — yosh ta''sischilar uchun venchur fond.','Startap va investitsiya atamalari',140);