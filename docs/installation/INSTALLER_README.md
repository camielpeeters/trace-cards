# 🧙‍♂️ Installatie Wizard - Overzicht

De installatie wizard is verbeterd en klaar voor Plesk deployment!

## ✨ Wat is er verbeterd?

### 1. **Betere Systeem Checks** ✅
- Node.js versie check
- Schrijfrechten verificatie voor `data/` folder
- SQLite database support test
- Environment variables check
- **Nieuw:** Prisma schema verificatie

### 2. **Verbeterde Error Handling** 🛡️
- Duidelijke foutmeldingen met uitleg
- Helpful error messages met oplossingen
- Betere visuele feedback in de UI
- Database connection test na setup

### 3. **Plesk Support** 🚀
- Buffer size aanpassingen voor Plesk omgeving
- Betere path handling
- Production mode support
- Verbeterde Prisma command execution

### 4. **Security & Protection** 🔒
- `/install` route wordt automatisch afgeschermd na installatie
- Redirect naar homepage als app al geïnstalleerd is
- `.installed` marker check in middleware

## 📍 Hoe te gebruiken

### Voor Plesk Deployment:

1. **Upload alle bestanden** naar `httpdocs/` in Plesk
2. **Installeer dependencies** via Plesk Node.js extension of SSH
3. **Ga naar** `https://jouwdomein.nl/install`
4. **Volg de wizard** - 7 stappen, automatisch uitgevoerd!

### Installatie Stappen in de Wizard:

1. **Systeem Checks** - Controleert alle vereisten
2. **Configuratie** - Vul admin gegevens in
3. **Environment Setup** - `.env` wordt aangemaakt
4. **Database Setup** - Prisma schema wordt gepusht
5. **Admin Account** - Eerste gebruiker wordt aangemaakt
6. **Finaliseren** - Installatie wordt afgerond
7. **Klaar!** - Success pagina met login links

## 📁 Belangrijke Bestanden

- `/app/install/page.js` - Installer wizard UI
- `/app/install/layout.js` - Install check & redirect
- `/app/api/install/*` - Install API routes
- `/middleware.js` - Route protection
- `/PLESK_INSTALLATION.md` - Volledige Plesk handleiding

## 🔄 Na Installatie

Na succesvolle installatie:
- `.installed` bestand wordt aangemaakt
- `/install` route wordt automatisch afgeschermd
- Redirect naar `/` als iemand naar `/install` gaat

## 🔧 Troubleshooting

Zie `PLESK_INSTALLATION.md` voor uitgebreide troubleshooting tips!

## ✅ Klaar voor gebruik!

De installer is nu volledig klaar voor Plesk deployment. Upload je bestanden en ga naar `/install` om te beginnen!

---

**Tip:** Check `PLESK_INSTALLATION.md` voor volledige installatie instructies! 📖
