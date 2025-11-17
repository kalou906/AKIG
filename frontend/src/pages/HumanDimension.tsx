import React, { useState } from 'react';
import { Users, Trophy, Zap, Target, BookOpen, Award } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  joinedDate: string;
  onboardingProgress: number;
  performanceScore: number;
  badges: string[];
}

interface GamificationReward {
  badge: string;
  title: string;
  description: string;
  earned: number;
  total: number;
  icon: string;
}

const HumanDimension: React.FC = () => {
  const [teamRotation, setTeamRotation] = useState(50); // % of team rotated
  const [selectedAgent, setSelectedAgent] = useState<TeamMember | null>(null);

  const teamMembers: TeamMember[] = [
    {
      id: 'AG001',
      name: 'Fatou Diallo',
      role: 'Senior Agent',
      joinedDate: '2023-01-15',
      onboardingProgress: 100,
      performanceScore: 92,
      badges: ['⭐ Top Performer', '🎯 Accuracy Star', '⏱️ Speed Master'],
    },
    {
      id: 'AG002',
      name: 'Mamadou Bah',
      role: 'New Agent',
      joinedDate: '2025-01-10',
      onboardingProgress: 45,
      performanceScore: 68,
      badges: ['🌟 Learning Fast'],
    },
    {
      id: 'AG003',
      name: 'Aïssatou Kone',
      role: 'Experienced Agent',
      joinedDate: '2023-06-20',
      onboardingProgress: 100,
      performanceScore: 88,
      badges: ['🏅 Team Lead', '💪 Reliability'],
    },
    {
      id: 'AG004',
      name: 'Ousmane Diop',
      role: 'Manager',
      joinedDate: '2022-03-01',
      onboardingProgress: 100,
      performanceScore: 94,
      badges: ['👑 Manager Elite', '📊 Analytics Pro'],
    },
    {
      id: 'AG005',
      name: 'Hawa Camara',
      role: 'New Agent',
      joinedDate: '2025-01-05',
      onboardingProgress: 28,
      performanceScore: 52,
      badges: [],
    },
  ];

  const rewards: GamificationReward[] = [
    {
      badge: '🏆',
      title: 'Top Performer',
      description: 'Highest monthly score',
      earned: 3,
      total: 12,
      icon: '⭐',
    },
    {
      badge: '🎯',
      title: 'Accuracy Star',
      description: '99%+ accuracy rate',
      earned: 8,
      total: 52,
      icon: '✅',
    },
    {
      badge: '⏱️',
      title: 'Speed Master',
      description: 'Complete 100+ tasks/month',
      earned: 5,
      total: 28,
      icon: '🚀',
    },
    {
      badge: '💪',
      title: 'Reliability Expert',
      description: '0 missed deadlines',
      earned: 12,
      total: 34,
      icon: '✔️',
    },
    {
      badge: '🌟',
      title: 'Learning Enthusiast',
      description: 'Complete 3 trainings',
      earned: 7,
      total: 41,
      icon: '📚',
    },
    {
      badge: '👑',
      title: 'Team Leader',
      description: 'Lead team activity',
      earned: 2,
      total: 8,
      icon: '🎖️',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Users className="w-10 h-10 text-green-400" />
            Human Dimension
          </h1>
          <p className="text-gray-400">Team rotation • Gamification system • Rapid onboarding</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg p-6 text-white">
            <div className="text-sm font-semibold opacity-80">Team Size</div>
            <div className="text-3xl font-bold mt-2">{teamMembers.length}</div>
            <div className="text-xs mt-2 opacity-75">Active members</div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="text-sm font-semibold opacity-80">Avg Performance</div>
            <div className="text-3xl font-bold mt-2">78%</div>
            <div className="text-xs mt-2 opacity-75">Across team</div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg p-6 text-white">
            <div className="text-sm font-semibold opacity-80">Team Rotation</div>
            <div className="text-3xl font-bold mt-2">{teamRotation}%</div>
            <div className="text-xs mt-2 opacity-75">New members this cycle</div>
          </div>

          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg p-6 text-white">
            <div className="text-sm font-semibold opacity-80">Badges Earned</div>
            <div className="text-3xl font-bold mt-2">{rewards.reduce((acc, r) => acc + r.earned, 0)}</div>
            <div className="text-xs mt-2 opacity-75">Total achievements</div>
          </div>
        </div>

        {/* Team Rotation Simulator */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
          <h2 className="text-lg font-bold text-white mb-4">Team Rotation Simulator</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-400">New Team Members: {teamRotation}%</span>
                <span className="text-sm font-semibold text-green-400">System remains fluid</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={teamRotation}
                onChange={(e) => setTeamRotation(Number(e.target.value))}
                className="w-full h-3 bg-gray-600 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-xs text-gray-400 mt-2">
                Drag to simulate team turnover. System automatically redistributes tasks and maintains performance.
              </p>
            </div>
          </div>
        </div>

        {/* Team Members */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              Team Roster
            </h2>

            <div className="space-y-2">
              {teamMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => setSelectedAgent(member)}
                  className={`w-full p-3 rounded-lg text-left transition ${
                    selectedAgent?.id === member.id
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{member.name}</div>
                      <div className="text-xs opacity-75">{member.role}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{member.performanceScore}%</div>
                      <div className="text-xs opacity-75">score</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Member Details */}
          {selectedAgent && (
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">Member Profile</h2>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">Name</label>
                  <div className="text-white font-semibold mt-1">{selectedAgent.name}</div>
                </div>

                <div>
                  <label className="text-sm text-gray-400">Role</label>
                  <div className="text-white mt-1">{selectedAgent.role}</div>
                </div>

                <div>
                  <label className="text-sm text-gray-400">Joined</label>
                  <div className="text-white mt-1">{new Date(selectedAgent.joinedDate).toLocaleDateString()}</div>
                </div>

                <div>
                  <label className="text-sm text-gray-400">Onboarding Progress</label>
                  <div className="mt-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{selectedAgent.onboardingProgress}%</span>
                      {selectedAgent.onboardingProgress === 100 && <span className="text-green-400">✓ Complete</span>}
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                        style={{ width: `${selectedAgent.onboardingProgress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400">Performance Score</label>
                  <div className="mt-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{selectedAgent.performanceScore}%</span>
                      <span className={selectedAgent.performanceScore > 85 ? 'text-green-400' : 'text-yellow-400'}>
                        {selectedAgent.performanceScore > 85 ? 'Excellent' : 'Good'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                        style={{ width: `${selectedAgent.performanceScore}%` }}
                      />
                    </div>
                  </div>
                </div>

                {selectedAgent.badges.length > 0 && (
                  <div>
                    <label className="text-sm text-gray-400">Achievements</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedAgent.badges.map((badge, idx) => (
                        <div key={idx} className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                          {badge}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Gamification Badges */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-400" />
            Gamification System
          </h2>

          <div className="grid grid-cols-3 gap-4">
            {rewards.map((reward) => (
              <div key={reward.title} className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-4xl mb-2">{reward.badge}</div>
                <h3 className="font-bold text-white text-sm">{reward.title}</h3>
                <p className="text-xs text-gray-400 mt-1">{reward.description}</p>

                <div className="mt-3">
                  <div className="flex justify-center mb-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={i < Math.round((reward.earned / reward.total) * 5) ? '⭐' : '☆'} />
                    ))}
                  </div>
                  <div className="text-xs text-gray-400">
                    {reward.earned} of {reward.total} earned
                  </div>
                </div>

                <div className="w-full bg-gray-600 rounded-full h-1 mt-2">
                  <div
                    className="bg-gradient-to-r from-yellow-500 to-orange-500 h-1 rounded-full"
                    style={{ width: `${(reward.earned / reward.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Onboarding Tracker */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mt-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" />
            Rapid Onboarding Path (&lt; 1 Week)
          </h2>

          <div className="space-y-3">
            {[
              { day: 'Day 1', title: 'System Orientation', topics: ['Platform tour', 'Login & setup', 'Basic navigation'] },
              { day: 'Day 2', title: 'Core Skills', topics: ['Data entry', 'Form completion', 'Basic calculations'] },
              { day: 'Day 3-4', title: 'Transactions', topics: ['Payment processing', 'Contract creation', 'Document handling'] },
              { day: 'Day 5', title: 'Compliance', topics: ['Rules & regulations', 'Error handling', 'Audit requirements'] },
              { day: 'Day 6', title: 'Advanced', topics: ['Advanced reports', 'Edge cases', 'Customer service'] },
              { day: 'Day 7', title: 'Certification', topics: ['Final exam', 'Performance review', 'Mentorship assignment'] },
            ].map((phase, idx) => (
              <div key={idx} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-start gap-4">
                  <div className="bg-green-500 text-white font-bold px-3 py-1 rounded-lg text-sm min-w-fit">{phase.day}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white">{phase.title}</h3>
                    <div className="text-sm text-gray-400 mt-1">{phase.topics.join(' • ')}</div>
                  </div>
                  <div className="text-green-400">✓</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HumanDimension;
