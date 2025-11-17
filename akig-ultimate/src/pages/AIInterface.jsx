import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Brain, Zap, Settings, X, Copy, Download } from 'lucide-react';

const AIInterface = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Bienvenue ! Je suis votre assistant IA AKIG. Comment puis-je vous aider aujourd\'hui ?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [aiMode, setAiMode] = useState('assistant');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulation de réponse IA
    setTimeout(() => {
      const botResponses = {
        assistant: 'Je comprends votre demande. Analysons cette situation ensemble pour trouver la meilleure solution.',
        analyst: 'D\'après mon analyse des données, voici les tendances principales : 📈 Croissance de 12% ce trimestre, 📊 Performance en hausse dans 3 régions clés.',
        strategist: 'Pour optimiser vos opérations, je recommande : 1️⃣ Automatiser les tâches répétitives, 2️⃣ Renforcer la formation, 3️⃣ Investir en technologie.',
      };

      const botMessage = {
        id: messages.length + 2,
        type: 'bot',
        content: botResponses[aiMode] || botResponses.assistant,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsLoading(false);
    }, 800);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const downloadChat = () => {
    const chatText = messages.map((m) => `${m.type.toUpperCase()}: ${m.content}`).join('\n\n');
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'akig_chat_export.txt';
    a.click();
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#E6F2FF] via-white to-[#FFE6E6]">
      {/* Sidebar */}
      <div className="w-72 bg-white border-r border-[#E9ECEF] shadow-lg flex flex-col">
        {/* Header Sidebar */}
        <div className="bg-gradient-to-r from-[#001F3F] to-[#0056B3] p-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-6 h-6" />
            <h2 className="text-lg font-bold">IA AKIG</h2>
          </div>
          <p className="text-xs text-blue-100">Assistant Intelligent Immobilier</p>
        </div>

        {/* Quick Actions */}
        <div className="p-4 flex-1 overflow-y-auto">
          <h3 className="text-xs font-bold text-[#212529] mb-3 uppercase tracking-wide">Modes IA</h3>
          <div className="space-y-2 mb-6">
            {[
              { id: 'assistant', name: 'Assistant', icon: '🤖' },
              { id: 'analyst', name: 'Analyste', icon: '📊' },
              { id: 'strategist', name: 'Stratégiste', icon: '🎯' },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setAiMode(mode.id)}
                className={`w-full text-left p-3 rounded-lg font-medium text-sm transition-all ${
                  aiMode === mode.id
                    ? 'bg-[#0056B3] text-white shadow-md'
                    : 'bg-[#F8F9FA] text-[#212529] hover:bg-[#E6F2FF] border border-[#E9ECEF]'
                }`}
              >
                <span className="mr-2">{mode.icon}</span>
                {mode.name}
              </button>
            ))}
          </div>

          <h3 className="text-xs font-bold text-[#212529] mb-3 uppercase tracking-wide">Actions Rapides</h3>
          <div className="space-y-2">
            {[
              { icon: '📈', label: 'Analyse du marché' },
              { icon: '💰', label: 'Budget prévisionnel' },
              { icon: '🏠', label: 'Optimisation locative' },
              { icon: '📱', label: 'Tendances digitales' },
            ].map((action, idx) => (
              <button
                key={idx}
                className="w-full text-left p-2 rounded-lg text-sm hover:bg-[#E6F2FF] text-[#212529] transition-colors"
                onClick={() => setInput(action.label)}
              >
                <span className="mr-2">{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-[#E9ECEF]">
          <button
            onClick={downloadChat}
            className="w-full bg-[#CC0000] hover:bg-[#990000] text-white py-2 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exporter
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b border-[#E9ECEF] px-8 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-[#0056B3] to-[#CC0000] p-3 rounded-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#212529]">Conversation IA</h1>
              <p className="text-xs text-[#495057]">Mode: {aiMode.charAt(0).toUpperCase() + aiMode.slice(1)}</p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-[#E6F2FF] rounded-lg transition-colors text-[#0056B3]"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-8 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-lg rounded-2xl px-6 py-4 shadow-md ${
                  message.type === 'user'
                    ? 'bg-[#0056B3] text-white rounded-br-none'
                    : 'bg-white text-[#212529] border border-[#E9ECEF] rounded-bl-none'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                <p className={`text-xs mt-2 ${message.type === 'user' ? 'text-blue-100' : 'text-[#ADB5BD]'}`}>
                  {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </p>

                {message.type === 'bot' && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => copyToClipboard(message.content)}
                      className="text-[#0056B3] hover:text-[#CC0000] transition-colors"
                      title="Copier"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-[#E9ECEF] rounded-2xl rounded-bl-none px-6 py-4 shadow-md">
                <div className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#0056B3] animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-[#CC0000] animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 rounded-full bg-[#0056B3] animate-bounce" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-[#E9ECEF] bg-white p-8">
          <div className="bg-gradient-to-r from-[#E6F2FF] to-[#FFE6E6] rounded-2xl border border-[#E9ECEF] shadow-md p-4 flex items-end gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Posez votre question à l'IA... (Shift+Entrée pour nouvelle ligne)"
              className="flex-1 bg-transparent outline-none text-[#212529] placeholder-[#ADB5BD] resize-none max-h-24 text-sm"
              rows="2"
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-r from-[#0056B3] to-[#CC0000] hover:from-[#003D82] hover:to-[#990000] disabled:opacity-50 text-white p-3 rounded-lg transition-all shadow-md hover:shadow-lg"
            >
              {isLoading ? <Zap className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-[#ADB5BD] mt-3">
            💡 Conseil: Utilisez les modes IA pour des réponses plus spécialisées
          </p>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-[#212529]">Paramètres IA</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-[#ADB5BD] hover:text-[#212529] transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-[#212529] mb-2">Niveau de détail</label>
                <select className="w-full p-2 border border-[#E9ECEF] rounded-lg text-sm focus:outline-none focus:border-[#0056B3]">
                  <option>Résumé</option>
                  <option>Équilibré</option>
                  <option>Détaillé</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#212529] mb-2">Langue</label>
                <select className="w-full p-2 border border-[#E9ECEF] rounded-lg text-sm focus:outline-none focus:border-[#0056B3]">
                  <option>Français</option>
                  <option>English</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-[#212529]">Mode sombre</label>
                <input type="checkbox" className="w-4 h-4 cursor-pointer" />
              </div>

              <button
                onClick={() => setShowSettings(false)}
                className="w-full bg-gradient-to-r from-[#0056B3] to-[#CC0000] hover:from-[#003D82] hover:to-[#990000] text-white py-2 rounded-lg font-medium mt-6 transition-all"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInterface;
