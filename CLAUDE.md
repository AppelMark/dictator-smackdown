# CLAUDE.md — Dictator Smackdown

Dit bestand wordt automatisch ingelezen door Claude Code bij elke sessie.
Lees het volledig voordat je iets doet.

---

## Projectoverzicht

**Naam:** Dictator Smackdown  
**Type:** Mobiele browser-first boxing game, later wrapped met Capacitor naar iOS en Android  
**Concept:** Een satirisch claymation boksspel waarbij de speler fictieve politieke archetypes verslaat. Alle personages zijn volledig fictief en satirisch. Geen echte namen of portretten.  
**Status:** In ontwikkeling  
**Doelplatform:** iOS Safari, Android Chrome, desktop Chrome  
**Primaire taal:** TypeScript (strict mode overal)

---

## Tech Stack

### Frontend
- **Next.js 15** met App Router
- **TypeScript** strict mode — NOOIT `any` gebruiken tenzij absoluut onvermijdelijk
- **Tailwind CSS** voor alle Next.js UI buiten Phaser
- **Google Fonts** via `next/font` — gebruik Bebas Neue voor titels

### Game Engine
- **Phaser.js 3.80.1** — alle game logica zit in /game/
- **Matter.js** ingebouwd in Phaser — voor physics van losrakende onderdelen
- Phaser canvas is NOOIT server-side gerenderd — altijd via dynamic import met `ssr: false`

### Backend
- **Supabase** voor database, auth, en file storage
- Browser client gebruikt ALTIJD de anon key
- Server-side API routes gebruiken de service role key
- Row Level Security is overal actief

### Verdienmodel
- **RevenueCat** voor native in-app aankopen (iOS App Store, Google Play)
- **Stripe** voor webbetalingen (omzeilt 30% App Store commissie)
- GEEN energie systeem of gevechten limiet
- GEEN pay-to-win elementen

### Deployment
- **Vercel** — elke push naar main deployt automatisch
- **Capacitor.js** voor native app wrapping (later)

---

