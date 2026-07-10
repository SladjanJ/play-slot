# PlaySlot — Product Requirements Document (PRD)

> **Version:** 1.0 (MVP)  
> **Last updated:** 2026-07-05  
> **Status:** Approved for implementation

## 1. Vision

PlaySlot je web aplikacija za online rezervaciju fudbalskih termina. Cilj je olakšati posao vlasnicima terena (Host) i ubrzati rezervaciju za igrače (Player) širom Balkana i inostranstva.

**MVP sport:** Fudbal only (arhitektura mora dozvoliti proširenje na druge sportove kasnije).

**Jezici:** Srpski (SR) i Engleski (EN).

---

## 2. Goals & Non-Goals

### Goals (MVP)

- Jednostavna registracija sa email verifikacijom
- Dvije uloge: **Player** i **Host**
- Host postavlja radno vrijeme, trajanje slot-a, cijenu i način potvrde rezervacije
- Player pretražuje terene i rezerviše termine
- Realtime kalendar
- Email i in-app notifikacije
- Production-ready demo (bez plaćanja online)

### Non-Goals (MVP)

- Online plaćanje
- Recenzije i ocjene
- Više sportova
- Admin panel
- SMS notifikacije
- Ručno blokiranje pojedinačnih slotova
- Host ne može rezervisati termine (nema dual role)

---

## 3. User Roles

| Role | Description |
|------|-------------|
| **Player** | Traži terene, pregleda kalendar, rezerviše i otkazuje termine |
| **Host** | Vlasnik jednog terena; upravlja profilom, kalendarom i rezervacijama |
| **Admin** | Rezervisano za budućnost (nema UI u MVP-u) |

---

## 4. User Flows

### 4.1 First Visit (Landing)

1. Korisnik otvara sajt
2. **Language popup** (prvi posjet)
3. Jezik se automatski detektuje iz browser locale (EN → EN, SR → SR)
4. Jezik se može promijeniti u headeru (EN/SR); izbor se pamti u cookie/localStorage
5. Kratka landing stranica: naslov, opis teme, **Register** i **Login**
6. Header sadrži **search bar** (Player flow)

**Header auth stanje:**

- **Gost:** Register + Login u headeru
- **Ulogovan korisnik:** samo **Logout** (Register/Login sakriveni)
- Landing hero sakriva Register/Login kad je korisnik prijavljen

**Rute:** `/sr`, `/en` (marketing/landing only)

### 4.2 Registration

- **Prvo polje: uloga** (Player ili Host)
- Polja se dinamički prikazuju na osnovu uloge

**Player polja:**

- Email, lozinka, ime, prezime
- Telefon: **opciono**

**Host polja:**

- Email, lozinka, ime
- Naziv firme
- Država → Grad (kaskadni dropdown)
- Timezone
- Lokacija: pin na mapi (Leaflet + OpenStreetMap)

### 4.3 Email Verification

1. Nakon Register → stranica **„Provjeri email"** (email u URL-u ako nema session)
2. Korisnik klikne link u emailu
3. Vraća se na verify stranicu
4. Klik **Refresh** → provjera session-a → redirect:
   - **Player** → landing (`/`) sa headerom
   - **Host** → `/host/setup` wizard
5. Dugme **„Pošalji email ponovo"** (`auth.resend`) za ponovno slanje

**Supabase localhost:** Site URL `http://localhost:3000`, Redirect URLs uključuju `/auth/callback`

**Pravilo:** Dok email nije verified, nema pristupa aplikaciji.

### 4.4 Host Setup (before publish)

Host mora popuniti prije nego teren bude javan:

| Field | Required |
|-------|----------|
| Email, lozinka, ime | ✅ (registracija) |
| Naziv firme | ✅ |
| Država + Grad | ✅ |
| Pin na mapi (lat/lng/adresa) | ✅ |
| Timezone | ✅ |
| Radno vrijeme (po danu) | ✅ |
| Trajanje slot-a (npr. 60 min) | ✅ |
| Cijena po slot-u | ✅ |
| Max uzastopnih slotova po rezervaciji | ✅ |
| Način potvrde (auto / pending) | ✅ |

**Radno vrijeme:**

- Unos **po danu** (Pon–Ned)
- Dugme **„Primijeni na sve dane"** kada su svi dani ista

**Publish:**

- Teren je `draft` dok nije kompletan
- Tek nakon Publish → vidljiv u pretrazi (`published`)

### 4.5 Host Dashboard

