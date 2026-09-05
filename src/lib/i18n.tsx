import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "uz" | "en" | "ru";
export type Theme = "dark" | "light";

const LANGS: { id: Lang; label: string }[] = [
  { id: "uz", label: "UZ" },
  { id: "en", label: "EN" },
  { id: "ru", label: "RU" },
];

type Dict = Record<string, string>;

const uz: Dict = {
  "nav.live": "Platforma ishlayapti",
  "nav.openBot": "Botni ochish",
  "hero.badge": "Vazirlik va Intellektual mulk agentligiga to'g'ridan-to'g'ri yo'naltirish tizimi",
  "hero.title1": "G'oyangizni kiriting va uni",
  "hero.titleGold": "rasmiy patent darajasiga",
  "hero.title2": "olib chiqing!",
  "hero.text":
    "KelajakHub — yosh ixtirochilar va startapchilarning ishlanmalarini raqamli muhrlaydi, hujjatlashtiradi va patent olish uchun tegishli vazirlik hamda patent idoralariga yuboradi.",
  "hero.cta": "Ixtironi hoziroq topshirish",
  "hero.how": "Qanday ishlaydi?",
  "sec.steps": "G'oyangiz patentga qanday aylanadi?",
  "sec.features": "Platformada nimalar bor?",
  "sec.audiences": "Kim uchun?",
  "cta.title": "Ixtironi bugun muhrlab qo'y",
  "cta.text":
    "Ro'yxatdan o'tish 2 daqiqa: rol tanlang, ismingizni yozing va SMS kod bilan telefon raqamingizni tasdiqlang.",
  "cta.button": "Telegram botni ochish",
  "footer.rights": "© 2026 KelajakHub. Barcha huquqlar himoyalangan.",
  "footer.miniapp": "Mini App",
  "step1.t": "Botga kirib ro'yxatdan o'tish",
  "step1.x": "Rol tanlaysiz, ism va telefon raqamingizni kiritasiz, SMS kod bilan tasdiqlaysiz.",
  "step2.t": "Ixtironi raqamli muhrlash",
  "step2.x": "Ixtiro nomi va tavsifi kiritiladi, tizim mualliflikni raqamli muhr bilan qayd etadi.",
  "step3.t": "Vazirlikka rasmiy yo'naltirish",
  "step3.x": "Ariza ekspertizadan o'tadi va rasmiy hujjat bilan mas'ul idoraga yuboriladi.",
  "f1.t": "Patentlash va vazirlik yo'naltirishi",
  "f1.x": "Har bir ariza ekspertizadan o'tadi va rasmiy xat bilan mas'ul idoraga yuboriladi.",
  "f2.t": "G'oyalar himoyasi",
  "f2.x": "Loyihalar raqamli mualliflik muhri bilan saqlanadi. Patent tarixi hech qachon o'chmaydi.",
  "f3.t": "Jamoa izlash",
  "f3.x": "Loyihangiz uchun dasturchi, dizayner yoki muhandis toping.",
  "f4.t": "Mentorlar va AI mentor",
  "f4.x": "Ekspert mentorlar bilan chat, 24/7 ishlaydigan AI mentor va Telegram guruhi.",
  "f5.t": "Ota-ona nazorati",
  "f5.x": "16 yoshgacha ixtirochilar faoliyati ota-ona panelida ko'rinadi; roziliksiz investitsiya olinmaydi.",
  "f6.t": "Kelajak portfeli",
  "f6.x": "Barcha ixtirolar, muhrlar va yutuqlar yagona raqamli portfelda.",
  "a1.t": "Yosh ixtirochi",
  "a1.x": "G'oyani muhrlab patentlash, jamoadosh va mentor topish.",
  "a2.t": "Ota-ona",
  "a2.x": "Farzand loyihalari, patentlari va investitsiya takliflarini nazorat qilish.",
  "a3.t": "Mentor",
  "a3.x": "Loyihalarni ko'rish, muallif bilan chat va guruhda yordam berish.",
  "a4.t": "Investor",
  "a4.x": "Loyiha nomi, logotipi va tavsifini o'rganib, investitsiya taklifi yuborish.",

  "tab.home": "Bosh",
  "tab.projects": "Loyihalar",
  "tab.chat": "Mentor",
  "tab.invest": "Investitsiya",
  "tab.parent": "Nazorat",
  "tab.feed": "Loyihalar",
  "tab.portfolio": "Portfel",
  "tab.team": "Jamoa",
  "tab.children": "Farzandlar",
  "tab.approvals": "Rozilik",
  "tab.mentees": "Shogirdlar",

  "mini.loading": "Yuklanmoqda...",
  "mini.onlyTelegram": "Bu sahifa Telegram bot ichida ochilishi kerak. @kelajakhubbot ga kiring va «KelajakHub» tugmasini bosing.",
  "mini.verified": "tasdiqlangan",
  "mini.unverified": "tasdiqlanmagan",
  "mini.noPhone": "raqam yo'q",
  "mini.projects": "Loyihalar",
  "mini.patents": "Patentlar",
  "mini.chats": "Suhbatlar",
  "mini.patentPortfolio": "Patent portfeli",
  "mini.noPatents": "Hozircha ixtiro yo'q. Botdagi patentlash tugmasidan foydalaning.",
  "mini.teamAds": "Jamoa izlayotgan loyihalar",
  "mini.noTeamAds": "Hozircha jamoa e'lonlari yo'q.",
  "mini.joinGroup": "Guruhga qo'shilish →",
  "mini.author": "Muallif",
  "mini.status": "Holat",
  "mini.seal": "muhr",
  "mini.newProject": "Yangi loyiha",
  "mini.editProject": "Loyihani tahrirlash",
  "mini.name": "Nomi",
  "mini.description": "Tavsif",
  "mini.logoUrl": "Logo havolasi",
  "mini.goal": "Investitsiya maqsadi",
  "mini.lookingForTeam": "Jamoa izlayapman",
  "mini.whoNeeded": "Kim kerak?",
  "mini.groupUrl": "Telegram guruh havolasi",
  "mini.save": "Saqlash",
  "mini.saving": "Saqlanmoqda...",
  "mini.saved": "Loyiha saqlandi",
  "mini.myProjects": "Mening loyihalarim",
  "mini.noProjects": "Hozircha loyiha yo'q — yuqoridagi formadan qo'shing.",
  "mini.edit": "Tahrirlash",
  "mini.attachMentor": "Mentor ulash",
  "mini.mentorRequested": "Mentorga so'rov yuborildi",
  "mini.noMentors": "Hozircha mentor yo'q.",
  "mini.aiMentor": "AI Mentor",
  "mini.aiMentorText": "G'oya, patent va prototip bo'yicha darhol maslahat",
  "mini.conversations": "Suhbatlar",
  "mini.noConversations": "Hozircha suhbat yo'q.",
  "mini.mentors": "Mentorlar",
  "mini.backToChats": "← Suhbatlar",
  "mini.startChat": "Suhbatni boshlang.",
  "mini.messagePlaceholder": "Xabar yozing...",
  "mini.send": "Yuborish",
  "mini.chatRetention": "Chat tarixi 30 kundan keyin avtomatik o'chiriladi. Patent tarixi hech qachon o'chmaydi.",
  "mini.incomingOffers": "Loyihamga kelgan takliflar",
  "mini.noIncoming": "Hozircha investitsiya taklifi yo'q.",
  "mini.investor": "Investor",
  "mini.makeOffer": "Investitsiya taklif qilish",
  "mini.amount": "Summa",
  "mini.message": "Xabar",
  "mini.myOffers": "Mening takliflarim",
  "mini.noOffers": "Hozircha taklif yubormadingiz.",
  "mini.enterAmount": "Summani kiriting.",
  "mini.offerSent": "Taklif yuborildi",
  "mini.offerSentParent": "Taklif yuborildi — ota-ona roziligi kutilmoqda",
  "mini.parentSecret": "Farzand uchun maxfiy raqam",
  "mini.children": "Farzandlar",
  "mini.noChildren": "Bog'langan farzand yo'q. Farzandingiz botda maxfiy raqamni kiritishi kerak.",
  "mini.childProjects": "Farzand loyihalari",
  "mini.childPatents": "Farzand patentlari",
  "mini.watchGroup": "Guruh faoliyatini kuzatish →",
  "mini.pendingConsent": "Rozilik kutayotgan investitsiyalar",
  "mini.noPending": "Rozilik kutayotgan taklif yo'q.",
  "mini.approve": "Rozilik",
  "mini.reject": "Rad etish",
  "mini.approved": "Rozilik berildi",
  "mini.rejected": "Rad etildi",
  "mini.none": "Yo'q.",
  "mini.mentorProjects": "Mentorlik loyihalari",
  "mini.noMentorProjects": "Hozircha sizga ulangan loyiha yo'q.",
  "mini.inventor": "Ixtirochi",
  "mini.minorNotice": "Siz 16 yoshgacha ixtirochisiz: investitsiya takliflari ota-onangiz roziligi bilan tasdiqlanadi.",
  "mini.parentLinked": "Ota-ona bog'langan",
  "mini.parentMissing": "Ota-ona bog'lanmagan — botda ota-ona maxfiy raqamini kiriting.",
  "mini.age": "Yosh",
  "role.inventor": "Ixtirochi",
  "role.parent": "Ota-ona",
  "role.mentor": "Mentor",
  "role.investor": "Investor",
  "st.pending_parent": "ota-ona roligi kutilmoqda",
  "st.approved": "tasdiqlangan",
  "st.rejected": "rad etilgan",
};