## Folder Structuur
```
/app/                    → Next.js App Router pagina's en API routes
  /api/                  → Server-side API routes
    /scores/             → Score opslaan en leaderboard ophalen
    /challenge/          → Challenge link aanmaken
    /profile/            → Speler profiel beheer
    /purchases/verify/   → RevenueCat webhook
    /stripe/checkout/    → Stripe checkout session aanmaken
    /stripe/webhook/     → Stripe betaling afhandelen
    /cron/               → Vercel Cron Jobs (dagelijkse notificaties)
  /battle/               → Game pagina (laadt GameCanvas)
  /challenge/[id]/       → Challenge acceptatie pagina
  /hall-of-shame/        → Trophy collectie
  /leaderboard/          → Scorebord
  /privacy/              → Privacy policy (verplicht App Store)
  /select/               → Character selectie
  /shop/                 → DLC en Season Pass winkel

/components/             → Gedeelde React componenten
  GameCanvas.tsx         → Phaser embedder (client only, ssr: false)
  SaveProgressSheet.tsx  → Zachte login trigger na eerste overwinning
  CharacterCard.tsx      → Character kaart voor selectie pagina
  TrophyCard.tsx         → Trophy kaart voor hall of shame
  ShopItem.tsx           → Winkel item component
  WelcomeBack.tsx        → Welcome back banner terugkerende spelers

/game/                   → Alle Phaser game code (NOOIT Next.js imports hier)
  /scenes/               → Phaser Scene klassen
    LoadingScene.ts      → Eerste scene, laadt alle assets
    IntroScene.ts        → MTV nieuwsintro, eenmalig
    TutorialScene.ts     → Interactief eerste gevecht als tutorial
    AnnouncementScene.ts → Pre-fight aankondiging (slim: volledig 1e keer)
    BattleScene.ts       → Hoofdgevecht scene
    HUDScene.ts          → HUD overlay boven BattleScene
    KOScene.ts           → Knockout + score + replay
    DefeatScene.ts       → Verlies scherm met archetype taunt
    UnlockScene.ts       → Nieuw archetype unlocked animatie
    ChampionScene.ts     → World Champion eindscherm
  /managers/             → Phaser manager klassen
    TapZoneManager.ts    → Touch input: tap zones + dodge swipe
    FacePartManager.ts   → Losrakende onderdelen met Matter.js
    JuiceManager.ts      → Hit-stop, camera shake, particles, feedback
    AudioManager.ts      → Commentaar, SFX, catchphrases
    AIOpponent.ts        → AI per archetype met telegraph systeem
    ComboManager.ts      → Combo tracking en multipliers
  DamageCalculator.ts    → Schade berekening (statische methode)
  AdaptiveDifficulty.ts  → Win-rate gebaseerde moeilijkheidsaanpassing
  constants.ts           → ALLE game constanten (geen magic numbers)

/lib/                    → Gedeelde utilities en API wrappers
  supabase.ts            → Browser en server Supabase clients
  playerProfile.ts       → Speler profiel CRUD en unlock logica
  scoring.ts             → Score berekening en ster toekenning
  purchases.ts           → RevenueCat + Stripe integratie
  stripe.ts              → Stripe utilities
  shareVideo.ts          → KO clip generatie via MediaRecorder
  claude.ts              → Claude API wrapper (commentaar generatie)
  elevenlabs.ts          → ElevenLabs TTS wrapper
  replicate.ts           → Replicate API wrapper (sprite generatie)

/data/                   → Statische game data
  characters.ts          → Alle 6 archetypes + 2 DLC placeholders
  commentary.ts          → Alle commentaar zinnen en catchphrases
  shop.ts                → Alle winkel items met prijzen en IDs

/types/                  → TypeScript type definities
  character.ts           → CharacterArchetype, Character, Move, etc.
  battle.ts              → BattleState, PunchEvent, DamageResult, etc.
  progression.ts         → PlayerProfile, DailyChallenge, ChallengeLink
  shop.ts                → ShopItem, Purchase, ProductType

/scripts/                → Eenmalige generatie scripts (niet in productie)
  generate-sprites.ts    → Genereert alle 54 sprites via Replicate
  generate-audio.ts      → Genereert alle audio via ElevenLabs
  generate-arenas.ts     → Genereert alle arena achtergronden
  build-spritesheets.ts  → Combineert sprites tot Phaser atlas
  sd-prompts.json        → Stable Diffusion prompts per archetype en pose
  sd-arenas.json         → SD prompts voor arena lagen

/public/
  /sprites/              → Losse gegenereerde PNG sprites
  /spritesheets/         → Phaser atlas PNG + JSON bestanden
  /arenas/               → Arena achtergrond lagen
  /audio/
    /commentary/         → Pre-gegenereerde commentaar MP3's + index.json
    /catchphrases/       → Pre-gegenereerde catchphrase MP3's + index.json
    /sfx/                → Handmatig gedownloade SFX bestanden

/supabase/
  schema.sql             → Volledig database schema
  rls-policies.sql       → Row Level Security policies
```

---

## Architectuurregels — Altijd naleven

### 1. Phaser en Next.js zijn gescheiden werelden

Phaser code gaat NOOIT in /app/ of /components/ behalve in GameCanvas.tsx.
Next.js imports (next/image, next/navigation, etc.) gaan NOOIT in /game/.
Communicatie tussen Phaser en React gaat via:
- `window.location.href` voor navigatie vanuit Phaser naar Next.js
- Phaser `this.game.events` voor communicatie tussen Scenes
- URL query parameters voor data doorgeven van Next.js naar Phaser

### 2. TypeScript strict — geen uitzonderingen

- NOOIT `any` type gebruiken
- ALTIJD return types definiëren op functies
- ALTIJD interfaces gebruiken voor objectstructuren
- Gebruik de types uit /types/ consequent door de hele codebase
- Als een type ontbreekt: voeg het toe aan het juiste bestand in /types/

### 3. Supabase veiligheid

