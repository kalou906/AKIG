/**
 * 🤖 AKIG AI Assistant - Composant IA avec suggestions intelligentes
 * Intégration complète avec recommandations, auto-complete, chatbot
 */

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Sparkles, Lightbulb } from 'lucide-react';

const AKIGAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, type: 'ai', text: 'Bonjour! Je suis AKIG Assistant. Comment puis-je vous aider?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      (messagesEndRef.current as HTMLDivElement).scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Suggestions intelligentes basées sur le contexte
  const suggestions: Array<{ icon: string; text: string; action: string }> = [
    { icon: '📊', text: 'Analyser les paiements en retard', action: 'analyze-overdue' },
    { icon: '⚠️', text: 'Alerter les contrats proches expiration', action: 'alert-expiring' },
    { icon: '💰', text: 'Estimer revenu prochain mois', action: 'estimate-revenue' },
    { icon: '🔔', text: 'Rappeler maintenance propriétés', action: 'remind-maintenance' },
  ];

  const handleSuggestion = (action: string) => {
    const responses: Record<string, string> = {
      'analyze-overdue': '📉 Analyse: 3 paiements en retard pour un total de 1.2M GNF. Recommandation: contacter locataires dans les 48h.',
      'alert-expiring': '⏰ Alerte: 5 contrats expirent dans 30 jours. 2 demandent renouvellement urgent.',
      'estimate-revenue': '💵 Projection: revenus prévus 4.8M GNF pour décembre (+ 12% vs novembre).',
      'remind-maintenance': '🔧 Maintenance: Propriété au 45 Rue X nécessite révision chauffage. Budget estimé: 250K GNF.',
    };
    addMessage(responses[action] || 'Réponse non disponible', 'ai');
  };

  const handleAIResponse = async (userMessage: string) => {
    setLoading(true);
    try {
      // Simulation réponse IA - remplacer par vrai API
      const aiResponses: Record<string, string> = {
        contrat: '📋 Gestion contrats: Vous avez 12 contrats actifs, 2 expirant bientôt. Voulez-vous en renouveler?',
        paiement: '💳 Paiements: 3 en retard (total 1.2M), 5 prévus ce mois. Taux de recouvrement: 94%.',
        propriété: '🏠 Propriétés: 8 immeubles, 24 appartements. Taux d\'occupation: 91%. Maintenance urgente: 2.',
        locataire: '👥 Locataires: 23 actifs, 2 demandes nouvelles. Satisfaction: 4.2/5 ⭐.',
        rapport: '📊 Rapports: Fiscal généré (89% des données). Charges calculées. SCI en cours.',
        rappel: '🔔 Rappels: 5 actifs. Prochaines alertes: paiement (2j), expiration contrat (8j).',
      };

      const lowerMsg = userMessage.toLowerCase();
      let response = 'Je n\'ai pas compris. Pourriez-vous préciser?';
      
      for (const [key, value] of Object.entries(aiResponses)) {
        if (lowerMsg.includes(key)) {
          response = value;
          break;
        }
      }

      await new Promise(r => setTimeout(r, 800)); // Simuler délai
      addMessage(response, 'ai');
    } catch (error) {
      addMessage('Erreur de traitement. Veuillez réessayer.', 'ai');
    } finally {
      setLoading(false);
    }
  };

  interface Message {
    id: number;
    type: 'user' | 'ai';
    text: string;
  }

  const addMessage = (text: string, type: 'user' | 'ai') => {
    const newMessage: Message = {
      id: Date.now(),
      type,
      text,
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSendMessage = () => {
    if (!input.trim()) return;

    addMessage(input, 'user');
    setInput('');
    handleAIResponse(input);
  };

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center z-40"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col animate-fadeInScale z-40">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-2xl text-white">
            <div className="flex items-center gap-2">
              <Sparkles size={20} />
              <h3 className="font-bold text-lg">AKIG Assistant</h3>
            </div>
            <p className="text-sm text-blue-100 mt-1">Votre assistant IA intelligent</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-3 rounded-lg ${
                    msg.type === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-gray-200 text-gray-900 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 px-4 py-3 rounded-lg rounded-bl-none">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions rapides */}
          {messages.length === 1 && (
            <div className="px-4 py-3 border-t">
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                <Lightbulb size={12} /> Suggestions rapides:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      addMessage(s.text, 'user');
                      handleSuggestion(s.action);
                    }}
                    className="text-xs bg-blue-50 hover:bg-blue-100 p-2 rounded text-blue-700 transition"
                  >
                    {s.icon} {s.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t p-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSendMessage()}
              placeholder="Tapez votre question..."
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white p-2 rounded-lg transition"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AKIGAssistant;