const en: Dict = {
  "nav.live": "Platform is live",
  "nav.openBot": "Open bot",
  "hero.badge": "Direct routing system to the Ministry and the Intellectual Property Agency",
  "hero.title1": "Submit your idea and take it to the",
  "hero.titleGold": "official patent level!",
  "hero.title2": "",
  "hero.text":
    "KelajakHub digitally seals and documents inventions of young inventors and startups, then submits them to the relevant ministry and patent offices.",
  "hero.cta": "Submit your invention now",
  "hero.how": "How does it work?",
  "sec.steps": "How does your idea become a patent?",
  "sec.features": "What's inside the platform?",
  "sec.audiences": "Who is it for?",
  "cta.title": "Seal your invention today",
  "cta.text": "Sign-up takes 2 minutes: pick a role, enter your name and confirm your phone with an SMS code.",
  "cta.button": "Open the Telegram bot",
  "footer.rights": "© 2026 KelajakHub. All rights reserved.",
  "footer.miniapp": "Mini App",
  "step1.t": "Register in the bot",
  "step1.x": "Choose a role, enter your name and phone number, confirm it with an SMS code.",
  "step2.t": "Digitally seal the invention",
  "step2.x": "Enter the title and description; the system records authorship with a digital seal.",
  "step3.t": "Official routing to the ministry",
  "step3.x": "The application passes review and is sent to the responsible agency with an official letter.",
  "f1.t": "Patenting and ministry routing",
  "f1.x": "Every application is reviewed and sent to the responsible agency with an official letter.",
  "f2.t": "Idea protection",
  "f2.x": "Projects are stored with a digital authorship seal. Patent history is never deleted.",
  "f3.t": "Team search",
  "f3.x": "Find a developer, designer or engineer for your project.",
  "f4.t": "Mentors and AI mentor",
  "f4.x": "Chat with expert mentors, a 24/7 AI mentor and a shared Telegram group.",
  "f5.t": "Parental control",
  "f5.x": "Activity of inventors under 16 is visible to parents; no investment without consent.",
  "f6.t": "Future portfolio",
  "f6.x": "All inventions, seals and achievements in one digital portfolio.",
  "a1.t": "Young inventor",
  "a1.x": "Seal and patent ideas, find teammates and mentors.",
  "a2.t": "Parent",
  "a2.x": "Monitor your child's projects, patents and investment offers.",
  "a3.t": "Mentor",
  "a3.x": "Review projects, chat with authors and help inside the group.",
  "a4.t": "Investor",
  "a4.x": "Review project name, logo and description, then send an investment offer.",

  "tab.home": "Home",
  "tab.projects": "Projects",
  "tab.chat": "Mentor",
  "tab.invest": "Investment",
  "tab.parent": "Control",
  "tab.feed": "Deals",
  "tab.portfolio": "Portfolio",
  "tab.team": "Team",
  "tab.children": "Children",
  "tab.approvals": "Approvals",
  "tab.mentees": "Mentees",

  "mini.loading": "Loading...",
  "mini.onlyTelegram": "Open this page inside the Telegram bot: go to @kelajakhubbot and tap the «KelajakHub» button.",
  "mini.verified": "verified",
  "mini.unverified": "not verified",
  "mini.noPhone": "no phone",
  "mini.projects": "Projects",
  "mini.patents": "Patents",
  "mini.chats": "Chats",
  "mini.patentPortfolio": "Patent portfolio",
  "mini.noPatents": "No inventions yet. Use the patent button in the bot.",
  "mini.teamAds": "Projects looking for a team",
  "mini.noTeamAds": "No team ads yet.",
  "mini.joinGroup": "Join the group →",
  "mini.author": "Author",
  "mini.status": "Status",
  "mini.seal": "seal",
  "mini.newProject": "New project",
  "mini.editProject": "Edit project",
  "mini.name": "Title",
  "mini.description": "Description",
  "mini.logoUrl": "Logo URL",
  "mini.goal": "Funding goal",
  "mini.lookingForTeam": "Looking for a team",
  "mini.whoNeeded": "Who do you need?",
  "mini.groupUrl": "Telegram group link",
  "mini.save": "Save",
  "mini.saving": "Saving...",
  "mini.saved": "Project saved",
  "mini.myProjects": "My projects",
  "mini.noProjects": "No projects yet — add one above.",
  "mini.edit": "Edit",
  "mini.attachMentor": "Attach mentor",
  "mini.mentorRequested": "Request sent to the mentor",
  "mini.noMentors": "No mentors yet.",
  "mini.aiMentor": "AI Mentor",
  "mini.aiMentorText": "Instant advice on ideas, patents and prototypes",
  "mini.conversations": "Chats",
  "mini.noConversations": "No chats yet.",
  "mini.mentors": "Mentors",
  "mini.backToChats": "← Chats",
  "mini.startChat": "Start the conversation.",
  "mini.messagePlaceholder": "Write a message...",
  "mini.send": "Send",
  "mini.chatRetention": "Chat history is deleted automatically after 30 days. Patent history is never deleted.",
  "mini.incomingOffers": "Offers for my projects",
  "mini.noIncoming": "No investment offers yet.",
  "mini.investor": "Investor",
  "mini.makeOffer": "Make an offer",
  "mini.amount": "Amount",
  "mini.message": "Message",
  "mini.myOffers": "My offers",
  "mini.noOffers": "You haven't sent any offers yet.",
  "mini.enterAmount": "Enter an amount.",
  "mini.offerSent": "Offer sent",
  "mini.offerSentParent": "Offer sent — waiting for parental consent",
  "mini.parentSecret": "Secret code for your child",
  "mini.children": "Children",
  "mini.noChildren": "No linked child yet. Your child must enter the secret code in the bot.",
  "mini.childProjects": "Child's projects",
  "mini.childPatents": "Child's patents",
  "mini.watchGroup": "Watch group activity →",
  "mini.pendingConsent": "Investments awaiting consent",
  "mini.noPending": "No offers awaiting consent.",
  "mini.approve": "Approve",
  "mini.reject": "Reject",
  "mini.approved": "Approved",
  "mini.rejected": "Rejected",
  "mini.none": "None.",
  "mini.mentorProjects": "Mentored projects",
  "mini.noMentorProjects": "No projects assigned to you yet.",
  "mini.inventor": "Inventor",
  "mini.minorNotice": "You are an inventor under 16: investment offers require parental consent.",
  "mini.parentLinked": "Parent linked",
  "mini.parentMissing": "No parent linked — enter the parent secret code in the bot.",
  "mini.age": "Age",
  "role.inventor": "Inventor",
  "role.parent": "Parent",
  "role.mentor": "Mentor",
  "role.investor": "Investor",
  "st.pending_parent": "awaiting parental consent",
  "st.approved": "approved",
  "st.rejected": "rejected",
};