- Browser client (`createBrowserClient`) gebruikt ALTIJD `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Server client (`createServerClient`) gebruikt `SUPABASE_SERVICE_ROLE_KEY`
- Service role key mag NOOIT in client-side code of /game/ terechtkomen
- RLS is overal actief — test altijd of ongeautoriseerde queries geblokkeerd worden
- Anonymous ID wordt doorgegeven als `x-anonymous-id` request header

### 4. Environment variables

Variabelen die beginnen met `NEXT_PUBLIC_` zijn zichtbaar in de browser.
Gebruik deze NOOIT voor geheime keys.
Variabelen zonder prefix zijn alleen server-side beschikbaar.
Lijst van alle vereiste variabelen staat in `.env.local.example`.

### 5. Game constanten

Alle numerieke waarden die de gameplay beïnvloeden staan in `/game/constants.ts`.
NOOIT magic numbers direct in de game logica.
Als je een nieuwe constante nodig hebt: voeg die toe aan constants.ts.

### 6. Geen energie systeem

Er is GEEN dagelijkse gevechten limiet.
Er is GEEN energie mechanisme.
Spelers kunnen onbeperkt spelen.
Als je code schrijft die het aantal gevechten beperkt: dat is een bug, geen feature.

---

## De 6 Archetypes — Snel overzicht

| Archetype | Stijl | Moeilijkheid | Unlock |
|---|---|---|---|
| Der Großer | Berserker — langzaam, verwoestend | 1 — makkelijkst | Standaard unlocked |
| The Don | Chaotic — volledig onvoorspelbaar | 2 | Standaard unlocked |
| The Nationalist | Speedster — extreem snel | 3 | Na winst op The Don |
| The Chairman | Defensive — blokkeert alles | 4 | Na winst op The Nationalist |
| The Ayatollah | Counter — straft herhalingen | 5 | Na winst op The Chairman |
| The Generalissimo | Boss — langzaam maar devastating | 6 — moeilijkst | Na winst op The Ayatollah |

Road to Champion volgorde (ook in constants.ts):
`DerGroszer → TheDon → TheNationalist → TheChairman → TheAyatollah → TheGeneralissimo`

DLC archetypes (betaald, nog niet beschikbaar):
- The Oligarch — `dictator_dlc_oligarch_199`
- The Tech Messiah — `dictator_dlc_tech_199`

---

## Besturingssysteem

**Geen swipes voor aanvallen — tap zones**

| Actie | Invoer |
|---|---|
| Jab | Tap linkerhelft scherm |
| Cross | Dubbele tap linkerhelft snel (< 300ms) |
| Hook | Tap rechterhelft scherm |
| Uppercut | Dubbele tap rechterhelft snel (< 300ms) |
| Special Move opladen | Lang indrukken (500ms+) |
| Dodge links | Snelle swipe naar links (> 60px in < 150ms) |
| Dodge rechts | Snelle swipe naar rechts |

Cooldown tussen klappen: 200ms.
Minimale swipe snelheid voor dodge: > 60px deltaX in < 150ms.
Power van klap: `Math.max(0.3, Math.min(1.0, 1.0 - tapDuration / 400))` — kortere tap = meer power.

---

## Schade en Physics Systeem

### Schade berekening (DamageCalculator.ts)
1. Basis schade uit `PUNCH_DAMAGE[punchType]` in constants
2. × punch.power
3. × (attackerStrength / 80)
4. × COMBO_MULTIPLIERS[comboPosition]
5. Als geblokkeerd: × (1 - defenderDefense / 200), minimum 1
6. Als counter: × 2.0
7. Als momentum > 70: × 1.20
8. Als momentum < 30: × 0.80
9. Math.round, minimum 1

### Combo multipliers
Index 0: 1.0× | Index 1: 1.1× | Index 2: 1.2× | Index 3: 1.4× | Index 4+: 1.6×

### Onderdelen loslaten (FacePartManager.ts)
Thresholds als percentage van verloren health:
- Left ear: 25% verlies
- Right ear: 35% verlies
- Nose: 50% verlies
- Left eye: 65% verlies
- Tooth: 75% verlies
- All parts (bij KO): 100%

---

## AI Telegraph Systeem

Elke AI aanval heeft twee fases:
1. **Telegraph (450ms):** rode gloed op AI, 'DODGE!' hint zichtbaar. Speler kan swipen om te ontwijken.
2. **Aanval:** als speler niet gedodged heeft, volgt de aanval automatisch.

Bij succesvolle dodge: **Counter Window (200ms)** actief. Volgende klap doet 2× schade.

AI stijlen per archetype:
- `berserker` — traag, zwaar, Uppercut-gefocust, berserk onder 35% health
- `chaotic` — volledig random interval en PunchType, onleesbaar
- `speedster` — hoge frequentie, lage individuele schade
- `defensive` — blokkeert 35% van de tijd, weinig schade
- `counter` — analyseert laatste 5 speler moves, counter bij herhaling
- `boss` — traag maar devastatend, special elke 5e aanval, intimidation elke 12s

---

## Juice Systeem (JuiceManager.ts)

Elke klap triggert SIMULTAAN:
1. **Hit-stop** — game pauzeert voor 50-200ms afhankelijk van PunchType
2. **Camera shake** — intensiteit uit constants per PunchType
3. **Klei-spatter** — 12 particles die permanent op het scherm blijven
4. **Impact tekst** — POW/CRACK/SMASH/BOOM, schaalt op en fadet uit
5. **Screen flash** — alleen bij critical hits (> 2× baseDamage)

Hit-stop frames: JAB=3, CROSS=4, HOOK=5, UPPERCUT=8, SPECIAL=12

---

## Verdienmodel

### Wat GRATIS is
- Volledige Road to Champion (alle 6 gevechten)
- Alle gameplay mechanics
- Leaderboard en challenge links
- KO clip delen
- **ONBEPERKT spelen — geen gevechten limiet**

### Betaald
| Product | Prijs | Type |
|---|---|---|
| Nieuwe DLC archetypes | €1,99 per stuk | Eenmalig |
| Season Pass per kwartaal | €4,99 | Eenmalig per seizoen |
| Cosmetic skins | €0,99–€1,99 | Eenmalig |
| Founding Dictator Bundle | €7,99 | Eenmalig, 90 dagen beschikbaar |

RevenueCat product IDs:
- `dictator_dlc_oligarch_199`
- `dictator_dlc_tech_199`
- `dictator_season_q1_499`
- `dictator_founder_799`
- `dictator_cosmetic_golden_gloves_99`

Stripe product IDs: zelfde namen maar met `price_` prefix.

**BELANGRIJK:** Webbetalingen via Stripe vermijden de 30% App Store commissie.
Toon altijd een optie voor webbetalingen met de tekst: "Purchasing via web saves 30%."

---

## Onboarding Flow

### Eerste launch ooit
`LoadingScene → IntroScene (eenmalig) → TutorialScene (eenmalig) → /select`

### Terugkerende speler
`LoadingScene → /select (met Welcome Back banner als > 23u geleden)`

### localStorage keys (nooit verwijderen)
- `dictator_anonymous_id` — anonieme UUID van de speler
- `dictator_has_seen_intro` — intro niet opnieuw tonen
- `dictator_has_seen_tutorial` — tutorial niet opnieuw tonen
- `dictator_seen_start_here` — start-here pijl niet opnieuw tonen
- `dictator_dismissed_save_today` — save sheet datum check
- `dictator_seen_announcement_{archetype}` — versnelde versie na eerste keer

### sessionStorage keys (per sessie)
- `dictator_selected_archetype` — gekozen archetype voor gevecht
- `dictator_difficulty` — gekozen moeilijkheidsgraad (1/2/3)
- `dictator_challenge_target` — target score als van challenge link

---

## Progressie Systeem

### Road to Champion
Speler verslaat archetypes in volgorde. Elk gewonnen gevecht unlock het volgende archetype.
Na het verslaan van alle 6: ChampionScene → Hard Mode beschikbaar.

### Sterren per archetype
- Ster 1: win het gevecht (altijd)
- Ster 2: win binnen 90 seconden
- Ster 3: win zonder ooit geraakt te worden

### Account koppeling (progressief)
1. Speel anoniem (UUID in localStorage)
2. Na EERSTE overwinning: zachte trigger via `SaveProgressSheet`
3. Bij aankoop: account verplicht (voor aankoop herstel)
4. Koppeling via Supabase OAuth (Google + Apple)
5. Bij koppeling: merge anonieme data naar OAuth account

**NOOIT** login verplichten bij eerste gebruik of bij het starten van een gevecht.

---

## Supabase Schema Samenvatting
```
player_profiles      — id, anonymous_id, display_name, stats, purchased_dlc
character_progress   — player_id, archetype, wins, losses, stars, best_score
scores               — player_id, archetype, score, time_seconds, combo
daily_challenges     — challenge_date, archetype, par_score
challenge_links      — id, challenger_id, archetype, score, expires_at
purchases            — player_id, product_id, platform, amount_cents
push_tokens          — player_id, token, platform
```

Alle tabellen hebben Row Level Security actief.
Scores zijn publiek leesbaar voor leaderboard queries.
Purchases zijn alleen toegankelijk via service role.

---

## Coding Conventies

### Bestandsnamen
- PascalCase voor klassen en componenten: `BattleScene.ts`, `GameCanvas.tsx`
- camelCase voor utilities en helpers: `playerProfile.ts`, `scoring.ts`
- kebab-case voor Next.js pagina directories: `/hall-of-shame/`

### TypeScript
```typescript
// GOED: expliciete return types
function calculateDamage(punch: PunchEvent): DamageResult { ... }

