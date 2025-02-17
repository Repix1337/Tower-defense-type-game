import React, { useState, useEffect, useCallback} from 'react';
import { v4 as uuidv4 } from 'uuid';



// Define the props for the Spawn component
interface SpawnProps {
  round: number;
  setHealthPoints: React.Dispatch<React.SetStateAction<number>>;
  money: number;
  setMoney: React.Dispatch<React.SetStateAction<number>>;
  setRound: React.Dispatch<React.SetStateAction<number>>;
  hp: number;
  isSpeedUp: boolean;  
  isPaused: boolean;
  setCanPause: React.Dispatch<React.SetStateAction<boolean>>;
  selectedTowerType: string;
}

// Define the Enemy interface
interface Enemy {
  id: string;
  positionX: number;
  positionY: number;
  hp: number;
  speed: number;
  baseSpeed: number;
  isSlowed: boolean;
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
  poisonDamage: number;
  maxPoisonDamage: number;
  hasSpecialUpgrade: boolean;
  specialUpgradeAvailable: boolean;
  canStopRegen: boolean;
  src: string; // Add src property
  effectSrc: string; // Add effectSrc property
  explosionRadius: number;
}

const Spawn: React.FC<SpawnProps> = ({ round, setHealthPoints, money, setMoney, setRound, hp, isSpeedUp, isPaused, setCanPause, selectedTowerType }) => {
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
  
  // First, extract enemy types as constants
  const ENEMY_TYPES = {
    BASIC: {
      src: 'enemy1.png',
      hp: 100,
      damage: 5,
      type: 'basic',
      speed: 0.225,    // from 0.150 * 1.5
      baseSpeed: 0.225, // from 0.150 * 1.5
      regen: 0,
      canRegen: false
    },
    STEALTH: {
      src: 'enemy2.png',
      hp: 50,
      damage: 10,
      type: 'stealth',
      speed: 0.225,    // from 0.150 * 1.5
      baseSpeed: 0.225, // from 0.150 * 1.5
      regen: 0,
      canRegen: false
    },
    TANK: {
      src: 'enemy3.png',
      hp: 350,
      damage: 5,
      type: 'basic',
      speed: 0.1875,    // from 0.125 * 1.5
      baseSpeed: 0.1875, // from 0.125 * 1.5
      regen: 0,
      canRegen: false
    },
    SPEEDY: {
      src: 'enemy4.png',
      hp: 50,
      damage: 35,
      type: 'speedy',
      speed: 1.5,    // from 1.0 * 1.5
      baseSpeed: 1.5, // from 1.0 * 1.5
      regen: 0,
      canRegen: false
    },
    STEALTHYTANK: {
      src: 'stealthyTank.png',
      hp: 250,
      damage: 20,
      type: 'stealthytank',
      speed: 0.1875,    // from 0.125 * 1.5
      baseSpeed: 0.1875, // from 0.125 * 1.5
      regen: 0,
      canRegen: false
    },
    STEALTHYSPEEDY: {
      src: 'stealthySpeedy.png',
      hp: 50,
      damage: 50,
      type: 'stealthyspeedy',
      speed: 1.5,    // from 1.0 * 1.5
      baseSpeed: 1.5, // from 1.0 * 1.5
      regen: 0,
      canRegen: false
    },
    REGENTANK: {
      src: 'regenTank.png',
      hp: 400,
      damage: 50,
      type: 'regentank',
      speed: 0.1875,    // from 0.125 * 1.5
      baseSpeed: 0.1875, // from 0.125 * 1.5
      regen: 100,
      canRegen: true
    },
    SPEEDYREGENTANK: {
      src: 'regenTank.png',
      hp: 500,
      damage: 50,
      type: 'speedyregentank',
      speed: 0.35,    // from 0.2 * 1.5
      baseSpeed: 0.35, // from 0.2 * 1.5
      regen: 150,
      canRegen: true
    }
    ,
    BOSS: {
      src: 'boss.png',
      hp: 40000,
      damage: 1000,
      type: 'boss',
      speed: 0.175,    
      baseSpeed: 0.175, 
      regen: 1200,
      canRegen: true
    },
    ULTRATANKS: {
      src: 'ultraTank.png',
      hp: 1500,
      damage: 1000,
      type: 'ultratank',
      speed: 0.15,    
      baseSpeed: 0.15, 
      regen: 0,
      canRegen: false,
    }
  };

// Add this near ENEMY_TYPES constant
const TOWER_TYPES = {
  BASIC: {
    src: '/tower1.png',
    baseAttack: 40,
    attack: 40,
    baseAttackInterval: 1000,
    attackInterval: 1000, // renamed from attackSpeed
    price: 100,
    towerWorth: 100,
    type: 'basic',
    maxDamage: 200,
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
    src: '/tower2.png',
    baseAttack: 120,
    attack: 120,
    baseAttackInterval: 2000,
    attackInterval: 2000,
    price: 200,
    towerWorth: 200,
    type: 'sniper',
    maxDamage: 500,
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
    maxDamage: 75,
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
    maxDamage: 10,
    maxAttackInterval: 700,
    radius: 27,
    attackType: 'double',
    canHitStealth: false,
    slowAmount: 0.75,
    maxSlow: 0.5,
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
    maxPoisonDamage: 100,
    hasSpecialUpgrade: false,
    specialUpgradeAvailable: false,
    canStopRegen: false,
    explosionRadius: 0,
    effectSrc: '/poisonAttack.png'
  },
  MORTAR: {
    src: '/mortar.png',
    baseAttack: 50,
    attack: 50,
    baseAttackInterval: 7000,
    attackInterval: 7000,
    price: 1200,
    towerWorth: 1200,
    type: 'mortar',
    maxDamage: 250,
    maxAttackInterval: 4500,
    radius: 40,
    attackType: 'explosion',
    canHitStealth: false,
    poisonDamage: 0,
    maxPoisonDamage: 0,
    hasSpecialUpgrade: false,
    specialUpgradeAvailable: false,
    canStopRegen: false,
    explosionRadius: 20,
    effectSrc: '/sniperAttack.png'
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
const createNewTower = (type: keyof typeof TOWER_TYPES, positionX: number, positionY: number, id: string) => ({
  id: id,
  positionX: positionX,
  positionY: positionY,
  furthestEnemyInRange: null,
  isAttacking: false,
  targettingType: "first",
  damageDone: 0,
  ...TOWER_TYPES[type]
});

// Then, create helper function for spawning enemies
const createNewEnemy = (type: keyof typeof ENEMY_TYPES) => ({
  id: uuidv4(),
  positionX: -6,
  positionY: 54,
  isTargeted: false,
  isSlowed: false,
  isPoisoned: false,
  ...ENEMY_TYPES[type]
});

useEffect(() => {
  if (hp <= 0) {
    alert('Game Over! You lost!');
    resetGame();
  }
}, [hp]);

useEffect(() => {
  if (!isPageVisible || isPaused) return; // Add isPaused check
  const spawnEnemies = () => {
    // Check for game over first
    if (round > 40 && enemies.length === 0) {
      alert('Congratulations! You won!');
      resetGame();
      return;
    }

    // Early rounds - Basic enemies
    if ((round > 0 && round <= 4) || (round > 5 && round < 10)) {
      if (enemyCount < 10 * round) {
        setEnemies(prev => [...prev, createNewEnemy('BASIC')]);
        setEnemyCount(prev => prev + 1);
      }
      if (round === 4 && enemyCount === 0 )
      {
        alert("!!!Stealth enemies incoming next round!!!")
      }
    }
    // Boss round - Stealth enemies
    else if (round === 5 && enemyCount < 10 * round) {
      const enemyType = enemyCount % 2 === 0 ? 'STEALTH' : 'SPEEDY';
      setEnemies(prev => [...prev, createNewEnemy(enemyType)]);
      setEnemyCount(prev => prev + 1);
    }
    // Later rounds - Mixed enemies
    else if (round >= 10 && round <= 15 && enemyCount < 10 * round) {
      const enemyType = enemyCount % 3 === 0 ? 'STEALTH' : 
                       enemyCount % 3 === 1 ? 'SPEEDY' : 'BASIC';
      setEnemies(prev => [...prev, createNewEnemy(enemyType)]);
      setEnemyCount(prev => prev + 1);
    }
    else if (round > 15 && round <= 21 && enemyCount < 10 * round) {
      const enemyType = enemyCount % 3 === 0 ? 'STEALTH' : 
                       enemyCount % 3 === 1 ? 'SPEEDY' : 'TANK';
      setEnemies(prev => [...prev, createNewEnemy(enemyType)]);
      setEnemyCount(prev => prev + 1);
    }
    else if (round === 22 && enemyCount < 10 * round) {
      setEnemies(prev => [...prev, createNewEnemy("REGENTANK")]);
      setEnemyCount(prev => prev + 1);
    }
    else if (round >= 23 && round <= 25 && enemyCount < 15 * round) {
      const enemyType = enemyCount % 3 === 0 ? 'STEALTHYTANK' : 
                       enemyCount % 3 === 1 ? 'STEALTHYSPEEDY' : 'REGENTANK';
      setEnemies(prev => [...prev, createNewEnemy(enemyType)]);
      setEnemyCount(prev => prev + 1);
    }
    else if (round >= 26 && round <= 31 && enemyCount < 15 * round) {
      const enemyType = enemyCount % 2 === 0 ? 'STEALTHYTANK' 
                        : 'SPEEDYREGENTANK';
      setEnemies(prev => [...prev, createNewEnemy(enemyType)]);
      setEnemyCount(prev => prev + 1);
    }
    else if (round === 32) {
      if (enemyCount < 320) {  // Changed from 15 * round to fixed 80
        setEnemies(prev => [...prev, createNewEnemy("BOSS")]);
        setEnemyCount(prev => prev + 80);
      }
    }
    else if (round > 32 && round <= 39) {
      if (enemyCount < 15 * round) {  // Changed from 15 * round to fixed 45
        setEnemies(prev => [...prev, createNewEnemy("ULTRATANKS")]);
        setEnemyCount(prev => prev + 3);
      }
    }
    else if (round === 40) {
      if (enemyCount < 15 * round) {  // Changed from 15 * round to fixed 40
        setEnemies(prev => [...prev, createNewEnemy("BOSS")]);
        setEnemyCount(prev => prev + 40);
      }
    }
    // Game reset
else if (round === 0) {
setEnemies([]);
}
  };

  const spawnInterval = setInterval(() => {
    if (round > 0) {
      spawnEnemies();
    }
  }, (round === 32  ? (isSpeedUp ? 2500 : 1250) : Math.max(1000 / round, 50)) / (isSpeedUp ? 2 : 1));

  // Cleanup
  return () => clearInterval(spawnInterval);
}, [round, enemyCount, enemies.length, isPageVisible, isSpeedUp, isPaused]); 


useEffect(() => {
  if (isPaused) return; // Add isPaused check
  if (enemies.length === 0 && (enemyCount >= 10 * round || enemyCount >= 15 * round)) {
    setCanPause(true); // Allow pausing when round is over
    
    const roundTimeout = setTimeout(() => {
      setRound(prev => prev + 1);
      setEnemyCount(0);
      setCanPause(false); // Disable pausing when new round starts
    }, 4000 / (isSpeedUp ? 2 : 1));

    return () => clearTimeout(roundTimeout);
  }
}, [enemies.length, enemyCount, round, isSpeedUp, isPaused]);

useEffect(() => {
  if (round > 0) {
    setCanPause(false); // Disable pausing when round is active
  }
}, [round]);

  // Enemy movement - updates position every 25ms
  useEffect(() => {
    if (!isPageVisible || round <= 0 || isPaused) return; 

    const interval = setInterval(moveEnemy, isSpeedUp ? 12.5 : 25); // Twice as fast when speed up
    return () => clearInterval(interval);
  }, [round, isPageVisible, isSpeedUp, isPaused]); // Add isPaused to dependencies

  // Heal enemy every second if it has health regeneration
  useEffect(() => {
    if (!isPageVisible || round <= 0 || isPaused) return; 

    const interval = setInterval(() => {
      setEnemies((prevEnemies) => 
        prevEnemies.map((enemy) => 
          enemy.regen > 0 && enemy.canRegen ? {...enemy, hp: enemy.hp + enemy.regen} : enemy
        )
      )
    }, 1500 / (isSpeedUp ? 2 : 1));
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
  
    setEnemies((prevEnemies) => {
      let updatedEnemies;
      if (tower.attackType === 'explosion') {
        const primaryTarget = targets[0]; // Get the main target
        const enemiesInExplosionRadius = prevEnemies.filter(enemy => {
          if (enemy.hp <= 0 || enemy.id === primaryTarget.id) return false; // Skip dead enemies and primary target
  
          // Calculate distance between primary target and other enemies
          const dx = enemy.positionX - primaryTarget.positionX;
          const dy = enemy.positionY - primaryTarget.positionY;
          const distance = Math.sqrt(dx * dx + dy * dy);
  
          return distance <= tower.explosionRadius;
        });
        setExplosionEffects(prev => [...prev, {
          id: uuidv4(),
          positionX: primaryTarget.positionX,
          positionY: primaryTarget.positionY,
          timestamp: Date.now()
        }]);
  
        // Remove explosion effect after animation
        setTimeout(() => {
          setExplosionEffects(prev =>
            prev.filter(effect => effect.positionX !== primaryTarget.positionX)
          );
        }, 300);
        let explosionDamageTotal = 0;
        updatedEnemies = prevEnemies.map(enemy => {
          if (enemy.hp <= 0) return enemy;
  
          if (enemy.id === primaryTarget.id) {
            // Calculate actual damage for primary target
            const actualDamage = Math.max(Math.min(tower.attack, enemy.hp), 0);
            explosionDamageTotal += actualDamage;
            return {
              ...enemy,
              isTargeted: true,
              hp: enemy.hp - tower.attack
            };
          }
  
          if (enemiesInExplosionRadius.some(e => e.id === enemy.id)) {
            const splashDamage = tower.attack / 2;
            const actualDamage = Math.min(splashDamage, enemy.hp);
            explosionDamageTotal += actualDamage; // Add to total damage
            return {
              ...enemy,
              isTargeted: true,
              hp: enemy.hp - splashDamage
            };
          }
          return enemy;
        });
        totalDamageDealt = explosionDamageTotal;
        setMoney(prevMoney => prevMoney + Math.floor(Math.max(explosionDamageTotal, 0) / 12.5));
      } else {
        // Non-explosion attack logic
        updatedEnemies = prevEnemies.map((enemy) => {
          const isTargeted = targets.some(target => target.id === enemy.id);
          if (!isTargeted) return enemy;
      
          const actualDamage = Math.min(tower.attack, enemy.hp);
          totalDamageDealt += actualDamage;
      
          const updatedEnemy = {
            ...enemy,
            isTargeted: true,
            hp: Math.max(enemy.hp - actualDamage, 0),
            speed: tower.type === "slower" && tower.slowAmount ? 
              Math.max(enemy.speed * tower.slowAmount, enemy.baseSpeed * tower.slowAmount) :
              enemy.speed
          };
      
          if (tower.type === "gasspitter") {
            return {
              ...updatedEnemy,
              isPoisoned: true,
              poisonSourceId: tower.id,
              poisonStartTime: Date.now(),
              canRegen: tower.canStopRegen ? false : true
            };
          }
          if (tower.type === "slower") {
            return {
              ...updatedEnemy,
              isSlowed: true,
              slowSourceId: tower.id,
              slowStartTime: Date.now()
            };
          }
          return updatedEnemy;
        });
      }
      return updatedEnemies;
    });

    // Update money after enemies state is updated
    if (tower.type !== "explosion"){
      setMoney(prevMoney => prevMoney + Math.floor(Math.max(tower.attack, 0) / 10));
    }
    

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
  
    setAttackEffects((prevEffects) => [...prevEffects, ...newEffects]);
    const timeoutId = setTimeout(() => {
      if (!isPaused) {
        setAttackEffects((prevEffects) => 
          prevEffects.filter((effect) => !newEffects.find(e => e.id === effect.id))
        );
  
        setTower((prevTowers) =>
          prevTowers.map((t) =>
            t.id === tower.id ? { 
              ...t, 
              isAttacking: false, 
              damageDone: t.damageDone + totalDamageDealt /2 // Add damage only once
            } : t
          )
        );
        setEnemies((prevEnemies) =>
          prevEnemies.map((enemy) => {
            const wasTargeted = targets.some(target => target.id === enemy.id);
            return wasTargeted ? { ...enemy, isTargeted: false } : enemy;
          })
        );
      }
    }, tower.attackInterval / (isSpeedUp ? 2 : 1));
  
    return () => clearTimeout(timeoutId);
  
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

  // Create enemy elements
  const createEnemy = () => {
    if (round > 0) {
      return enemies.map((enemy) => (
        <img
          key={enemy.id}
          src={enemy.src}
          alt='enemy'
          style={{
            position: 'absolute',
            top: `${enemy.positionY}%`,
            left: `${enemy.positionX}%`,
            transform: 'translateY(-50%)',
            zIndex: 10,
          }}
          className='w-12 h-12'
        />
      ));
    }
  };

  // Move enemies by updating their position
  const moveEnemy = () => {
    setEnemies((prevEnemies) =>
      prevEnemies
        .map((enemy) => {
          // Define waypoints/checkpoints for the path
          if (enemy.positionX < 28) {
            // First segment - Move right until x=30
            return { ...enemy, positionX: enemy.positionX + enemy.speed, positionY: enemy.positionY - enemy.speed / 10};
          } else if (enemy.positionX >= 28 && enemy.positionX < 52 && enemy.positionY > 15) {
            // Second segment - Move up until y=15
            return { ...enemy, positionY: enemy.positionY - (enemy.speed * 2), positionX: enemy.positionX + enemy.speed / 3 };
          } else if (enemy.positionY <= 15 && enemy.positionX < 52) {
            // Third segment - Move right until x=50
            return { ...enemy, positionX: enemy.positionX + enemy.speed };
          } else if (enemy.positionX >= 52 && enemy.positionX < 75 && enemy.positionY < 87) {
            // Fourth segment - Move down until y=85
            return { ...enemy, positionY: enemy.positionY + enemy.speed * 2 };
          } else if (enemy.positionY >= 87 && enemy.positionX < 75) {
            // Fifth segment - Move right until x=70
            return { ...enemy, positionX: enemy.positionX + enemy.speed };
          } else if (enemy.positionX >= 75 && enemy.positionY > 50) {
            // Sixth segment - Move up until y=50
            return { ...enemy, positionY: enemy.positionY - (enemy.speed * 2), positionX: enemy.positionX + enemy.speed / 10};
          } else {
            // Final segment - Move right until end
            return { ...enemy, positionX: enemy.positionX + enemy.speed };
          }
        })
        .filter((enemy) => enemy.hp > 0)
    );
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
  
    const slowInterval = setInterval(() => {
      const currentTime = Date.now();
      const SLOW_DURATION = isSpeedUp ? 3000 : 6000;
  
      setEnemies(prevEnemies => {
        let hasChanges = false;
        const updatedEnemies = prevEnemies.map(enemy => {
          if (!enemy.isSlowed || !enemy.slowSourceId || !enemy.slowStartTime) return enemy;
          
          if (currentTime - enemy.slowStartTime >= SLOW_DURATION) {
            hasChanges = true;
            return {
              ...enemy,
              speed: enemy.baseSpeed,
              isSlowed: false,
              slowSourceId: undefined,
              slowStartTime: undefined,

            };
          }
          return enemy;
        });
  
        // Only return new array if there were actual changes
        return hasChanges ? updatedEnemies : prevEnemies;
      });
    }, 1000); // Check every second instead of every render
  
    return () => clearInterval(slowInterval);
  }, [isPageVisible, isPaused, isSpeedUp]); // Only include stable dependencies
  useEffect(() => {
    if (!isPageVisible || isPaused) return;
           
    const POISON_TICK_RATE = isSpeedUp ? 5 : 10; 
    const POISON_DURATION = isSpeedUp ? 2000 : 4000; 
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
  
          return {
            ...enemy,
            hp: enemy.hp - actualPoisonDamage
          };
        });
  
        // Update tower damage counters and add money for poison damage
        setTower(prevTowers =>
          prevTowers.map(t => ({
            ...t,
            damageDone: t.damageDone + (poisonDamageByTower[t.id] || 0)
          }))
        );
  
        // Add money for poison damage
        const totalPoisonDamage = Object.values(poisonDamageByTower).reduce((sum, damage) => sum + damage, 0);
        if (totalPoisonDamage > 0) {
          setMoney(prevMoney => prevMoney + totalPoisonDamage / 7.5);
        }
  
        return updatedEnemies;
      });
    }, POISON_TICK_RATE);
  
    return () => clearInterval(poisonInterval);
  }, [enemies, tower, isPageVisible, isSpeedUp, isPaused, setMoney]);
  // Buy towers and place them on the map
  const buyTowers = (event: React.MouseEvent<HTMLImageElement>, positionX: number, positionY: number) => {
    if (round > 0 && selectedTowerType && (event.target as HTMLImageElement).src.includes('buildingSite')) {
      const newTowerId = `tower-${uuidv4()}`; // Add 'tower-' prefix
      (event.target as HTMLImageElement).id = newTowerId;
      
      
      // Check if we have enough money for the selected tower
      const towerConfig = TOWER_TYPES[selectedTowerType.toUpperCase() as keyof typeof TOWER_TYPES];
      if (towerConfig && money >= towerConfig.price) {
        (event.target as HTMLImageElement).src = towerConfig.src;
        setMoney((prevMoney) => prevMoney - towerConfig.price);
        setTower((prevTower) => [...prevTower, createNewTower(selectedTowerType.toUpperCase() as keyof typeof TOWER_TYPES, positionX, positionY, newTowerId)]);
      }
    } else if (round > 0 && !(event.target as HTMLImageElement).src.includes('buildingSite')) {
      setShowUpgradeMenu(true);
      setSelectedTowerID((event.target as HTMLImageElement).id);
    }
  };
  
