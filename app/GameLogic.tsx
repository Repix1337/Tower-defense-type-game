import React, { useState, useEffect, useCallback} from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useSettings } from './context/SettingsContext';



// Define the props for the Spawn component
interface SpawnProps {
  round: number;
  setHealthPoints: React.Dispatch<React.SetStateAction<number>>;
  money: number;
  setMoney: React.Dispatch<React.SetStateAction<number>>;
  setRound: React.Dispatch<React.SetStateAction<number>>;
  hp: number;
  isSpeedUp: number;  
  setIsSpeedUp: React.Dispatch<React.SetStateAction<number>>;
  setIsPaused: React.Dispatch<React.SetStateAction<boolean>>;
  isPaused: boolean;
  canPause: boolean;
  setCanPause: React.Dispatch<React.SetStateAction<boolean>>;
  selectedTowerType: string;
}
interface TowerUpgrade {
  name: string;
  cost: number;
  description: string;
  path: number;
  effect: (tower: Tower) => Partial<Tower>;
  requires: number; // Previous upgrade level required
}

// Define the Enemy interface
interface Enemy {
  id: string;
  positionX: number;
  positionY: number;
  hp: number;
  maxHp: number;
  speed: number;
  baseSpeed: number;
  isSlowed: boolean;
  slowValue?: number;
  slowSourceId?: string;
  slowStartTime?: number;
  damage: number;
  src: string;
  type: string;
  regen: number;
  isTargeted: boolean;  
  isPoisoned: boolean;
  poisonSourceId?: string;
  poisonStartTime?: number;
  canRegen: boolean;
  isArmored: boolean;
  isStunned: boolean;
  stunSourceId?: string;
  stunStartTime?: number;
  canSpawn?: boolean;
}

// Define the Tower interface
interface Tower {
  id: string;
  positionX: number;
  positionY: number;
  damageDone: number;
  baseAttackInterval: number;
  baseAttack: number;
  attack: number;
  attackInterval: number; // renamed from attackSpeed
  furthestEnemyInRange: Enemy[] | null;
  isAttacking: boolean;
  price: number;
  towerWorth: number;
  type: string;
  targettingType: string;
  maxDamage: number;
  maxAttackInterval: number; // renamed from maxAttackSpeed
  radius: number;
  attackType: string;
  canHitStealth: boolean;
  slowAmount?: number; // Make slowAmount optional
  maxSlow?:number; // Make maxSlow optional
  slowDuration?: number; // Make slowAmount optional
  poisonDamage: number;
  maxPoisonDamage: number;
  hasSpecialUpgrade: boolean;
  specialUpgradeAvailable: boolean;
  canStopRegen: boolean;
  src: string; // Add src property
  effectSrc: string; // Add effectSrc property
  explosionRadius: number;
  upgradeLevel: number;
  hasCritical?: boolean;
  criticalChance?: number;
  criticalMultiplier?: number;
  canHitArmored?: boolean;
  canStun?: boolean;
  stunDuration?: number;
  chainCount?: number;
  chainRange?: number;
  hasLingering?: boolean;
  lingeringDamage?: number;
  lingeringRadius?: number;
  lingeringDuration?: number;
  lingeringColor?: string;
  path1Level: number;
  path2Level: number;
  path: number;
}
interface LingeringEffect {
  id: string;
  positionX: number;
  positionY: number;
  damage: number;
  radius: number;
  timestamp: number;
  color: string;
  duration: number;
}