// FOUT: impliciet any
function doSomething(data) { ... }

// GOED: interface voor objectstructuren
interface BattleConfig {
  archetype: CharacterArchetype;
  difficulty: 1 | 2 | 3;
}

// FOUT: inline object types
function startBattle(config: { archetype: string; difficulty: number }) { ... }
```

### Phaser patronen
```typescript
// GOED: events via this.events (binnen scene) of this.game.events (cross-scene)
this.events.emit('punch', punchEvent);
this.game.events.emit('hud_update', hudData);

// GOED: managers aanmaken in create(), niet in constructor
create() {
  this.tapZoneManager = new TapZoneManager(this);
  this.juiceManager = new JuiceManager(this);
}

// GOED: cleanup in scene shutdown
shutdown() {
  this.events.removeAllListeners();
}
```

### Async/await
```typescript
// GOED: async/await met try/catch
try {
  const profile = await getOrCreateProfile();
} catch (error) {
  console.error('Profile error:', error);
}

// FOUT: .then() chains
getOrCreateProfile().then(profile => { ... });
```

### Supabase queries
```typescript
// GOED: altijd error checken
const { data, error } = await supabase
  .from('scores')
  .insert({ ... });
if (error) throw error;

// FOUT: error negeren
const { data } = await supabase.from('scores').insert({ ... });
```

---

## Bekende Valkuilen — Voorkom Deze Fouten

### 1. Phaser server-side rendering
Phaser CRASHT op de server. GameCanvas.tsx laadt Phaser altijd via:
```typescript
const Phaser = await import('phaser');
```
En de pagina laadt GameCanvas via:
```typescript
const GameCanvas = dynamic(() => import('@/components/GameCanvas'), { ssr: false });
```

### 2. Matter.js physics in Phaser
Matter.js is de physics engine in Phaser. Voor losrakende onderdelen:
```typescript
// GOED: voeg physics toe via scene.matter
this.scene.matter.add.gameObject(sprite, { restitution: 0.65 });