const ru: Dict = {
  "nav.live": "Платформа работает",
  "nav.openBot": "Открыть бота",
  "hero.badge": "Система прямого направления в министерство и Агентство интеллектуальной собственности",
  "hero.title1": "Отправьте идею и доведите её до",
  "hero.titleGold": "официального патента!",
  "hero.title2": "",
  "hero.text":
    "KelajakHub цифрово заверяет и документирует разработки юных изобретателей и стартапов, а затем направляет их в профильное министерство и патентные органы.",
  "hero.cta": "Отправить изобретение",
  "hero.how": "Как это работает?",
  "sec.steps": "Как идея становится патентом?",
  "sec.features": "Что есть на платформе?",
  "sec.audiences": "Для кого?",
  "cta.title": "Заверьте изобретение сегодня",
  "cta.text": "Регистрация занимает 2 минуты: выберите роль, укажите имя и подтвердите номер SMS-кодом.",
  "cta.button": "Открыть Telegram-бота",
  "footer.rights": "© 2026 KelajakHub. Все права защищены.",
  "footer.miniapp": "Mini App",
  "step1.t": "Регистрация в боте",
  "step1.x": "Выберите роль, укажите имя и номер телефона, подтвердите SMS-кодом.",
  "step2.t": "Цифровое заверение изобретения",
  "step2.x": "Вводите название и описание — система фиксирует авторство цифровой печатью.",
  "step3.t": "Официальное направление в министерство",
  "step3.x": "Заявка проходит экспертизу и отправляется в ответственный орган официальным письмом.",
  "f1.t": "Патентование и направление в министерство",
  "f1.x": "Каждая заявка проходит экспертизу и направляется официальным письмом.",
  "f2.t": "Защита идей",
  "f2.x": "Проекты хранятся с цифровой печатью авторства. История патентов не удаляется.",
  "f3.t": "Поиск команды",
  "f3.x": "Найдите разработчика, дизайнера или инженера для проекта.",
  "f4.t": "Менторы и AI-ментор",
  "f4.x": "Чат с экспертами, AI-ментор 24/7 и совместная работа в Telegram-группе.",
  "f5.t": "Родительский контроль",
  "f5.x": "Активность изобретателей до 16 лет видна родителям; инвестиции — только с согласия.",
  "f6.t": "Портфолио будущего",
  "f6.x": "Все изобретения, печати и достижения в едином цифровом портфолио.",
  "a1.t": "Юный изобретатель",
  "a1.x": "Заверить и запатентовать идею, найти команду и ментора.",
  "a2.t": "Родитель",
  "a2.x": "Контроль проектов, патентов и инвестиционных предложений ребёнка.",
  "a3.t": "Ментор",
  "a3.x": "Смотреть проекты, общаться с автором и помогать в группе.",
  "a4.t": "Инвестор",
  "a4.x": "Изучить название, логотип и описание проекта и отправить предложение.",

  "tab.home": "Главная",
  "tab.projects": "Проекты",
  "tab.chat": "Ментор",
  "tab.invest": "Инвестиции",
  "tab.parent": "Контроль",
  "tab.feed": "Проекты",
  "tab.portfolio": "Портфолио",
  "tab.team": "Команда",
  "tab.children": "Дети",
  "tab.approvals": "Согласия",
  "tab.mentees": "Ученики",

  "mini.loading": "Загрузка...",
  "mini.onlyTelegram": "Откройте страницу внутри Telegram-бота: зайдите в @kelajakhubbot и нажмите кнопку «KelajakHub».",
  "mini.verified": "подтверждён",
  "mini.unverified": "не подтверждён",
  "mini.noPhone": "нет номера",
  "mini.projects": "Проекты",
  "mini.patents": "Патенты",
  "mini.chats": "Чаты",
  "mini.patentPortfolio": "Портфолио патентов",
  "mini.noPatents": "Изобретений пока нет. Используйте кнопку патентования в боте.",
  "mini.teamAds": "Проекты в поиске команды",
  "mini.noTeamAds": "Объявлений пока нет.",
  "mini.joinGroup": "Присоединиться к группе →",
  "mini.author": "Автор",
  "mini.status": "Статус",
  "mini.seal": "печать",
  "mini.newProject": "Новый проект",
  "mini.editProject": "Редактировать проект",
  "mini.name": "Название",
  "mini.description": "Описание",
  "mini.logoUrl": "Ссылка на логотип",
  "mini.goal": "Цель инвестиций",
  "mini.lookingForTeam": "Ищу команду",
  "mini.whoNeeded": "Кто нужен?",
  "mini.groupUrl": "Ссылка на Telegram-группу",
  "mini.save": "Сохранить",
  "mini.saving": "Сохранение...",
  "mini.saved": "Проект сохранён",
  "mini.myProjects": "Мои проекты",
  "mini.noProjects": "Проектов пока нет — добавьте выше.",
  "mini.edit": "Редактировать",
  "mini.attachMentor": "Подключить ментора",
  "mini.mentorRequested": "Запрос отправлен ментору",
  "mini.noMentors": "Менторов пока нет.",
  "mini.aiMentor": "AI-ментор",
  "mini.aiMentorText": "Мгновенные советы по идее, патенту и прототипу",
  "mini.conversations": "Чаты",
  "mini.noConversations": "Чатов пока нет.",
  "mini.mentors": "Менторы",
  "mini.backToChats": "← Чаты",
  "mini.startChat": "Начните беседу.",
  "mini.messagePlaceholder": "Напишите сообщение...",
  "mini.send": "Отправить",
  "mini.chatRetention": "История чата удаляется автоматически через 30 дней. История патентов не удаляется.",
  "mini.incomingOffers": "Предложения по моим проектам",
  "mini.noIncoming": "Предложений пока нет.",
  "mini.investor": "Инвестор",
  "mini.makeOffer": "Сделать предложение",
  "mini.amount": "Сумма",
  "mini.message": "Сообщение",
  "mini.myOffers": "Мои предложения",
  "mini.noOffers": "Вы пока не отправляли предложений.",
  "mini.enterAmount": "Укажите сумму.",
  "mini.offerSent": "Предложение отправлено",
  "mini.offerSentParent": "Отправлено — ожидается согласие родителя",
  "mini.parentSecret": "Секретный код для ребёнка",
  "mini.children": "Дети",
  "mini.noChildren": "Ребёнок не привязан. Он должен ввести секретный код в боте.",
  "mini.childProjects": "Проекты ребёнка",
  "mini.childPatents": "Патенты ребёнка",
  "mini.watchGroup": "Смотреть активность группы →",
  "mini.pendingConsent": "Инвестиции, ожидающие согласия",
  "mini.noPending": "Нет предложений, ожидающих согласия.",
  "mini.approve": "Согласиться",
  "mini.reject": "Отклонить",
  "mini.approved": "Согласие дано",
  "mini.rejected": "Отклонено",
  "mini.none": "Нет.",
  "mini.mentorProjects": "Проекты менторства",
  "mini.noMentorProjects": "К вам пока не подключены проекты.",
  "mini.inventor": "Изобретатель",
  "mini.minorNotice": "Вам меньше 16 лет: инвестиционные предложения подтверждает родитель.",
  "mini.parentLinked": "Родитель привязан",
  "mini.parentMissing": "Родитель не привязан — введите секретный код родителя в боте.",
  "mini.age": "Возраст",
  "role.inventor": "Изобретатель",
  "role.parent": "Родитель",
  "role.mentor": "Ментор",
  "role.investor": "Инвестор",
  "st.pending_parent": "ожидается согласие родителя",
  "st.approved": "подтверждено",
  "st.rejected": "отклонено",
};