const Spawn: React.FC<SpawnProps> = ({ round, setHealthPoints, money, setMoney, setRound, hp,setIsSpeedUp, isSpeedUp,setIsPaused,canPause, isPaused, setCanPause, selectedTowerType }) => {
  // Game state
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [tower, setTower] = useState<Tower[]>([]);
  const [attackEffects, setAttackEffects] = useState<{ 
    id: string; 
    towerPositionX: number; 
    towerPositionY: number; 
    enemyPositionX: number; 
    enemyPositionY: number;
    effectSrc: string; 
    timestamp?: number 
  }[]>([]);
  const [enemyCount, setEnemyCount] = useState(0);
  const [showUpgradeMenu, setShowUpgradeMenu] = useState(false);
  const [selectedTowerID, setSelectedTowerID] = useState('');
  const [explosionEffects, setExplosionEffects] = useState<{
      id: string;
      positionX: number;
      positionY: number;
      timestamp: number;
      
    }[]>([]);
  
  
  // Add this new state near other state declarations
  const [isPageVisible, setIsPageVisible] = useState(true);
  const [damageNumbers, setDamageNumbers] = useState<Array<{
    id: string;
    damage: number;
    x: number;
    y: number;
    timestamp: number;
  }>>([]);
  const [lingeringEffects, setLingeringEffects] = useState<LingeringEffect[]>([]);
  const { showDamageNumbers, showRangeIndicators, showHealthBars, confirmTowerSell, autoStartRounds } = useSettings();
  // Add this new useEffect for visibility tracking
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPageVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  // Add this state to track which enemies have granted money
  const [processedEnemies] = useState(() => new Set<string>());

  // First, extract enemy types as constants
  const ENEMY_TYPES = {
    BASIC: {
      src: 'basicEnemy.png',
      hp: 100,
      damage: 5,
      type: 'basic',
      speed: 0.225,    // from 0.150 * 1.5
      baseSpeed: 0.225, // from 0.150 * 1.5
      regen: 0,
      canRegen: false,
      isArmored: false,
    },
    STEALTH: {
      src: 'stealth.png',
      hp: 50,
      damage: 10,
      type: 'stealth',
      speed: 0.225,    // from 0.150 * 1.5
      baseSpeed: 0.225, // from 0.150 * 1.5
      regen: 0,
      canRegen: false,
      isArmored: false,
    },
    TANK: {
      src: 'tank.png',
      hp: 350,
      damage: 5,
      type: 'basic',
      speed: 0.1875,    // from 0.125 * 1.5
      baseSpeed: 0.1875, // from 0.125 * 1.5
      regen: 0,
      canRegen: false,
      isArmored: false,
    },
    SPEEDY: {
      src: 'speedy.png',
      hp: 40,
      damage: 35,
      type: 'speedy',
      speed: 1.5,    // from 1.0 * 1.5
      baseSpeed: 1.5, // from 1.0 * 1.5
      regen: 0,
      canRegen: false,
      isArmored: false,
    },
    STEALTHYTANK: {
      src: 'stealthyTank.png',
      hp: 250,
      damage: 20,
      type: 'stealthytank',
      speed: 0.1875,    // from 0.125 * 1.5
      baseSpeed: 0.1875, // from 0.125 * 1.5
      regen: 0,
      canRegen: false,
      isArmored: false,
    },
    STEALTHYSPEEDY: {
      src: 'stealthySpeedy.png',
      hp: 50,
      damage: 50,
      type: 'stealthyspeedy',
      speed: 1.5,    // from 1.0 * 1.5
      baseSpeed: 1.5, // from 1.0 * 1.5
      regen: 0,
      canRegen: false,
      isArmored: false,
    },
    REGENTANK: {
      src: 'regenTank.png',
      hp: 400,
      damage: 50,
      type: 'regentank',
      speed: 0.1875,    // from 0.125 * 1.5
      baseSpeed: 0.1875, // from 0.125 * 1.5
      regen: 100,
      canRegen: true,
      isArmored: false,
    },
    SPEEDYREGENTANK: {
      src: 'regenTank.png',
      hp: 600,
      damage: 50,
      type: 'speedyregentank',
      speed: 0.35,    // from 0.2 * 1.5
      baseSpeed: 0.35, // from 0.2 * 1.5
      regen: 150,
      canRegen: true,
      isArmored: false,
    }
    ,
    BOSS: {
      src: 'boss.png',
      hp: 50000,
      damage: 1000,
      type: 'boss',
      speed: 0.15,    
      baseSpeed: 0.15, 
      regen: 1200,
      canRegen: true,
      isArmored: false,
    },
    ULTRATANKS: {
      src: 'ultraTank.png',
      hp: 1750,
      damage: 1000,
      type: 'ultratank',
      speed: 0.15,    
      baseSpeed: 0.15, 
      regen: 0,
      canRegen: false,
      isArmored: false,
    },
    ARMOREDBASIC: {
      src: 'armoredbasicEnemy.png',
      hp: 125,
      damage: 30,
      type: 'armoredbasic',
      speed: 0.2,    
      baseSpeed: 0.2, 
      regen: 0,
      canRegen: false,
      isArmored: true,
    },
    ARMOREDTANK: {
      src: 'armoredtank.png',
      hp: 400,
      damage: 400,
      type: 'armoredtank',
      speed: 0.175,    
      baseSpeed: 0.175, 
      regen: 0,
      canRegen: false,
      isArmored: true,
    },
    ARMOREDULTRATANK: {
      src: 'armoredultraTank.png',
      hp: 2000,
      damage: 1000,
      type: 'armoredultratank',
      speed: 0.2,    
      baseSpeed: 0.2, 
      regen: 0,
      canRegen: false,
      isArmored: true,
    },
    ARMOREDSPEEDYMEGATANK: {
      src: 'armoredspeedyMegaTank.png',
      hp: 3500,
      damage: 1000,
      type: 'armoredultratank',
      speed: 0.5,    
      baseSpeed: 0.5, 
      regen: 0,
      canRegen: false,
      isArmored: true,
    },
    SPEEDYMEGATANK: {
      src: 'speedyMegaTank.png',
      hp: 3000,
      damage: 1000,
      type: 'armoredultratank',
      speed: 0.5,    
      baseSpeed: 0.5, 
      regen: 0,
      canRegen: false,
      isArmored: true,
    },
    MEGABOSS: {
      src: 'megaBoss.png',
      hp: 125000,
      damage: 1000,
      type: 'boss',
      speed: 0.2,    
      baseSpeed: 0.2, 
      regen: 5000,
      canRegen: true,
      isArmored: false,
    },
    SPAWNER: {
      src: 'boss.png',
      hp: 2000,
      damage: 100,
      type: 'spawner',
      speed: 0.2,    
      baseSpeed: 0.2, 
      regen: 0,
      canRegen: false,
      isArmored: false,
      canSpawn: true,
    }
  };

// Add this near ENEMY_TYPES constant
const TOWER_TYPES = {
  BASIC: {
    src: '/basic.png',
    baseAttack: 50,
    attack: 50,
    baseAttackInterval: 1000,
    attackInterval: 1000, // renamed from attackSpeed
    price: 100,
    towerWorth: 100,
    type: 'basic',
    maxDamage: 300,
    maxAttackInterval: 450, // renamed from maxAttackSpeed
    radius: 27,
    attackType: 'single',
    canHitStealth: false,
    poisonDamage: 0,
    maxPoisonDamage: 0,
    hasSpecialUpgrade: false,
    specialUpgradeAvailable: false,
    canStopRegen: false,
    explosionRadius: 0,
    effectSrc: '/basicAttack.png'
  },
  SNIPER: {
    src: '/sniper.png',
    baseAttack: 120,
    attack: 120,
    baseAttackInterval: 2000,
    attackInterval: 2000,
    price: 200,
    towerWorth: 200,
    type: 'sniper',
    maxDamage: 1500,
    maxAttackInterval: 1000,
    radius: 120,
    attackType: 'single',
    canHitStealth: true,
    poisonDamage: 0,
    maxPoisonDamage: 0,
    hasSpecialUpgrade: false,
    specialUpgradeAvailable: false,
    canStopRegen: false,
    explosionRadius: 0,
    effectSrc: '/sniperAttack.png'
  },
  RAPIDSHOOTER: {
    src: '/rapidShooter.png',
    baseAttack: 20,
    attack: 20,
    baseAttackInterval: 350,
    attackInterval: 350,
    price: 500,
    towerWorth: 500,
    type: 'rapidShooter',
    maxDamage: 68,
    maxAttackInterval: 200,
    radius: 27,
    attackType: 'double',
    canHitStealth: false,
    poisonDamage: 0,
    maxPoisonDamage: 0,
    hasSpecialUpgrade: false,
    specialUpgradeAvailable: false,
    canStopRegen: false,
    explosionRadius: 0,
    effectSrc: '/rapidAttack.png'
  },
  SLOWER: {
    src: '/slower.png',
    baseAttack: 10,
    attack: 10,
    baseAttackInterval: 1000,
    attackInterval: 1000,
    price: 300,
    towerWorth: 300,
    type: 'slower',
    maxDamage: 15,
    maxAttackInterval: 700,
    radius: 27,
    attackType: 'double',
    canHitStealth: false,
    slowAmount: 0.75,
    maxSlow: 0.5,
    slowDuration: 2000,
    poisonDamage: 0,
    maxPoisonDamage: 0,
    hasSpecialUpgrade: false,
    specialUpgradeAvailable: false,
    canStopRegen: false,
    explosionRadius: 0,
    effectSrc: '/slowerAttack.png'
  },
  GASSPITTER: {
    src: '/gasSpitter.png',
    baseAttack: 20,
    attack: 20,
    baseAttackInterval: 1000,
    attackInterval: 1000,
    price: 300,
    towerWorth: 300,
    type: 'gasspitter',
    maxDamage: 20,
    maxAttackInterval: 600,
    radius: 27,
    attackType: 'double',
    canHitStealth: false,
    poisonDamage: 20,
    maxPoisonDamage: 360,
    hasSpecialUpgrade: false,
    specialUpgradeAvailable: false,
    canStopRegen: false,
    explosionRadius: 0,
    effectSrc: '/poisonAttack.png'
  },
  MORTAR: {
    src: '/mortar.png',
    baseAttack: 1755,
    attack: 175,
    baseAttackInterval: 8500,
    attackInterval: 8500,
    price: 1200,
    towerWorth: 1200,
    type: 'mortar',
    maxDamage: 650,
    maxAttackInterval: 4500,
    radius: 60,
    attackType: 'explosion',
    canHitStealth: false,
    poisonDamage: 0,
    maxPoisonDamage: 0,
    hasSpecialUpgrade: false,
    specialUpgradeAvailable: false,
    canStopRegen: false,
    explosionRadius: 20,
    canHitArmored: true,
    effectSrc: '/sniperAttack.png'
  }
  ,
  CANNON: {
    src: '/cannon.png',
    baseAttack: 75,
    attack: 75,
    baseAttackInterval: 2750,
    attackInterval: 2750,
    price: 500,
    towerWorth: 500,
    type: 'cannon',
    maxDamage: 380,
    maxAttackInterval: 1000,
    radius: 27,
    attackType: 'explosion',
    canHitStealth: false,
    poisonDamage: 0,
    maxPoisonDamage: 0,
    hasSpecialUpgrade: false,
    specialUpgradeAvailable: false,
    canStopRegen: false,
    explosionRadius: 15,
    effectSrc: '/sniperAttack.png',
    canHitArmored: true,
  }
};


// Add this helper function
const resetGame = () => {
  // Only target towers on the game board, not in the selection panel
  const buildingSites = document.querySelectorAll('img[id^="building-site-"], [id^="tower-"]');
  
  buildingSites.forEach(element => {
    if (element instanceof HTMLImageElement) {
      element.src = '/buildingSite.png';
    }
  });

  // Reset game state
  setRound(0);
  setEnemyCount(0);
  setHealthPoints(100);
  setMoney(200);
  setEnemies([]);
  setTower([]);
  setShowUpgradeMenu(false);
};

// Then create a helper function for creating new towers
const createNewTower = (type: keyof typeof TOWER_TYPES, positionX: number, positionY: number, id: string): Tower => ({
  id: id,
  positionX: positionX,
  positionY: positionY,
  furthestEnemyInRange: null,
  isAttacking: false,
  targettingType: "first",
  damageDone: 0,
  upgradeLevel: 0,
  path1Level: 0,
  path2Level: 0,
  path: 0,
  ...TOWER_TYPES[type]
});

// Then, create helper function for spawning enemies
const createNewEnemy = (type: keyof typeof ENEMY_TYPES, positionX?: number, positionY?: number) => {
  const enemyStats = ENEMY_TYPES[type];
  return {
    id: uuidv4(),
    positionX: positionX ?? -6, // Use provided X or default to -6
    positionY: positionY ?? 56, // Use provided Y or default to 56
    isTargeted: false,
    isSlowed: false,
    isPoisoned: false,
    isStunned: false,
    maxHp: enemyStats.hp,
    ...enemyStats
  };
};
useEffect(() => {
  if (hp <= 0) {
    alert('Game Over! You lost!');
    resetGame();
  }
}, [hp]);


const getEnemyLimit = (round: number) => {
  switch (true) {
    case round <= 26:
      return 10 * round;
    case round > 30:
      return Math.ceil((15 * round) / 2); // Half enemies after round 30
    default:
      return 15 * round;
  }
};
useEffect(() => {
  if (!isPageVisible || isPaused) return;

  const spawnEnemies = () => {
    // Check for game over first
    if (round > 50 && enemies.length === 0) {
      alert('Congratulations! You won!');
      resetGame();
      return;
    }


    

    switch (true) {
      case round === 0:
        setEnemies([]);
        break;

      case round <= 4 || (round > 5 && round < 10):
        if (enemyCount < getEnemyLimit(round)) {
          setEnemies(prev => [...prev, createNewEnemy('BASIC')]);
          setEnemyCount(prev => prev + 1);
        }
        break;

      case round === 5:
        if (enemyCount < getEnemyLimit(round)) {
          const type5 = enemyCount % 2 === 0 ? 'STEALTH' : 'SPEEDY';
          setEnemies(prev => [...prev, createNewEnemy(type5)]);
          setEnemyCount(prev => prev + 1);
        }
        break;

      case round >= 10 && round <= 12:
        if (enemyCount < getEnemyLimit(round)) {
        const type10 = enemyCount % 3 === 0 ? 'STEALTH' : 
                      enemyCount % 3 === 1 ? 'SPEEDY' : 'BASIC';
        setEnemies(prev => [...prev, createNewEnemy(type10)]);
        setEnemyCount(prev => prev + 1);
        }
        break;
      case round >= 13 && round <= 15:
        if (enemyCount < getEnemyLimit(round)) {
        const type10 = enemyCount % 3 === 0 ? 'STEALTH' : 
                      enemyCount % 3 === 1 ? 'SPEEDY' : 'ARMOREDBASIC';
        setEnemies(prev => [...prev, createNewEnemy(type10)]);
        setEnemyCount(prev => prev + 1);
        }
        break;

      case round > 15 && round <= 21:
        if (enemyCount < getEnemyLimit(round)) {
        const type15 = enemyCount % 3 === 0 ? 'STEALTH' : 
                      enemyCount % 3 === 1 ? 'SPEEDY' : 'TANK';
        setEnemies(prev => [...prev, createNewEnemy(type15)]);
        setEnemyCount(prev => prev + 1);
        }
        break;

      case round === 22:
        if (enemyCount < getEnemyLimit(round)) {
        setEnemies(prev => [...prev, createNewEnemy('REGENTANK')]);
        setEnemyCount(prev => prev + 1);
        }
        break;

      case round >= 23 && round <= 25:
        if (enemyCount < getEnemyLimit(round)) {
        const type23 = enemyCount % 3 === 0 ? 'STEALTHYTANK' : 
                      enemyCount % 3 === 1 ? 'STEALTHYSPEEDY' : 'ARMOREDTANK';
        setEnemies(prev => [...prev, createNewEnemy(type23)]);
        setEnemyCount(prev => prev + 1);
        }
        break;

      case round >= 26 && round <= 31:
        if (enemyCount < getEnemyLimit(round)) {
        const type26 = enemyCount % 2 === 0 ? 'STEALTHYTANK' : 'SPEEDYREGENTANK';
        setEnemies(prev => [...prev, createNewEnemy(type26)]);
        setEnemyCount(prev => prev + 1);
        }
        break;

      case round === 32:
        if (enemyCount < 320) {
          setEnemies(prev => [...prev, createNewEnemy('BOSS')]); // Boss HP unchanged
          setEnemyCount(prev => prev + 80);
        }
        break;

      case round > 32 && round <= 39:
        if (enemyCount < getEnemyLimit(round)) {
          const type32 = enemyCount % 50 === 0 ? 'BOSS' :
                        enemyCount % 2 === 0 ? 'ARMOREDULTRATANK' : 'ULTRATANKS';
          setEnemies(prev => [...prev, createNewEnemy(type32)]);
          setEnemyCount(prev => prev + 2);
        }
        break;

      case round === 40:
        if (enemyCount < getEnemyLimit(round)) {
          setEnemies(prev => [...prev, createNewEnemy('BOSS')]); // Boss HP unchanged
          setEnemyCount(prev => prev + 35);
        }
        break;

      case round >= 41 && round <= 44:
        if (enemyCount < getEnemyLimit(round)) {
          const type41 = enemyCount % 50 === 0 ? 'BOSS' :
                        enemyCount % 2 === 0 ? 'ARMOREDSPEEDYMEGATANK' : 'SPEEDYMEGATANK';
          setEnemies(prev => [...prev, 
            type41 === 'BOSS' ? createNewEnemy(type41) : createNewEnemy(type41)
          ]);
          setEnemyCount(prev => prev + 1);
        }
        break;

      case round === 45:
        if (enemyCount < getEnemyLimit(round)) {
          setEnemies(prev => [...prev, createNewEnemy('MEGABOSS')]); 
          setEnemyCount(prev => prev + 50);
        }
        break;
        case round >= 46 && round <= 49:
          if (enemyCount < getEnemyLimit(round)) {
            const type46 = enemyCount % 100 === 0 ? 'MEGABOSS' :
                          enemyCount % 2 === 0 ? 'SPAWNER' : 'SPEEDYMEGATANK';
            setEnemies(prev => [...prev, 
              type46 === 'MEGABOSS' ? createNewEnemy(type46) : createNewEnemy(type46)
            ]);
            setEnemyCount(prev => prev + 1);
          }
        break;
        case round === 50:
          if (enemyCount < getEnemyLimit(round)) {
            setEnemies(prev => [...prev, createNewEnemy('MEGABOSS')]); 
            setEnemyCount(prev => prev + 35);
          }
    }
  };

  const spawnInterval = setInterval(
    spawnEnemies,
    (round === 32 ? (isSpeedUp ? 2500 : 1250) : Math.max(1000 / round, 50)) / 
    (isSpeedUp === 2 ? 3 : isSpeedUp ? 2 : 1)
  );

  return () => clearInterval(spawnInterval);
}, [round, enemyCount, enemies.length, isPageVisible, isSpeedUp, isPaused]);


useEffect(() => {
  if (isPaused) return;
  if (enemies.length === 0 && enemyCount >= getEnemyLimit(round) && round !== 0) {
    setCanPause(true); // Allow pausing when round is over
    
    // Only auto-advance if autorounds is enabled
    if (autoStartRounds) {
      const roundTimeout = setTimeout(() => {
        setRound(prev => prev + 1);
        setEnemies([]);
        setEnemyCount(0);
        setCanPause(false); // Disable pausing when new round starts
      }, 4000 / (isSpeedUp === 2 ? 3 : isSpeedUp ? 2 : 1));
      return () => clearTimeout(roundTimeout);
    } else {
      // If autorounds is disabled, pause the game
      setIsPaused(true);
    }
  }
}, [enemies.length, enemyCount, round, isSpeedUp, isPaused, autoStartRounds]);

// Modify the round change effect to handle round starts
useEffect(() => {
  if (round > 0) {
    if (!autoStartRounds) {
      // When autorounds is off, allow manual resume
      setCanPause(true);
    } else {
      // When autorounds is on, disable pause at round start
      setCanPause(false);
    }
  }
}, [round, autoStartRounds]);

// Add a new effect to handle manual round advancement
useEffect(() => {
  if (!isPaused && round > 0 && !autoStartRounds) {
    if (enemies.length === 0 && enemyCount >= getEnemyLimit(round)) {
      setRound(prev => prev + 1);
      setEnemies([]);
      setEnemyCount(0);
    }
  }
}, [isPaused]);
useEffect(() => {
  const handleKeyPress = (event: KeyboardEvent) => {
    if (!isPageVisible) return;

    switch (event.code) {
      case 'Space':
        event.preventDefault(); // Prevent page scroll
        if (canPause) {
          setIsPaused(prev => !prev);
          if (isSpeedUp) {
            setIsSpeedUp(0);
          }
        }
        break;
        case 'Digit1':
          if (!isPaused) {
            setIsSpeedUp(3);
          }
          break;
      case 'Digit2':
        if (!isPaused) {
          setIsSpeedUp(1);
        }
        break;
      case 'Digit3':
        if (!isPaused) {
          setIsSpeedUp(2);
        }
        break;
      case 'Delete':
      case 'Backspace':
        if (selectedTowerID && confirmTowerSell) {
          const selectedTower = tower.find(t => t.id === selectedTowerID);
          if (selectedTower) {
            if (window.confirm('Are you sure you want to sell this tower?')) {
              sellTower(selectedTower.towerWorth);
            }
          }
        } else if (selectedTowerID) {
          const selectedTower = tower.find(t => t.id === selectedTowerID);
          if (selectedTower) {
            sellTower(selectedTower.towerWorth);
          }
        }
        break;
    }
  };

  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, [isPageVisible, canPause, isPaused, isSpeedUp, selectedTowerID, tower]);
const moveEnemy = useCallback(() => {
  if (!isPageVisible || isPaused) return;
  
  setEnemies(prevEnemies =>
    prevEnemies
      .map((enemy) => {
        if (enemy.positionX < 28) {
          return { ...enemy, positionX: enemy.positionX + enemy.speed, positionY: enemy.positionY - enemy.speed / 10};
        } else if (enemy.positionX >= 28 && enemy.positionX < 52 && enemy.positionY > 20) {
          return { ...enemy, positionY: enemy.positionY - (enemy.speed * 2), positionX: enemy.positionX + enemy.speed / 3 };
        } else if (enemy.positionY <= 20 && enemy.positionX < 53) {
          return { ...enemy, positionX: enemy.positionX + enemy.speed };
        } else if (enemy.positionX >= 53 && enemy.positionX < 75 && enemy.positionY < 87) {
          return { ...enemy, positionY: enemy.positionY + enemy.speed * 2 };
        } else if (enemy.positionY >= 87 && enemy.positionX < 76.5) {
          return { ...enemy, positionX: enemy.positionX + enemy.speed };
        } else if (enemy.positionX >= 76.5 && enemy.positionY > 51) {
          return { ...enemy, positionY: enemy.positionY - (enemy.speed * 2), positionX: enemy.positionX + enemy.speed / 10};
        } else {
          return { ...enemy, positionX: enemy.positionX + enemy.speed };
        }
      })
      .filter((enemy) => enemy.hp > 0)
  );
}, [isPageVisible, isPaused]);
  // Enemy movement - updates position every 25ms
  useEffect(() => {
    if (!isPageVisible || round <= 0 || isPaused) return; 
  
    const interval = setInterval(moveEnemy, 22.5 / (isSpeedUp === 2 ? 3 : isSpeedUp ? 2 : 1));
    return () => clearInterval(interval);
  }, [isPageVisible, round, isPaused, isSpeedUp, moveEnemy]);

  // Heal enemy every second if it has health regeneration
  useEffect(() => {
    if (!isPageVisible || round <= 0 || isPaused) return; 

    const interval = setInterval(() => {
      setEnemies((prevEnemies) => 
        prevEnemies.map((enemy) => 
          enemy.regen > 0 && enemy.canRegen ? {...enemy, hp: enemy.hp + enemy.regen} : enemy
        )
      )
    }, 1500 / (isSpeedUp === 2 ? 3 : isSpeedUp ? 2 : 1)); // Adjusted for 3x speed
    return () => clearInterval(interval);
  }, [enemies, isPageVisible, isSpeedUp, isPaused]); // Add isPaused to dependencies

  // Main tower attack logic
  const towerAttack = useCallback((tower: Tower, targets: Enemy[]) => {
    if (tower.isAttacking) return;
  
    setTower((prevTowers) =>
      prevTowers.map((t) =>
        t.id === tower.id ? { ...t, isAttacking: true } : t
      )
    );
  
    let totalDamageDealt = 0;
  
    

   
    

    // Handle attack effects
    const newEffects = targets.map(target => ({
      id: uuidv4(),
      towerPositionX: tower.positionX,
      towerPositionY: tower.positionY,
      enemyPositionX: target.positionX,
      enemyPositionY: target.positionY,
      timestamp: Date.now(),
      effectSrc: tower.effectSrc
    }));
  
    // Batch state updates together
    const updateStates = () => {
      // Mark tower as attacking
      setTower(prevTowers =>
        prevTowers.map(t =>
          t.id === tower.id ? { ...t, isAttacking: true } : t
        )
      );
  
      // Add new effects
      setAttackEffects(prevEffects => [...prevEffects, ...newEffects]);
  
      // Handle enemy updates and damage
      setEnemies(prevEnemies => {
          let updatedEnemies;
          // Calculate critical hit if tower has that ability
          const isCriticalHit = tower.hasCritical && 
                               tower.criticalChance && 
                               Math.random() < tower.criticalChance;
          const damageMultiplier = isCriticalHit ? (tower.criticalMultiplier || 1) : 1;
      
          if (tower.attackType === 'explosion') {
            const primaryTarget = targets[0];
            
            // Find enemies in radius
            const enemiesInExplosionRadius = prevEnemies.filter(enemy => {
              if (enemy.hp <= 0 || enemy.id === primaryTarget.id) return false;
              const dx = enemy.positionX - primaryTarget.positionX;
              const dy = enemy.positionY - primaryTarget.positionY;
              const distance = Math.sqrt(dx * dx + dy * dy);
              return distance <= tower.explosionRadius;
            });
          
            // Add explosion effect
            setExplosionEffects(prev => [...prev, {
              id: uuidv4(),
              positionX: primaryTarget.positionX,
              positionY: primaryTarget.positionY,
              timestamp: Date.now()
            }]);
            setTimeout(() => {
              setExplosionEffects(prev =>
                prev.filter(effect => effect.positionX !== primaryTarget.positionX)
              );
            }, 250);
            // If tower has lingering effect, create lingering zone
            if (tower.hasLingering) {
              setLingeringEffects(prev => [...prev, {
                id: uuidv4(),
                positionX: primaryTarget.positionX,
                positionY: primaryTarget.positionY,
                damage: tower.lingeringDamage || tower.attack * 0.1,
                radius: tower.lingeringRadius || 15,
                timestamp: Date.now(),
                duration: tower.lingeringDuration || 2000,
                color: tower.lingeringColor || 'rgba(255, 69, 0, 0.5)'
              }]);
            }
          
            let explosionDamageTotal = 0;
            updatedEnemies = prevEnemies.map(enemy => {
              if (enemy.hp <= 0) return enemy;
          
              const isInExplosion = enemy.id === primaryTarget.id || 
                                   enemiesInExplosionRadius.some(e => e.id === enemy.id);
          
              if (isInExplosion) {
                const baseDamage = enemy.id === primaryTarget.id ? tower.attack : tower.attack / 4;
                const damage = baseDamage * damageMultiplier;
                const actualDamage = Math.min(damage, enemy.hp);
                explosionDamageTotal += actualDamage;
                if (showDamageNumbers) {  // Add this check
                  setDamageNumbers(prev => [...prev, {
                    id: uuidv4(),
                    damage: actualDamage,
                    x: enemy.positionX,
                    y: enemy.positionY,
                    timestamp: Date.now()
                  }]);
                }
          
                const newHp = enemy.isArmored && !tower.canHitArmored ? 
                  enemy.hp : 
                  Math.max(enemy.hp - actualDamage, 0);
          
                  let updatedEnemy = {
                    ...enemy,
                    hp: enemy.hp - actualDamage
                  };
            
                  // Remove armor if tower can hit armored enemies
                  if (tower.canHitArmored && enemy.isArmored) {
                    updatedEnemy = {
                      ...updatedEnemy,
                      isArmored: false,
                      src: enemy.src.replace('armored', '')
                    };
                  }
                                    console.log(updatedEnemy);
                if (newHp <= 0 && enemy.hp > 0) {
                  if(enemy.canSpawn){
                    const spawnBatch = async () => {
                      for (let i = 0; i < 5; i++){
                        // Add a small delay between spawns
                        await new Promise(resolve => setTimeout(resolve, 50));
                        setEnemies(prev => [...prev, createNewEnemy('SPEEDYMEGATANK', enemy.positionX, enemy.positionY)]);
                      }
                    };
                    spawnBatch();
                  }
                  grantMoneyForKill(enemy);
                }
                // Apply additional effects like stun/slow
                if (tower.canStun) {
                  updatedEnemy = {
                    ...updatedEnemy,
                    isStunned: true,
                    stunSourceId: tower.id,
                    stunStartTime: Date.now(),
                    speed: 0
                  };
                }
          
                if (tower.slowAmount) {
                  const newSlowAmount = tower.slowAmount;
                  if (!updatedEnemy.isSlowed || newSlowAmount < (updatedEnemy.slowValue || 1)) {
                    updatedEnemy = {
                      ...updatedEnemy,
                      isSlowed: true,
                      slowSourceId: tower.id,
                      slowStartTime: Date.now(),
                      slowValue: newSlowAmount,
                      speed: !updatedEnemy.isStunned ? 
                          Math.max(enemy.baseSpeed * newSlowAmount, enemy.baseSpeed * 0.4) : 
                          0
                    };
                  }
                }
          
                
          
                return updatedEnemy;
              }
              return enemy;
            });
          
            totalDamageDealt = explosionDamageTotal;
          } else if (tower.attackType === 'chain') {
            // Get initial target
            const chainEffects: {
              id: string;
              towerPositionX: number;
              towerPositionY: number;
              enemyPositionX: number;
              enemyPositionY: number;
              effectSrc: string;
              timestamp: number;
            }[] = [];
          
            let currentTarget = targets[0];
            let chainsLeft = tower.chainCount || 1;
            const chainedEnemies = new Set([targets[0].id]);
            let chainDamage = 0;
          
            // Create the first chain effect
            chainEffects.push({
              id: uuidv4(),
              towerPositionX: tower.positionX,
              towerPositionY: tower.positionY,
              enemyPositionX: currentTarget.positionX,
              enemyPositionY: currentTarget.positionY,
              effectSrc: '/chainLightning.png',
              timestamp: Date.now()
            });
          
            while (chainsLeft > 1) {
              const nextTarget = prevEnemies.find(enemy => {
                if (enemy.hp <= 0 || chainedEnemies.has(enemy.id)) return false;
                const dx = enemy.positionX - currentTarget.positionX;
                const dy = enemy.positionY - currentTarget.positionY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                return distance <= (tower.chainRange || 15);
              });
          
              if (!nextTarget) break;
          
              chainedEnemies.add(nextTarget.id);
              
              // Create chain effect between previous and next target
              chainEffects.push({
                id: uuidv4(),
                towerPositionX: currentTarget.positionX,
                towerPositionY: currentTarget.positionY,
                enemyPositionX: nextTarget.positionX,
                enemyPositionY: nextTarget.positionY,
                effectSrc: '/chainLightning.png',
                timestamp: Date.now()
              });
          
              currentTarget = nextTarget;
              chainsLeft--;
            }
          
            // Add all chain effects at once
            setAttackEffects(prev => [...prev, ...chainEffects]);
          
            // Set a single cleanup timeout for all chain effects
            const effectIds = chainEffects.map(effect => effect.id);
            setTimeout(() => {
              if (!isPaused) {
                setAttackEffects(prev => 
                  prev.filter(effect => !effectIds.includes(effect.id))
                );
              }
            }, Math.min(tower.attackInterval, 500) / (isSpeedUp === 2 ? 3 : isSpeedUp ? 2 : 1));
          
            // Handle chain damage
            updatedEnemies = prevEnemies.map(enemy => {
              if (chainedEnemies.has(enemy.id)) {
                const damage = Math.min(tower.attack * damageMultiplier, enemy.hp);
                chainDamage += damage;
                return {
                  ...enemy,
                  hp: enemy.hp - damage,
                  isTargeted: true
                };
              }
              if (showDamageNumbers) {  // Add this check
                setDamageNumbers(prev => [...prev, {
                  id: uuidv4(),
                  damage: chainDamage,
                  x: enemy.positionX,
                  y: enemy.positionY,
                  timestamp: Date.now()
                }]);
              }
              return enemy;
            });
            
            totalDamageDealt = chainDamage;
          }else if (tower.attackType === 'lingering') {
            setLingeringEffects(prev => [...prev, {
              id: uuidv4(),
              positionX: targets[0].positionX,
              positionY: targets[0].positionY,
              damage: tower.lingeringDamage || tower.attack * 0.1,
              radius: tower.lingeringRadius || 10,
              timestamp: Date.now(),
              duration: tower.lingeringDuration || 2000,
              color: tower.lingeringColor || 'rgba(144, 238, 144, 0.5)'
            }]);
          
            // Apply initial impact damage
            updatedEnemies = prevEnemies.map(enemy => {
              const isTargeted = targets.some(target => target.id === enemy.id);
              if (!isTargeted) return enemy;
          
              const actualDamage = Math.min(tower.attack * damageMultiplier, enemy.hp);
              return {
                ...enemy,
                hp: enemy.hp - actualDamage
              };
            });
          }
           else {
            // Non-explosion attack logic
            updatedEnemies = prevEnemies.map((enemy) => {
              const isTargeted = targets.some(target => target.id === enemy.id);
              if (!isTargeted) return enemy;
            
              // Update damage calculation to include critical hits
              const actualDamage = Math.min(tower.attack * damageMultiplier, enemy.hp);
              totalDamageDealt += actualDamage;
              let updatedEnemy = { ...enemy };
          
              // Apply stun effect if tower has it
              if (tower.canStun && Math.random() < (tower.criticalChance || 0)) {
                updatedEnemy = {
                  ...updatedEnemy,
                  isStunned: true,
                  stunSourceId: tower.id,
                  stunStartTime: Date.now(),
                  speed: 0
                };
              }
          
              // Apply slow effect if tower has it
              if (tower.slowAmount) {
                const newSlowAmount = tower.slowAmount;
                const currentSlowAmount = updatedEnemy.slowValue || 1;
              
                // Only apply new slow if it's stronger or there's no current slow
                if (!updatedEnemy.isSlowed || newSlowAmount < currentSlowAmount) {
                    const minimumSpeed = round < 30 ? 0.15 : 0.4;
                    const calculatedSpeed = enemy.baseSpeed * newSlowAmount;
                    
                    updatedEnemy = {
                        ...updatedEnemy,
                        isSlowed: true,
                        slowSourceId: tower.id,
                        slowStartTime: Date.now(),
                        slowValue: newSlowAmount,
                        speed: !updatedEnemy.isStunned ? 
                            Math.max(calculatedSpeed, enemy.baseSpeed * minimumSpeed) : 
                            0
                    };
                }
            }
          
              // Apply other effects (poison, etc.)
              if (tower.type === "gasspitter") {
                updatedEnemy = {
                  ...updatedEnemy,
                  isPoisoned: true,
                  poisonSourceId: tower.id,
                  poisonStartTime: Date.now(),
                  canRegen: tower.canStopRegen ? false : true
                };
              }
              if (showDamageNumbers) {  // Add this check
                setDamageNumbers(prev => [...prev, {
                  id: uuidv4(),
                  damage: actualDamage,
                  x: enemy.positionX,
                  y: enemy.positionY,
                  timestamp: Date.now()
                }]);
              }
              // Apply damage based on armor
              updatedEnemy.hp = enemy.isArmored && !tower.canHitArmored ? 
                enemy.hp : 
                Math.max(enemy.hp - actualDamage, 0);
          
              // Then check for kill and grant money
              if (updatedEnemy.hp <= 0 && enemy.hp > 0) {
                if(enemy.canSpawn){
                  const spawnBatch = async () => {
                    for (let i = 0; i < 5; i++){
                      // Add a small delay between spawns
                      await new Promise(resolve => setTimeout(resolve, 50));
                      setEnemies(prev => [...prev, createNewEnemy('SPEEDYMEGATANK', enemy.positionX, enemy.positionY)]);
                    }
                  };
                  spawnBatch();
                }
                grantMoneyForKill(enemy);
              }
          
              updatedEnemy.isTargeted = true;
              return updatedEnemy;
            });
          }
          
          return updatedEnemies;
        });
    }
    
  
    // Execute updates
    updateStates();
    
    // Clean up effects after animation
    const cleanupTimeout = setTimeout(() => {
      if (!isPaused) {
        // Create a cleanup batch to avoid multiple state updates
        const batchedUpdates = () => {
          const effectsToRemove = newEffects.map(e => e.id);
          const targetIds = targets.map(t => t.id);
          
          // Single state update for attack effects
          setAttackEffects(prevEffects => 
            prevEffects.filter(effect => !effectsToRemove.includes(effect.id))
          );
  
          // Single state update for towers
          setTower(prevTowers =>
            prevTowers.map(t =>
              t.id === tower.id ? { 
                ...t, 
                isAttacking: false,
                damageDone: t.damageDone + totalDamageDealt
              } : t
            )
          );
  
          // Single state update for enemies
          setEnemies(prevEnemies =>
            prevEnemies.map(enemy => 
              targetIds.includes(enemy.id) ? 
                { ...enemy, isTargeted: false } : 
                enemy
            )
          );
        };
  
        // Execute all updates in one batch
        batchedUpdates();
      }
    }, tower.attackInterval / (isSpeedUp === 2 ? 3 : isSpeedUp ? 2 : 1));
  
    return () => {
      clearTimeout(cleanupTimeout);
    };
  }, [isSpeedUp, isPaused]);
  
// Get the furthest enemy within a certain radius from the tower
const getFurthestEnemyInRadius = (
  towerPositionX: number, 
  towerPositionY: number,
  towerType: string, 
  radius: number, 
  canHitStealth: boolean, 
  attackType: string, 
  attackDamage: number, 
  targettingType: string
) => {
  const enemiesInRadius = enemies.filter((enemy) => {
    // Only target enemies with positive hp
    if (enemy.hp <= 0) return false;
    
    // Calculate distance between tower and enemy
    const dx = enemy.positionX - towerPositionX;
    const dy = enemy.positionY - towerPositionY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    const isInRange = distance <= radius;
    
    // Different targeting logic based on tower type and capabilities
    if (canHitStealth) {
      return isInRange;
    } else if (towerType === "gasspitter" && canHitStealth) {
      return isInRange && !enemy.isPoisoned;
    } else if (towerType === "gasspitter" && !canHitStealth) {
      return isInRange && !enemy.isPoisoned && 
        (enemy.type !== "stealth" && enemy.type !== "stealthytank" && enemy.type !== "stealthyspeedy");
    } else if (towerType === "slower" && canHitStealth) {
      return isInRange && !enemy.isSlowed;
    } else if (towerType === "slower" && !canHitStealth) {
      return isInRange && !enemy.isSlowed && 
        (enemy.type !== "stealth" && enemy.type !== "stealthytank" && enemy.type !== "stealthyspeedy");
    } else {
      return isInRange && 
        (enemy.type !== "stealth" && enemy.type !== "stealthytank" && enemy.type !== "stealthyspeedy");
    }
  });

  if (enemiesInRadius.length === 0) {
    return null;
  }

  // Calculate progress value for each enemy based on their position in the path
  const enemiesWithProgress = enemiesInRadius.map(enemy => {
    let progress = 0;
    
    // Calculate progress based on enemy position along the path
    if (enemy.positionX < 28) {
      // First segment - diagonal path
      progress = enemy.positionX;
    } else if (enemy.positionX >= 28 && enemy.positionX < 52 && enemy.positionY > 15) {
      // Second segment - vertical path
      progress = 28 + (50 - enemy.positionY);
    } else if (enemy.positionY <= 15 && enemy.positionX < 52) {
      // Third segment - horizontal path
      progress = 63 + enemy.positionX;
    } else if (enemy.positionX >= 52 && enemy.positionX < 75 && enemy.positionY < 87) {
      // Fourth segment - vertical path down
      progress = 115 + enemy.positionY;
    } else if (enemy.positionY >= 87 && enemy.positionX < 75) {
      // Fifth segment - horizontal path
      progress = 202 + enemy.positionX;
    } else if (enemy.positionX >= 75 && enemy.positionY > 50) {
      // Sixth segment - diagonal path up
      progress = 277 + (87 - enemy.positionY);
    } else {
      // Final segment - horizontal path to end
      progress = 314 + enemy.positionX;
    }
    
    return { ...enemy, progress };
  });

  // Sort enemies based on targeting type
  if (targettingType === "highestHp") {
    enemiesWithProgress.sort((a, b) => b.hp - a.hp);
  } else if (targettingType === "last") {
    enemiesWithProgress.reverse();
  } else {
    // "first" targeting - already sorted by progress
    enemiesWithProgress.sort((a, b) => b.progress - a.progress);
  }

  // Return enemies based on attack type
   if (attackType === 'double') {
    return enemiesWithProgress.slice(0, Math.min(2, enemiesWithProgress.length));
  } else if (attackType === 'triple') {
    return enemiesWithProgress.slice(0, Math.min(3, enemiesWithProgress.length));
  } else if (attackType === 'quadruple') {
    return enemiesWithProgress.slice(0, Math.min(4, enemiesWithProgress.length));
  } else {
    // Single target
    return enemiesWithProgress.slice(0, 1);
  }
};

// Tower targeting system - updates target when enemies move
useEffect(() => {
  if (!isPageVisible || isPaused) return;

  // Only update if there are enemies to target
  if (enemies.length === 0) return;

  setTower(prevTowers =>
    prevTowers.map(tower => ({
      ...tower,
      furthestEnemyInRange: getFurthestEnemyInRadius(
        tower.positionX,
        tower.positionY,
        tower.type,
        tower.radius,
        tower.canHitStealth,
        tower.attackType,
        tower.attack,
        tower.targettingType
      ) ?? null
    }))
  );
}, [enemies, isPageVisible, isPaused]);
  
  // Tower attack execution - triggers attacks when targets are available
  useEffect(() => {
    if (!isPageVisible || isPaused) return; // Add isPaused check

    tower.forEach((t) => {
      if (t.furthestEnemyInRange && !t.isAttacking) {
        towerAttack(t, t.furthestEnemyInRange);
      }
    });
  }, [tower, towerAttack, isPageVisible, isPaused]); // Add isPaused to dependencies


  const HealthBar = ({ enemy }: { enemy: Enemy }) => {
    if (!showHealthBars) return null;
  
    const healthPercentage = (enemy.hp / enemy.maxHp) * 100;
    const barColor = healthPercentage > 50 ? 'bg-green-500' : 
                    healthPercentage > 25 ? 'bg-yellow-500' : 
                    'bg-red-500';
  
    return (
      <div className="absolute -top-2 left-0 w-full h-1.5 bg-gray-800/50 rounded overflow-hidden">
        <div 
          className={`h-full ${barColor} transition-all duration-200`}
          style={{ width: `${healthPercentage}%` }}
        />
      </div>
    );
  };

  const DamageNumber = ({ damage, x, y }: { damage: number; x: number; y: number }) => {
    if (!showDamageNumbers) return null;
    
    // Add randomness to prevent overlap
    const random = Math.random();
    
    return (
      <div
        className="animate-float-up"
        style={{ 
          left: `${x}%`, 
          top: `${y - 2}%`,
          '--random': random,
          color: damage >= 100 ? '#ff4444' : 
                 damage >= 50 ? '#ff8844' : 
                 '#ffffff',
          textShadow: '0 2px 0 rgba(0,0,0,0.8)',
          fontSize: damage >= 100 ? '1.25rem' : '1rem',
          fontWeight: 'bold'
        } as React.CSSProperties}
      >
        {Math.floor(damage)}
      </div>
    );
  };

  useEffect(() => {
    if (damageNumbers.length > 0) {
      const cleanupTimeout = setTimeout(() => {
        const now = Date.now();
        setDamageNumbers(prev => 
          prev.filter(num => now - num.timestamp < 1000)
        );
      }, 500); // Run cleanup every second
  
      return () => clearTimeout(cleanupTimeout);
    }
  }, [damageNumbers]);
  // Create enemy elements
  const createEnemy = () => {
    if (round > 0) {
      return enemies.map((enemy) => (
        <div 
          key={enemy.id} 
          className="absolute"
          style={{
            top: `${enemy.positionY}%`,
            left: `${enemy.positionX}%`,
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
          }}
        >
          <div className="absolute" style={{ width: '40px' }}>
            <HealthBar enemy={enemy} />
          </div>
          <img
            src={enemy.src}
            alt='enemy'
            className='w-10 h-10'
          />
          
        </div>
      ));
    }
  };

  

  // Reduce player's health points if enemies reach the end
  const damagePlayer = (enemies: Enemy[]) => {
    enemies.forEach((enemy) => {
      if (enemy.positionX > 99) { // Changed from >= 100 to > 95
        setHealthPoints((prevHealthPoints) => prevHealthPoints - enemy.damage);
        setEnemies((prevEnemies) => prevEnemies.filter(e => e.id !== enemy.id)); // Remove the enemy that dealt damage
      }
    });
  }; 
  useEffect(() => {
    damagePlayer(enemies);
  }, [enemies,tower]);
  useEffect(() => {
    if (!isPageVisible || isPaused) return;
    
    const slowCheckInterval = 10 * (isSpeedUp === 2 ? 1/3 : isSpeedUp ? 1/2 : 1);
    
    const slowInterval = setInterval(() => {
      const currentTime = Date.now();
  
      setEnemies(prevEnemies => {
        let hasChanges = false;
        const updatedEnemies = prevEnemies.map(enemy => {
          if (!enemy.isSlowed || !enemy.slowSourceId || !enemy.slowStartTime) return enemy;
          
          // Find the tower that applied the effect
          const effectTower = tower.find(t => t.id === enemy.slowSourceId);
          if (!effectTower) return enemy;
  
          const effectDuration = effectTower.slowDuration || 2500;
  
          const adjustedDuration = effectDuration / (isSpeedUp === 2 ? 3 : isSpeedUp ? 2 : 1);
          
          if (currentTime - enemy.slowStartTime >= adjustedDuration) {
            hasChanges = true;
            return {
              ...enemy,
              speed: !enemy.isStunned ? enemy.baseSpeed : enemy.speed,
              isSlowed: false,
              slowSourceId: undefined,
              slowStartTime: undefined
            };
          }
          return enemy;
        });
  
        return hasChanges ? updatedEnemies : prevEnemies;
      });
    }, slowCheckInterval);
  
    return () => clearInterval(slowInterval);
  }, [isPageVisible, isPaused, isSpeedUp, tower]);// Added tower to dependencies
  useEffect(() => {
    if (!isPageVisible || isPaused) return;
    
    const stunCheckInterval = 10 * (isSpeedUp === 2 ? 1/3 : isSpeedUp ? 1/2 : 1);
    
    const stunInterval = setInterval(() => {
      const currentTime = Date.now();
  
      setEnemies(prevEnemies => {
        let hasChanges = false;
        const updatedEnemies = prevEnemies.map(enemy => {
          if (!enemy.isStunned || !enemy.stunSourceId || !enemy.stunStartTime) return enemy;
          
          // Find the tower that applied the effect
          const effectTower = tower.find(t => t.id === enemy.stunSourceId);
          if (!effectTower) return enemy;
  
          // If it's a stun (speed = 0), use the stun duration, otherwise use slow duration
          const effectDuration = effectTower.stunDuration || 150
  
          const adjustedDuration = effectDuration / (isSpeedUp === 2 ? 3 : isSpeedUp ? 2 : 1);
          
          if (currentTime - enemy.stunStartTime >= adjustedDuration) {
            hasChanges = true;
            return {
              ...enemy,
              speed: enemy.isSlowed ? enemy.baseSpeed * (enemy.slowValue ?? 1) : enemy.baseSpeed,
              isStunned: false,
              stunSourceId: undefined,
              stunStartTime: undefined
            };
          }
          return enemy;
        });
  
        return hasChanges ? updatedEnemies : prevEnemies;
      });
    }, stunCheckInterval);
  
    return () => clearInterval(stunInterval);
  }, [isPageVisible, isPaused, isSpeedUp, tower]);
  useEffect(() => {
    if (!isPageVisible || isPaused) return;
  
    const LINGERING_TICK_RATE = 50;
  
    const lingeringInterval = setInterval(() => {
      const currentTime = Date.now();
  
      // Remove expired lingering effects
      setLingeringEffects(prev => prev.filter(effect => 
        currentTime - effect.timestamp < effect.duration
      ));
  
      // Apply damage to enemies in lingering areas
      setEnemies(prevEnemies => {
        let hasChanges = false;
        const updatedEnemies = prevEnemies.map(enemy => {
          let totalDamage = 0;
  
          // Check each lingering effect
          lingeringEffects.forEach(effect => {
            const dx = enemy.positionX - effect.positionX;
            const dy = enemy.positionY - effect.positionY;
            const distance = Math.sqrt(dx * dx + dy * dy);
  
            if (distance <= effect.radius) {
              totalDamage += effect.damage;
            }
          });
  
          if (totalDamage > 0) {
            hasChanges = true;
            const newHp = Math.max(0, enemy.hp - totalDamage);
  
            if (showDamageNumbers) {
              setDamageNumbers(prev => [...prev, {
                id: uuidv4(),
                damage: totalDamage,
                x: enemy.positionX,
                y: enemy.positionY,
                timestamp: currentTime
              }]);
            }
  
            // Check for kill
            if (newHp <= 0 && enemy.hp > 0) {
              grantMoneyForKill(enemy);
            }
  
            return { ...enemy, hp: newHp };
          }
  
          return enemy;
        });
  
        return hasChanges ? updatedEnemies : prevEnemies;
      });
    }, LINGERING_TICK_RATE);
  
    return () => clearInterval(lingeringInterval);
  }, [isPageVisible, isPaused, lingeringEffects]);
  useEffect(() => {
    if (!isPageVisible || isPaused) return;
             
    const POISON_TICK_RATE = isSpeedUp === 2 ? 3.33 : isSpeedUp ? 5 : 10; // Adjusted for 3x speed
    const POISON_DURATION = isSpeedUp === 2 ? 1333 : isSpeedUp ? 2000 : 4000; // Adjusted for 3x speed
    const TOTAL_TICKS = POISON_DURATION / POISON_TICK_RATE;
    
    const poisonInterval = setInterval(() => {
      const currentTime = Date.now();
      
      setEnemies(prevEnemies => {
        const poisonDamageByTower: { [key: string]: number } = {};
        
        const updatedEnemies = prevEnemies.map(enemy => {
          if (!enemy.isPoisoned || !enemy.poisonSourceId || !enemy.poisonStartTime) return enemy;
  
          if (currentTime - enemy.poisonStartTime >= POISON_DURATION) {
            return {
              ...enemy,
              isPoisoned: false,
              poisonSourceId: undefined,
              poisonStartTime: undefined,
              canRegen: true
            };
          }
  
          const poisonTower = tower.find(t => t.id === enemy.poisonSourceId);
          if (!poisonTower?.poisonDamage) return enemy;
  
          const damagePerTick = (4 * poisonTower.poisonDamage) / TOTAL_TICKS;
          const actualPoisonDamage = Math.min(damagePerTick, enemy.hp);
          
          if (!poisonDamageByTower[poisonTower.id]) {
            poisonDamageByTower[poisonTower.id] = 0;
          }
          poisonDamageByTower[poisonTower.id] += actualPoisonDamage;
  
          const newHp = enemy.hp - actualPoisonDamage;
          // Only grant money if the poison damage kills the enemy
          if (newHp <= 0 && enemy.hp > 0) {
            if(enemy.canSpawn){
              const spawnBatch = async () => {
                for (let i = 0; i < 5; i++){
                  // Add a small delay between spawns
                  await new Promise(resolve => setTimeout(resolve, 50));
                  setEnemies(prev => [...prev, createNewEnemy('SPEEDYMEGATANK', enemy.positionX, enemy.positionY)]);
                  setEnemyCount(prev => prev + 1);
                }
              };
              spawnBatch();
            }
            grantMoneyForKill(enemy);
          }
  
          return {
            ...enemy,
            hp: newHp
          };
        });
  
        // Update tower damage counters
        setTower(prevTowers =>
          prevTowers.map(t => ({
            ...t,
            damageDone: t.damageDone + (poisonDamageByTower[t.id] || 0)
          }))
        );
  
        return updatedEnemies;
      });
    }, POISON_TICK_RATE);
  
    return () => clearInterval(poisonInterval);
  }, [enemies, tower, isPageVisible, isSpeedUp, isPaused, setMoney]);
  // Buy towers and place them on the map
  const buyTowers = (event: React.MouseEvent<HTMLImageElement>, positionX: number, positionY: number) => {
    if (selectedTowerType && (event.target as HTMLImageElement).src.includes('buildingSite')) {
      const newTowerId = `tower-${uuidv4()}`; // Add 'tower-' prefix
      (event.target as HTMLImageElement).id = newTowerId;
      
      
      // Check if we have enough money for the selected tower
      const towerConfig = TOWER_TYPES[selectedTowerType.toUpperCase() as keyof typeof TOWER_TYPES];
      if (towerConfig && money >= towerConfig.price) {
        (event.target as HTMLImageElement).src = towerConfig.src;
        (event.target as HTMLImageElement).className = 'absolute w-16 h-16 z-10 hover:opacity-75 transition-opacity';
        setMoney((prevMoney) => prevMoney - towerConfig.price);
        setTower((prevTower) => [...prevTower, createNewTower(selectedTowerType.toUpperCase() as keyof typeof TOWER_TYPES, positionX, positionY, newTowerId)]);
      }
    } else if (!(event.target as HTMLImageElement).src.includes('buildingSite')) {
      setShowUpgradeMenu(true);
      setSelectedTowerID((event.target as HTMLImageElement).id);
    }
  };
  
  const upgradeTower = () => {
    if (showUpgradeMenu) {
      const selectedTower = tower.find(t => t.id === selectedTowerID);
      if (!selectedTower) return null;
  
      const availableUpgrades = TOWER_UPGRADES[selectedTower.type]?.filter(upgrade => {
        const hasChosenPath = selectedTower.path1Level >= 3 || selectedTower.path2Level >= 3;
        
        if (hasChosenPath) {
          if (selectedTower.path1Level >= 3) {
            if (upgrade.path === 2 && upgrade.requires < 2 && 
                upgrade.requires === selectedTower.path2Level) {
              return true;
            }
            return upgrade.path === 1 && upgrade.requires === selectedTower.path1Level;
          }
          if (selectedTower.path2Level >= 3) {
            if (upgrade.path === 1 && upgrade.requires < 2 && 
                upgrade.requires === selectedTower.path1Level) {
              return true;
            }
            return upgrade.path === 2 && upgrade.requires === selectedTower.path2Level;
          }
        }
        
        return (upgrade.path === 1 && upgrade.requires === selectedTower.path1Level) || 
               (upgrade.path === 2 && upgrade.requires === selectedTower.path2Level);
      }).filter(Boolean) || [];
  
      return (
        <div 
          data-upgrade-menu
          className='absolute top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 bg-slate-800 
            flex items-start justify-between p-8 rounded-lg gap-8 shadow-xl border-2 border-blue-500'
          style={{left: selectedTower.positionX < 50 ? '70%' : '30%', width: '800px'}}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Left Panel - Tower Info & Stats */}
          <div className='flex flex-col space-y-6 w-1/2'>
            <div className='text-white'>
              <h1 className="text-3xl font-bold mb-2 text-blue-400">
                {selectedTower.type.charAt(0).toUpperCase() + selectedTower.type.slice(1)} Tower
              </h1>
              <div className="h-px bg-gradient-to-r from-blue-500 to-transparent mb-4"></div>
              
              {/* Tower Image and Basic Info */}
              <div className="flex items-center gap-4 mb-6">
                <img src={selectedTower.src} alt="Tower" className="w-16 h-16" />
                <div>
                  <p className="text-sm text-gray-400">Level: {Math.max(selectedTower.path1Level, selectedTower.path2Level)}</p>
                  <p className="text-sm text-gray-400">Total Value: ${Math.floor(selectedTower.towerWorth)}</p>
                </div>
              </div>
  
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <StatBlock label="Attack Damage" value={Math.floor(selectedTower.attack)} />
                <StatBlock label="Attack Speed" value={`${Math.floor(selectedTower.attackInterval)}ms`} />
                <StatBlock label="Range" value={Math.floor(selectedTower.radius)} />
                <StatBlock label="Attack Type" value={selectedTower.attackType} />
                <StatBlock label="Targets Stealth" value={selectedTower.canHitStealth ? "Yes" : "No"} />
                <StatBlock label="Targets Armored" value={selectedTower.canHitArmored ? "Yes" : "No"} />
                
                {selectedTower.hasCritical && (
                  <>
                    <StatBlock 
                      label="Crit Chance" 
                      value={`${(selectedTower.criticalChance || 0) * 100}%`} 
                    />
                    <StatBlock 
                      label="Crit Multiplier" 
                      value={`${selectedTower.criticalMultiplier}x`} 
                    />
                  </>
                )}
                
                {selectedTower.slowAmount && (
                  <>
                    <StatBlock 
                      label="Slow Amount" 
                      value={`${Math.floor((1 - selectedTower.slowAmount) * 100)}%`} 
                    />
                    <StatBlock 
                      label="Slow Duration" 
                      value={`${selectedTower.slowDuration}ms`} 
                    />
                  </>
                )}
  
                {selectedTower.poisonDamage > 0 && (
                  <StatBlock 
                    label="Poison DPS" 
                    value={selectedTower.poisonDamage * 4} 
                  />
                )}
  
                {selectedTower.canStun && (
                  <StatBlock 
                    label="Stun Duration" 
                    value={`${selectedTower.stunDuration}ms`} 
                  />
                )}
  
                {selectedTower.explosionRadius > 0 && (
                  <StatBlock 
                    label="Explosion Radius" 
                    value={Math.floor(selectedTower.explosionRadius)} 
                  />
                )}
  
                <StatBlock 
                  label="Total Damage" 
                  value={Math.floor(selectedTower.damageDone)} 
                  highlight={true}
                />
              </div>
            </div>
  
            {/* Control Buttons */}
            <div className="flex gap-4 mt-4">
              <button 
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg
                  transition-all duration-200 shadow-md"
                onClick={() => sellTower(selectedTower.towerWorth)}
              >
                Sell (${Math.floor(selectedTower.towerWorth * 0.75)})
              </button>
              <button 
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg
                  transition-all duration-200 shadow-md"
                onClick={changeTowerTargetting}
              >
                Target: {selectedTower.targettingType}
              </button>
            </div>
          </div>
  
          {/* Right Panel - Upgrades */}
          <div className='w-1/2 space-y-4'>
            <h2 className="text-2xl font-bold text-blue-400 mb-4">Upgrades</h2>
            {availableUpgrades.map((upgrade) => (
              <button 
                key={upgrade.name}
                className={`w-full text-left p-4 rounded-lg transition-all duration-200 shadow-md
                  ${upgrade.path === 1 
                    ? 'bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 border-l-4 border-red-500' 
                    : 'bg-gradient-to-r from-blue-900 to-blue-800 hover:from-blue-800 hover:to-blue-700 border-l-4 border-blue-500'}
                  ${money < upgrade.cost ? 'opacity-50 cursor-not-allowed' : 'hover:scale-102'}`}
                onClick={() => performUpgrade(selectedTower, upgrade)}
                disabled={money < upgrade.cost}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-white">{upgrade.name}</span>
                  <span className="text-sm text-gray-300">${upgrade.cost}</span>
                </div>
                <p className="text-sm text-gray-300">{upgrade.description}</p>
              </button>
            ))}
  
            <button 
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg
                transition-all duration-200 shadow-md mt-6"
              onClick={closeUpgradeMenu}
            >
              Close
            </button>
          </div>
        </div>
      );
    }
    return null;
  };
  
  // Add this helper component for stats
  const StatBlock = ({ label, value, highlight = false }: { 
    label: string; 
    value: string | number; 
    highlight?: boolean 
  }) => (
    <div className={`p-2 rounded ${highlight ? 'bg-blue-900/50' : 'bg-gray-900/50'}`}>
      <div className="text-xs text-gray-400">{label}</div>
      <div className={`text-sm ${highlight ? 'text-blue-300 font-bold' : 'text-white'}`}>
        {value}
      </div>
    </div>
  );
  const closeUpgradeMenu = () => {
    setShowUpgradeMenu(false);
  }
  const performUpgrade = (tower: Tower, upgrade: TowerUpgrade) => {
    if (money >= upgrade.cost) {
      setMoney(prev => prev - upgrade.cost);
      setTower(prevTowers => 
        prevTowers.map(t => {
          if (t.id === tower.id) {
            // Determine which path level to increment
            const newPath1Level = upgrade.path === 1 ? (t.path1Level + 1) : t.path1Level;
            const newPath2Level = upgrade.path === 2 ? (t.path2Level + 1) : t.path2Level;
            
            // Set path if reaching level 3 in either path
            const newPath = (newPath1Level === 3 && !t.path) ? 1 : 
                           (newPath2Level === 3 && !t.path) ? 2 : t.path;
            
            return {
              ...t,
              ...upgrade.effect(t),
              path1Level: newPath1Level,
              path2Level: newPath2Level,
              path: newPath,
              // Ensure other properties are preserved
              id: t.id,
              positionX: t.positionX,
              positionY: t.positionY,
              isAttacking: t.isAttacking,
              furthestEnemyInRange: t.furthestEnemyInRange,
              damageDone: t.damageDone
            };
          }
          return t;
        })
      );
  
      // Update the tower image if it's on the board
      const towerElement = document.getElementById(tower.id) as HTMLImageElement;
      if (towerElement && upgrade.effect(tower).src) {
        towerElement.src = upgrade.effect(tower).src!;
      }
    }
  };
  const changeTowerTargetting = () => {
    setTower(() => 
      tower.map((t) =>
        t.id === selectedTowerID ? { 
          ...t, 
          targettingType: t.targettingType === "first" 
            ? "highestHp" 
            : t.targettingType === "highestHp" 
            ? "last" 
            : "first" 
        } : t
    ))
  }
  
  const sellTower = (towerPrice: number) => {
    if (confirmTowerSell) {
      const confirmed = window.confirm('Are you sure you want to sell this tower?');
      if (!confirmed) return;
    }
    
    setMoney((prevMoney) => prevMoney + towerPrice / 1.5);
    setTower((prevTower) => prevTower.filter((t) => t.id !== selectedTowerID));
    
    const towerElement = document.getElementById(selectedTowerID) as HTMLImageElement;
    if (towerElement) {
      towerElement.src = '/buildingSite.png';
      towerElement.id = `building-site-${uuidv4()}`;
    }
    
    setShowUpgradeMenu(false);
  };
  // Component for attack animation
  const attackAnimation = () => {
    return attackEffects.map((effect) => (
      <img
        src={effect.effectSrc}
        key={effect.id}
        className='pointer-events-none animate-slide h-6 w-6 absolute'
        style={{
          '--tower-positionX': `${effect.towerPositionX + 1}%`,
          '--tower-positionY': `${effect.towerPositionY + 2.5}%`,
          '--enemy-positionX': `${effect.enemyPositionX + 1.5}%`,
          '--enemy-positionY': `${effect.enemyPositionY}%`,
          left: `${effect.towerPositionX}%`,
          animationDuration: `${100 / (isSpeedUp === 2 ? 3 : isSpeedUp ? 2 : 1)}ms`,
          filter: 'drop-shadow(0 0 2px rgba(0,0,0,1)) brightness(1.2) contrast(1.2)',
          mixBlendMode: 'normal',
          zIndex: 20
        } as React.CSSProperties}
      />
    ));
  };
  
  
  const renderExplosions = () => {
    return explosionEffects.map((effect) => {
      // Find the tower that caused this explosion
      const explosionTower = tower.find(t => t.attackType === 'explosion');
      const explosionSize = explosionTower ? explosionTower.explosionRadius * 2 : 50;
  
      // Define explosion colors based on tower type
      let explosionColor;
      if (explosionTower) {
        switch (explosionTower.type) {
          case 'mortar':
            explosionColor = 'rgba(255, 69, 0, 0.5)'; // Orange-red
            break;
          case 'cannon':
            explosionColor = 'rgba(255, 215, 0, 0.5)'; // Golden
            break;
          case 'gasspitter':
            explosionColor = 'rgba(0, 255, 0, 0.5)'; // Toxic green
            break;
          case 'basic':
            explosionColor = 'rgba(255, 0, 0, 0.5)'; // Red
            break;
          case 'slower':
            explosionColor = 'rgba(0, 191, 255, 0.5)'; // Deep sky blue
            break;
          default:
            explosionColor = 'rgba(255, 0, 0, 0.5)'; // Default red
        }
      }
  
      return (
        <div
          key={effect.id}
          className="absolute rounded-full animate-explosion z-[5]"
          style={{
            left: `${effect.positionX}%`,
            top: `${effect.positionY}%`,
            width: `${explosionSize / 1.5}%`,
            height: `${explosionSize / 1.5}%`,
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, ${explosionColor} 0%, rgba(255,255,255,0) 70%)`,
          }}
        />
      );
    });
  };

// Define upgrade paths for each tower type
const TOWER_UPGRADES: { [key: string]: TowerUpgrade[] } = {
  basic: [
    // Path 1 - Attack Speed focused
    {
      name: "Stealth Detection",
      cost: 400,
      requires: 0,
      path: 1,
      description: "Can hit stealth enemies",
      effect: (tower) => ({ 
        canHitStealth: true,
        towerWorth: tower.towerWorth + 400,
        path: 1
      })
    },
    {
      name: "Rapid Fire",
      cost: 800,
      description: "Reduces attack interval by 300ms",
      requires: 1,
      path: 1,
      effect: (tower) => ({ 
        attackInterval: tower.attackInterval - 300,
        towerWorth: tower.towerWorth + 800,
        path: 1
      })
    },
    {
      name: "Double Shot",
      cost: 2000,
      description: "Attacks two targets at once with increased speed",
      requires: 2,
      path: 1,
      effect: (tower) => ({ 
        attackType: 'double',
        attackInterval: tower.attackInterval - 200,
        towerWorth: tower.towerWorth + 2000,
        path: 1
      })
    },
    {
      name: "Speed Master",
      cost: 15000,
      description: "Ultimate attack speed and triple shot",
      requires: 3,
      path: 1,
      effect: (tower) => ({
        attackInterval: tower.attackInterval - 250,
        attackType: 'triple',
        attack: tower.attack * 1.5,
        src: '/basicSpecial.png',
        towerWorth: tower.towerWorth + 15000,
        path: 1
      })
    },
    {
      name: "Hypersonic Barrage",
      cost: 25000,
      description: "Quadruple shot with extreme attack speed",
      requires: 4,
      path: 1,
      effect: (tower) => ({
        attackInterval: tower.attackInterval - 100,
        attackType: 'quadruple',
        attack: tower.attack * 1.8,
        towerWorth: tower.towerWorth + 25000,
        path: 1
      })
    },

    // Path 2 - Heavy Damage focused
    {
      name: "Enhanced Targeting",
      cost: 600,
      requires: 0,
      path: 2,
      description: "Increases attack damage by 60",
      effect: (tower) => ({ 
        attack: tower.attack + 60,
        towerWorth: tower.towerWorth + 600,
        path: 2
      })
    },
    {
      name: "Heavy Shells",
      cost: 2000,
      description: "Further increases damage and adds armor piercing",
      requires: 1,
      path: 2,
      effect: (tower) => ({ 
        attack: tower.attack + 80,
        canHitArmored: true,
        towerWorth: tower.towerWorth + 2000,
        path: 2
      })
    },
    {
      name: "Critical Strike",
      cost: 5000,
      description: "30% chance to deal triple damage",
      requires: 2,
      path: 2,
      effect: (tower) => ({ 
        hasCritical: true,
        criticalChance: 0.30,
        criticalMultiplier: 3,
        towerWorth: tower.towerWorth + 5000,
        path: 2
      })
    },
    {
      name: "Demolition Expert",
      cost: 15000,
      description: "Converts to massive explosive damage",
      requires: 3,
      path: 2,
      effect: (tower) => ({
        attackType: 'explosion',
        explosionRadius: 25,
        attack: tower.attack * 3,
        src: '/basicSpecial2.png',
        towerWorth: tower.towerWorth + 15000,
        path: 2
      })
    },
    {
      name: "Nuclear Strike",
      cost: 30000,
      description: "Devastating explosion",
      requires: 4,
      path: 2,
      effect: (tower) => ({
        explosionRadius: tower.explosionRadius * 1.4,
        attack: tower.attack * 1.5,
        towerWorth: tower.towerWorth + 30000,
        path: 2
      })
    }
  ],
  sniper: [
    // Path 1 - High Damage/Stun
    {
      name: "Precision Scope",
      cost: 1000,
      requires: 0,
      path: 1,
      description: "Increases damage by 100",
      effect: (tower) => ({
        attack: tower.attack + 100,
        towerWorth: tower.towerWorth + 1000,
        path: 1
      })
    },
    {
      name: "Stun Rounds",
      cost: 2500,
      requires: 1,
      path: 1,
      description: "20% chance to stun enemies",
      effect: (tower) => ({
        canStun: true,
        stunDuration: 75, // Reduced from 150
        criticalChance: 0.2,
        towerWorth: tower.towerWorth + 2500,
        path: 1
      })
    },
    {
      name: "Armor Piercing",
      cost: 5000,
      requires: 2,
      path: 1,
      description: "Can hit armored enemies and +150 damage",
      effect: (tower) => ({
        canHitArmored: true,
        attack: tower.attack + 150,
        towerWorth: tower.towerWorth + 5000,
        path: 1
      })
    },
    {
      name: "Heavy Impact",
      cost: 12000,
      requires: 3,
      path: 1,
      description: "40% stun chance and doubled damage",
      effect: (tower) => ({
        attack: tower.attack * 2,
        criticalChance: 0.4,
        stunDuration: 150, // Reduced from 300
        src: '/sniperSpecial.png',
        towerWorth: tower.towerWorth + 12000,
        path: 1
      })
    },
    {
      name: "Ultimate Destroyer",
      cost: 25000,
      requires: 4,
      path: 1,
      description: "Massive damage and guaranteed stun",
      effect: (tower) => ({
        attack: tower.attack * 3,
        criticalChance: 1.0,
        stunDuration: 250, // Reduced from 500
        towerWorth: tower.towerWorth + 25000,
        path: 1
      })
    },

    // Path 2 - Attack Speed
    {
      name: "Quick Loader",
      cost: 800,
      requires: 0,
      path: 2,
      description: "Reduces attack interval by 400ms",
      effect: (tower) => ({
        attackInterval: tower.attackInterval - 400,
        towerWorth: tower.towerWorth + 800,
        path: 2
      })
    },
    {
      name: "Double Shot",
      cost: 2000,
      requires: 1,
      path: 2,
      description: "Can target two enemies",
      effect: (tower) => ({
        attackType: 'double',
        attackInterval: tower.attackInterval - 200,
        towerWorth: tower.towerWorth + 2000,
        path: 2
      })
    },
    {
      name: "Advanced Targeting",
      cost: 4500,
      requires: 2,
      path: 2,
      description: "Triple shot and faster firing",
      effect: (tower) => ({
        attackType: 'triple',
        attackInterval: tower.attackInterval - 300,
        towerWorth: tower.towerWorth + 4500,
        path: 2
      })
    },
    {
      name: "Rapid Fire Master",
      cost: 15000,
      requires: 3,
      path: 2,
      description: "Extremely fast attack speed",
      effect: (tower) => ({
        attackInterval: tower.attackInterval - 500,
        attack: tower.attack * 1.3,
        src: '/sniperSpecial2.png',
        towerWorth: tower.towerWorth + 15000,
        path: 2
      })
    },
    {
      name: "Machine Gun Mode",
      cost: 25000,
      requires: 4,
      path: 2,
      description: "Quadruple shot with insane speed",
      effect: (tower) => ({
        attackType: 'quadruple',
        attackInterval: tower.attackInterval - 350,
        attack: tower.attack * 1.5,
        towerWorth: tower.towerWorth + 25000,
        path: 2
      })
    }
  ],
  rapidShooter: [
    // Path 1 - Multi-target Attack Speed Path
    {
      name: "Faster Firing",
      cost: 500,
      requires: 0,
      path: 1,
      description: "Reduces attack interval by 75ms",
      effect: (tower) => ({
        attackInterval: tower.attackInterval - 75,
        towerWorth: tower.towerWorth + 500,
        path: 1
      })
    },
    {
      name: "Enhanced Targeting",
      cost: 1200,
      requires: 1,
      path: 1,
      description: "Increases damage by 15 and attack speed",
      effect: (tower) => ({
        attack: tower.attack + 15,
        attackInterval: tower.attackInterval - 50,
        towerWorth: tower.towerWorth + 1200,
        path: 1
      })
    },
    {
      name: "Triple Shot",
      cost: 3500,
      requires: 2,
      path: 1,
      description: "Can target three enemies at once",
      effect: (tower) => ({
        attackType: 'triple',
        attackInterval: tower.attackInterval - 25,
        towerWorth: tower.towerWorth + 3500,
        path: 1
      })
    },
    {
      name: "Quad Shot",
      cost: 8000,
      requires: 3,
      path: 1,
      description: "Four targets and enhanced speed",
      effect: (tower) => ({
        attackType: 'quadruple',
        attackInterval: tower.attackInterval - 50,
        attack: tower.attack + 10,
        src: '/rapidShooterSpecial1.png',
        towerWorth: tower.towerWorth + 8000,
        path: 1
      })
    },
    {
      name: "Bullet Storm",
      cost: 25000,
      requires: 4,
      path: 1,
      description: "Maximum attack speed and damage",
      effect: (tower) => ({
        attackInterval: tower.attackInterval - 65,
        attack: tower.attack * 1.6,
        towerWorth: tower.towerWorth + 25000,
        path: 1
      })
    },

    // Path 2 - Chain Lightning Path
    {
      name: "Static Charge",
      cost: 800,
      requires: 0,
      path: 2,
      description: "Adds 25 damage and slight range",
      effect: (tower) => ({
        attack: tower.attack + 25,
        radius: tower.radius * 1.1,
        towerWorth: tower.towerWorth + 800,
        path: 2
      })
    },
    {
      name: "Enhanced Range",
      cost: 1500,
      requires: 1,
      path: 2,
      description: "Further increases range, damage and stealth detection",
      effect: (tower) => ({
        radius: tower.radius * 1.2,
        attack: tower.attack + 15,
        canHitStealth: true,
        towerWorth: tower.towerWorth + 1500,
        path: 2
      })
    },
    {
      name: "Chain Lightning",
      cost: 4500,
      requires: 2,
      path: 2,
      description: "Attacks chain to 2 nearby enemies",
      effect: (tower) => ({
        attackType: 'chain',
        chainCount: 2,
        chainRange: 20,
        effectSrc: '/chainLightning.png',
        src: '/rapidShooterSpecial2.png',
        attack: tower.attack + 20,
        towerWorth: tower.towerWorth + 4500,
        path: 2
      })
    },
    {
      name: "Storm Caller",
      cost: 12000,
      requires: 3,
      path: 2,
      description: "Chain to 3 enemies with increased damage",
      effect: (tower) => ({
        chainCount: 3,
        chainRange: 25,
        attack: tower.attack * 1.4,
        attackInterval: tower.attackInterval - 25,
        src: '/rapidShooterSpecial2.png',
        towerWorth: tower.towerWorth + 12000,
        path: 2
      })
    },
    {
      name: "Lightning Master",
      cost: 25000,
      requires: 4,
      path: 2,
      description: "Maximum chain potential and massive damage",
      effect: (tower) => ({
        chainCount: 4,
        chainRange: 30,
        attack: tower.attack * 2,
        attackInterval: tower.attackInterval - 50,
        towerWorth: tower.towerWorth + 25000,
        path: 2
      })
    }
],
slower: [
  // Path 1 - Time Warping Path
  {
    name: "Enhanced Slow",
    cost: 400,
    requires: 0,
    path: 1,
    description: "Increases slow effect by 10%",
    effect: (tower) => ({
      slowAmount: tower.slowAmount ? tower.slowAmount * 0.9 : 0.9,
      towerWorth: tower.towerWorth + 400,
      path: 1
    })
  },
  {
    name: "Time Distortion",
    cost: 1500,
    requires: 1,
    path: 1,
    description: "Further increases slow effect and duration",
    effect: (tower) => ({
      slowAmount: tower.slowAmount ? tower.slowAmount * 0.8 : 0.8,
      slowDuration: 3000,
      towerWorth: tower.towerWorth + 1500,
      path: 1
    })
  },
  {
    name: "Temporal Field",
    cost: 3500,
    requires: 2,
    path: 1,
    description: "Creates slowing field around targets",
    effect: (tower) => ({
      attackType: 'explosion',
      explosionRadius: 15,
      slowAmount: tower.slowAmount ? tower.slowAmount * 0.7: 0.7,
      src: '/slowerSpecial1.png',
      towerWorth: tower.towerWorth + 3500,
      path: 1
    })
  },
  {
    name: "Chrono Break",
    cost: 8000,
    requires: 3,
    path: 1,
    description: "Massive slow effect in larger area",
    effect: (tower) => ({
      explosionRadius: 20,
      slowAmount: tower.slowAmount ? tower.slowAmount * 0.6: 0.6,
      slowDuration: 4000,
      towerWorth: tower.towerWorth + 8000,
      path: 1
    })
  },
  {
    name: "Time Lord",
    cost: 20000,
    requires: 4,
    path: 1,
    description: "Ultimate time manipulation",
    effect: (tower) => ({
      explosionRadius: 25,
      slowAmount: tower.slowAmount ? tower.slowAmount * 0.6 : 0.6,
      canHitStealth: true,
      towerWorth: tower.towerWorth + 20000,
      path: 1
    })
  },
  // Path 2 - Multi-target Freezing Path
  {
    name: "Frost Touch",
    cost: 600,
    requires: 0,
    path: 2,
    description: "Adds freezing damage",
    effect: (tower) => ({
      attack: tower.attack + 15,
      towerWorth: tower.towerWorth + 600,
      path: 2
    })
  },
  {
    name: "Frost Touch 2",
    cost: 1200,
    requires: 1,
    path: 2,
    description: "Faster freeze",
    effect: (tower) => ({
      attackInterval: tower.attackInterval - 250,
      towerWorth: tower.towerWorth + 600,
      path: 2
    })
  },
  {
    name: "Arctic Wind",
    cost: 4500,
    requires: 2,
    path: 2,
    description: "Triple target and increased range",
    effect: (tower) => ({
      attackType: 'triple',
      radius: tower.radius * 1.3,
      attack: tower.attack + 25,
      src: '/slowerSpecial2.png',
      towerWorth: tower.towerWorth + 4500,
      path: 2
    })
  },
  {
    name: "Deep Freeze",
    cost: 12000,
    requires: 3,
    path: 2,
    description: "Quad target and chance to stun",
    effect: (tower) => ({
      attackType: 'quadruple',
      canStun: true,
      stunDuration: 100, // Reduced from 200
      attack: tower.attack + 30,
      towerWorth: tower.towerWorth + 12000,
      path: 2
    })
  },
  {
    name: "Permafrost",
    cost: 20000,
    requires: 4,
    path: 2,
    description: "Maximum freeze potential",
    effect: (tower) => ({
      attack: tower.attack * 2,
      stunDuration: 250, // Reduced from 400
      radius: tower.radius * 1.5,
      towerWorth: tower.towerWorth + 20000,
      path: 2
    })
  }
],

gasspitter: [
  // Path 1 - DOT Damage Path
  {
    name: "Virulent Strain",
    cost: 400,
    requires: 0,
    path: 1,
    description: "Increases poison damage",
    effect: (tower) => ({
      poisonDamage: tower.poisonDamage + 25,
      towerWorth: tower.towerWorth + 400,
      path: 1
    })
  },
  {
    name: "Lingering Toxin",
    cost: 1200,
    requires: 1,
    path: 1,
    description: "Longer lasting poison",
    effect: (tower) => ({
      poisonDamage: tower.poisonDamage + 30,
      towerWorth: tower.towerWorth + 1200,
      path: 1
    })
  },
  {
    name: "Acid Pools",
    cost: 3000,
    requires: 2,
    path: 1,
    description: "Creates damaging acid pools on impact",
    effect: (tower) => ({
      attackType: 'lingering',
      lingeringDamage: tower.poisonDamage * 0.05,
      lingeringRadius: 15,
      lingeringDuration: 2000,
      lingeringColor: 'rgba(0, 255, 0, 0.5)',
      towerWorth: tower.towerWorth + 3000
    })
  },
  {
    name: "Toxic Catalyst",
    cost: 8000,
    requires: 3,
    path: 1,
    description: "Extreme poison damage, Can stop regen and hit stealth",
    effect: (tower) => ({
      poisonDamage: tower.poisonDamage * 2.5,
      canHitStealth: true,
      canStopRegen: true,
      towerWorth: tower.towerWorth + 8000,
      path: 1
    })
  },
  {
    name: "Bio Weaponry",
    cost: 15000,
    requires: 4,
    path: 1,
    description: "Ultimate poison damage",
    effect: (tower) => ({
      poisonDamage: tower.poisonDamage * 3,
      attack: tower.attack * 1.5,
      src: '/gasSpitterSpecial1.png',
      towerWorth: tower.towerWorth + 15000,
      path: 1
    })
  },

  // Path 2 - Gas Cloud Path
  {
    name: "Wider Spray",
    cost: 600,
    requires: 0,
    path: 2,
    description: "Increases attack radius",
    effect: (tower) => ({
      radius: tower.radius * 1.2,
      towerWorth: tower.towerWorth + 600,
      path: 2
    })
  },
  {
    name: "Faster Attack",
    cost: 2000,
    requires: 1,
    path: 2,
    description: "Reduces attack interval",
    effect: (tower) => ({
      attackInterval: tower.attackInterval - 200,
      radius: tower.radius * 1.2,
      towerWorth: tower.towerWorth + 2000,
      path: 2
    })
  },
  {
    name: "Gas Cloud",
    cost: 4500,
    requires: 2,
    path: 2,
    description: "Creates poisonous explosion",
    effect: (tower) => ({
      attackType: 'explosion',
      explosionRadius: 20,
      poisonDamage: tower.poisonDamage + 20,
      towerWorth: tower.towerWorth + 4500,
      path: 2
    })
  },
  {
    name: "Dense Vapors",
    cost: 12000,
    requires: 3,
    path: 2,
    description: "Larger explosion and slowing effect",
    effect: (tower) => ({
      explosionRadius: 25,
      slowAmount: 0.8,
      slowDuration: 2000,
      poisonDamage: tower.poisonDamage + 30,
      towerWorth: tower.towerWorth + 12000,
      src: '/gasSpitterSpecial2.png',
      path: 2
    })
  },
  {
    name: "Chemical Warfare",
    cost: 20000,
    requires: 4,
    path: 2,
    description: "Maximum area control",
    effect: (tower) => ({
      explosionRadius: 30,
      slowAmount: 0.7,
      poisonDamage: tower.poisonDamage * 1.5,
      towerWorth: tower.towerWorth + 20000,
      path: 2
    })
  }
],
mortar: [
  {
    name: "High Explosive Shells",
    cost: 800,
    requires: 0,
    path: 1,
    description: "More powerful explosions",
    effect: (tower) => ({
      attack: tower.attack + 100,
      explosionRadius: tower.explosionRadius * 1.1,
      towerWorth: tower.towerWorth + 800,
      path: 1
    })
  },
  {
    name: "Heavy Ordnance",
    cost: 2000,
    requires: 1,
    path: 1,
    description: "Massively enhanced explosion damage",
    effect: (tower) => ({
      explosionRadius: tower.explosionRadius * 1.2,
      attack: tower.attack * 1.3,
      towerWorth: tower.towerWorth + 2000,
      path: 1
    })
  },
  {
    name: "Concentrated Blast",
    cost: 4500,
    requires: 2,
    path: 1,
    description: "Extreme explosive power",
    effect: (tower) => ({
      attack: tower.attack * 1.5,
      canHitArmored: true,
      src: '/mortarSpecial.png',
      towerWorth: tower.towerWorth + 4500,
      path: 1
    })
  },
  {
    name: "Napalm Shells",
    cost: 8000,
    requires: 3,
    path: 1,
    description: "Devastating area damage",
    effect: (tower) => ({
      attack: tower.attack * 1.75,
      explosionRadius: tower.explosionRadius * 1.3,
      canHitStealth: true,
      towerWorth: tower.towerWorth + 8000,
      path: 1
    })
  },
  {
    name: "Nuclear Artillery",
    cost: 30000,
    requires: 4,
    path: 1,
    description: "Ultimate destruction",
    effect: (tower) => ({
      attack: tower.attack * 2.5,
      explosionRadius: tower.explosionRadius * 1.4,
      attackInterval: tower.attackInterval * 1.5, // Slower but more powerful
      criticalChance: 0.3,
      criticalMultiplier: 2,
      towerWorth: tower.towerWorth + 30000,
      path: 1
    })
  },

  // Path 2 - Tactical Support (crowd control)
  {
    name: "EMP Shells",
    cost: 1000,
    requires: 0,
    path: 2,
    description: "Shells temporarily disable enemies",
    effect: (tower) => ({
      canStun: true,
      stunDuration: 100,
      explosionRadius: tower.explosionRadius * 1.1,
      towerWorth: tower.towerWorth + 1000,
      path: 2
    })
  },
  {
    name: "Cryogenic Payload",
    cost: 2500,
    requires: 1,
    path: 2,
    description: "Freezing explosions slow enemies",
    effect: (tower) => ({
      slowAmount: 0.7,
      slowDuration: 2000,
      explosionRadius: tower.explosionRadius * 1.2,
      towerWorth: tower.towerWorth + 2500,
      path: 2
    })
  },
  {
    name: "Shockwave Artillery",
    cost: 5000,
    requires: 2,
    path: 2,
    description: "Enhanced control effects",
    effect: (tower) => ({
      explosionRadius: tower.explosionRadius * 1.3,
      stunDuration: 300,
      slowAmount: 0.6,
      attack: tower.attack + 50,
      towerWorth: tower.towerWorth + 5000,
      path: 2
    })
  },
  {
    name: "Shock and Awe",
    cost: 12000,
    requires: 3,
    path: 2,
    description: "Devastating crowd control",
    effect: (tower) => ({
      explosionRadius: tower.explosionRadius * 1.4,
      slowAmount: 0.5,
      slowDuration: 3000,
      stunDuration: 400,
      attack: tower.attack + 100,
      src: '/mortarSpecial2.png',
      towerWorth: tower.towerWorth + 12000,
      path: 2
    })
  },
  {
    name: "Strategic Command",
    cost: 25000,
    requires: 4,
    path: 2,
    description: "Ultimate battlefield control",
    effect: (tower) => ({
      explosionRadius: tower.explosionRadius * 1.5,
      attack: tower.attack * 1.5,
      slowAmount: 0.4,
      slowDuration: 4000,
      canHitStealth: true,
      towerWorth: tower.towerWorth + 20000,
      path: 2
    })
  }
],

cannon: [
  // Path 1 - Anti-Tank Specialist
  {
    name: "Reinforced Barrel",
    cost: 800,
    requires: 0,
    path: 1,
    description: "Increased damage ",
    effect: (tower) => ({
      attack: tower.attack + 50,
      towerWorth: tower.towerWorth + 800
    })
  },
  {
    name: "Armor Piercing Rounds",
    cost: 2000,
    requires: 1,
    path: 1,
    description: "Specialized anti-armor ammunition",
    effect: (tower) => ({
      attack: tower.attack + 75,
      hasCritical: true,
      criticalChance: 0.2,
      criticalMultiplier: 2,
      towerWorth: tower.towerWorth + 2000
    })
  },
  {
    name: "Depleted Uranium",
    cost: 4500,
    requires: 2,
    path: 1,
    description: "Extreme armor penetration",
    effect: (tower) => ({
      attack: tower.attack * 1.5,
      criticalChance: 0.3,
      criticalMultiplier: 2.5,
      towerWorth: tower.towerWorth + 4500
    })
  },
  {
    name: "Tank Hunter",
    cost: 8000,
    requires: 3,
    path: 1,
    description: "Specialized in destroying tough enemies",
    effect: (tower) => ({
      attack: tower.attack * 1.75,
      criticalChance: 0.4,
      criticalMultiplier: 3,
      attackInterval: tower.attackInterval - 500,
      src: '/cannonSpecial.png',
      towerWorth: tower.towerWorth + 8000
    })
  },
  {
    name: "Siege Breaker",
    cost: 25000,
    requires: 4,
    path: 1,
    description: "Ultimate anti-armor capabilities",
    effect: (tower) => ({
      attack: tower.attack * 1.5,
      criticalChance: 0.5,
      criticalMultiplier: 4,
      canHitStealth: true,
      towerWorth: tower.towerWorth + 25000
    })
  },

  // Path 2 - Anti-Group Specialist
  {
    name: "Wide Shells",
    cost: 1000,
    requires: 0,
    path: 2,
    description: "Increases explosion radius",
    effect: (tower) => ({
      explosionRadius: tower.explosionRadius * 1.2,
      attack: tower.attack - 15, // Small damage penalty for bigger radius
      towerWorth: tower.towerWorth + 1000,
    })
  },
  {
    name: "Cluster Bombs",
    cost: 2500,
    requires: 1,
    path: 2,
    description: "Creates multiple small explosions",
    effect: (tower) => ({
      explosionRadius: tower.explosionRadius * 1.3,
      attackInterval: tower.attackInterval - 125, 
      attack: tower.attack + 15,
      towerWorth: tower.towerWorth + 2500,
    })
  },
  {
    name: "Inferno Zone",
    cost: 5000,
    requires: 2,
    path: 2,
    description: "Massive burning zones after explosions",
    effect: (tower) => ({
      lingeringDamage: tower.attack * 0.05,
      lingeringRadius: 20,
      lingeringDuration: 4000,
      attack: tower.attack + 75,
      explosionRadius: tower.explosionRadius * 1.3,
      towerWorth: tower.towerWorth + 5000
    })
  },
  {
    name: "Hellfire Cannon",
    cost: 12000,
    requires: 3,
    path: 2,
    description: "Devastating explosions with intense burning",
    effect: (tower) => ({
      lingeringDamage: tower.attack * 0.15,
      lingeringRadius: 25,
      lingeringDuration: 5000,
      attack: tower.attack * 1.4,
      explosionRadius: tower.explosionRadius * 1.4,
      src: '/cannonSpecial2.png',
      towerWorth: tower.towerWorth + 12000
    })
  },
  {
    name: "Solar Inferno",
    cost: 20000,
    requires: 4,
    path: 2,
    description: "Ultimate area denial with massive damage",
    effect: (tower) => ({
      lingeringDamage: tower.attack * 0.2,
      lingeringRadius: 30,
      lingeringDuration: 6000,
      attack: tower.attack * 1.6,
      explosionRadius: tower.explosionRadius * 1.5,
      canHitArmored: true,
      towerWorth: tower.towerWorth + 20000
    })
  }
  ]
};
// Add this new component near your other components
const RangeIndicator = ({ tower }: { tower: Tower }) => {

  if (!showRangeIndicators) return null;
  
  return showUpgradeMenu && tower.id === selectedTowerID && (
    <div
      className="absolute rounded-full border-2 border-blue-400 pointer-events-none"
      style={{
        width: `${(tower.radius * 2)}%`,
        height: `${(tower.radius * 2)}%`,
        left: `${tower.positionX}%`,
        top: `${tower.positionY}%`,
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        zIndex: 5,
      }}
    />
  );
}

// Add this function near your other event handlers
const handleOutsideClick = (event: React.MouseEvent) => {
  // Check if the click was outside the upgrade menu
  const upgradeMenu = document.querySelector('[data-upgrade-menu]');
  if (upgradeMenu && !upgradeMenu.contains(event.target as Node)) {
    setShowUpgradeMenu(false);
  }
};

useEffect(() => {
  if (enemies.length === 0 && (enemyCount >= 10 * round || enemyCount >= 15 * round)) {
    // Clear processed enemies when round is complete
    processedEnemies.clear();
  }
}, [enemies.length, enemyCount, round]);

const grantMoneyForKill = useCallback((enemy: Enemy) => {
  if (!processedEnemies.has(enemy.id)) {
    processedEnemies.add(enemy.id);
    const reward = Math.floor(
      (enemy.maxHp / 6.5) * 
      (round >= 33 ? 0.055 : round > 22 ? 0.325 : 1)
    );
    setMoney(prev => prev + reward);
  }
}, [processedEnemies, round]);

// Add this near your other useEffects
useEffect(() => {
  // Check for dead enemies that haven't granted money yet
  setEnemies(prevEnemies => {
    let hasChanges = false;
    const updatedEnemies = prevEnemies.map(enemy => {
      if (enemy.hp <= 0 && !processedEnemies.has(enemy.id)) {
        grantMoneyForKill(enemy);
        hasChanges = true;
      }
      return enemy;
    });
    return hasChanges ? updatedEnemies : prevEnemies;
  });
}, [enemies, grantMoneyForKill]);

// Add a helper function to calculate rotation
const getTowerRotation = (tower: Tower, target: Enemy) => {
  if (!target) return '';
  const shootingRight = target.positionX > tower.positionX;
  return shootingRight ? 'scaleX(-1)' : '';
};
const LingeringEffects = () => {
  return (
    <>
      {lingeringEffects.map(effect => (
        <div
          key={effect.id}
          className="absolute rounded-full pointer-events-none animate-pulse"
          style={{
            left: `${effect.positionX}%`,
            top: `${effect.positionY}%`,
            width: `${effect.radius * 2.5}%`,
            height: `${effect.radius * 2.5}%`,
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, ${effect.color} 0%, transparent 50%)`,
            opacity: 0.5,
            zIndex: 4
          }}
        />
      ))}
    </>
  );
};
  return (
    <>
   <div 
      className='relative min-h-[72vh] w-full overflow-hidden' 
      suppressHydrationWarning
      onClick={handleOutsideClick}
    >
  <img 
    src='/test.webp' 
    className=' w-full h-full object-fill top-0 left-0 z-0' 
    alt='map' 
  />
      {/* Add range indicators for all towers */}
      {tower.map((t) => (
        <RangeIndicator key={`range-${t.id}`} tower={t} />
      ))}
      <div>
  {(
    <>
      {[
        { top: '35%', left: '20%', x: 21, y: 36 },
        { top: '35%', left: '10%', x: 11, y: 36 },
        { top: '60%', left: '66%', x: 66, y: 61 },
        { top: '58%', left: '60%', x: 60, y: 59 },
        { top: '30%', left: '63%', x: 63, y: 31 },
        { top: '42.5%', left: '63%', x: 63, y: 43.5 },
        { top: '35%', left: '85%', x: 85, y: 36 },
        { top: '65%', left: '2%', x: 2, y: 66 },
        { top: '65%', left: '25%', x: 25, y: 66 },
        { top: '8%', left: '30%', x: 30, y: 9 },
        { top: '8%', left: '50%', x: 50, y: 9 },
        { top: '5%', left: '41%', x: 41, y: 6 },
        { top: '40%', left: '41%', x: 41, y: 41 },
        { top: '52.5%', left: '41%', x: 41, y: 53.5 },
        { top: '57%', left: '35%', x: 35, y: 58 },
        { top: '65%', left: '41%', x: 42, y: 67 },
        { top: '65%', left: '80%', x: 80, y: 66 },
        { top: '80%', left: '80%', x: 80, y: 81 }
      ].map((pos, index) => {
        const existingTower = tower.find(t => t.positionX === pos.x && t.positionY === pos.y);
        
        // Only render if there's an existing tower or if a tower type is selected
        const shouldShow = existingTower || selectedTowerType;
        
        return shouldShow ? (
          <img
            key={index}
            id={existingTower?.id || `building-site-${index}`}
            src={existingTower ? existingTower.src : '/buildingSite.png'}
            className='absolute w-14 h-14 z-10 hover:opacity-75 transition-opacity'
            style={{ 
              top: pos.top, 
              left: pos.left,
              transform: existingTower?.furthestEnemyInRange?.[0] ? 
                getTowerRotation(existingTower, existingTower.furthestEnemyInRange[0]) : ''
            }}
            onClick={(event) => buyTowers(event, pos.x, pos.y)}
          />
        ) : null;
      })}
    </>
  )}
</div>
      {createEnemy()}
      {damageNumbers.map(num => (
  <DamageNumber
    key={num.id}
    damage={num.damage}
    x={num.x}
    y={num.y}
  />
))}
      {attackAnimation()}
      {renderExplosions()}
      {LingeringEffects()}
    </div>
    {upgradeTower()}
    </>
  );
};

export default Spawn;