// FOUT: gebruik Phaser arcade physics voor Matter objecten
sprite.setVelocityX(10); // werkt niet met Matter
sprite.setVelocity(10, -5); // Matter methode
```

### 3. Phaser tijdschaal voor slow-motion
```typescript
// GOED: tijdschaal via time manager
this.time.timeScale = 0.3;
this.time.delayedCall(500, () => { this.time.timeScale = 1.0; });

// FOUT: physics pauzeren voor slow-motion
this.physics.pause(); // stopt alles, niet slow-motion
```

### 4. Cross-scene communicatie
```typescript
// GOED: game events voor cross-scene communicatie
this.game.events.emit('hud_update', data); // in BattleScene
this.game.events.on('hud_update', handler); // in HUDScene

// FOUT: directe scene referenties
const battleScene = this.scene.get('BattleScene') as BattleScene;
battleScene.someProperty; // fragiel en type-unsafe
```

### 5. Next.js 15 App Router
```typescript
// GOED: 'use client' voor state en browser APIs
'use client';
import { useState } from 'react';

// GOED: server components voor data fetching
// Geen 'use client' — default is server component
async function LeaderboardPage() {
  const data = await fetchLeaderboard();
}

// FOUT: useState in server component
// Geeft een cryptische error
```

### 6. iOS Safari touch events
Het Phaser canvas heeft dit nodig anders werken touch events niet:
```typescript
canvas.style.touchAction = 'none';
canvas.style.userSelect = 'none';
```

### 7. Supabase anon key in server code
```typescript
// GOED: juiste client per context
// In client component:
const supabase = createBrowserClient(); // gebruikt anon key

// In API route:
const supabase = createServerClient(); // gebruikt service role key

