import React, { useState } from 'react';
import { Globe, BookOpen, BarChart3, Zap, Radio, Share2 } from 'lucide-react';

interface Language {
  code: string;
  name: string;
  speakers: number;
  status: 'active' | 'planned' | 'beta';
  coverage: number;
  sampleText: string;
}

interface APIPartner {
  name: string;
  category: string;
  status: 'active' | 'pending' | 'testing';
  baseURL: string;
  methods: string[];
  authType: string;
}

interface BenchmarkMetric {
  metric: string;
  akigPerformance: number;
  africaLeader: number;
  globalLeader: number;
  unit: string;
}

const JupiterVision: React.FC = () => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('FR');

  const languages: Language[] = [
    {
      code: 'FR',
      name: 'Français',
      speakers: 50000000,
      status: 'active',
      coverage: 100,
      sampleText: 'Bienvenue dans le système AKIG',
    },
    {
      code: 'EN',
      name: 'English',
      speakers: 1400000000,
      status: 'active',
      coverage: 100,
      sampleText: 'Welcome to AKIG system',
    },
    {
      code: 'SO',
      name: 'Soussou',
      speakers: 1500000,
      status: 'active',
      coverage: 95,
      sampleText: 'Mabole e AKIG simiyee',
    },
    {
      code: 'PL',
      name: 'Peulh',
      speakers: 40000000,
      status: 'beta',
      coverage: 78,
      sampleText: 'Jaaraama e AKIG saba',
    },
    {
      code: 'MK',
      name: 'Malinké',
      speakers: 15000000,
      status: 'planned',
      coverage: 45,
      sampleText: 'A ni se AKIG sistema',
    },
  ];

  const apiPartners: APIPartner[] = [
    {
      name: 'Payment Gateway Pro',
      category: 'Payments',
      status: 'active',
      baseURL: 'https://api.paymentgateway.local/v2',
      methods: ['POST /process', 'GET /status', 'PUT /refund'],
      authType: 'OAuth 2.0',
    },
    {
      name: 'Banking Network',
      category: 'Banking',
      status: 'active',
      baseURL: 'https://api.banking.local/v3',
      methods: ['GET /accounts', 'POST /transfer', 'GET /balance'],
      authType: 'mTLS + API Key',
    },
    {
      name: 'SMS Gateway',
      category: 'Communication',
      status: 'active',
      baseURL: 'https://sms.gateway.local/v1',
      methods: ['POST /send', 'GET /status'],
      authType: 'API Key',
    },
    {
      name: 'Insurance Hub',
      category: 'Insurance',
      status: 'testing',
      baseURL: 'https://api.insurance.local/v1',
      methods: ['POST /quote', 'GET /policies'],
      authType: 'OAuth 2.0',
    },
    {
      name: 'Tax Authority API',
      category: 'Compliance',
      status: 'active',
      baseURL: 'https://api.tax.gov.gn/v2',
      methods: ['POST /validate', 'GET /rates'],
      authType: 'Government Token',
    },
  ];

  const benchmarks: BenchmarkMetric[] = [
    {
      metric: 'Average Response Time',
      akigPerformance: 145,
      africaLeader: 180,
      globalLeader: 95,
      unit: 'ms',
    },
    {
      metric: 'System Uptime',
      akigPerformance: 99.8,
      africaLeader: 99.5,
      globalLeader: 99.99,
      unit: '%',
    },
    {
      metric: 'Transactions/Second',
      akigPerformance: 5000,
      africaLeader: 2000,
      globalLeader: 50000,
      unit: 'TPS',
    },
    {
      metric: 'Data Recovery Time',
      akigPerformance: 15,
      africaLeader: 45,
      globalLeader: 5,
      unit: 'min',
    },
    {
      metric: 'User Adoption Rate',
      akigPerformance: 92,
      africaLeader: 75,
      globalLeader: 88,
      unit: '%',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-amber-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Zap className="w-10 h-10 text-amber-400" />
            Jupiter Vision
          </h1>
          <p className="text-gray-400">Multi-language • Public API • International benchmark</p>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg p-6 text-white">
            <div className="text-sm font-semibold opacity-80">Languages</div>
            <div className="text-3xl font-bold mt-2">{languages.filter((l) => l.status !== 'planned').length}</div>
            <div className="text-xs mt-2 opacity-75">Active + Beta</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg p-6 text-white">
            <div className="text-sm font-semibold opacity-80">API Partners</div>
            <div className="text-3xl font-bold mt-2">{apiPartners.filter((p) => p.status === 'active').length}</div>
            <div className="text-xs mt-2 opacity-75">Integrated systems</div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-6 text-white">
            <div className="text-sm font-semibold opacity-80">Regional Leaders</div>
            <div className="text-3xl font-bold mt-2">5</div>
            <div className="text-xs mt-2 opacity-75">Benchmark categories</div>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-lg p-6 text-white">
            <div className="text-sm font-semibold opacity-80">Global Reach</div>
            <div className="text-3xl font-bold mt-2">150+</div>
            <div className="text-xs mt-2 opacity-75">Countries targeted</div>
          </div>
        </div>

        {/* Languages */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              Multi-Language Support
            </h2>

            <div className="space-y-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setSelectedLanguage(lang.code)}
                  className={`w-full p-4 rounded-lg text-left transition ${
                    selectedLanguage === lang.code
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold">{lang.name}</div>
                      <div className="text-xs opacity-75">{lang.code}</div>
                    </div>
                    <div
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        lang.status === 'active'
                          ? 'bg-green-900 text-green-200'
                          : lang.status === 'beta'
                          ? 'bg-yellow-900 text-yellow-200'
                          : 'bg-gray-600 text-gray-200'
                      }`}
                    >
                      {lang.status.toUpperCase()}
                    </div>
                  </div>

                  <div className="text-xs text-opacity-75 mb-2">
                    {(lang.speakers / 1000000).toFixed(1)}M speakers • {lang.coverage}% coverage
                  </div>

                  <div className="w-full bg-gray-600 rounded-full h-2">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" style={{ width: `${lang.coverage}%` }} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Language Preview */}
          {selectedLanguage && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">Language Details</h2>

              {languages
                .filter((l) => l.code === selectedLanguage)
                .map((lang) => (
                  <div key={lang.code} className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-400">Language</label>
                      <div className="text-2xl font-bold text-white mt-1">{lang.name}</div>
                    </div>

                    <div>
                      <label className="text-sm text-gray-400">Speakers Worldwide</label>
                      <div className="text-xl font-bold text-cyan-400 mt-1">
                        {(lang.speakers / 1000000).toFixed(1)} Million
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-gray-400">Interface Coverage</label>
                      <div className="mt-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span>{lang.coverage}%</span>
                          {lang.coverage >= 95 && <span className="text-green-400">✓ Complete</span>}
                          {lang.coverage < 95 && lang.coverage >= 70 && <span className="text-yellow-400">In Progress</span>}
                        </div>
                        <div className="w-full bg-gray-600 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full"
                            style={{ width: `${lang.coverage}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-gray-400">Sample Text</label>
                      <div className="bg-gray-700 rounded-lg p-3 text-white mt-1 italic">
                        "{lang.sampleText}"
                      </div>
                    </div>

                    <div>
                      <label className="text-sm text-gray-400">Status</label>
                      <div
                        className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mt-1 ${
                          lang.status === 'active'
                            ? 'bg-green-900 text-green-200'
                            : lang.status === 'beta'
                            ? 'bg-yellow-900 text-yellow-200'
                            : 'bg-gray-600 text-gray-200'
                        }`}
                      >
                        {lang.status.toUpperCase()}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Public API Marketplace */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Radio className="w-5 h-5 text-green-400" />
            Public API Marketplace (for Partner Integration)
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {apiPartners.map((partner) => (
              <div key={partner.name} className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-white">{partner.name}</h3>
                    <p className="text-xs text-gray-400">{partner.category}</p>
                  </div>
                  <div
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      partner.status === 'active'
                        ? 'bg-green-900 text-green-200'
                        : partner.status === 'testing'
                        ? 'bg-yellow-900 text-yellow-200'
                        : 'bg-gray-600 text-gray-200'
                    }`}
                  >
                    {partner.status.toUpperCase()}
                  </div>
                </div>

                <div className="text-xs font-mono text-cyan-400 bg-gray-900 rounded p-2 mb-2 break-all">
                  {partner.baseURL}
                </div>

                <div className="mb-2">
                  <div className="text-xs text-gray-400 mb-1">Methods:</div>
                  <div className="flex flex-wrap gap-1">
                    {partner.methods.map((method) => (
                      <span key={method} className="bg-gray-600 text-gray-200 text-xs px-2 py-1 rounded">
                        {method}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="text-xs">
                  <span className="text-gray-400">Auth:</span>
                  <span className="text-purple-400 ml-2">{partner.authType}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 bg-gradient-to-r from-green-900 to-emerald-900 rounded-lg p-4 border border-green-700">
            <div className="flex items-center gap-2 mb-2">
              <Share2 className="w-4 h-4 text-green-400" />
              <span className="text-sm font-semibold text-white">API Documentation</span>
            </div>
            <p className="text-xs text-gray-300">
              Access our public REST API at: <span className="font-mono text-cyan-400">https://api.akig.io/v2</span>
            </p>
          </div>
        </div>

        {/* International Benchmark */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-400" />
            International Benchmark
          </h2>

          <div className="space-y-4">
            {benchmarks.map((benchmark) => {
              const maxValue = Math.max(benchmark.akigPerformance, benchmark.africaLeader, benchmark.globalLeader);
              const normAkig = (benchmark.akigPerformance / maxValue) * 100;
              const normAfrica = (benchmark.africaLeader / maxValue) * 100;
              const normGlobal = (benchmark.globalLeader / maxValue) * 100;

              return (
                <div key={benchmark.metric} className="bg-gray-700 rounded-lg p-4">
                  <div className="font-semibold text-white mb-3">{benchmark.metric}</div>

                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-cyan-400">AKIG</span>
                        <span className="text-cyan-300 font-semibold">
                          {benchmark.akigPerformance} {benchmark.unit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full"
                          style={{ width: `${normAkig}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-green-400">Africa Leader</span>
                        <span className="text-green-300 font-semibold">
                          {benchmark.africaLeader} {benchmark.unit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                          style={{ width: `${normAfrica}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-purple-400">Global Leader</span>
                        <span className="text-purple-300 font-semibold">
                          {benchmark.globalLeader} {benchmark.unit}
                        </span>
                      </div>
                      <div className="w-full bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                          style={{ width: `${normGlobal}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 bg-gradient-to-r from-amber-900 to-orange-900 rounded-lg p-4 border border-amber-700">
            <p className="text-sm text-white">
              <strong>Strategic Position:</strong> AKIG is competitive with Africa's leaders and approaching global benchmarks, positioning us
              as the fastest-growing proptech platform in West Africa.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JupiterVision;
