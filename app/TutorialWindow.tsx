import React, { useState } from 'react';

interface TutorialWindowProps {
    onClose: () => void;
}

const TutorialWindow: React.FC<TutorialWindowProps> = ({ onClose }) => {
    const [activeTab, setActiveTab] = useState<'towers' | 'mechanics'>('towers');

    const renderTowerContent = () => (
        <div className="space-y-6">
            {/* Basic Tower */}
            <div className="bg-slate-700 p-4 rounded-lg">
                <div className="flex items-center gap-4 mb-2">
                    <img src="/tower1.png" alt="Basic Tower" className="w-12 h-12"/>
                    <h3 className="text-xl text-white">Basic Tower (100$)</h3>
                </div>
                <p className="text-gray-300">Balanced tower with good damage and attack speed. Can be upgraded to hit 2 enemies at a time.</p>
                <p className="text-yellow-400 mt-2">Special: Artillery (20000$) - Massive damage and range increase .</p>
            </div>
    
            {/* Sniper Tower */}
            <div className="bg-slate-700 p-4 rounded-lg">
                <div className="flex items-center gap-4 mb-2">
                    <img src="/tower2.png" alt="Sniper Tower" className="w-12 h-12"/>
                    <h3 className="text-xl text-white">Sniper Tower (200$)</h3>
                </div>
                <p className="text-gray-300">High single-target damage with long range but slow attack speed.</p>
                <p className="text-yellow-400 mt-2">Special: Rail Gun (20000$) - Extreme damage and penetration.</p>
            </div>
    
            {/* Rapid Shooter */}
            <div className="bg-slate-700 p-4 rounded-lg">
                <div className="flex items-center gap-4 mb-2">
                    <img src="/rapidShooter.png" alt="Rapid Shooter" className="w-12 h-12"/>
                    <h3 className="text-xl text-white">Rapid Shooter (500$)</h3>
                </div>
                <p className="text-gray-300">Fast-attacking tower that can be upgraded to triple attack.</p>
                <p className="text-yellow-400 mt-2">Special: Gatling Gun (20000$) -Bigger damage, Ultimate attack speed and quad targeting.</p>
            </div>
    
            {/* Slower Tower */}
            <div className="bg-slate-700 p-4 rounded-lg">
                <div className="flex items-center gap-4 mb-2">
                    <img src="/slower.png" alt="Slower Tower" className="w-12 h-12"/>
                    <h3 className="text-xl text-white">Slower Tower (300$)</h3>
                </div>
                <p className="text-gray-300">Slows down enemies in range. Perfect for strategic control.</p>
                <p className="text-yellow-400 mt-2">Special: Cryogen (20000$) - Maximum slow effect and triple targeting.</p>
            </div>
    
            {/* Gas Spitter */}
            <div className="bg-slate-700 p-4 rounded-lg">
                <div className="flex items-center gap-4 mb-2">
                    <img src="/gasSpitter.png" alt="Gas Spitter" className="w-12 h-12"/>
                    <h3 className="text-xl text-white">Gas Spitter (300$)</h3>
                </div>
                <p className="text-gray-300">Poisons enemies with damage over time. Effective vs high HP units.</p>
                <p className="text-yellow-400 mt-2">Special: Acid Spitter (20000$) - Deadly poison and stops enemy regeneration.</p>
            </div>
    
            {/* Mortar */}
            <div className="bg-slate-700 p-4 rounded-lg">
                <div className="flex items-center gap-4 mb-2">
                    <img src="/mortar.png" alt="Mortar Tower" className="w-12 h-12"/>
                    <h3 className="text-xl text-white">Mortar Tower (1200$)</h3>
                </div>
                <p className="text-gray-300">Area damage tower that hits multiple enemies in blast radius.</p>
                <p className="text-yellow-400 mt-2">Special: Armageddon (20000$) - Massive explosion radius and damage.</p>
            </div>
        </div>
    );

    const renderMechanicsContent = () => (
        <div className="space-y-6">
            {/* Money Management */}
            <div className="bg-slate-700 p-4 rounded-lg">
                <h3 className="text-xl text-white mb-2">Money Management</h3>
                <p className="text-gray-300">• Start with 200$ initial money</p>
                <p className="text-gray-300">• Earn money by hitting enemies</p>
                <p className="text-gray-300">• Towers can be sold for 75% of total investment</p>
            </div>

            {/* Tower Placement */}
            <div className="bg-slate-700 p-4 rounded-lg">
                <h3 className="text-xl text-white mb-2">Tower Placement</h3>
                <p className="text-gray-300">• Place towers on building sites marked on the map that appear after
                    you select your tower in the tower select panel.</p>
                <p className="text-gray-300">• Click a tower to open upgrade menu</p>
                <p className="text-gray-300">• Blue circle shows tower&apos;s range</p>
            </div>

            {/* Enemy Types */}
            <div className="bg-slate-700 p-4 rounded-lg">
                <h3 className="text-xl text-white mb-2">Enemy Types</h3>
                <p className="text-gray-300">• Normal - Basic enemies</p>
                <p className="text-gray-300">• Fast - Moves quickly but has less HP</p>
                <p className="text-gray-300">• Tank - High HP but moves slowly</p>
                <p className="text-gray-300">• Stealth - Invisible to basic towers</p>
                <p className="text-gray-300">• Regenerating - Recovers HP over time</p>
                <p className="text-yellow-300">• Boss - Very high HP and it regenerates (appear in round 32 and 40)</p>
            </div>

            {/* Game Controls */}
            <div className="bg-slate-700 p-4 rounded-lg">
                <h3 className="text-xl text-white mb-2">Game Controls</h3>
                <p className="text-gray-300">• Press Start to begin the game</p>
                <p className="text-gray-300">• Speed up button doubles game speed</p>
                <p className="text-gray-300">• Pause button freezes the game (can only be pressed when transitioning into the next round)</p>
                <p className="text-gray-300">• 40 rounds to complete</p>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 p-6 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto border border-blue-400">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Game Guide</h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-white"
                    >
                        ✕
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-4 mb-6">
                    <button
                        onClick={() => setActiveTab('towers')}
                        className={`px-4 py-2 rounded-lg transition-all ${
                            activeTab === 'towers'
                                ? 'bg-blue-500 text-white'
                                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                        }`}
                    >
                        Towers
                    </button>
                    <button
                        onClick={() => setActiveTab('mechanics')}
                        className={`px-4 py-2 rounded-lg transition-all ${
                            activeTab === 'mechanics'
                                ? 'bg-blue-500 text-white'
                                : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                        }`}
                    >
                        Game Mechanics
                    </button>
                </div>

                {/* Content */}
                {activeTab === 'towers' ? renderTowerContent() : renderMechanicsContent()}
            </div>
        </div>
    );
};

export default TutorialWindow;