// FOUT: service role key in browser code
// Geeft volledige database toegang aan elke gebruiker
```

---

## Hoe Nieuwe Features Toevoegen

### Nieuw archetype toevoegen
1. Voeg toe aan `CharacterArchetype` enum in `/types/character.ts`
2. Voeg stats toe aan `ARCHETYPE_STATS` in `/game/constants.ts`
3. Voeg character data toe aan `/data/characters.ts`
4. Voeg AI stijl toe aan `AIOpponent.ts` onder `decideAction()`
5. Voeg defeat taunts toe aan `/data/commentary.ts` onder `DEFEAT_TAUNT`
6. Voeg catchphrases toe aan `/data/commentary.ts` onder `ARCHETYPE_CATCHPHRASES`
7. Voeg arena prompts toe aan `/scripts/sd-arenas.json`
8. Genereer sprites via het generate-sprites script
9. Bouw sprite sheets opnieuw via build-spritesheets script
10. Genereer audio via generate-audio script

### Nieuw DLC item toevoegen aan de shop
1. Voeg toe aan `SHOP_ITEMS` in `/data/shop.ts`
2. Maak product aan in RevenueCat dashboard
3. Maak product aan in Stripe dashboard
4. Update `checkEntitlement()` in `/lib/purchases.ts`

### Nieuwe arena toevoegen
1. Voeg arena prompts toe aan `/scripts/sd-arenas.json`
2. Voer `generate-arenas.ts` script uit
3. Voeg arena key toe aan het Character object in `/data/characters.ts`
4. Laad de nieuwe arena assets in `BattleScene.preload()`

---

## Git Commit Conventie

Elke stap eindigt met een commit:
```
git add .
git commit -m "stap X.Y: korte beschrijving van wat je gedaan hebt"
git push origin main
```

Gebruik altijd lowercase voor commit messages.
Beschrijf WAT je gedaan hebt, niet HOE.
Maximum 72 karakters per commit message.

Gebruik tags voor releases:
```
git tag v1.0.0
git push origin v1.0.0
```

---

## Omgevingsvariabelen Referentie
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=              # Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=         # Veilig voor browser
SUPABASE_SERVICE_ROLE_KEY=             # NOOIT in browser code

# AI en generatie (alleen server-side)
REPLICATE_API_TOKEN=                   # Sprite generatie
ANTHROPIC_API_KEY=                     # Claude API
ELEVENLABS_API_KEY=                    # TTS generatie
ELEVENLABS_VOICE_ID=                   # Stem ID (pNInz6obpgDQGcFmaJgB als default)

# Betalingen
STRIPE_SECRET_KEY=                     # Alleen server-side
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=    # Veilig voor browser
STRIPE_WEBHOOK_SECRET=                 # Webhook verificatie

# RevenueCat
NEXT_PUBLIC_REVENUECAT_IOS_KEY=        # iOS SDK key
NEXT_PUBLIC_REVENUECAT_ANDROID_KEY=    # Android SDK key

# App configuratie
NEXT_PUBLIC_BASE_URL=                  # https://dictatorsmackdown.com in productie
```

---

## Satirisch en Juridisch Kader

**ALTIJD onthouden:**
- Alle personages zijn volledig fictief
- Geen echte namen in code, data, of commentaar
- Geen fotorealistisch portret van herkenbare personen
- Cartoon geweld zonder bloed (12+ rating doelstelling)
- Elke publiek zichtbare tekst die archetypes beschrijft moet duidelijk satirisch zijn

Dit is beschermd als artistieke satire in de traditie van South Park, Spitting Image, en Veep.

De disclaimer in de App Store beschrijving (nooit aanpassen):
> "All characters in Dictator Smackdown are entirely fictional satirical archetypes. 
> Any resemblance to real persons, living or dead, is purely coincidental and unintended."

---

## Projectstatus Bijhouden

Gebruik dit gedeelte om de huidige status bij te houden.
Update dit handmatig na elke voltooide fase.

**Voltooide fases:**
- [ ] Fase 1: Project Fundament
- [ ] Fase 2: Account Systeem
- [ ] Fase 3: Onboarding Flow
- [ ] Fase 4: Gevechtsengine
- [ ] Fase 5: Flow Schermen
- [ ] Fase 6: Sprites en Arena's
- [ ] Fase 7: Audio en Commentaar
- [ ] Fase 8: Verdienmodel en Shop
- [ ] Fase 9: Leaderboard en Challenge Links
- [ ] Fase 10: Polish en Performance
- [ ] Fase 11: Capacitor en App Store
- [ ] Fase 12: Launch

**Huidige stap:** Nog niet begonnen

**Bekende openstaande issues:** Geen
```

---

## Over SKILLS.md in Claude Code

Nu het tweede punt. In de **geïntegreerde Claude Code extensie voor VS Code** werkt het SKILLS.md systeem anders dan in de standalone terminal versie.

**Hoe het werkt:**

Claude Code leest automatisch bestanden op basis van locatie. Het prioriteert bestanden in deze volgorde:

1. `CLAUDE.md` in de root van je project — dit is je hoofdbestand
2. `CLAUDE.md` bestanden in subdirectories — worden gelezen als je in die map werkt
3. `.claude/` directory — voor extra instructies

**Mijn aanbeveling voor jouw project:**

Maak naast het CLAUDE.md in de root ook subdirectory CLAUDE.md bestanden voor de twee meest complexe onderdelen. Claude Code leest deze automatisch als je aan bestanden in die map werkt.
```
mkdir .claude