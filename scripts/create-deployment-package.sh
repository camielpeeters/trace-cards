#!/bin/bash

echo "📦 Creating deployment package..."

# Maak deployment folder
rm -rf deployment
mkdir -p deployment

# Kopieer essentiële bestanden
echo "Copying files..."
cp -r .next deployment/
cp -r public deployment/
cp -r prisma deployment/
cp package.json deployment/
cp package-lock.json deployment/
cp next.config.js deployment/
cp .env.production deployment/.env

# Maak data folder voor database
mkdir -p deployment/data

# Maak README voor deployment
cat > deployment/DEPLOYMENT_README.txt << 'EOF'
TRACE.CARDS - DEPLOYMENT INSTRUCTIES VOOR PLESK
================================================

1. Upload alle bestanden naar je Plesk domein folder (bijvoorbeeld: httpdocs)

2. Ga naar Plesk > Node.js settings:
   - Node.js version: 18.x of hoger
   - Application mode: production
   - Application root: / (of je httpdocs pad)
   - Application startup file: node_modules/next/dist/bin/next
   - Arguments: start

3. Environment variables instellen in Plesk:
   DATABASE_URL=file:./data/production.db
   JWT_SECRET=your-super-secret-jwt-key-HERE
   NODE_ENV=production
   POKEMON_API_KEY=your-pokemon-api-key

4. In Plesk SSH/Terminal:
   cd /var/www/vhosts/yourdomain.com/httpdocs
   npm install --production
   npx prisma generate
   npx prisma db push
   npm start

5. Restart Node.js application in Plesk

6. Check: https://yourdomain.com

BELANGRIJK:
- Zorg dat data/ folder write permissions heeft (755)
- JWT_SECRET moet een lange random string zijn
- Bewaar je .env veilig (niet in public folder!)

Support: Kijk in logs als iets niet werkt
EOF

# Zip alles
echo "Creating ZIP..."
cd deployment
zip -r ../trace-cards-deployment.zip . -x "*.DS_Store" -x "node_modules/*"
cd ..

echo "✅ Deployment package created: trace-cards-deployment.zip"
echo ""
echo "📤 Upload dit bestand naar Plesk en unzip in je httpdocs folder"
