# 🚀 Deployment Checklist voor trace.cards

## PRE-DEPLOYMENT (Lokaal)

- [ ] Test app lokaal: `npm run dev`
- [ ] Test registratie flow
- [ ] Test login flow
- [ ] Test kaarten toevoegen
- [ ] Build succesvol: `npm run build`
- [ ] Deployment package gemaakt: `./create-deployment-package.sh`

## PLESK SETUP

- [ ] Node.js enabled in Plesk (18.x+)
- [ ] Bestanden geupload naar httpdocs/
- [ ] Environment variables ingesteld
- [ ] JWT_SECRET gegenereerd (64 karakters random)
- [ ] SSH toegang werkend

## INSTALLATION (SSH)

```bash
cd /var/www/vhosts/trace.cards/httpdocs
npm install --production
npx prisma generate
npx prisma db push
```

## CONFIGURATION

- [ ] data/ folder aangemaakt met write permissions
- [ ] Database aangemaakt (production.db)
- [ ] SSL certificaat geïnstalleerd
- [ ] HTTPS redirect enabled
- [ ] Custom domain toegevoegd (trace.cards)

## POST-DEPLOYMENT

- [ ] App gestart in Plesk
- [ ] Homepage laadt: https://trace.cards
- [ ] Registratie werkt
- [ ] Login werkt
- [ ] Dashboard toegankelijk
- [ ] Kaarten laden
- [ ] API key ingesteld voor Pokemon TCG

## MONITORING

- [ ] Logs checken voor errors
- [ ] Performance testen
- [ ] Database grootte monitoren
- [ ] SSL expiry date noteerd

## BACKUP

- [ ] Database backup: cp data/production.db data/backup-$(date +%Y%m%d).db
- [ ] Backup plan ingesteld (wekelijks)

## KLAAR! 🎉

App is live op: https://trace.cards