const upgradeTower = () => {
  if (showUpgradeMenu) {
    const selectedTower = tower.find(t => t.id === selectedTowerID);
    
    if (!selectedTower) return null;

    return (
      <div 
        data-upgrade-menu
        className='absolute top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 bg-slate-800 
          flex items-start justify-between p-6 rounded-lg gap-6 shadow-lg border border-blue-400'
        style={{left: selectedTower.positionX < 50 ? '70%' : '30%', width: '700px'}}
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside menu from bubbling up
      >
        {/* Left side - Upgrade buttons */}
        <div className='flex flex-col space-y-3 w-1/2'>
          <h1 className="text-2xl font-bold mb-4 text-white border-b border-blue-400 pb-2">Upgrade Menu</h1>
          
          {/* Damage Upgrade */}
          {selectedTower.attack < selectedTower.maxDamage ? (
            <button 
              className="bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 
                text-white font-bold py-3 px-4 rounded-lg w-full transition-all duration-200 shadow-md
                disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={upgradeDamage}
              disabled={money < 300}
            >
              Upgrade Damage (300$ for {selectedTower.maxDamage / 5}dmg)
            </button>
          ) : (
            <div className="bg-gray-700 text-gray-300 font-bold py-3 px-4 rounded-lg w-full text-center">
              Max Damage Reached
            </div>
          )}

          {/* Attack Interval Upgrade */}
          {selectedTower.attackInterval > selectedTower.maxAttackInterval ? (
            <button 
              className="bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 
                text-white font-bold py-3 px-4 rounded-lg w-full transition-all duration-200 shadow-md
                disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={upgradeAttackInterval}
              disabled={money < 300}
            >
              Upgrade Attack Interval (300$ for -{(selectedTower.baseAttackInterval - selectedTower.maxAttackInterval) / 5  }ms)
            </button>
          ) : (
            <div className="bg-gray-700 text-gray-300 font-bold py-3 px-4 rounded-lg w-full text-center">
              Min Attack Interval Reached
            </div>
          )}

          {/* Double Attack Upgrade */}
          {selectedTower.attackType === 'single' ? (
            <button 
              className="bg-gradient-to-r from-purple-500 to-purple-700 hover:from-purple-600 hover:to-purple-800 
                text-white font-bold py-3 px-4 rounded-lg w-full transition-all duration-200 shadow-md
                disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={upgradeDoubleAttack}
              disabled={money < 1500}
            >
              Upgrade Double Attack (1500$)
            </button>
          ) : selectedTower.type === "basic" ? (
            <div className="bg-gray-700 text-gray-300 font-bold py-3 px-4 rounded-lg w-full text-center">
              Already have double attack
            </div>
          ) : null}

          {/* Triple Attack Upgrade */}
          {selectedTower.type === "rapidShooter" && selectedTower.attackType === 'double' ? (
            <button 
              className="bg-gradient-to-r from-indigo-500 to-indigo-700 hover:from-indigo-600 hover:to-indigo-800 
                text-white font-bold py-3 px-4 rounded-lg w-full transition-all duration-200 shadow-md
                disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={upgradeTotripleAttack}
              disabled={money < 2500}
            >
              Upgrade Triple Attack (2500$)
            </button>
          ) : selectedTower.type === "rapidShooter" ? (
            <div className="bg-gray-700 text-gray-300 font-bold py-3 px-4 rounded-lg w-full text-center">
              Already have Triple Attack
            </div>
          ) : null}

          {/* Stealth Detection Upgrade */}
          {!selectedTower.canHitStealth ? (
            <button 
              className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 
                text-white font-bold py-3 px-4 text-center rounded-lg w-full transition-all duration-200 shadow-md
                disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={upgradeToHitStealth}
              disabled={money < 2000}
            >
              Stealth Enemies Detection (2000$)
            </button>
          ) : (
            <div className="bg-gray-700 text-gray-300 font-bold py-3 px-4 rounded-lg w-full text-center">
              Already detect stealth enemies
            </div>
          )}

          {/* Slow Amount Upgrade */}
          {selectedTower.type === "slower" && selectedTower.slowAmount !== selectedTower.maxSlow ? (
            <button 
              className="bg-gradient-to-r from-cyan-500 to-cyan-700 hover:from-cyan-600 hover:to-cyan-800 
                text-white font-bold py-3 px-4 rounded-lg w-full transition-all duration-200 shadow-md
                disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={upgradeSlow}
              disabled={money < 1000}
            >
              Upgrade Slow (1000$)
            </button>
          ) : selectedTower.type === "slower" ? (
            <div className="bg-gray-700 text-gray-300 font-bold py-3 px-4 rounded-lg w-full text-center">
              Slow already upgraded
            </div>
          ) : null}
           {selectedTower.type === "gasspitter" && selectedTower.poisonDamage !== selectedTower.maxPoisonDamage ? (
            <button 
              className="bg-gradient-to-r from-cyan-500 to-cyan-700 hover:from-cyan-600 hover:to-cyan-800 
                text-white font-bold py-3 px-4 rounded-lg w-full transition-all duration-200 shadow-md
                disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={upgradePoison}
              disabled={money < 500}
            >
              Upgrade Poison(500$ for +80 dmg)
            </button>
          ) : selectedTower.type === "gasspitter" ? (
            <div className="bg-gray-700 text-gray-300 font-bold py-3 px-4 rounded-lg w-full text-center">
              Poison is maxed out
            </div>
          ) : null}
          {checkSpecialUpgradeAvailability(selectedTower) && !selectedTower.hasSpecialUpgrade ? (
  <button 
    className="bg-gradient-to-r from-yellow-500 to-yellow-700 hover:from-yellow-600 hover:to-yellow-800 
      text-white font-bold py-3 px-4 rounded-lg w-full transition-all duration-200 shadow-md
      disabled:opacity-50 disabled:cursor-not-allowed"
    onClick={upgradeSpecial}
    disabled={money < 20000}
  >
    {getSpecialUpgradeText(selectedTower.type)}
  </button>
) : selectedTower.hasSpecialUpgrade ? (
  <div className="bg-gray-700 text-gray-300 font-bold py-3 px-4 rounded-lg w-full text-center">
    Special Upgrade Active
  </div>
) : null}
          {/* Control Buttons */}
          <div className="flex gap-2 mt-4">
            <button 
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex-1 
                transition-all duration-200 shadow-md"
              onClick={() => sellTower(selectedTower.towerWorth)}
            >
              Sell Tower ({Math.floor(selectedTower.towerWorth * 0.75)}$)
            </button>
            <button 
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg flex-1 
                transition-all duration-200 shadow-md"
              onClick={closeUpgradeMenu}
            >
              Close
            </button>
          </div>
        </div>

        {/* Right side - Stats */}
        <div className='bg-slate-700 p-4 rounded-lg space-y-4 w-1/2'>
          <h2 className="text-xl font-bold text-white border-b border-blue-400 pb-2">Tower Stats</h2>
          
          <div className="space-y-3 text-gray-200">
  <div>
    <div className="flex justify-between items-center mb-1">
      <span>Attack:</span>
      <span>{selectedTower.attack} / {selectedTower.maxDamage}</span>
    </div>
    <div className="w-full bg-gray-600 rounded-full h-2">
      <div className="bg-red-500 h-2 rounded-full" 
        style={{width: `${(selectedTower.attack / selectedTower.maxDamage) * 100}%`}}
      />
    </div>
    <span className="text-xs text-gray-400">
      ({Math.floor((selectedTower.maxDamage - selectedTower.attack) / (selectedTower.maxDamage / 5))} upgrades left)
    </span>
  </div>

  <div>
    <div className="flex justify-between items-center mb-1">
      <span>Attack Interval:</span>
      <span>{selectedTower.attackInterval} / {selectedTower.maxAttackInterval}</span>
    </div>
    <div className="w-full bg-gray-600 rounded-full h-2">
      <div className="bg-blue-500 h-2 rounded-full" 
        style={{width: `${((selectedTower.attackInterval - selectedTower.maxAttackInterval) / (selectedTower.baseAttackInterval - selectedTower.maxAttackInterval)) * 100}%`}}
      />
    </div>
    <span className="text-xs text-gray-400">
      ({Math.ceil((selectedTower.attackInterval - selectedTower.maxAttackInterval) / ((selectedTower.baseAttackInterval - selectedTower.maxAttackInterval) / 5))} upgrades left)
    </span>
  </div>
  
  {selectedTower.type === "gasspitter" && selectedTower.maxPoisonDamage != undefined && selectedTower.poisonDamage != undefined && (
  <div>
    <div className="flex justify-between items-center mb-1">
      <span>Poison Damage:</span>
      <span>{selectedTower.poisonDamage * 4} / {selectedTower.maxPoisonDamage * 4}</span>
    </div>
    <div className="w-full bg-gray-600 rounded-full h-2">
      <div className="bg-green-500 h-2 rounded-full" 
        style={{width: `${(selectedTower.poisonDamage / selectedTower.maxPoisonDamage) * 100}%`}}
      />
    </div>
    <span className="text-xs text-gray-400">
      ({Math.floor((selectedTower.maxPoisonDamage - selectedTower.poisonDamage) / 20)} upgrades left)
    </span>
  </div>
  )}
            <div className="pt-2 border-t border-gray-600">
              <div>Attack Type: {selectedTower.attackType}</div>
              <div>Can hit stealth: {selectedTower.canHitStealth ? 'Yes' : 'No'}</div>
              <div>Damage done to enemies: {Math.floor(selectedTower.damageDone)}</div>
              {selectedTower.type === "slower" && (
                <div>
                  <div>Slow Amount: {selectedTower.slowAmount ? selectedTower.slowAmount.toFixed(2) : 'N/A'} / {selectedTower.maxSlow}</div>
                  <span className="text-xs text-gray-400">
                    ({selectedTower.slowAmount !== undefined ? Math.floor((selectedTower.slowAmount - (selectedTower.maxSlow ?? 0)) / 0.25) : 0} upgrades left)
                  </span>
                </div>
              )}
              <div>
                Targetting:
              <button 
              className="bg-blue-400 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg flex-1 
                transition-all duration-200 shadow-md w-[100%]"
              onClick={changeTowerTargetting}
            >
            {selectedTower.targettingType === "first" ? "First" : selectedTower.targettingType === "highestHp" ? "Highest HP" : "Last"}
            </button>
            </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};
  const closeUpgradeMenu = () => {
    setShowUpgradeMenu(false);
  }
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
  const upgradeDamage = () => {
    if (money >= 300){
      setMoney((prevMoney) => prevMoney - 300);
      setTower((prevTower) => 
        prevTower.map((t) =>
          t.id === selectedTowerID ? { ...t, attack: Math.min(t.attack + (t.maxDamage / 5) , t.maxDamage), towerWorth: t.towerWorth + 300 } : t
        )
      );
    }
    
  }
  const upgradeAttackInterval = () => {
    if (money >= 300){
      setMoney((prevMoney) => prevMoney - 300);
      setTower((prevTower) => 
        prevTower.map((t) =>
          t.id === selectedTowerID ? { ...t, attackInterval: Math.max(t.attackInterval - ((t.baseAttackInterval - t.maxAttackInterval) / 5), t.maxAttackInterval), towerWorth: t.towerWorth + 300 } : t
        )
      );
    }
  }
  const upgradeDoubleAttack = () => {
    if (money >= 1500){
      setMoney((prevMoney) => prevMoney - 1500);
      setTower((prevTower) => 
        prevTower.map((t) =>
          t.id === selectedTowerID ? { ...t,  attackType: 'double', towerWorth: t.towerWorth + 1500 } : t
        )
      );
    }
  }
  const upgradeTotripleAttack = () => {
    if (money >= 2500){
      setMoney((prevMoney) => prevMoney - 2500);
      setTower((prevTower) => 
        prevTower.map((t) =>
          t.id === selectedTowerID ? { ...t, attackType: 'triple', towerWorth: t.towerWorth + 2500} : t
        )
      );
    }
  }
  const upgradeToHitStealth = () => {
    if (money >= 2000){
      setMoney((prevMoney) => prevMoney - 2000);
      setTower((prevTower) => 
        prevTower.map((t) =>
          t.id === selectedTowerID ? { ...t, canHitStealth: true, towerWorth: t.towerWorth + 2000} : t
        )
      );
    }
  }
  const upgradeSlow = () => {
    if (money >= 1000){
      setMoney((prevMoney) => prevMoney - 1000);
      setTower((prevTower) => 
        prevTower.map((t) =>
          t.id === selectedTowerID ? { ...t, slowAmount: Math.max((t.slowAmount ?? 0) - 0.25, t.maxSlow ?? 0), towerWorth: t.towerWorth + 1000 } : t
        )
      );
    }
  }
  const upgradePoison = () => {
    if (money >= 500){
      setMoney((prevMoney) => prevMoney - 500);
      setTower((prevTower) => 
        prevTower.map((t) =>
          t.id === selectedTowerID && t.poisonDamage !== undefined && t.maxPoisonDamage !== undefined ?
          { ...t, poisonDamage: Math.min(t.poisonDamage + 20, t.maxPoisonDamage), towerWorth: t.towerWorth + 500 } : t
        )
      );
    }
  }
  const sellTower = (towerPrice: number) => {
    setMoney((prevMoney) => prevMoney + towerPrice / 1.5); // Add money back (changed from subtract)
    setTower((prevTower) => 
        prevTower.filter((t) => t.id !== selectedTowerID) // Filter out the selected tower
    );
    
    // Reset the building site image
    const towerElement = document.getElementById(selectedTowerID) as HTMLImageElement;
    if (towerElement) {
        towerElement.src = '/buildingSite.png';
    }
    
    setShowUpgradeMenu(false); // Close the upgrade menu after selling
};
  // Component for attack animation
  const attackAnimation = () => {
    return attackEffects.map((effect) => (
        <img
          src={effect.effectSrc}
          key={effect.id}
          className='z-20 animate-slide h-6 w-6 absolute text-red-500'
          style={{
            '--tower-positionX': `${effect.towerPositionX + 1}%`,
            '--tower-positionY': `${effect.towerPositionY + 2.5}%`,
            '--enemy-positionX': `${effect.enemyPositionX + 1.5}%`,
            '--enemy-positionY': `${effect.enemyPositionY}%`,
            left: `${effect.towerPositionX}%`,
            animationDuration: `${isSpeedUp ? '50ms' : '100ms'}`,
          } as React.CSSProperties}
        />
          
      ));
  };
  const upgradeSpecial = () => {
    if (money >= 20000) {
      setMoney(prev => prev - 20000);
      setTower(prevTower => 
        prevTower.map(t => {
          if (t.id === selectedTowerID) {
            t.towerWorth = t.towerWorth + 20000
            switch(t.type) {
              case 'basic':
                return { 
                  ...t, 
                  hasSpecialUpgrade: true, 
                  attack: t.attack * 2.25, 
                  maxDamage: t.maxDamage * 2.25,
                  radius: t.radius * 1.4, 
                  src: '/basicSpecial.png' 
                };
              case 'sniper':
                return { 
                  ...t, 
                  hasSpecialUpgrade: true, 
                  attack: t.attack * 4,
                  maxDamage: t.maxDamage * 4,
                  src: '/sniperSpecial.png'
                };
              case 'rapidShooter':
                return { 
                  ...t, 
                  hasSpecialUpgrade: true, 
                  attack: t.attack * 1.5,
                  maxDamage: t.maxDamage * 1.5,
                  attackInterval: t.attackInterval * 0.6, 
                  maxAttackInterval: t.maxAttackInterval * 0.6,
                  attackType: "quadruple",
                  src: '/rapidShooterSpecial.png'
                };
              case 'slower':
                return { 
                  ...t, 
                  hasSpecialUpgrade: true, 
                  slowAmount: t.slowAmount ? t.slowAmount * 0.5 : t.slowAmount,
                  maxSlow: t.maxSlow ? t.maxSlow * 0.5 : t.maxSlow,
                  attackType: "triple",
                  src: '/slowerSpecial.png'
                };
              case 'gasspitter':
                return { 
                  ...t, 
                  hasSpecialUpgrade: true, 
                  poisonDamage: t.poisonDamage * 4,
                  maxPoisonDamage: t.maxPoisonDamage * 4,
                  canStopRegen: true,
                  src: '/gasSpitterSpecial.png'
                };
              case 'mortar':
                return { 
                    ...t, 
                    hasSpecialUpgrade: true, 
                    attack: t.attack * 2, 
                    maxDamage: t.maxDamage * 2,
                    radius: t.radius * 1.5, 
                    explosionRadius: t.explosionRadius * 1.25,
                    src: '/mortarSpecial.png'
                };
              default:
                return t;
            }
          }
          return t;
        })
      );
  
      // Update the tower image in the DOM
      const towerElement = document.getElementById(selectedTowerID) as HTMLImageElement;
      if (towerElement) {
        const selectedTower = tower.find(t => t.id === selectedTowerID);
        if (selectedTower) {
          switch(selectedTower.type) {
            case 'basic':
              towerElement.src = '/basicSpecial.png';
              break;
            case 'sniper':
              towerElement.src = '/sniperSpecial.png';
              break;
            case 'rapidShooter':
              towerElement.src = '/rapidShooterSpecial.png';
              break;
            case 'slower':
              towerElement.src = '/slowerSpecial.png';
              break;
            case 'gasspitter':
              towerElement.src = '/gasSpitterSpecial.png';
              break;
            case 'mortar':
              towerElement.src = '/mortarSpecial.png';
                break;
          }
        }
      }
    }
  };
  const getSpecialUpgradeText = (towerType: string) => {
    switch(towerType) {
      case 'basic':
        return "Artillery(20000$)";
      case 'sniper':
        return "Rail Gun(20000$)";
      case 'rapidShooter':
        return "Gatling Gun (20000$)";
      case 'slower':
        return "Cryogen(20000$)";
      case 'gasspitter':
        return "Acid Spitter (20000$)";
        case 'mortar':
          return "Armageddon (20000$)";
      default:
        return "Special Upgrade (20000$)";
    }
  };
  
  // Add this function to check if all upgrades are purchased
const checkSpecialUpgradeAvailability = (tower: Tower) => {
  const baseConditions = 
    tower.attack === tower.maxDamage &&
    tower.attackInterval === tower.maxAttackInterval &&
    tower.canHitStealth;

  switch(tower.type) {
    case 'basic':
      return baseConditions && tower.attackType === 'double';
    case 'sniper':
      return baseConditions && tower.attackType === 'double';
    case 'rapidShooter':
      return baseConditions && tower.attackType === 'triple';
    case 'slower':
      return baseConditions && tower.slowAmount === tower.maxSlow;
    case 'gasspitter':
      return baseConditions && tower.poisonDamage === tower.maxPoisonDamage;
    case 'mortar':
      return baseConditions;
    default:
      return false;
  }
};
const renderExplosions = () => {
  return explosionEffects.map((effect) => {
    // Find the tower that caused this explosion
    const explosionTower = tower.find(t => t.attackType === 'explosion');
    const explosionSize = explosionTower ? explosionTower.explosionRadius * 2 : 50; // Default to 50 if no tower found

    return (
      <div
        key={effect.id}
        className="absolute rounded-full animate-explosion z-30"
        style={{
          left: `${effect.positionX}%`,
          top: `${effect.positionY}%`,
          width: `${explosionSize / 1.5}%`,
          height: `${explosionSize / 1.5}%`,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(255,0,0,0.5) 0%, rgba(255,0,0,0) 70%)',
        }}
      />
    );
  });
};

// Add this new component near your other components
const RangeIndicator = ({ tower }: { tower: Tower }) => {
  const gameAreaWidth = 100; // Adjust this value based on your game area width
  const gameAreaHeight = 100; // Adjust this value based on your game area height

  return showUpgradeMenu && tower.id === selectedTowerID && (
    <div
      className="absolute rounded-full border-2 border-blue-400 pointer-events-none"
      style={{
        width: `${(tower.radius * 2) / gameAreaWidth * 100}%`,    // Adjusted for game area width
        height: `${(tower.radius * 2) / gameAreaHeight * 100}%`,   // Adjusted for game area height
        left: `${tower.positionX}%`,
        top: `${tower.positionY}%`,
        transform: 'translate(-50%, -50%)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        zIndex: 5,
      }}
    />
  )
}

// Add this function near your other event handlers
const handleOutsideClick = (event: React.MouseEvent) => {
  // Check if the click was outside the upgrade menu
  const upgradeMenu = document.querySelector('[data-upgrade-menu]');
  if (upgradeMenu && !upgradeMenu.contains(event.target as Node)) {
    setShowUpgradeMenu(false);
  }
};

  return (
    <>
   <div 
      className='relative min-h-[75vh] w-full border border-white overflow-hidden' 
      suppressHydrationWarning
      onClick={handleOutsideClick}
    >
  <img 
    src='/map.png' 
    className=' w-full h-full object-fill top-0 left-0 z-0' 
    alt='map' 
  />
      {/* Add range indicators for all towers */}
      {tower.map((t) => (
        <RangeIndicator key={`range-${t.id}`} tower={t} />
      ))}
      <div>
  {round > 0 && (
    <>
      {[
        { top: '30%', left: '20%', x: 21, y: 32 },
        { top: '30%', left: '10%', x: 11, y: 32 },
        { top: '60%', left: '66%', x: 66, y: 62.5 },
        { top: '30%', left: '63%', x: 63, y: 32 },
        { top: '42.5%', left: '63%', x: 63, y: 44.5 },
        { top: '30%', left: '85%', x: 85, y: 32 },
        { top: '65%', left: '2%', x: 2, y: 65 },
        { top: '65%', left: '25%', x: 25, y: 66 },
        { top: '40%', left: '41%', x: 41, y: 41 },
        { top: '52.5%', left: '41%', x: 41, y: 53.5 },
        { top: '65%', left: '41%', x: 42, y: 67 },
        { top: '65%', left: '82%', x: 83, y: 66 }
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
            style={{ top: pos.top, left: pos.left }}
            onClick={(event) => buyTowers(event, pos.x, pos.y)}
          />
        ) : null;
      })}
    </>
  )}
</div>
      {createEnemy()}
      
      {attackAnimation()}
      {renderExplosions()}
    </div>
    {upgradeTower()}
    </>
  );
};

export default Spawn;

