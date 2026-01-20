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
    let width, height;
    let animationId;
    let dpr = window.devicePixelRatio || 1;
    let lastWidth = 0;
    let lastHeight = 0;
    const SIGNIFICANT_SIZE_CHANGE = 50; // Alleen resetten bij > 50px verschil

    const CLOUD_COUNT = 6;
    const WIND_SPEED = 0.5; // Snellere animatie (was 0.2)
    const STAR_COUNT = 250; // Meer sterren maar subtieler
    
    // Create off-screen canvas for blur effect (Firefox mobile compatibility)
    let offScreenCanvas = null;
    let offScreenCtx = null;
    
    // Simple seeded random number generator for deterministic cloud generation
    function seededRandom(seed) {
      let value = seed;
      return function() {
        value = (value * 9301 + 49297) % 233280;
        return value / 233280;
      };
    }
    
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

    // Cloud Class - Separate styling for mobile and desktop
    class SimpleCloud {
      constructor(isInitial = false, cloudIndex = 0) {
        // Store cloud index for deterministic generation
        this.cloudIndex = cloudIndex;
        
        // Detect if mobile - set once at creation, stored for entire cloud lifetime
        const currentWidth = width || window.innerWidth;
        this.isMobile = currentWidth < 768;
        
        // Separate seeds for mobile vs desktop to ensure isolated styling
        // Mobile: higher seed range (10000+), Desktop: lower seed range (0-9999)
        const baseSeed = this.isMobile 
          ? 10000 + (cloudIndex * 1000) + (isInitial ? 0 : 5000)
          : cloudIndex * 1000 + (isInitial ? 0 : 5000);
        this.seed = baseSeed;
        this.random = seededRandom(this.seed);
        
        // Mobile and desktop use same blob count - only rendering method differs
        this.blobCount = 12; // Same as desktop for consistency
        
        this.reset(isInitial);
      }

      reset(isInitial) {
        if (!width || !height) return;
        
        // Deterministic position based on seed
        this.x = isInitial ? this.random() * width : -500;
        this.y = this.random() * (height * 0.4);
        this.speed = WIND_SPEED + this.random() * 0.1;
        this.scale = 0.8 + this.random() * 0.4;
        
        // Opacity: light mode normaal, dark mode zeer transparant
        this.opacityLight = 0.35;
        this.opacityDark = 0.15 + this.random() * 0.1; // 0.15 - 0.25 (bijna onzichtbaar in nacht)
        
        // Mobile-specific blob generation (separate from desktop)
        // Mobile uses realistic clouds WITHOUT blur - uses gradients and layered opacity
        this.blobs = [];
        
        for (let i = 0; i < this.blobCount; i++) {
          let blobWidth, blobHeight, blobSpreadX, blobSpreadY, blobOpacity;
          
          if (this.isMobile) {
            // Mobile: realistic clouds WITHOUT blur
            // More blobs, smaller sizes, varied opacities for natural layered effect
            blobWidth = 50 + this.random() * 100; // 50-150px on mobile (smaller for better overlap)
            blobHeight = 35 + this.random() * 65; // 35-100px on mobile
            blobSpreadX = 380; // Tighter spread for better overlap
            blobSpreadY = 85; // Taller spread on mobile
            // Varied opacity for depth - outer blobs more transparent, center more opaque
            const distanceFromCenter = Math.abs((this.random() - 0.5)) * 2; // 0-1
            blobOpacity = 0.4 + (1 - distanceFromCenter) * 0.3; // 0.4-0.7, center is more opaque
          } else {
            // Desktop: original styling with blur support
            blobWidth = 80 + this.random() * 120; // 80-200px on desktop
            blobHeight = 50 + this.random() * 70; // 50-120px on desktop
            blobSpreadX = 400; // Original spread on desktop
            blobSpreadY = 80; // Original spread on desktop
            blobOpacity = 1.0; // Desktop uses globalAlpha
          }
          
          this.blobs.push({
            x: (this.random() - 0.5) * blobSpreadX,
            y: (this.random() - 0.5) * blobSpreadY,
            width: blobWidth,
            height: blobHeight,
            rotation: (this.random() - 0.5) * 0.3,
            opacity: blobOpacity // Store individual opacity for mobile
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

      draw(darkMode, dpr = 1, resolutionScale = 1, offScreenCanvas = null, offScreenCtx = null) {
        if (!ctx) return;
        
        // Re-check mobile status in case of orientation change
        const currentWidth = width || window.innerWidth;
        const isMobileNow = currentWidth < 768;
        const effectiveMobile = this.isMobile || isMobileNow;
        
        const opacity = this.getOpacity(darkMode);
        
        ctx.save();
        
        // Scale context voor hoge resolutie (canvas is al geschaald in resize)
        ctx.setTransform(dpr * resolutionScale, 0, 0, dpr * resolutionScale, 0, 0);
        ctx.translate(this.x, this.y);
        ctx.scale(this.scale, this.scale);
        
        if (effectiveMobile) {
          // MOBILE: Use off-screen canvas for blur (same rendering as desktop)
          const baseBlur = darkMode ? 22 : 27;
          
          // Ensure mobile clouds are drawn - debug
          console.log('📱 Mobile cloud rendering - blob count:', this.blobs.length);
          
          if (offScreenCanvas && offScreenCtx) {
            // Calculate cloud bounds
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            this.blobs.forEach(blob => {
              const blobX = blob.x - blob.width / 2;
              const blobY = blob.y - blob.height / 2;
              minX = Math.min(minX, blobX - baseBlur * 2);
              maxX = Math.max(maxX, blobX + blob.width + baseBlur * 2);
              minY = Math.min(minY, blobY - baseBlur * 2);
              maxY = Math.max(maxY, blobY + blob.height + baseBlur * 2);
            });
            
            const cloudWidth = (maxX - minX) + baseBlur * 4;
            const cloudHeight = (maxY - minY) + baseBlur * 4;
            
            offScreenCanvas.width = cloudWidth * dpr * resolutionScale;
            offScreenCanvas.height = cloudHeight * dpr * resolutionScale;
            offScreenCtx.setTransform(dpr * resolutionScale, 0, 0, dpr * resolutionScale, 0, 0);
            
            offScreenCtx.clearRect(0, 0, cloudWidth, cloudHeight);
            offScreenCtx.filter = `blur(${baseBlur}px)${darkMode ? ' brightness(0.8)' : ''}`;
            offScreenCtx.globalAlpha = darkMode ? opacity * 0.8 : opacity;
            offScreenCtx.translate(-minX + baseBlur * 2, -minY + baseBlur * 2);
            offScreenCtx.scale(this.scale, this.scale);
            
            if (darkMode) {
              offScreenCtx.fillStyle = `rgba(200, 210, 220, 1)`;
            } else {
              offScreenCtx.fillStyle = `rgba(255, 255, 255, 1)`;
            }
            
            this.blobs.forEach(blob => {
              offScreenCtx.save();
              offScreenCtx.translate(blob.x, blob.y);
              offScreenCtx.rotate(blob.rotation);
              
              offScreenCtx.beginPath();
              const radiusX = blob.width / 2;
              const radiusY = blob.height / 2;
              offScreenCtx.moveTo(0, -radiusY);
              offScreenCtx.bezierCurveTo(radiusX, -radiusY, radiusX, radiusY, 0, radiusY);
              offScreenCtx.bezierCurveTo(-radiusX, radiusY, -radiusX, -radiusY, 0, -radiusY);
              offScreenCtx.closePath();
              offScreenCtx.fill();
              
              offScreenCtx.restore();
            });
            
            ctx.restore();
            ctx.save();
            ctx.setTransform(dpr * resolutionScale, 0, 0, dpr * resolutionScale, 0, 0);
            ctx.drawImage(
              offScreenCanvas,
              this.x + minX - baseBlur * 2,
              this.y + minY - baseBlur * 2
            );
            ctx.restore();
            return;
          }
          
          // Fallback for mobile
          ctx.filter = `blur(${baseBlur}px)${darkMode ? ' brightness(0.8)' : ''}`;
          ctx.globalAlpha = darkMode ? opacity * 0.8 : opacity;
          
          if (darkMode) {
            ctx.fillStyle = `rgba(200, 210, 220, 1)`;
          } else {
            ctx.fillStyle = `rgba(255, 255, 255, 1)`;
          }

          this.blobs.forEach(blob => {
            ctx.save();
            ctx.translate(blob.x, blob.y);
            ctx.rotate(blob.rotation);
            
            ctx.beginPath();
            const radiusX = blob.width / 2;
            const radiusY = blob.height / 2;
            
            ctx.moveTo(0, -radiusY);
            ctx.bezierCurveTo(radiusX, -radiusY, radiusX, radiusY, 0, radiusY);
            ctx.bezierCurveTo(-radiusX, radiusY, -radiusX, -radiusY, 0, -radiusY);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
          });
        } else {
          // DESKTOP: Softer blur for better cloud effect (was 22/27, now higher for softer clouds)
          const baseBlur = darkMode ? 28 : 35; // Increased blur for softer, more realistic clouds
          
          // Use off-screen canvas for blur if available (better Firefox support)
          if (offScreenCanvas && offScreenCtx) {
            // Calculate cloud bounds for off-screen canvas - use cloud position correctly
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            this.blobs.forEach(blob => {
              // Blobs are relative to cloud position (this.x, this.y), so account for that
              const blobX = blob.x - blob.width / 2;
              const blobY = blob.y - blob.height / 2;
              minX = Math.min(minX, blobX - baseBlur * 2);
              maxX = Math.max(maxX, blobX + blob.width + baseBlur * 2);
              minY = Math.min(minY, blobY - baseBlur * 2);
              maxY = Math.max(maxY, blobY + blob.height + baseBlur * 2);
            });
            
            const cloudWidth = (maxX - minX) + baseBlur * 4;
            const cloudHeight = (maxY - minY) + baseBlur * 4;
            
            offScreenCanvas.width = cloudWidth * dpr * resolutionScale;
            offScreenCanvas.height = cloudHeight * dpr * resolutionScale;
            offScreenCtx.setTransform(dpr * resolutionScale, 0, 0, dpr * resolutionScale, 0, 0);
            
            // Clear and draw cloud on off-screen canvas
            offScreenCtx.clearRect(0, 0, cloudWidth, cloudHeight);
            offScreenCtx.filter = `blur(${baseBlur}px)${darkMode ? ' brightness(0.8)' : ''}`;
            offScreenCtx.globalAlpha = darkMode ? opacity * 0.8 : opacity;
            
            // Reset transform for drawing
            offScreenCtx.setTransform(1, 0, 0, 1, 0, 0);
            offScreenCtx.scale(dpr * resolutionScale, dpr * resolutionScale);
            
            // Translate to account for cloud position and padding
            offScreenCtx.translate(-minX + baseBlur * 2, -minY + baseBlur * 2);
            offScreenCtx.scale(this.scale, this.scale);
            
            if (darkMode) {
              offScreenCtx.fillStyle = `rgba(200, 210, 220, 1)`;
            } else {
              offScreenCtx.fillStyle = `rgba(255, 255, 255, 1)`;
            }
            
            this.blobs.forEach(blob => {
              offScreenCtx.save();
              offScreenCtx.translate(blob.x, blob.y);
              offScreenCtx.rotate(blob.rotation);
              
              offScreenCtx.beginPath();
              const radiusX = blob.width / 2;
              const radiusY = blob.height / 2;
              offScreenCtx.moveTo(0, -radiusY);
              offScreenCtx.bezierCurveTo(radiusX, -radiusY, radiusX, radiusY, 0, radiusY);
              offScreenCtx.bezierCurveTo(-radiusX, radiusY, -radiusX, -radiusY, 0, -radiusY);
              offScreenCtx.closePath();
              offScreenCtx.fill();
              offScreenCtx.restore();
            });
            
            // Draw blurred cloud from off-screen canvas to main canvas at correct position
            ctx.restore(); // Restore from earlier save
            ctx.save();
            ctx.setTransform(dpr * resolutionScale, 0, 0, dpr * resolutionScale, 0, 0);
            // Position: cloud x/y + blob min x/y - padding
            ctx.drawImage(offScreenCanvas, this.x + minX - baseBlur * 2, this.y + minY - baseBlur * 2);
            ctx.restore();
            return;
          }
          
          // Fallback: draw directly with filter (original desktop method)
          ctx.filter = `blur(${baseBlur}px)${darkMode ? ' brightness(0.8)' : ''}`;
          ctx.globalAlpha = darkMode ? opacity * 0.8 : opacity;
          
          if (darkMode) {
            ctx.fillStyle = `rgba(200, 210, 220, 1)`;
          } else {
            ctx.fillStyle = `rgba(255, 255, 255, 1)`;
          }

          this.blobs.forEach(blob => {
            ctx.save();
            ctx.translate(blob.x, blob.y);
            ctx.rotate(blob.rotation);
            
            ctx.beginPath();
            const radiusX = blob.width / 2;
            const radiusY = blob.height / 2;
            
            ctx.moveTo(0, -radiusY);
            ctx.bezierCurveTo(radiusX, -radiusY, radiusX, radiusY, 0, radiusY);
            ctx.bezierCurveTo(-radiusX, radiusY, -radiusX, -radiusY, 0, -radiusY);
            ctx.closePath();
            ctx.fill();
            
            ctx.restore();
          });
        }

        ctx.restore();
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

    function initClouds() {
      if (!width || !height) return;
      if (cloudsRef.current.length > 0) return; // Al geïnitialiseerd, skip
      
      cloudsRef.current = [];
      // Use cloud index for deterministic generation - same clouds on mobile and desktop
      for (let i = 0; i < CLOUD_COUNT; i++) {
        cloudsRef.current.push(new SimpleCloud(true, i));
      }
    }

    function animate() {
      if (!width || !height || !ctx) {
        animationId = requestAnimationFrame(animate);
        return;
      }
      
      animationTimeRef.current += 0.016; // ~60fps
      
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
      
          // Initialize off-screen canvas if not already created
          if (!offScreenCanvas) {
            offScreenCanvas = document.createElement('canvas');
            offScreenCtx = offScreenCanvas.getContext('2d');
          }
          
          // Teken wolken (boven alles) - met DPR scaling en resolution scale
          cloudsRef.current.forEach(cloud => {
            cloud.update();
            cloud.draw(darkModeRef.current, dpr, resolutionScale, offScreenCanvas, offScreenCtx);
          });

      animationId = requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize);
    resize();
    
    // Initialiseer en start animatie
    if (width && height) {
      initClouds();
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
      className="fixed inset-0 pointer-events-none"
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
