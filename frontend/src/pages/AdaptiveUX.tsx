import React, { useState } from 'react';
import { Users, Eye, Smartphone, Zap, Volume2, Type } from 'lucide-react';

interface UIProfile {
  name: string;
  role: 'agent' | 'manager' | 'owner';
  icon: React.ReactNode;
  description: string;
  features: string[];
  color: string;
}

const AdaptiveUX: React.FC = () => {
  const [selectedProfile, setSelectedProfile] = useState<'agent' | 'manager' | 'owner'>('agent');
  const [colorblindMode, setColorblindMode] = useState(false);
  const [highContrastMode, setHighContrastMode] = useState(false);
  const [largeTextMode, setLargeTextMode] = useState(false);
  const [lowLiteracyMode, setLowLiteracyMode] = useState(false);
  const [voiceAssistantMode, setVoiceAssistantMode] = useState(false);

  const profiles: Record<'agent' | 'manager' | 'owner', UIProfile> = {
    agent: {
      name: 'Field Agent',
      role: 'agent',
      icon: <Users className="w-6 h-6" />,
      description: 'Simple, task-focused interface for field operations',
      features: ['Quick action buttons', 'Large touch targets', 'Minimal text', 'Visual confirmations', 'Voice navigation'],
      color: 'from-blue-500 to-cyan-500',
    },
    manager: {
      name: 'Manager',
      role: 'manager',
      icon: <Eye className="w-6 h-6" />,
      description: 'Data-rich dashboard with analytics and team management',
      features: ['Real-time dashboards', 'Performance metrics', 'Team oversight', 'Report generation', 'Alerts & notifications'],
      color: 'from-purple-500 to-pink-500',
    },
    owner: {
      name: 'Owner',
      role: 'owner',
      icon: <Zap className="w-6 h-6" />,
      description: 'Strategic overview with business intelligence',
      features: ['P&L dashboards', 'Strategic insights', 'Benchmarking', 'Forecasting', 'Board reports'],
      color: 'from-amber-500 to-orange-500',
    },
  };

  const currentProfile = profiles[selectedProfile];

  const accessibilityFeatures = [
    {
      name: 'Colorblind Friendly',
      enabled: colorblindMode,
      setter: setColorblindMode,
      description: 'Deuteranopia-safe color palette',
      icon: '🎨',
    },
    {
      name: 'High Contrast',
      enabled: highContrastMode,
      setter: setHighContrastMode,
      description: 'Enhanced contrast for visibility',
      icon: '◐',
    },
    {
      name: 'Large Text',
      enabled: largeTextMode,
      setter: setLargeTextMode,
      description: 'Bigger fonts throughout',
      icon: <Type className="w-4 h-4 inline" />,
    },
    {
      name: 'Low-Literacy Mode',
      enabled: lowLiteracyMode,
      setter: setLowLiteracyMode,
      description: 'Simplified language, more icons',
      icon: '📖',
    },
    {
      name: 'Voice Assistant',
      enabled: voiceAssistantMode,
      setter: setVoiceAssistantMode,
      description: 'Audio-first navigation',
      icon: <Volume2 className="w-4 h-4 inline" />,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Smartphone className="w-10 h-10 text-cyan-400" />
            Adaptive UX System
          </h1>
          <p className="text-gray-400">Profile-based interfaces • Micro-interactions • Universal accessibility</p>
        </div>

        {/* Profile Selector */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-700">
          <h2 className="text-lg font-bold text-white mb-4">Select User Profile</h2>
          <div className="grid grid-cols-3 gap-4">
            {(['agent', 'manager', 'owner'] as const).map((profileKey) => (
              <button
                key={profileKey}
                onClick={() => setSelectedProfile(profileKey)}
                className={`p-6 rounded-lg font-semibold transition transform hover:scale-105 ${
                  selectedProfile === profileKey
                    ? `bg-gradient-to-br ${profiles[profileKey].color} text-white shadow-lg`
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <div className="mb-2 flex justify-center">{profiles[profileKey].icon}</div>
                <div>{profiles[profileKey].name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Profile Details */}
        <div className={`bg-gradient-to-br ${currentProfile.color} rounded-lg p-8 mb-8 text-white shadow-lg`}>
          <h2 className="text-3xl font-bold mb-2">{currentProfile.name} Interface</h2>
          <p className="text-white opacity-90 mb-6">{currentProfile.description}</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-3">✨ Key Features</h3>
              <ul className="space-y-2">
                {currentProfile.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-white rounded-full" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="text-sm font-semibold opacity-80">UI Customization</div>
                <div className="text-xs opacity-75 mt-1">
                  {selectedProfile === 'agent' && '• Buttons: 3x larger\n• Text: Simple language\n• Actions: 1-click operations'}
                  {selectedProfile === 'manager' && '• Layout: Multi-column\n• Charts: Real-time updates\n• Data: Deep analytics'}
                  {selectedProfile === 'owner' && '• Focus: KPIs & trends\n• Depth: Strategic insights\n• Format: Executive summary'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Accessibility Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-cyan-400" />
              Accessibility Options
            </h2>

            <div className="space-y-3">
              {accessibilityFeatures.map((feature) => (
                <button
                  key={feature.name}
                  onClick={() => feature.setter(!feature.enabled)}
                  className={`w-full p-4 rounded-lg text-left transition transform hover:scale-102 ${
                    feature.enabled
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{feature.name}</div>
                      <div className="text-xs opacity-75">{feature.description}</div>
                    </div>
                    <div
                      className={`w-12 h-7 rounded-full transition ${
                        feature.enabled ? 'bg-white bg-opacity-30' : 'bg-gray-600'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 bg-white rounded-full transition-transform ${
                          feature.enabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4">Live Preview</h2>

            <div
              className={`bg-gray-900 rounded-lg p-6 transition-all ${
                highContrastMode ? 'border-4 border-white' : 'border border-gray-700'
              }`}
              style={{
                fontSize: largeTextMode ? '18px' : '14px',
                filter: colorblindMode ? 'url(#colorblindFilter)' : 'none',
              }}
            >
              <svg style={{ display: 'none' }}>
                <defs>
                  <filter id="colorblindFilter">
                    <feColorMatrix type="matrix" values="0.567,0.433,0,0,0 0.558,0.442,0,0,0 0,0.242,0.758,0,0 0,0,0,1,0" />
                  </filter>
                </defs>
              </svg>

              {lowLiteracyMode ? (
                <div className="space-y-4">
                  <div className="text-2xl font-bold text-white">🏠 HOME</div>
                  <div className="grid grid-cols-3 gap-3">
                    <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-6 rounded-lg text-center">
                      ✔️<br />CONFIRM
                    </button>
                    <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-6 rounded-lg text-center">
                      ➕<br />ADD
                    </button>
                    <button className="bg-red-500 hover:bg-red-600 text-white font-bold py-6 rounded-lg text-center">
                      ❌<br />DELETE
                    </button>
                  </div>
                </div>
              ) : voiceAssistantMode ? (
                <div className="text-center">
                  <div className="text-3xl mb-3 animate-pulse">🎙️</div>
                  <div className="text-white font-semibold mb-2">Listening...</div>
                  <div className="text-xs text-gray-400">Say "Show my tasks" or "Review payment"</div>
                  <div className="mt-4 flex gap-1 justify-center">
                    <div className="w-1 h-8 bg-cyan-400 rounded" />
                    <div className="w-1 h-12 bg-cyan-400 rounded animate-pulse" />
                    <div className="w-1 h-10 bg-cyan-400 rounded" />
                    <div className="w-1 h-14 bg-cyan-400 rounded animate-pulse" />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className={`font-bold ${highContrastMode ? 'text-white text-2xl' : 'text-gray-200'}`}>
                    Dashboard
                  </div>
                  <div className={`grid grid-cols-2 gap-3 ${colorblindMode ? 'opacity-90' : ''}`}>
                    <div className="bg-blue-600 p-4 rounded-lg text-white font-semibold">
                      Pending: 5
                    </div>
                    <div className="bg-green-600 p-4 rounded-lg text-white font-semibold">
                      Completed: 12
                    </div>
                  </div>
                  <button className={`w-full py-3 rounded-lg font-semibold transition ${
                    highContrastMode ? 'bg-white text-black' : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}>
                    View Details
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Micro-Interactions Showcase */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Micro-Interactions Library</h2>

          <div className="grid grid-cols-3 gap-4">
            {[
              { name: 'Bounce', emoji: '⬆️' },
              { name: 'Pulse', emoji: '💓' },
              { name: 'Rotate', emoji: '🔄' },
              { name: 'Glow', emoji: '✨' },
              { name: 'Slide', emoji: '→' },
              { name: 'Fade', emoji: '👻' },
            ].map((interaction) => (
              <button
                key={interaction.name}
                className="bg-gray-700 hover:bg-gray-600 text-white py-6 rounded-lg font-semibold transition hover:scale-110 active:scale-95"
              >
                <div className="text-3xl mb-2">{interaction.emoji}</div>
                <div className="text-sm">{interaction.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Device Support */}
        <div className="bg-gray-800 rounded-lg p-6 mt-8 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4">Device Support</h2>

          <div className="grid grid-cols-4 gap-4">
            {[
              { device: 'Modern Phone', support: '✅ Full', features: 'All features' },
              { device: 'Feature Phone', support: '✅ Basic', features: 'SMS + Text' },
              { device: 'Tablet', support: '✅ Full', features: 'Optimized layout' },
              { device: 'Desktop', support: '✅ Full', features: 'Full dashboard' },
            ].map((item) => (
              <div key={item.device} className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">📱</div>
                <div className="font-semibold text-white text-sm">{item.device}</div>
                <div className="text-xs text-cyan-400 font-bold mt-1">{item.support}</div>
                <div className="text-xs text-gray-400 mt-2">{item.features}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdaptiveUX;
