# Absence System

Sistem absensi digital dengan Next.js frontend dan NestJS backend.

## Struktur Project

```
absence-system/
├── absence-backend/     # NestJS REST API
└── absence-frontend/    # Next.js Web App
```

## Backend (NestJS)

### Setup & Run
```bash
cd absence-backend
npm install
npm run start:dev
```

Backend berjalan di `http://localhost:3000`

### Features
- ✅ Register & Login (bcrypt password hashing)
- ✅ Toggle Clock In/Out via email
- ✅ Auto-generate comment berdasarkan jam kerja
- ✅ Validasi harian (1x IN, 1x OUT per hari)
- ✅ Integrasi PeopleHR (optional remote swipe)
- ✅ MySQL database dengan Prisma ORM

### Endpoints
- `POST /auth/register` - Daftar user baru
- `POST /auth/login` - Login
- `POST /attendance/clock` - Clock in/out toggle

### Database
MySQL via Laragon/XAMPP. Pastikan DB `absence` sudah dibuat.

```bash
npx prisma db push
npx prisma generate
```

## Frontend (Next.js)

### Setup & Run
```bash
cd absence-frontend
npm install
npm run dev
```

Frontend berjalan di `http://localhost:3001` (atau port berikutnya jika 3000 dipakai backend)

### Features
- ✅ Landing page dengan fitur overview
- ✅ Register page
- ✅ Login page
- ✅ Dashboard dengan real-time clock
- ✅ Toggle clock in/out dengan satu tombol
- ✅ Responsive UI dengan Tailwind CSS

### Pages
- `/` - Landing page
- `/register` - Daftar akun baru
- `/login` - Halaman login
- `/dashboard` - Dashboard absensi (protected)

## Environment Variables

### Backend (.env di absence-backend/)
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=absence
DB_USERNAME=root
DB_PASSWORD=

DATABASE_URL="mysql://root:@127.0.0.1:3306/absence"

APP_SECRET=replace_with_a_strong_secret_here

REMOTE_BASE_URL=https://metrodata.peopleshr.com
REMOTE_LOGIN_PATH=/hr/security/login?ReturnUrl=%2fhr
REMOTE_MANUAL_SWIPE_PATH=/hr/TNAV9/api/ManualSwipe/SubmitManualSwipe

PORT=3000
```

### Frontend (.env.local di absence-frontend/)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Usage Flow

1. **Daftar akun** di `/register`
2. **Login** di `/login`
3. **Dashboard** otomatis terbuka
4. **Klik tombol besar** untuk clock in (pertama kali)
5. **Klik lagi** untuk clock out
6. **Validasi**: tidak bisa clock lebih dari 1x IN dan 1x OUT per hari

## Tech Stack

### Backend
- NestJS
- Prisma ORM
- MySQL
- bcryptjs (password hashing)
- axios + tough-cookie (remote API calls)

### Frontend
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- React

## Development

Jalankan kedua server secara bersamaan:

```bash
# Terminal 1 - Backend
cd absence-backend
npm run start:dev

# Terminal 2 - Frontend
cd absence-frontend
npm run dev
```

## Production Build

### Backend
```bash
cd absence-backend
npm run build
npm run start:prod
```

### Frontend
```bash
cd absence-frontend
npm run build
npm start
```

## Notes

- Default jam kerja: 08:00 - 17:00
- Comment otomatis: "Datang tepat waktu", "Datang terlambat", dll
- Remote PeopleHR swipe bersifat optional (bisa gagal jika token/payload tidak match)
- User credentials tersimpan di localStorage (frontend)
- Production: implementasi JWT untuk auth yang lebih aman

## License

Private project
