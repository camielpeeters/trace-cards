# 📦 Plesk Installatie Handleiding

Deze handleiding helpt je om de trace.cards applicatie te installeren op Plesk via de installatie wizard.

## 📋 Vereisten

- Plesk met Node.js 18.x of hoger
- Schrijfrechten in de `httpdocs` directory
- FTP/SSH toegang om bestanden te uploaden

## 🚀 Installatie Stappen

### Stap 1: Upload naar Plesk

1. **Pak de applicatie uit** in je lokale omgeving
2. **Upload alle bestanden** naar de `httpdocs` directory van je Plesk domain via:
   - **FTP** (FileZilla, WinSCP, etc.)
   - **SSH** (rsync, scp)
   - **Plesk File Manager**

3. **Zorg dat de folder structuur intact blijft:**
   ```
   httpdocs/
   ├── app/
   ├── prisma/
   ├── public/
   ├── package.json
   ├── next.config.js
   └── ... (alle andere bestanden)
   ```

### Stap 2: Installeer Dependencies

#### Optie A: Via Plesk Node.js Extension (Aanbevolen)

1. Ga naar **Plesk > Domains > [jouw domain] > Node.js**
2. Zorg dat **Node.js versie 18.x of hoger** is geselecteerd
3. Zet **Application Root** naar `/httpdocs`
4. Zet **Application Startup File** naar `server.js` (of `next start`)
5. Klik op **Enable Node.js**

#### Optie B: Via SSH (Alternatief)

1. Maak SSH verbinding met je server
2. Navigeer naar de httpdocs directory:
   ```bash
   cd /var/www/vhosts/jouwdomein.nl/httpdocs
   ```
3. Installeer dependencies:
   ```bash
   npm install --production
   ```

### Stap 3: Build de Applicatie (Optioneel, voor production)

Als je de applicatie wilt builden voor production:

```bash
npm run build
```

**Let op:** Voor de installer wizard hoef je dit nog niet te doen. De wizard kan automatisch builden.

### Stap 4: Start de Installatie Wizard

1. Open je browser en ga naar: `https://jouwdomein.nl/install`
2. De installatie wizard wordt automatisch geopend

### Stap 5: Doorloop de Wizard

De wizard heeft **7 stappen**:

#### Stap 1: Systeem Checks ✅
- **Node.js Versie**: Controleert of je Node.js 18+ hebt
- **Schrijfrechten**: Controleert of je kan schrijven in `data/` folder
- **Database Support**: Test of SQLite werkt
- **Environment Variables**: Controleert `.env` bestand
- **Prisma Schema**: Verifieert dat Prisma schema aanwezig is

Klik op **"Start Controle"** en wacht tot alle checks groen zijn.

#### Stap 2: Configuratie ⚙️
Vul het formulier in:
- **Admin Username**: Je gebruikersnaam (bijv. `admin`)
- **Email**: Je e-mailadres
- **Display Name**: Optioneel, je weergavenaam
- **Wachtwoord**: Minimaal 8 karakters
- **Bevestig Wachtwoord**: Herhaal je wachtwoord
- **Pokemon TCG API Key**: Optioneel (van [pokemontcg.io](https://dev.pokemontcg.io/))
- **JWT Secret**: Wordt automatisch gegenereerd ✅

#### Stap 3-6: Installatie 🔄
De wizard voert automatisch uit:
1. Environment Setup (`.env` aanmaken)
2. Database Setup (Prisma schema pushen)
3. Admin Account (eerste gebruiker aanmaken)
4. Finaliseren (`.installed` marker aanmaken)

#### Stap 7: Klaar! 🎉
Je ziet een success pagina met:
- Je login gegevens
- Link naar `/login`
- Link naar je profiel pagina

### Stap 6: Configureer Plesk (Na Installatie)

Na succesvolle installatie:

1. **Zorg dat de applicatie blijft draaien:**
   - Plesk Node.js extension blijft automatisch actief
   - Of configureer een PM2 process via SSH

2. **SSL Certificaat** (aanbevolen):
   - Ga naar **Plesk > Domains > [jouw domain] > SSL/TLS**
   - Installeer een Let's Encrypt certificaat

3. **Environment Variabelen** (indien nodig):
   - Controleer `.env` in `httpdocs/`
   - Pas aan indien nodig via Plesk File Manager

## 🔧 Troubleshooting

### Probleem: "Geen schrijfrechten"
**Oplossing:**
```bash
# Via SSH, geef schrijfrechten:
chmod 755 httpdocs/data
mkdir -p httpdocs/data
chmod 755 httpdocs/data
```

### Probleem: "Node.js versie te oud"
**Oplossing:**
1. Ga naar **Plesk > Node.js**
2. Installeer Node.js 18.x of hoger
3. Selecteer deze versie voor je domain

### Probleem: "Database setup failed"
**Oplossing:**
- Controleer of `data/` folder bestaat en schrijfrechten heeft
- Check of Prisma correct is geïnstalleerd (`npm install` opnieuw uitvoeren)

### Probleem: "Prisma generate failed"
**Oplossing:**
```bash
cd /var/www/vhosts/jouwdomein.nl/httpdocs
npm install
npx prisma generate
```

### Probleem: Installer werkt niet
**Oplossing:**
1. Check of je naar `/install` gaat (niet `/install/`)
2. Controleer browser console voor errors
3. Check Plesk error logs: **Plesk > Logs > Error Log**

## 📝 Belangrijke Bestanden

Na installatie:
- `.env` - Environment configuratie (NIET verwijderen!)
- `.installed` - Installatie marker (NIET verwijderen!)
- `data/production.db` - SQLite database (BACKUP maken!)

## 🔄 Herinstallatie

Als je de applicatie opnieuw wilt installeren:

1. Verwijder `.installed` bestand via Plesk File Manager
2. (Optioneel) Verwijder `.env` als je configuratie wilt resetten
3. Ga opnieuw naar `/install`

**Let op:** Dit verwijdert NIET je database. Om volledig te resetten:
- Verwijder `data/production.db`
- Verwijder `.env` en `.installed`
- Start installatie wizard opnieuw

## 📞 Support

Bij problemen:
1. Check de error logs in Plesk
2. Check browser console (F12)
3. Controleer alle checks in Stap 1 van de wizard

## ✅ Installatie Checklist

- [ ] Bestanden geüpload naar `httpdocs/`
- [ ] Node.js 18+ geïnstalleerd in Plesk
- [ ] Dependencies geïnstalleerd (`npm install`)
- [ ] Schrijfrechten op `data/` folder
- [ ] Wizard bereikbaar via `/install`
- [ ] Alle systeem checks geslaagd
- [ ] Admin account aangemaakt
- [ ] Installatie voltooid
- [ ] SSL certificaat geconfigureerd

---

**Veel succes met de installatie! 🎉**
