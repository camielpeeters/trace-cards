'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Circle, AlertCircle, Loader, Sparkles } from 'lucide-react';

export default function InstallWizard() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checks, setChecks] = useState({
    nodeVersion: null,
    writable: null,
    database: null,
    env: null,
    prisma: null
  });
  
  const [formData, setFormData] = useState({
    adminUsername: '',
    adminEmail: '',
    adminPassword: '',
    adminPasswordConfirm: '',
    displayName: '',
    jwtSecret: '',
    pokemonApiKey: ''
  });

  // Auto-generate JWT secret
  useEffect(() => {
    if (!formData.jwtSecret) {
      const secret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      setFormData(prev => ({ ...prev, jwtSecret: secret }));
    }
  }, []);

  const runChecks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/install/check');
      const data = await response.json();
      setChecks(data.checks);
      
      const allPassed = Object.values(data.checks).every(check => check.passed);
      if (allPassed) {
        setStep(2);
      }
    } catch (error) {
      setError('Kon checks niet uitvoeren. Check console voor details.');
    } finally {
      setLoading(false);
    }
  };

  const handleInstall = async () => {
    // Validation
    if (formData.adminPassword !== formData.adminPasswordConfirm) {
      setError('Wachtwoorden komen niet overeen');
      return;
    }
    
    if (formData.adminPassword.length < 8) {
      setError('Wachtwoord moet minimaal 8 karakters zijn');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Step 1: Setup environment
      setStep(3);
      const envResponse = await fetch('/api/install/setup-env', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jwtSecret: formData.jwtSecret,
          pokemonApiKey: formData.pokemonApiKey
        })
      });
      
      if (!envResponse.ok) {
        const errorData = await envResponse.json();
        throw new Error(errorData.error || 'Environment setup failed');
      }
      
      // Step 2: Setup database
      setStep(4);
      const dbResponse = await fetch('/api/install/setup-database', {
        method: 'POST'
      });
      
      if (!dbResponse.ok) {
        const errorData = await dbResponse.json();
        const errorMessage = errorData.error || 'Database setup failed';
        const helpText = errorData.help ? `\n\n${errorData.help}` : '';
        throw new Error(`${errorMessage}${helpText}`);
      }
      
      // Step 3: Create admin user
      setStep(5);
      const adminResponse = await fetch('/api/install/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.adminUsername,
          email: formData.adminEmail,
          password: formData.adminPassword,
          displayName: formData.displayName
        })
      });
      
      if (!adminResponse.ok) {
        const errorData = await adminResponse.json();
        throw new Error(errorData.error || 'Admin creation failed');
      }
      
      // Step 4: Finalize
      setStep(6);
      await fetch('/api/install/finalize', { method: 'POST' });
      
      // Success!
      setStep(7);
      
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const CheckItem = ({ label, status }) => (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
      {status === null && <Circle className="w-5 h-5 text-gray-300" />}
      {status === 'checking' && <Loader className="w-5 h-5 text-blue-500 animate-spin" />}
      {status?.passed === true && <CheckCircle className="w-5 h-5 text-green-500" />}
      {status?.passed === false && <AlertCircle className="w-5 h-5 text-red-500" />}
      <div className="flex-1">
        <p className="font-bold text-sm">{label}</p>
        {status?.message && (
          <p className="text-xs text-gray-600">{status.message}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 font-['Comic_Neue',_cursive] p-4">
      <div className="max-w-2xl mx-auto py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full mb-4">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-gray-800 mb-2">
            trace.cards Installer
          </h1>
          <p className="text-gray-600">
            Welkom! Deze wizard helpt je om trace.cards in 5 minuten te installeren.
          </p>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-4 border-purple-400">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4, 5, 6, 7].map(s => (
              <div
                key={s}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  s < step ? 'bg-green-500 text-white' :
                  s === step ? 'bg-purple-500 text-white' :
                  'bg-gray-200 text-gray-400'
                }`}
              >
                {s < step ? '✓' : s}
              </div>
            ))}
          </div>
          <div className="text-center text-sm font-bold text-gray-600">
            {step === 1 && 'Stap 1: Systeem Checks'}
            {step === 2 && 'Stap 2: Configuratie'}
            {step === 3 && 'Stap 3: Environment Setup'}
            {step === 4 && 'Stap 4: Database Setup'}
            {step === 5 && 'Stap 5: Admin Account'}
            {step === 6 && 'Stap 6: Afronden'}
            {step === 7 && 'Klaar! ✅'}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-400 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-red-700 font-bold text-sm mb-2">Fout opgetreden:</p>
                <p className="text-red-600 text-sm whitespace-pre-line">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-4 border-purple-400">
          {/* Step 1: System Checks */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-gray-800 mb-4">
                Systeem Controle
              </h2>
              <p className="text-gray-600 mb-6">
                We controleren of je systeem klaar is voor trace.cards.
              </p>
              
              <div className="space-y-3">
                <CheckItem 
                  label="Node.js Versie" 
                  status={checks.nodeVersion}
                />
                <CheckItem 
                  label="Schrijfrechten (data/ folder)" 
                  status={checks.writable}
                />
                <CheckItem 
                  label="Database Support (SQLite)" 
                  status={checks.database}
                />
                <CheckItem 
                  label="Environment Variables (.env)" 
                  status={checks.env}
                />
                <CheckItem 
                  label="Prisma Schema" 
                  status={checks.prisma}
                />
              </div>

              <button
                onClick={runChecks}
                disabled={loading}
                className="w-full mt-6 bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 rounded-full font-black text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50"
              >
                {loading ? 'Controleren...' : 'Start Controle'}
              </button>
            </div>
          )}

          {/* Step 2: Configuration */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-gray-800 mb-4">
                Configuratie
              </h2>
              <p className="text-gray-600 mb-6">
                Vul de gegevens in voor je eerste admin account.
              </p>

              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleInstall(); }}>
                {/* Username */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Admin Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.adminUsername}
                    onChange={(e) => setFormData({...formData, adminUsername: e.target.value.toLowerCase()})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-purple-400 focus:outline-none font-medium"
                    placeholder="admin"
                    pattern="[a-z0-9_]{3,20}"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Je URL: trace.cards/<strong>{formData.adminUsername || 'username'}</strong>
                  </p>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({...formData, adminEmail: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-purple-400 focus:outline-none font-medium"
                    placeholder="admin@trace.cards"
                  />
                </div>

                {/* Display Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({...formData, displayName: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-purple-400 focus:outline-none font-medium"
                    placeholder="Admin (optioneel)"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Wachtwoord *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.adminPassword}
                    onChange={(e) => setFormData({...formData, adminPassword: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-purple-400 focus:outline-none font-medium"
                    placeholder="••••••••"
                    minLength={8}
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Bevestig Wachtwoord *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.adminPasswordConfirm}
                    onChange={(e) => setFormData({...formData, adminPasswordConfirm: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-purple-400 focus:outline-none font-medium"
                    placeholder="••••••••"
                  />
                </div>

                {/* Pokemon API Key */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Pokemon TCG API Key
                  </label>
                  <input
                    type="text"
                    value={formData.pokemonApiKey}
                    onChange={(e) => setFormData({...formData, pokemonApiKey: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-purple-400 focus:outline-none font-medium"
                    placeholder="Optioneel - krijg je van pokemontcg.io"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    <a href="https://dev.pokemontcg.io/" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                      Krijg hier gratis een API key →
                    </a>
                  </p>
                </div>

                {/* JWT Secret (Read-only) */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    JWT Secret (Automatisch gegenereerd)
                  </label>
                  <input
                    type="text"
                    value={formData.jwtSecret}
                    readOnly
                    className="w-full px-4 py-3 rounded-xl border-2 border-green-300 bg-green-50 font-mono text-xs"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    ✅ Veilige random string automatisch gegenereerd
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-6 bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 rounded-full font-black text-lg shadow-lg hover:shadow-xl hover:scale-105 transition-all disabled:opacity-50"
                >
                  {loading ? 'Installeren...' : 'Start Installatie'}
                </button>
              </form>
            </div>
          )}

          {/* Steps 3-6: Installation Progress */}
          {[3, 4, 5, 6].includes(step) && (
            <div className="text-center py-12">
              <Loader className="w-16 h-16 text-purple-500 animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-black text-gray-800 mb-2">
                {step === 3 && 'Environment wordt ingesteld...'}
                {step === 4 && 'Database wordt aangemaakt...'}
                {step === 5 && 'Admin account wordt aangemaakt...'}
                {step === 6 && 'Installatie wordt afgerond...'}
              </h2>
              <p className="text-gray-600">
                Dit kan een moment duren. Even geduld...
              </p>
            </div>
          )}

          {/* Step 7: Success */}
          {step === 7 && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-6">
                <CheckCircle className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-800 mb-4">
                Installatie Succesvol! 🎉
              </h2>
              <p className="text-gray-600 mb-8">
                trace.cards is nu klaar voor gebruik!
              </p>

              <div className="bg-gray-50 rounded-xl p-6 mb-6 text-left">
                <h3 className="font-black text-lg mb-3">Jouw Gegevens:</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Username:</strong> {formData.adminUsername}</p>
                  <p><strong>Email:</strong> {formData.adminEmail}</p>
                  <p><strong>Jouw pagina:</strong> <a href={`/${formData.adminUsername}`} className="text-purple-600 hover:underline">trace.cards/{formData.adminUsername}</a></p>
                </div>
              </div>

              <div className="flex gap-4">
                <a
                  href="/login"
                  className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 rounded-full font-black text-center shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                >
                  Login →
                </a>
                <a
                  href={`/${formData.adminUsername}`}
                  className="flex-1 bg-white text-purple-600 border-2 border-purple-500 py-3 rounded-full font-black text-center shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                >
                  Mijn Pagina →
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