const DICTS: Record<Lang, Dict> = { uz, en, ru };

type Ctx = {
  lang: Lang;
  theme: Theme;
  setLang: (l: Lang) => void;
  setTheme: (t: Theme) => void;
  t: (key: string) => string;
};

const UiContext = createContext<Ctx | null>(null);

export function UiProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("uz");
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const storedLang = localStorage.getItem("kh-lang") as Lang | null;
    const storedTheme = localStorage.getItem("kh-theme") as Theme | null;
    if (storedLang && storedLang in DICTS) setLangState(storedLang);
    if (storedTheme === "light" || storedTheme === "dark") setThemeState(storedTheme);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("light", theme === "light");
    root.setAttribute("lang", lang);
  }, [theme, lang]);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("kh-lang", l);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem("kh-theme", t);
  }, []);

  const t = useCallback(
    (key: string) => DICTS[lang][key] ?? uz[key] ?? key,
    [lang],
  );

  const value = useMemo<Ctx>(() => ({ lang, theme, setLang, setTheme, t }), [lang, theme, setLang, setTheme, t]);
  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi(): Ctx {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error("useUi must be used inside UiProvider");
  return ctx;
}

export function UiSwitch({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, theme, setTheme } = useUi();
  return (
    <div className="flex items-center gap-1">
      <div className="flex overflow-hidden rounded-full border border-border">
        {LANGS.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => setLang(l.id)}
            aria-label={l.label}
            className={`px-2.5 py-1 text-[11px] font-semibold transition ${
              lang === l.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        aria-label="theme"
        className={`rounded-full border border-border ${compact ? "px-2 py-1" : "px-2.5 py-1.5"} text-[13px] leading-none text-foreground hover:bg-secondary`}
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>
    </div>
  );
}
