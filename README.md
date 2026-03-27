# KSEB STOR

متجر احترافي مبني بـ Next.js + TypeScript + Tailwind + Prisma + PostgreSQL.

## التشغيل محلياً

1. انسخ ملف البيئة:
   - `.env.example` -> `.env`
2. ضع اتصال PostgreSQL في `DATABASE_URL`
3. نفّذ:

```bash
npm install
npx prisma generate
npx prisma db push
npm run prisma:seed
npm run dev
```

## المزايا

- متجر عربي RTL مع بحث ذكي وسلة وGuest Checkout
- لوحة إدارة (أقسام/فروع/منتجات/متغيرات) + رفع صور من الجهاز
- إدارة الطلبات وتحويلها للنظام الأساسي عبر `mainOrderId`
- تقارير أرباح ومخزون

## API أساسية

- `GET /api/store/search?q=...`
- `POST /api/store/cart/variants`
- `POST /api/store/checkout`
- `POST /api/store/orders/:id/transfer`
