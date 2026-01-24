'use client';

import { useEffect, useRef } from 'react';
import { useTheme } from './ThemeProvider';

export default function CloudBackground() {
  const { darkMode, mounted } = useTheme();
  
  if (!mounted) return null;

  return <CloudBackgroundCanvas darkMode={darkMode} />;
}

function CloudBackgroundCanvas({ darkMode = false }) {
  const canvasRef = useRef(null);
  const darkModeRef = useRef(darkMode);
  const cloudsRef = useRef([]);
  const starsRef = useRef([]);
  const shootingStarsRef = useRef([]);
  const sunRef = useRef(null);
  const grassRef = useRef([]);
  const animationTimeRef = useRef(0);

  // Update darkMode ref wanneer het verandert (zonder effect opnieuw te runnen)
  useEffect(() => {
    darkModeRef.current = darkMode;
    // Clean up opposite mode features when switching
    if (darkMode) {
      // Switch to dark mode: clear sun
      sunRef.current = null;
    } else {
      // Switch to light mode: clear shooting stars
      shootingStarsRef.current = [];
    }
  }, [darkMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    // Browser detection (used only for canvas safety fallbacks / minor styling)
    const ua = typeof navigator !== 'undefined' ? (navigator.userAgent || '') : '';
    
    // Safari detection - DISABLE CANVAS ENTIRELY for Safari
    const IS_SAFARI = /^((?!chrome|android).)*safari/i.test(ua);
    
    if (IS_SAFARI) {
      console.log('🍎 Safari detected - Canvas disabled, using CSS clouds fallback');
      // Don't render canvas at all for Safari
      return;
    }
    
    const IS_FIREFOX = /Firefox|FxiOS/i.test(ua);
    const IS_CURSOR = /Cursor|Electron/i.test(ua);
    const IS_CHROME =
      /Chrome|Chromium|CriOS/i.test(ua) && !/Edg|OPR|Electron|Cursor/i.test(ua) && !IS_FIREFOX;
    // Treat Electron/Cursor as Chromium too (broad)
    const IS_CHROMIUM = !IS_FIREFOX && /Chrome|Chromium|CriOS|Edg|OPR|Electron/i.test(ua);
    // Only enable aggressive grass safe-mode for Cursor/Electron. Chrome should match Firefox visuals.
    const IS_SAFE_GRASS = IS_CURSOR;
    let width, height;
    let animationId;
    let dpr = window.devicePixelRatio || 1;
    let lastWidth = 0;
    let lastHeight = 0;
    const SIGNIFICANT_SIZE_CHANGE = 50; // Alleen resetten bij > 50px verschil

    const CLOUD_COUNT = 6;
    const WIND_SPEED = 0.5; // Snellere animatie (was 0.2)
    const STAR_COUNT = 250; // Meer sterren maar subtieler
    
    // Force dark mode check from DOM (Safari compatibility)
    const getCurrentDarkMode = () => {
      return document.documentElement.classList.contains('dark');
    };

    function resize() {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      dpr = window.devicePixelRatio || 1;
      
      // Check of de dimensies significant zijn veranderd
      const widthChanged = Math.abs(newWidth - lastWidth) > SIGNIFICANT_SIZE_CHANGE;
      const heightChanged = Math.abs(newHeight - lastHeight) > SIGNIFICANT_SIZE_CHANGE;
      const shouldResetStars = widthChanged || heightChanged;
      
      width = newWidth;
      height = newHeight;
      
      // Reset gras bij resize zodat het altijd aan footer blijft
      if (widthChanged || heightChanged) {
        grassRef.current = [];
      }
      
      // Hogere resolutie canvas (2x in dark mode voor anti-pixelation)
      const resolutionScale = darkModeRef.current ? 2 : 1;
      canvas.width = width * dpr * resolutionScale;
      canvas.height = height * dpr * resolutionScale;
      canvas.style.width = width + 'px';
      canvas.style.height = height + 'px';
      
      // Herinitialiseer sterren ALLEEN bij significante size change
      // Dit voorkomt plotselinge verdwijning bij kleine resize events
      if (darkModeRef.current && shouldResetStars) {
        // Mark stars for reinitialization maar verwijder ze niet onmiddellijk
        // Ze worden automatisch opnieuw geïnitialiseerd in animate() loop
        if (starsRef.current.length > 0) {
          starsRef.current = []; // Reset zodat ze opnieuw worden geïnitialiseerd met nieuwe dimensies
        }
      }
      
      // Reset shooting stars bij significante resize (maar NIET de zon)
      if (shouldResetStars) {
        shootingStarsRef.current = [];
        // Zon blijft bestaan - alleen update de max glow radius als de zon actief is
        if (sunRef.current) {
          sunRef.current.maxGlowRadius = Math.max(width, height) * 1.2;
        }
      }
      
      // Update last dimensions
      lastWidth = width;
      lastHeight = height;
    }

    // Ster Class voor dark mode - Verfijnd met twinkle animatie
    class Star {
      constructor(starWidth, starHeight) {
        // Gebruik doorgegeven width/height voor volledige scherm coverage
        const w = starWidth || width || window.innerWidth;
        const h = starHeight || height || window.innerHeight;
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.size = Math.random() * 1 + 0.5; // 0.5-1.5px (kleiner)
        // Mix van helderheid: 60% opacity 0.4-0.6, 40% opacity 0.8-1.0
        const isBright = Math.random() > 0.6; // 40% helder
        this.baseOpacity = isBright ? (Math.random() * 0.2 + 0.8) : (Math.random() * 0.2 + 0.4); // 0.8-1.0 of 0.4-0.6
        this.opacity = this.baseOpacity;
        
        // Twinkle animatie: 40% van sterren fonkelen langzaam
        this.shouldTwinkle = Math.random() > 0.6; // 40% fonkelen
        if (this.shouldTwinkle) {
          this.twinkleDuration = 2 + Math.random() * 2; // 2-4 seconden
          this.twinkleDelay = Math.random() * this.twinkleDuration; // Random delay
          this.twinklePhase = (this.twinkleDelay / this.twinkleDuration) * Math.PI * 2;
        } else {
          this.twinkleDuration = 0;
          this.twinklePhase = 0;
        }
        
        this.hasGlow = isBright; // Alleen heldere sterren krijgen glow
      }

      update(time) {
        if (this.shouldTwinkle) {
          // Twinkle animatie: 0%,100% opacity 0.3, 50% opacity 1
          const cycleTime = ((time * 1000 + this.twinkleDelay * 1000) / (this.twinkleDuration * 1000)) % 1;
          let twinkleOpacity;
          if (cycleTime < 0.25) {
            // 0% -> 25%: fade in
            twinkleOpacity = 0.3 + (1 - 0.3) * (cycleTime / 0.25);
          } else if (cycleTime < 0.75) {
            // 25% -> 75%: fade out
            twinkleOpacity = 1 - (1 - 0.3) * ((cycleTime - 0.25) / 0.5);
          } else {
            // 75% -> 100%: fade in
            twinkleOpacity = 0.3 + (1 - 0.3) * ((cycleTime - 0.75) / 0.25);
          }
          this.currentOpacity = this.baseOpacity * twinkleOpacity;
        } else {
          // Geen twinkle, gebruik base opacity
          this.currentOpacity = this.baseOpacity;
        }
      }

      draw(ctx) {
        if (!ctx) return;
        
        ctx.save();
        const opacity = this.currentOpacity || this.opacity;
        ctx.globalAlpha = opacity;
        
        // Zeer subtiele glow voor heldere sterren
        if (this.hasGlow) {
          const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size + 2);
          gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
          gradient.addColorStop(0.5, `rgba(255, 255, 255, ${opacity * 0.5})`);
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size + 2, 0, Math.PI * 2);
          ctx.fill();
        }
        
        // Ster zelf - kleiner (0.5-1.5px)
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      }
    }

    // Vallende Ster Class voor dark mode
    class ShootingStar {
      constructor() {
        // Start rechtsbovenin het scherm
        this.x = Math.random() * window.innerWidth * 0.7 + window.innerWidth * 0.3;
        this.y = Math.random() * window.innerHeight * 0.3;
        
        // Beweging naar linksonder
        this.velocityX = -(Math.random() * 3 + 2);
        this.velocityY = Math.random() * 2 + 1;
        
        // Visuele eigenschappen
        this.length = Math.random() * 60 + 40; // Trail lengte
        this.opacity = 1;
        this.fadeSpeed = 0.02;
        this.active = true;
      }
      
      update() {
        this.x += this.velocityX;
        this.y += this.velocityY;
        this.opacity -= this.fadeSpeed;
        
        if (this.opacity <= 0) {
          this.active = false;
        }
      }
      
      draw(ctx, dpr = 1, resolutionScale = 1) {
        if (!this.active || !ctx) return;
        
        ctx.save();
        ctx.setTransform(dpr * resolutionScale, 0, 0, dpr * resolutionScale, 0, 0);
        
        const gradient = ctx.createLinearGradient(
          this.x, this.y,
          this.x + this.length, this.y + this.length/2
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${this.opacity})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.length, this.y + this.length/2);
        ctx.stroke();
        
        ctx.restore();
      }
    }

    // Zon Class voor light mode - Realistisch met stralen glow over hele pagina
    class Sun {
      constructor() {
        // Positie: meer links in de hoek (niet achter header), met variatie
        // X: 10% tot 40% van scherm breedte (meer links)
        // Y: 80px tot 200px vanaf top (onder header, ~50-70px header hoogte)
        this.x = Math.random() * (window.innerWidth * 0.3) + (window.innerWidth * 0.1);
        this.y = Math.random() * 120 + 80; // 80-200px vanaf top
        
        this.size = Math.random() * 30 + 50; // 50-80px (groter voor meer impact)
        this.opacity = 0;
        this.targetOpacity = Math.random() * 0.25 + 0.55; // 0.55-0.8
        this.fadeIn = true;
        this.lifetime = Math.random() * 1200 + 1800; // Blijft 1800-3000 frames zichtbaar (~30-50 seconden)
        this.age = 0;
        this.fullEffectDuration = 1500; // Blijft 1500 frames (~25 seconden) in full effect voor fade out begint
        
        // Bereken max radius voor hele pagina glow
        this.maxGlowRadius = Math.max(window.innerWidth, window.innerHeight) * 1.2;
      }
      
      update() {
        this.age++;
        
        if (this.fadeIn) {
          // Fase 1: Fade in - snel zichtbaar worden
          this.opacity += 0.02; // Snellere fade in zodat stralen snel zichtbaar zijn
          if (this.opacity >= this.targetOpacity) {
            this.fadeIn = false;
            // Reset age zodat we kunnen tellen vanaf full effect
            this.age = 0;
          }
        } else if (this.age > this.fullEffectDuration) {
          // Fase 3: Fade out - langzaam weg gaan (alleen na full effect periode)
          this.opacity -= 0.008; // Langzame fade out (~2.5x langzamer dan fade in)
        }
        // Fase 2: Full effect - opacity blijft op targetOpacity tijdens fullEffectDuration
        
        return this.opacity > 0;
      }
      
      // Teken achtergrond lichteffect over hele pagina
      drawBackgroundGlow(ctx, width, height, dpr = 1, resolutionScale = 1) {
        if (!ctx || this.opacity <= 0) return;
        
        ctx.save();
        ctx.setTransform(dpr * resolutionScale, 0, 0, dpr * resolutionScale, 0, 0);
        
        // Bereken max radius dynamisch op basis van actuele pagina dimensies
        // Veel groter zodat stralen ver over de pagina reiken, ook achter wolken
        const maxGlowRadius = Math.max(width, height) * 2.2; // Veel groter (was 1.3) voor stralen die ver reiken
        
        // Enorme radial gradient die de hele pagina beïnvloedt
        // Van helder geel/wit rond de zon naar subtiel lichtblauw aan de randen
        const gradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, maxGlowRadius
        );
        
        // Meerdere color stops voor natuurlijk zonlicht effect - SUBTIEL, GEEN GROEN MENGING
        // Stralen moeten zichtbaar zijn maar niet te intens zodat ze niet met blauw groen worden
        const centerOpacity = this.opacity * 0.25; // Veel subtieler (was 0.85) - voorkomt groen menging
        const midOpacity = this.opacity * 0.15; // Subtieler (was 0.5)
        const farMidOpacity = this.opacity * 0.08; // Zeer subtiel (was 0.25)
        const edgeOpacity = this.opacity * 0.04; // Minimale zichtbaarheid aan randen (was 0.12)
        
        // Warm zonlicht kleuren: geel -> wit -> lichtblauw - SUBTIEL, GEEN OVERSCHRIJVING VAN BLAUW
        // Vroeg overgaan naar blauwe tinten om groen menging te voorkomen
        gradient.addColorStop(0, `rgba(255, 255, 240, ${centerOpacity})`); // Zacht geel-wit centrum (minder geel)
        gradient.addColorStop(0.1, `rgba(255, 252, 230, ${midOpacity})`); // Zeer licht geel-wit
        gradient.addColorStop(0.2, `rgba(255, 250, 235, ${midOpacity * 0.8})`); // Licht geel-wit
        gradient.addColorStop(0.3, `rgba(255, 248, 245, ${midOpacity * 0.6})`); // Bijna wit met subtiel geel
        gradient.addColorStop(0.4, `rgba(250, 248, 250, ${farMidOpacity * 1.5})`); // Wit met subtiel blauw tint
        gradient.addColorStop(0.5, `rgba(245, 245, 255, ${farMidOpacity})`); // Licht blauw-wit
        gradient.addColorStop(0.6, `rgba(240, 243, 255, ${farMidOpacity * 0.7})`); // Blauw-wit
        gradient.addColorStop(0.7, `rgba(235, 240, 255, ${edgeOpacity * 1.5})`); // Licht blauw
        gradient.addColorStop(0.8, `rgba(230, 238, 255, ${edgeOpacity})`); // Blauw tint
        gradient.addColorStop(0.9, `rgba(225, 235, 255, ${edgeOpacity * 0.5})`); // Zeer subtiel blauw
        gradient.addColorStop(1, 'rgba(220, 230, 255, 0)'); // Transparant aan verste randen
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        ctx.restore();
      }
      
      draw(ctx, dpr = 1, resolutionScale = 1) {
        if (!ctx || this.opacity <= 0) return;
        
        ctx.save();
        ctx.setTransform(dpr * resolutionScale, 0, 0, dpr * resolutionScale, 0, 0);
        
        // Buitenste glow - ENORM groot voor stralen die ver over pagina reiken
        // Deze moet duidelijk zichtbaar zijn, zelfs wanneer wolken eroverheen vliegen
        const outerGlow = this.size * 8; // Veel groter (was 5) zodat stralen ver reiken
        const outerGradient = ctx.createRadialGradient(
          this.x, this.y, this.size * 0.8,
          this.x, this.y, outerGlow
        );
        outerGradient.addColorStop(0, `rgba(255, 250, 180, ${this.opacity * 0.95})`); // Heel zichtbaar (was 0.85)
        outerGradient.addColorStop(0.2, `rgba(255, 245, 170, ${this.opacity * 0.8})`); // Intens geel
        outerGradient.addColorStop(0.4, `rgba(255, 235, 160, ${this.opacity * 0.7})`); // Zichtbaar geel (was 0.65)
        outerGradient.addColorStop(0.6, `rgba(255, 220, 150, ${this.opacity * 0.55})`); // Gele tint (was 0.4)
        outerGradient.addColorStop(0.8, `rgba(255, 200, 140, ${this.opacity * 0.35})`); // Subtiele gele gloed
        outerGradient.addColorStop(1, 'rgba(255, 180, 130, 0)');
        
        ctx.fillStyle = outerGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, outerGlow, 0, Math.PI * 2);
        ctx.fill();
        
        // Midden glow - zachte halo - VEEL MEER ZICHTBAAR
        const midGlow = this.size * 3.5; // Groter (was 2.5) voor meer bereik
        const midGradient = ctx.createRadialGradient(
          this.x, this.y, this.size * 0.9,
          this.x, this.y, midGlow
        );
        midGradient.addColorStop(0, `rgba(255, 245, 180, ${this.opacity * 0.98})`); // Heel zichtbaar (was 0.95)
        midGradient.addColorStop(0.4, `rgba(255, 235, 160, ${this.opacity * 0.75})`); // Intens geel
        midGradient.addColorStop(0.7, `rgba(255, 225, 150, ${this.opacity * 0.55})`); // Gele gloed (was 0.6)
        midGradient.addColorStop(1, 'rgba(255, 210, 140, 0)');
        
        ctx.fillStyle = midGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, midGlow, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner glow - zachte kern glow
        const innerGlow = this.size * 1.5;
        const innerGradient = ctx.createRadialGradient(
          this.x, this.y, this.size * 0.7,
          this.x, this.y, innerGlow
        );
        innerGradient.addColorStop(0, `rgba(255, 255, 240, ${this.opacity * 0.9})`);
        innerGradient.addColorStop(0.6, `rgba(255, 245, 200, ${this.opacity * 0.6})`);
        innerGradient.addColorStop(1, 'rgba(255, 230, 180, 0)');
        
        ctx.fillStyle = innerGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, innerGlow, 0, Math.PI * 2);
        ctx.fill();
        
        // Kern van de zon - zeer zacht, geen harde randen
        const coreSize = this.size * 0.85; // Iets kleiner dan origineel voor zachter effect
        const coreGradient = ctx.createRadialGradient(
          this.x, this.y, 0,
          this.x, this.y, coreSize
        );
        coreGradient.addColorStop(0, `rgba(255, 255, 250, ${this.opacity})`); // Bijna wit centrum
        coreGradient.addColorStop(0.4, `rgba(255, 250, 210, ${this.opacity * 0.95})`);
        coreGradient.addColorStop(0.7, `rgba(255, 240, 190, ${this.opacity * 0.85})`);
        coreGradient.addColorStop(1, `rgba(255, 230, 180, ${this.opacity * 0.6})`);
        
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, coreSize, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      }
    }

    // DESKTOP Cloud Class - Perfect rendering, DO NOT MODIFY
    class SimpleCloud {
      constructor(isInitial = false) {
        // Desktop always uses 12 blobs - fixed and perfect
        this.blobCount = 12;
        this.isMobile = false; // Desktop clouds never mobile
        this.reset(isInitial);
      }

      reset(isInitial) {
        if (!width || !height) return;
        this.x = isInitial ? Math.random() * width : -500;
        this.y = Math.random() * (height * 0.4);
        this.speed = WIND_SPEED + Math.random() * 0.1;
        this.scale = 0.8 + Math.random() * 0.4;
        
        // Opacity: light mode normaal, dark mode zeer transparant
        this.opacityLight = 0.35;
        this.opacityDark = 0.15 + Math.random() * 0.1; // 0.15 - 0.25 (bijna onzichtbaar in nacht)
        
        // Desktop blob generation - PERFECT as is, do not modify
        this.blobs = [];
        
        for (let i = 0; i < this.blobCount; i++) {
          // Desktop: perfect blob sizes
          const blobWidth = 80 + Math.random() * 120; // 80-200px desktop
          const blobHeight = 50 + Math.random() * 70; // 50-120px desktop
          
          this.blobs.push({
            x: (Math.random() - 0.5) * 400, // Desktop spread
            y: (Math.random() - 0.5) * 80,  // Desktop spread
            width: blobWidth,
            height: blobHeight,
            rotation: (Math.random() - 0.5) * 0.3
          });
        }
      }
      
      getOpacity(darkMode) {
        return darkMode ? this.opacityDark : this.opacityLight;
      }

      update() {
        if (!width) return;
        this.x += this.speed;
        if (this.x > width + 600) {
          this.reset(false);
        }
      }

      draw(darkMode, dpr = 1, resolutionScale = 1) {
        if (!ctx) return;
        
        ctx.save();
        
        // DESKTOP RENDERING - Perfect technique, DO NOT MODIFY
        // Scale context voor hoge resolutie (canvas is al geschaald in resize)
        ctx.setTransform(dpr * resolutionScale, 0, 0, dpr * resolutionScale, 0, 0);
        
        // Perfect blur values for desktop - perfect resolution and diffusion
        const baseBlur = darkMode ? 22 : 27; // Perfect blur values
        ctx.filter = `blur(${baseBlur}px)${darkMode ? ' brightness(0.8)' : ''}`;
        
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        
        const opacity = this.getOpacity(darkMode);
        
        // Kleur afhankelijk van dark mode
        if (darkMode) {
          ctx.fillStyle = `rgba(200, 210, 220, ${opacity})`;
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        }

        // Teken alle blobs als ellipsen - Safari compatible met bezier curves
        this.blobs.forEach(blob => {
          ctx.save();
          ctx.translate(blob.x, blob.y);
          ctx.rotate(blob.rotation);
          
          ctx.beginPath();
          const radiusX = blob.width / 2;
          const radiusY = blob.height / 2;
          
          // Teken ellips met bezier curves (Safari compatible) - Perfect technique
          ctx.moveTo(0, -radiusY);
          ctx.bezierCurveTo(radiusX, -radiusY, radiusX, radiusY, 0, radiusY);
          ctx.bezierCurveTo(-radiusX, radiusY, -radiusX, -radiusY, 0, -radiusY);
          ctx.closePath();
          ctx.fill();
          
          ctx.restore();
        });

        ctx.restore();
      }
    }

    // MOBILE Cloud Class - Separate from desktop, based on desktop technique
    class MobileCloud {
      constructor(isInitial = false) {
        this.reset(isInitial);
      }

      reset(isInitial) {
        if (!width || !height) return;
        this.x = isInitial ? Math.random() * width : -500;
        this.y = Math.random() * (height * 0.4);
        this.speed = WIND_SPEED + Math.random() * 0.1;
        // Smaller scale for mobile clouds
        this.scale = 0.4 + Math.random() * 0.3; // 0.4-0.7 (was 0.8-1.2)
        
        // Different opacity per cloud (variety)
        const opacityVariation = 0.1 + Math.random() * 0.2; // 0.1-0.3 variation
        this.opacityLight = 0.3 + opacityVariation; // 0.3-0.6
        this.opacityDark = 0.15 + opacityVariation * 0.5; // 0.15-0.3
        
        // SVG-style cloud: multiple bubbles that form a cloud shape
        // SMALLER bubbles for mobile
        this.bubbles = [];
        
        // Create cloud shape with bubbles (like SVG cloud path)
        // Base bubble (center, smaller for mobile)
        this.bubbles.push({
          x: 0,
          y: 0,
          radius: 18 + Math.random() * 8 // 18-26px base (was 35-50px)
        });
        
        // Top bubbles (2-3, smaller)
        const topCount = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < topCount; i++) {
          this.bubbles.push({
            x: -20 + (i * 20) + Math.random() * 10 - 5,
            y: -15 - Math.random() * 8,
            radius: 10 + Math.random() * 8 // 10-18px (was 20-35px)
          });
        }
        
        // Side bubbles (2 each side, smaller)
        this.bubbles.push({
          x: -25 - Math.random() * 8,
          y: -3 + Math.random() * 5,
          radius: 12 + Math.random() * 6 // 12-18px
        });
        this.bubbles.push({
          x: 25 + Math.random() * 8,
          y: -3 + Math.random() * 5,
          radius: 12 + Math.random() * 6 // 12-18px
        });
        
        // Bottom bubbles (2-3, smaller)
        const bottomCount = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < bottomCount; i++) {
          this.bubbles.push({
            x: -15 + (i * 15) + Math.random() * 8 - 4,
            y: 12 + Math.random() * 6,
            radius: 8 + Math.random() * 6 // 8-14px (was 15-25px)
          });
        }
      }
      
      getOpacity(darkMode) {
        return darkMode ? this.opacityDark : this.opacityLight;
      }

      update() {
        if (!width) return;
        this.x += this.speed;
        // Reset when cloud goes off screen (ensures clouds come back)
        if (this.x > width + 200) { // Smaller buffer for smaller clouds
          this.reset(false);
        }
      }

      draw(darkMode, dpr = 1, resolutionScale = 1, offScreenCanvas = null, offScreenCtx = null) {
        if (!ctx) return;
        
        const opacity = this.getOpacity(darkMode);
        
        if (this.bubbles.length === 0) {
          return;
        }
        
        // SVG-STYLE CLOUD RENDERING - Real cloud shape with shadow
        // Fixed transform to prevent flickering/shaking
        ctx.save();
        
        // Scale context (fixed transform, no random changes)
        ctx.setTransform(dpr * resolutionScale, 0, 0, dpr * resolutionScale, 0, 0);
        
        // Translate to cloud position (use Math.floor to prevent sub-pixel rendering issues)
        ctx.translate(Math.floor(this.x), Math.floor(this.y));
        ctx.scale(this.scale, this.scale);
        
        // Set shadow for depth (mobile-compatible)
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        if (darkMode) {
          ctx.shadowColor = `rgba(0, 0, 0, ${opacity * 0.3})`;
        } else {
          ctx.shadowColor = `rgba(0, 0, 0, ${opacity * 0.2})`;
        }
        
        // Set fill color
        if (darkMode) {
          ctx.fillStyle = `rgba(200, 210, 220, ${opacity})`;
        } else {
          ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
        }
        
        // Draw SVG-style cloud: start with first bubble, then connect others
        ctx.beginPath();
        
        // Start with the base (largest) bubble
        const base = this.bubbles[0];
        ctx.arc(base.x, base.y, base.radius, 0, Math.PI * 2);
        
        // Add all other bubbles as arcs (they will merge visually)
        for (let i = 1; i < this.bubbles.length; i++) {
          const bubble = this.bubbles[i];
          // Use moveTo to create separate arcs that merge into cloud shape
          ctx.moveTo(bubble.x + bubble.radius, bubble.y);
          ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
        }
        
        // Fill the entire cloud shape (with shadow)
        ctx.fill();
        
        // Remove shadow for inner layers
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Draw some bubbles again for depth (lighter)
        ctx.globalAlpha = opacity * 0.4;
        this.bubbles.forEach((bubble, i) => {
          if (i === 0 || i % 2 === 0) { // Draw base and every other bubble for depth
            ctx.beginPath();
            ctx.arc(bubble.x, bubble.y, bubble.radius * 0.7, 0, Math.PI * 2);
            ctx.fill();
          }
        });
        
        ctx.restore();
      }
    }

    // Grass Class - Wild grass sprieten op footer met wind animatie
    class GrassBlade {
      constructor(x, grassHeight) {
        this.x = x;
        this.baseY = grassHeight; // Y positie op footer
        // Meer variatie in breedte - WILDER GRAS (eerst breedte bepalen)
        // Firefox is perfect - use same distribution for Chrome too
        const widthType = Math.random();
        let isExtraThick = false;
        if (widthType < 0.3) {
          this.width = 2.5 + Math.random() * 2; // Dun: 2.5-4.5px (30%)
        } else if (widthType < 0.7) {
          this.width = 4 + Math.random() * 3; // Medium: 4-7px (40%)
        } else if (widthType < 0.9) {
          this.width = 7 + Math.random() * 4; // Dik: 7-11px (20%)
        } else {
          this.width = 11 + Math.random() * 5; // Extra dik wild gras: 11-16px (10%)
          isExtraThick = true;
        }
        
        // Meer variatie in hoogte: mix van kort, medium en lang
        // Dikke sprieten zijn LANGER (komen boven de rest uit)
        const heightType = Math.random();
        if (isExtraThick) {
          // Extra dikke sprieten zijn altijd lang en komen bovenuit
          this.height = 70 + Math.random() * 40; // 70-110px (boven de rest uit)
        } else if (heightType < 0.3) {
          this.height = 15 + Math.random() * 15; // Kort: 15-30px (30%)
        } else if (heightType < 0.7) {
          this.height = 30 + Math.random() * 25; // Medium: 30-55px (40%)
        } else {
          this.height = 50 + Math.random() * 30; // Lang: 50-80px (30%)
        }
        
        // Wind: dunne sprieten zijn stil (voorkomt glitch/flicker in Chrome)
        const isThin = this.width < 5;
        this.windSpeed = isThin ? 0 : 0.3 + Math.random() * 0.4; // 0.3-0.7
        this.windOffset = Math.random() * Math.PI * 2; // Random start fase
        this.swayAmount = isThin ? 0 : 10 + Math.random() * 18; // 10-28px
        this.isThick = this.width > 7; // Dikke sprieten zijn automatisch thick
        this.isThin = isThin;
        this.hasExtraBlade = Math.random() > 0.5; // 50% kans op extra zijtak (meer wild)

        // Cursor/Electron: reduce motion amplitude and speed to avoid shimmer/flicker during movement.
        if (IS_SAFE_GRASS && !isThin) {
          this.windSpeed = 0.12 + Math.random() * 0.08; // 0.12-0.20 (very gentle)
          this.swayAmount = 4 + Math.random() * 4; // 4-8px (small sway)
        }

        // Cursor/Electron: keep blades visually lighter/thinner (safe mode otherwise looks too chunky)
        if (IS_SAFE_GRASS) {
          this.width = Math.min(this.width, 6.5);
          this.isThick = this.width > 7; // recompute (will be false after clamp)
        }

        // Side-blade parameters: precompute ONCE (no Math.random in draw -> prevents "glitch" flicker)
        if (this.hasExtraBlade) {
          this.sideBladeHeightFactor = 0.4 + Math.random() * 0.3; // 0.4-0.7
          this.sideBladeOffsetX = Math.random() > 0.5 ? 3 : -3;
        } else {
          this.sideBladeHeightFactor = 0;
          this.sideBladeOffsetX = 0;
        }
        
        // Uitstekers voor wild gras (meerdere zijtakken)
        // NOTE: these start mid-stem and can look like "floating blades".
        // Safe design: disable them to avoid detached-looking blades across browsers.
        this.outgrowths = [];
      }

      update(time) {
        // Wind animatie: sin wave voor heen en weer beweging
        // Dunne sprieten: GEEN update (stil)
        if (this.isThin) return;
        this.windPhase = time * this.windSpeed + this.windOffset;
      }

      draw(ctx, darkMode, dpr = 1, resolutionScale = 1, currentHeight = null) {
        if (!ctx) return;
        
        ctx.save();
        ctx.setTransform(dpr * resolutionScale, 0, 0, dpr * resolutionScale, 0, 0);

        const isThin = this.isThin || this.width < 5;
        // Cursor/Electron: quantize to 0.5px to avoid shimmer/flicker from sub-pixel rasterization.
        const q = (v) => (IS_SAFE_GRASS ? Math.round(v * 2) / 2 : v);

        // Bereken wind beweging - alleen voor dikke sprieten
        let windX = 0;
        if (!isThin) {
          windX = q(Math.sin(this.windPhase) * this.swayAmount);
        }
        
        // Gebruik cluster positie als basis (als beschikbaar) voor gedeelde beweging
        const baseXPos = this.clusterX !== undefined ? this.clusterX : this.x;
        const baseX = q(baseXPos + (this.clusterOffset || 0));
        
        // Gebruik altijd actuele height voor footer positie (geen opgeslagen baseY)
        const baseY = q(currentHeight || this.baseY || height);
        
        // Cursor SAFE MODE:
        // Filled shapes with sharp tips can still shimmer in Cursor/Electron. Use a simple stroked curve.
        if (IS_SAFE_GRASS) {
          // Cursor safe mode: slightly thinner + a bit less opaque (prevents "big thick stems" look)
          ctx.strokeStyle = darkMode ? 'rgba(24, 48, 24, 0.85)' : 'rgba(70, 140, 70, 0.85)';
          const lineWidth = this.isThick ? this.width * 1.15 : this.width;
          ctx.lineWidth = Math.max(2, lineWidth);
          ctx.lineJoin = 'round';
          ctx.lineCap = 'round';

          // Gentle curve
          const controlX = q(baseX + windX * 0.4);
          const controlY = q(baseY - this.height * 0.45);
          const endX = q(baseX + windX);
          const endY = q(baseY - this.height);

          ctx.beginPath();
          ctx.moveTo(baseX, baseY);
          ctx.quadraticCurveTo(controlX, controlY, endX, endY);
          ctx.stroke();

          ctx.restore();
          return;
        }

        // Kleur afhankelijk van dark mode
        if (darkMode) {
          // Dark mode: donkergroen tot bijna zwart
          ctx.strokeStyle = `rgba(30, 50, 30, 0.9)`;
          ctx.fillStyle = `rgba(20, 40, 20, 0.78)`; // slightly more opaque to avoid "floating" look
        } else {
          // Light mode: groenig
          ctx.strokeStyle = `rgba(60, 120, 60, 1)`;
          ctx.fillStyle = `rgba(80, 150, 80, 0.88)`; // slightly more opaque to avoid "floating" look
        }
        
        // Dikkere lijn voor vollere sprieten
        const lineWidth = this.isThick ? this.width * 1.5 : this.width;
        ctx.lineWidth = lineWidth;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        
        // Teken gras spriet als gebogen lijn (wind effect)
        const controlX = q(baseX + windX * 0.5);
        const controlY = q(baseY - this.height * 0.4);
        const endX = q(baseX + windX);
        const endY = q(baseY - this.height);

        // Teken spriet met ECHTE puntige top (scherpe driehoekige punt)
        const tipX = endX;
        const tipY = endY;
        
        // Bereken scherpe punt - echt puntig, niet afgesneden
        // De punt moet naar een echt scherp punt lopen (0px breedte aan top)
        const tipSharpness = lineWidth * 0.15; // Hoe scherp de punt is (kleiner = scherper)
        const tipHeight = lineWidth * 0.5; // Hoogte van punt sectie
        
        // Teken spriet als gevulde vorm die uitloopt in ECHTE scherpe punt
        ctx.beginPath();
        ctx.moveTo(baseX, baseY);
        ctx.quadraticCurveTo(controlX, controlY, tipX, tipY);
        
        // Teken naar scherpe punt: van breed naar 0px breedte
        // Eerst naar de zijkanten van de punt basis
        ctx.lineTo(tipX + tipSharpness, tipY + tipHeight * 0.6);
        // Dan naar het scherpe punt (0px breedte) - ECHTE PUNT
        ctx.lineTo(tipX, tipY + tipHeight); // ECHTE PUNT (0px breedte aan top)
        // Dan naar de andere zijkant
        ctx.lineTo(tipX - tipSharpness, tipY + tipHeight * 0.6);
        ctx.closePath();
        ctx.fill();
        
        // Teken outline voor duidelijkheid (met puntige top)
        // Chromium-safe: outline strokes can shimmer/flicker; skip on Chromium.
        if (!IS_CHROMIUM) {
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.moveTo(baseX, baseY);
          ctx.quadraticCurveTo(controlX, controlY, tipX, tipY);
          // Outline loopt ook naar punt
          ctx.lineTo(tipX, tipY + tipHeight); // Tot aan de punt
          ctx.lineWidth = lineWidth * 0.2;
          ctx.stroke();
        }
        
        // Geen extra lijn meer - voorkomt trillen
        
        // Extra zijtak voor meer variatie (50% van sprieten) - ook puntig
        // GEEN zijtakken voor dunne sprieten (voorkomt glitch/flicker)
        // Chromium/Cursor: disable side-blades (still shimmer in Chromium)
        if (this.hasExtraBlade && !isThin && !IS_CHROMIUM) {
          ctx.globalAlpha = darkMode ? 0.4 : 0.5;
          const sideBladeHeight = this.height * this.sideBladeHeightFactor;
          const sideBladeX = baseX + this.sideBladeOffsetX;
          const sideWindX = Math.sin(this.windPhase * 1.2) * (this.swayAmount * 0.6);

          const sideControlX = sideBladeX + sideWindX * 0.4;
          const sideControlY = baseY - sideBladeHeight * 0.4;
          const sideEndX = sideBladeX + sideWindX * 0.7;
          const sideEndY = baseY - sideBladeHeight;
          
          // Zijtak met echte puntige top
          const sideTipSharpness = lineWidth * 0.15;
          const sideTipHeight = lineWidth * 0.5;
          
          ctx.beginPath();
          ctx.moveTo(sideBladeX, baseY);
          ctx.quadraticCurveTo(sideControlX, sideControlY, sideEndX, sideEndY);
          // Echte puntige top
          ctx.lineTo(sideEndX + sideTipSharpness * 0.7, sideEndY + sideTipHeight * 0.6);
          ctx.lineTo(sideEndX, sideEndY + sideTipHeight); // ECHTE PUNT
          ctx.lineTo(sideEndX - sideTipSharpness * 0.7, sideEndY + sideTipHeight * 0.6);
          ctx.closePath();
          ctx.fill();
        }
        
        // Uitstekers voor wild gras - meerdere puntige zijtakken
        // GEEN uitstekers voor dunne sprieten (voorkomt glitch/flicker)
        // Chromium-safe: outgrowth micro-details flicker in Chromium; disable entirely there.
        if (!IS_CHROMIUM && this.outgrowths && this.outgrowths.length > 0 && !isThin) {
          this.outgrowths.forEach(outgrowth => {
            ctx.globalAlpha = darkMode ? 0.5 : 0.6;
            
            // Bereken start positie op hoofdspriet
            const startY = baseY - (this.height * outgrowth.position);
            const startX = baseX + (windX * (1 - outgrowth.position) * 0.5);
            
            // Bereken uitsteker positie en beweging
            const outgrowthHeight = outgrowth.height;
            const outgrowthWindX = Math.sin(this.windPhase * 1.1) * (this.swayAmount * 0.5);
            const outgrowthX = startX + (outgrowth.side * 4); // Offset van hoofdspriet
            const outgrowthEndX = outgrowthX + outgrowthWindX * 0.6 + (outgrowth.side * outgrowth.angle * 10);
            const outgrowthEndY = startY - outgrowthHeight;
            
            // Teken uitsteker met puntige top
            const outgrowthWidth = outgrowth.width;
            const outgrowthTipSharpness = outgrowthWidth * 0.2;
            
            ctx.beginPath();
            ctx.moveTo(outgrowthX, startY);
            ctx.quadraticCurveTo(
              outgrowthX + outgrowthWindX * 0.3,
              startY - outgrowthHeight * 0.4,
              outgrowthEndX,
              outgrowthEndY
            );
            // Echte puntige top (0px breedte aan top)
            const outgrowthTipHeight = outgrowthWidth * 0.5;
            ctx.lineTo(outgrowthEndX + outgrowthTipSharpness, outgrowthEndY + outgrowthTipHeight * 0.6);
            ctx.lineTo(outgrowthEndX, outgrowthEndY + outgrowthTipHeight); // ECHTE PUNT
            ctx.lineTo(outgrowthEndX - outgrowthTipSharpness, outgrowthEndY + outgrowthTipHeight * 0.6);
            ctx.closePath();
            ctx.fill();
            
            // Outline voor duidelijkheid
            // Chromium-safe: skip outgrowth outlines (can shimmer)
            if (!IS_CHROMIUM) {
              ctx.globalAlpha = darkMode ? 0.7 : 0.8;
              ctx.beginPath();
              ctx.moveTo(outgrowthX, startY);
              ctx.quadraticCurveTo(
                outgrowthX + outgrowthWindX * 0.3,
                startY - outgrowthHeight * 0.4,
                outgrowthEndX,
                outgrowthEndY
              );
              ctx.lineWidth = outgrowthWidth * 0.2;
              ctx.stroke();
            }
          });
        }
        
        // Reset filter voor volgende spriet
        ctx.filter = 'none';
        ctx.restore();
      }
    }

    function initGrass() {
      if (!width || !height) return;
      // Reset gras bij resize (zodat het altijd aan footer blijft)
      grassRef.current = [];
      
      // Gras op footer (onderkant van scherm) - gebruik altijd actuele height
      // Meer clusters voor volledige bodem vulling
      const clusterCount = Math.floor(width / 8);
      
      for (let i = 0; i < clusterCount; i++) {
        // Bepaal cluster positie - meer uniform verdeeld voor volledige vulling
        const baseClusterX = (i / clusterCount) * width;
        const clusterX = baseClusterX + (Math.random() - 0.5) * (width / clusterCount) * 0.6;
        
        // Elke cluster heeft 2-4 sprieten vanuit 1 punt
        const bladesPerCluster = 2 + Math.floor(Math.random() * 3); // 2-4
        
        for (let j = 0; j < bladesPerCluster; j++) {
          // Sprieten vanuit cluster punt, iets verspreid
          const offsetX = (Math.random() - 0.5) * 5; // Iets meer verspreiding
          const x = clusterX + offsetX;
          
          // Creëer spriet met referentie naar cluster voor gedeelde beweging
          // baseY wordt dynamisch gebruikt (altijd huidige height)
          const blade = new GrassBlade(x, 0); // 0 = placeholder, wordt dynamisch gebruikt
          blade.clusterX = clusterX; // Bewaar cluster positie
          blade.clusterOffset = offsetX; // Bewaar offset
          grassRef.current.push(blade);
        }
      }
      
      // Extra anker punten tussen clusters voor volledige bodem vulling
      const extraClusterCount = Math.floor(width / 16);
      for (let i = 0; i < extraClusterCount; i++) {
        // Plaats tussen bestaande clusters
        const extraX = (i / extraClusterCount) * width + (width / extraClusterCount) * 0.5;
        const clusterX = extraX + (Math.random() - 0.5) * 8;
        
        // Kleinere clusters voor tussenruimtes (1-3 sprieten)
        const bladesPerCluster = 1 + Math.floor(Math.random() * 3); // 1-3
        
        for (let j = 0; j < bladesPerCluster; j++) {
          const offsetX = (Math.random() - 0.5) * 4;
          const x = clusterX + offsetX;
          
          const blade = new GrassBlade(x, 0); // 0 = placeholder
          blade.clusterX = clusterX;
          blade.clusterOffset = offsetX;
          grassRef.current.push(blade);
        }
      }
    }

    function initStars() {
      // Gebruik actuele viewport dimensies voor volledige scherm coverage
      const currentWidth = width || window.innerWidth;
      const currentHeight = height || window.innerHeight;
      
      // Debugging logs
      console.log('🌟 initStars called');
      console.log('📐 width:', width, 'height:', height);
      console.log('🖥️ currentWidth:', currentWidth, 'currentHeight:', currentHeight);
      console.log('📏 window.innerWidth:', window.innerWidth, 'window.innerHeight:', window.innerHeight);
      console.log('⭐ STAR_COUNT:', STAR_COUNT);
      
      if (!currentWidth || !currentHeight) {
        console.warn('⚠️ initStars: Missing dimensions, skipping');
        return;
      }
      if (starsRef.current.length > 0) {
        console.log('ℹ️ Stars already initialized, skipping');
        return; // Al geïnitialiseerd
      }
      
      starsRef.current = [];
      for (let i = 0; i < STAR_COUNT; i++) {
        const star = new Star(currentWidth, currentHeight);
        starsRef.current.push(star);
        // Debug eerste en laatste ster positie
        if (i === 0 || i === STAR_COUNT - 1) {
          console.log(`⭐ Star ${i} position:`, { x: star.x, y: star.y });
        }
      }
      console.log('✅ Stars initialized:', starsRef.current.length);
    }

    // Create off-screen canvas for mobile clouds (mobile-friendly rendering)
    let offScreenCanvas = null;
    let offScreenCtx = null;

    function initClouds() {
      if (!width || !height) return;
      if (cloudsRef.current.length > 0) return; // Al geïnitialiseerd, skip
      
      const isMobile = width < 768;
      
      cloudsRef.current = [];
      // Desktop uses SimpleCloud (perfect, untouched), Mobile uses MobileCloud (mobile-friendly)
      const CloudClass = isMobile ? MobileCloud : SimpleCloud;
      
      for (let i = 0; i < CLOUD_COUNT; i++) {
        cloudsRef.current.push(new CloudClass(true));
      }
      
      // Initialize off-screen canvas for mobile if needed
      if (isMobile && !offScreenCanvas) {
        offScreenCanvas = document.createElement('canvas');
        offScreenCtx = offScreenCanvas.getContext('2d');
      }
    }

    function animate() {
      if (!width || !height || !ctx) {
        animationId = requestAnimationFrame(animate);
        return;
      }

      // Use real frame time for consistent motion across browsers (avoids Firefox stutter)
      // Clamp delta to avoid huge jumps when tab is throttled.
      if (!animate._lastTs) animate._lastTs = performance.now();
      const now = performance.now();
      const dt = Math.min((now - animate._lastTs) / 1000, 0.033);
      animate._lastTs = now;
      animationTimeRef.current += dt;
      
      // Initialiseer als nog niet gedaan
      if (cloudsRef.current.length === 0) {
        initClouds();
      }
      if (darkModeRef.current && starsRef.current.length === 0) {
        initStars();
      }
      
      // Force check dark mode from DOM (Safari compatibility)
      const currentDarkMode = getCurrentDarkMode();
      if (currentDarkMode !== darkModeRef.current) {
        darkModeRef.current = currentDarkMode;
        // Reset stars/clouds when mode changes
        if (currentDarkMode && starsRef.current.length === 0) {
          starsRef.current = [];
        }
        if (!currentDarkMode) {
          shootingStarsRef.current = [];
          sunRef.current = null;
        }
      }
      
      // Clear canvas (transparant - achtergrond wordt door CSS afgehandeld)
      // Gebruik scaled dimensies voor clearRect met resolution scale
      const resolutionScale = darkModeRef.current ? 2 : 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, width * dpr * resolutionScale, height * dpr * resolutionScale);
      
      // EERST: Teken achtergrond zonlicht effect over hele pagina (light mode)
      // Dit moet eerst om de hele achtergrond te beïnvloeden
      if (!darkModeRef.current && sunRef.current && sunRef.current.opacity > 0) {
        sunRef.current.drawBackgroundGlow(ctx, width, height, dpr, resolutionScale);
      }
      
      // Teken sterren (alleen in dark mode) - CORRECTE TRANSFORM voor full screen
      if (darkModeRef.current && starsRef.current.length > 0) {
        // Debug: log eerste keer dat sterren worden getekend
        if (animationTimeRef.current < 0.1) {
          console.log('🎨 Drawing stars - count:', starsRef.current.length);
          console.log('📐 Canvas dimensions:', canvas.width, 'x', canvas.height);
          console.log('📏 Viewport:', width, 'x', height);
          console.log('🔍 DPR:', dpr, 'ResolutionScale:', resolutionScale);
          console.log('📍 First star position:', { x: starsRef.current[0].x, y: starsRef.current[0].y });
          console.log('📍 Last star position:', { 
            x: starsRef.current[starsRef.current.length - 1].x, 
            y: starsRef.current[starsRef.current.length - 1].y 
          });
          console.log('🎯 Transform scale:', dpr * resolutionScale);
        }
        
        // BELANGRIJK: Gebruik dezelfde transform als canvas resolutie (dpr * resolutionScale)
        // Dit zorgt ervoor dat sterren over het hele scherm worden getekend
        ctx.setTransform(dpr * resolutionScale, 0, 0, dpr * resolutionScale, 0, 0);
        starsRef.current.forEach(star => {
          star.update(animationTimeRef.current);
          star.draw(ctx);
        });
      }
      
      // Teken zon kern (alleen in light mode) - na achtergrond glow
      if (!darkModeRef.current) {
        // Spawn nieuwe zon met 0.3% kans per frame als er nog geen zon is
        if (!sunRef.current && Math.random() < 0.003) {
          sunRef.current = new Sun();
        }
        
        // Update en teken zon kern (achtergrond glow is al getekend)
        if (sunRef.current) {
          const stillActive = sunRef.current.update();
          // Teken alleen de zon kern zelf (glow is al gedaan)
          sunRef.current.draw(ctx, dpr, resolutionScale);
          if (!stillActive) {
            sunRef.current = null;
          }
        }
      }
      
      // Vallende sterren (alleen in dark mode)
      if (darkModeRef.current) {
        // Spawn nieuwe vallende ster met 0.5% kans per frame (~1 per 3-4 seconden)
        if (Math.random() < 0.005) {
          shootingStarsRef.current.push(new ShootingStar());
        }
        
        // Update en teken vallende sterren
        shootingStarsRef.current = shootingStarsRef.current.filter(star => {
          star.update();
          star.draw(ctx, dpr, resolutionScale);
          return star.active;
        });
      } else {
        // Clear shooting stars in light mode
        shootingStarsRef.current = [];
      }
      
      // Teken wolken (boven alles) - met DPR scaling en resolution scale
      // Desktop uses SimpleCloud (perfect, untouched), Mobile uses MobileCloud
      const isMobile = width < 768;
      
      cloudsRef.current.forEach(cloud => {
        cloud.update();
        // Mobile clouds: try off-screen canvas first, fallback to direct rendering
        // Desktop clouds: always direct rendering (perfect, untouched)
        if (isMobile && cloud.constructor.name === 'MobileCloud') {
          // Mobile: use off-screen canvas if available, otherwise direct rendering
          cloud.draw(darkModeRef.current, dpr, resolutionScale, offScreenCanvas, offScreenCtx);
        } else {
          // Desktop: perfect rendering, untouched
          cloud.draw(darkModeRef.current, dpr, resolutionScale);
        }
      });
      
      // Teken gras op footer (onderkant) - met wind animatie
      if (grassRef.current.length === 0) {
        initGrass();
      }
      
      // SAFE DESIGN (cross-browser):
      // - Draw a solid grass base strip so the footer is always fully filled (no gaps)
      // - Do NOT render thin back-layer blades (they flicker/glitch across browsers)
      // - Render only the thicker blades on top (smooth + stable)
      {
        // Firefox/Chrome: no strip (keeps parity + avoids visible band).
        // Cursor/Electron: keep a strip to ensure "filled footer" even when thin blades are hidden.
        if (IS_SAFE_GRASS) {
          const grassBaseHeight = 34; // px (CSS pixels)
          const topAlpha = 0.65;
          const bottomAlpha = 0.9;

          ctx.save();
          ctx.setTransform(dpr * resolutionScale, 0, 0, dpr * resolutionScale, 0, 0);

          const y0 = height - grassBaseHeight;
          const gradient = ctx.createLinearGradient(0, y0, 0, height);
          if (darkModeRef.current) {
            gradient.addColorStop(0, `rgba(12, 28, 12, ${topAlpha})`);
            gradient.addColorStop(1, `rgba(6, 16, 6, ${bottomAlpha})`);
          } else {
            gradient.addColorStop(0, `rgba(70, 145, 70, ${topAlpha})`);
            gradient.addColorStop(1, `rgba(45, 105, 45, ${bottomAlpha})`);
          }
          ctx.fillStyle = gradient;
          ctx.fillRect(0, y0, width, grassBaseHeight);
          ctx.restore();
        }
      }

      grassRef.current.forEach((blade) => {
        // Thin back-layer blades are the source of the visible "glitch" across browsers.
        // We keep them in the array (no layout gaps), but never render them.
        if (blade.isThin || blade.width < 5) return;

        blade.update(animationTimeRef.current);
        // Geef altijd actuele height mee voor footer positie (consistent bij zoom/uitzoom)
        blade.draw(ctx, darkModeRef.current, dpr, resolutionScale, height);
      });

      animationId = requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    resize();
    
    // Initialiseer en start animatie
    if (width && height) {
      initClouds();
      initGrass(); // Initialiseer gras
      if (darkModeRef.current) {
        initStars();
      }
      animate();
    }

    return () => {
      window.removeEventListener('resize', resize);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []); // Geen darkMode dependency - wolken blijven op zelfde positie

  // Resize canvas wanneer dark mode verandert (voor resolutie aanpassing)
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    const resolutionScale = darkMode ? 2 : 1;
    
    // Pas canvas resolutie aan voor dark mode
    canvas.width = width * dpr * resolutionScale;
    canvas.height = height * dpr * resolutionScale;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
  }, [darkMode]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none safari-hide"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1, 
        backgroundColor: 'transparent',
        backdropFilter: darkMode ? 'blur(1px)' : 'none',
      }}
    />
  );
}
