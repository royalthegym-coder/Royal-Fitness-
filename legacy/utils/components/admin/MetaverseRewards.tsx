import React from 'react';
import { motion } from 'motion/react';
import { Gamepad2, Trophy, Coins, Star, Hexagon } from 'lucide-react';

const MetaverseRewards: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-widest text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
            Metaverse <span className="text-indigo-400">Rewards</span>
          </h2>
          <p className="text-indigo-500/60 font-mono text-xs uppercase tracking-[0.2em] mt-1">Gamified Fitness Ecosystem</p>
        </div>
        <div className="bg-indigo-950/30 border border-indigo-500/30 px-4 py-2 rounded-lg flex items-center gap-3">
          <Gamepad2 className="w-5 h-5 text-indigo-400 animate-pulse" />
          <span className="text-xs font-mono text-indigo-300">GAMIFICATION ACTIVE</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Economy Stats */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-black/40 border border-yellow-500/30 p-6 rounded-2xl relative overflow-hidden"
          >
            <div className="absolute -right-10 -top-10 text-yellow-500/10">
              <Coins className="w-40 h-40" />
            </div>
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Total $AETHER Mined</h3>
            <div className="text-5xl font-black text-white mb-2">2.4<span className="text-2xl text-yellow-500">M</span></div>
            <p className="text-xs text-yellow-400/80 font-mono">+145k this week</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
            className="bg-black/40 border border-indigo-500/30 p-6 rounded-2xl relative overflow-hidden"
          >
            <div className="absolute -right-10 -top-10 text-indigo-500/10">
              <Trophy className="w-40 h-40" />
            </div>
            <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Active Challenges</h3>
            <div className="text-5xl font-black text-white mb-2">12</div>
            <p className="text-xs text-indigo-400/80 font-mono">84% member participation</p>
          </motion.div>
        </div>

        {/* Leaderboard */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
          className="bg-black/40 border border-gray-800 rounded-2xl p-6 flex flex-col"
        >
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400" />
            Top Miners (This Week)
          </h3>
          <div className="flex-1 space-y-4">
            {[
              { name: 'Alex M.', points: '12,450', rank: 1 },
              { name: 'Sarah K.', points: '11,200', rank: 2 },
              { name: 'John D.', points: '10,850', rank: 3 },
            ].map((user) => (
              <div key={user.rank} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-black ${
                    user.rank === 1 ? 'bg-yellow-400' : user.rank === 2 ? 'bg-gray-300' : 'bg-amber-600'
                  }`}>
                    {user.rank}
                  </div>
                  <span className="text-sm font-bold text-white">{user.name}</span>
                </div>
                <span className="text-sm font-mono text-yellow-400">{user.points} $AETHER</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* NFT & Avatar Section */}
      <div className="bg-black/40 border border-fuchsia-500/20 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Hexagon className="w-5 h-5 text-fuchsia-400" />
          Digital Assets & NFTs
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: 'Genesis Pass', type: 'NFT', minted: '500/500', color: 'fuchsia' },
            { title: 'Cyber Sneakers', type: 'Avatar Gear', minted: '124/1000', color: 'cyan' },
            { title: 'FitnessFutureAura', type: 'Profile Effect', minted: 'Unlimited', color: 'indigo' },
          ].map((asset, i) => (
            <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-fuchsia-500/50 transition-colors cursor-pointer group">
              <div className={`w-full h-32 rounded-lg bg-gradient-to-br from-${asset.color}-900/40 to-black border border-${asset.color}-500/30 mb-4 flex items-center justify-center group-hover:scale-105 transition-transform`}>
                <Hexagon className={`w-12 h-12 text-${asset.color}-400 opacity-50`} />
              </div>
              <h4 className="text-sm font-bold text-white">{asset.title}</h4>
              <div className="flex justify-between mt-2 text-xs">
                <span className="text-gray-500">{asset.type}</span>
                <span className={`text-${asset.color}-400 font-mono`}>{asset.minted}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MetaverseRewards;
