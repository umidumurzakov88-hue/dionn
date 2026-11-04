// Admin "feedback" section strings (callbacks + reviews). ru is the source of truth for the type.
const ru = {
  callbacks: {
    title: 'Заявки',
    subtitle: 'Обратные звонки и быстрые заказы с сайта (дублируются в Telegram)',
    tabNew: 'Новые',
    tabDone: 'Обработанные',
    emptyNew: 'Новых заявок нет 🎉',
    emptyDone: 'Обработанных заявок нет',
    quickOrder: 'Быстрый заказ',
    call: 'Звонок',
  },
  reviews: {
    title: 'Отзывы',
    subtitle: 'Отзывы появляются на сайте только после публикации',
    tabPending: 'На модерации',
    tabPublished: 'Опубликованные',
    emptyPending: 'Новых отзывов нет',
    emptyPublished: 'Опубликованных отзывов пока нет',
    general: 'Общий отзыв',
    rating: 'Оценка: {n} из 5',
  },
};
export type Dict = typeof ru;

const uz: Dict = {
  callbacks: {
    title: 'Arizalar',
    subtitle: 'Saytdan qayta qo‘ng‘iroq va tezkor buyurtmalar (Telegramga ham yuboriladi)',
    tabNew: 'Yangi',
    tabDone: 'Ko‘rib chiqilgan',
    emptyNew: 'Yangi arizalar yo‘q 🎉',
    emptyDone: 'Ko‘rib chiqilgan arizalar yo‘q',
    quickOrder: 'Tezkor buyurtma',
    call: 'Qo‘ng‘iroq',
  },
  reviews: {
    title: 'Sharhlar',
    subtitle: 'Sharhlar saytda faqat nashr etilgandan keyin ko‘rinadi',
    tabPending: 'Moderatsiyada',
    tabPublished: 'Nashr etilgan',
    emptyPending: 'Yangi sharhlar yo‘q',
    emptyPublished: 'Hozircha nashr etilgan sharhlar yo‘q',
    general: 'Umumiy sharh',
    rating: 'Baho: 5 dan {n}',
  },
};

const en: Dict = {
  callbacks: {
    title: 'Requests',
    subtitle: 'Callback requests and quick orders from the site (also sent to Telegram)',
    tabNew: 'New',
    tabDone: 'Handled',
    emptyNew: 'No new requests 🎉',
    emptyDone: 'No handled requests',
    quickOrder: 'Quick order',
    call: 'Callback',
  },
  reviews: {
    title: 'Reviews',
    subtitle: 'Reviews appear on the site only after they are published',
    tabPending: 'Awaiting moderation',
    tabPublished: 'Published',
    emptyPending: 'No new reviews',
    emptyPublished: 'No published reviews yet',
    general: 'General review',
    rating: 'Rating: {n} out of 5',
  },
};

const dict = { ru, uz, en };
export default dict;