- Kalendar (isti prikaz kao Player, ali Host vidi **ime rezervisanog korisnika**)
- **Side panel:** današnje rezervacije + pending lista
- **Approve / Reject** pending rezervacija u panelu
- Profil/postavke na `/host/settings` (firma, lokacija, radno vrijeme, cijena, slot settings, confirmation mode)

**Host NE može:** ručno blokirati slotove u MVP-u (samo radno vrijeme ograničava dostupnost)

### 4.6 Player Search & Booking

1. Pretraga po **nazivu firme** + filter **grad/država**
2. Odabir terena → kalendar sa slobodnim slotovima, cijenom, radnim vremenom
3. Realtime ažuriranje (Supabase Realtime)
4. Rezervacija:
   - Bira **početni slot**
   - Bira **broj uzastopnih slotova** (1 … max definisan od Host-a)
   - **Minimum 1 sat** prije početka termina (ne može se rezervisati slot koji počinje za manje od 1h)
   - Trajanje mora biti **višekratnik** Host slot trajanja (npr. ako je 1h optimalan, nema 30 min)
   - **3 min lock** tokom checkout-a
   - Prikaz ukupne cijene
5. Potvrda:
   - **Auto:** odmah `confirmed`
   - **Pending:** poruka „Čeka se potvrda od Hosta" + email Hostu

### 4.7 Pending Reservations

- Pending ističe nakon **24h** → status `expired`, slot oslobođen
- Host Approve → `confirmed` + email Playeru
- Host Reject → `rejected` + **email + in-app notifikacija** Playeru

### 4.8 Cancellation (Player)

- Moguće **minimum 5 sati** prije termina
- **Obavezan razlog** u formi
- Slot odmah slobodan
- Host dobija **email sa razlogom**

### 4.9 Host Settings Change — Pending → Auto

- Modal upozorenje: „Imate X pending rezervacija koje će biti otkazane"
- Potvrda → sve pending → `cancelled` + email korisnicima

### 4.10 Auth Flows (required)

- Register
- Login
- Logout
- Forgot password / Reset password

---

## 5. Business Rules

| Rule | Value |
|------|-------|
| Terena po Host nalogu | 1 |
| Min. rezervacija unaprijed | 1 sat prije početka termina |
| Min. otkazivanje | 5 sati prije termina |
| Pending timeout | 24 sata |
| Slot lock | 3 minute |
| Plaćanje | Na licu mjesta (nema online) |
| Cijena | Vidljiva na kalendaru i u potvrdi |
| Valuta (default) | RSD za RS, EUR za ostale države |

---

## 6. Notifications

### Email

- Verifikacija emaila
- Reset lozinke
- Potvrda rezervacije (Player + Host)
- Nova pending rezervacija
- Pending approved / rejected / expired
- Mass cancel (promjena pending→auto)
- Otkazivanje (Host + Player potvrda)

### In-App

- Odbijena pending rezervacija
- Ostale ključne status promjene
- Bell ikona u headeru → `/notifications`

### SMS

- Ne u MVP-u

---

## 7. Geography (Countries & Cities)

- Tabele `countries` i `cities` u Supabase
- Svaka država ima listu gradova
- **MVP seed:** cijeli **Balkan** (RS, BA, ME, HR, MK, AL, SI) — glavni gradovi po državi
- Host bira: država → grad (dropdown)
- Adresa se dopunjuje iz geocoding-a pin-a na mapi

---

## 8. UI/UX Requirements

- **Stack UI:** shadcn/ui
- **Tema:** svijetla, minimal shadcn default; blagi sportski akcent (primary zelena)
- **Responsive:** mobile i desktop jednako od starta
- **i18n:** next-intl; landing sa locale prefiksom; app rute bez prefiksa

---

## 9. Success Criteria (MVP)

- [x] Player može pronaći teren, rezervisati i otkazati termin
- [x] Host može postaviti teren, objaviti ga i upravljati rezervacijama
- [x] Nema double-booking (lock + DB constraint)
- [x] Email verifikacija i reset lozinke rade
- [x] SR/EN prekidač radi i pamti izbor
- [x] Realtime kalendar ažurira slotove

---

## 10. Implementation Phases

1. **Faza 1:** Supabase schema + RLS + Auth
2. **Faza 2:** i18n + Landing (language popup)
3. **Faza 3:** Host flow (setup, dashboard, settings)
4. **Faza 4:** Player flow (search, booking, cancel)
5. **Faza 5:** Realtime + email + polish

---

## 11. Open Items / Future

- Online plaćanje (Stripe / lokalni provajderi)
- Recenzije
- Više sportova
- Admin panel
- Više terena po Host nalogu
- Slike terena
- PWA
- Proširenje liste gradova po državama
