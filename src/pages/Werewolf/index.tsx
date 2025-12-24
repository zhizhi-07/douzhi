import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BackIcon } from '../../components/Icons';
import { 
  initializeGameWithCharacters, 
  checkGameOver,
  generateNPCs
} from './gameEngine';
import { 
  GameState, 
  Player, 
  AIDiscussionScript,
  Role
} from './types';
import { generateDayDiscussions } from './aiService';
import { characterService, Character } from '../../services/characterService';
import { getUserInfoWithAvatar } from '../../utils/userUtils';

// 游戏阶段
type GameStage = 'character_select' | 'dealing' | 'playing';

// 夜间子阶段
type NightPhase = 'werewolf' | 'witch_save' | 'witch_poison' | 'seer' | 'end';

const ROLE_INFO: Record<Role, { name: string; emoji: string; desc: string }> = {
  werewolf: { name: '狼人', emoji: '🐺', desc: '每晚杀死一名玩家，白天伪装好人' },
  villager: { name: '村民', emoji: '👨‍🌾', desc: '没有特殊能力，靠推理找出狼人' },
  seer: { name: '预言家', emoji: '🔮', desc: '每晚查验一名玩家的身份' },
  witch: { name: '女巫', emoji: '🧪', desc: '拥有解药和毒药各一瓶' }
};

const WerewolfGame = () => {
  const navigate = useNavigate();
  
  // 游戏阶段
  const [stage, setStage] = useState<GameStage>('character_select');
  
  // 角色选择
  const [availableCharacters, setAvailableCharacters] = useState<Character[]>([]);
  const [selectedCharacters, setSelectedCharacters] = useState<Character[]>([]);
  
  // 用户信息
  const [userInfo, setUserInfo] = useState<{ name: string; avatar: string }>({ name: '我', avatar: '' });
  
  // 发牌动画
  const [dealingStep, setDealingStep] = useState(0);
  const [userRole, setUserRole] = useState<Role | null>(null);
  
  // 游戏状态
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  
  // 夜间状态
  const [nightPhase, setNightPhase] = useState<NightPhase>('werewolf');
  const [nightKillTarget, setNightKillTarget] = useState<string | null>(null);
  const nightKillTargetRef = useRef<string | null>(null); // 用ref保存最新值，避免闭包问题
  const [seerResult, setSeerResult] = useState<{ name: string; isWolf: boolean } | null>(null);
  
  // 播放控制
  const [isPlayingScript, setIsPlayingScript] = useState(false);
  const [currentScriptIndex, setCurrentScriptIndex] = useState(0);
  const [script, setScript] = useState<AIDiscussionScript | null>(null);
  
  // 用户发言
  const [userSpeech, setUserSpeech] = useState('');
  const [hasUserSpoken, setHasUserSpoken] = useState(false);
  
  // 消息日志
  const [displayLog, setDisplayLog] = useState<{speaker: Player, content: string}[]>([]);
  
  const logEndRef = useRef<HTMLDivElement>(null);
  
  // 加载角色列表和用户信息
  useEffect(() => {
    const loadData = async () => {
      await characterService.waitForLoad();
      const chars = characterService.getAll();
      setAvailableCharacters(chars);
      
      // 获取用户头像
      try {
        const info = await getUserInfoWithAvatar();
        setUserInfo({
          name: info.realName || info.nickname || '我',
          avatar: info.avatar || ''
        });
      } catch (e) {
        console.error('获取用户信息失败', e);
      }
    };
    loadData();
  }, []);
  
  // 自动滚动
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayLog]);

  // 脚本播放逻辑
  useEffect(() => {
    if (isPlayingScript && script && gameState) {
      if (currentScriptIndex < script.discussions.length) {
        const discussion = script.discussions[currentScriptIndex];
        const speaker = gameState.players.find(p => p.id === discussion.speakerId);
        
        const timer = setTimeout(() => {
          if (speaker) {
            setDisplayLog(prev => [...prev, {
              speaker,
              content: discussion.content
            }]);
          }
          setCurrentScriptIndex(prev => prev + 1);
        }, 2000 + Math.random() * 1000);
        
        return () => clearTimeout(timer);
      } else {
        setIsPlayingScript(false);
        setGameState(prev => prev ? ({ ...prev, phase: 'day_voting' }) : null);
        setDisplayLog(prev => [...prev, { 
          speaker: { id: 'judge', name: '法官', avatar: '', role: 'villager' as Role, isAlive: true, isUser: false },
          content: '发言结束，请开始投票。' 
        }]);
      }
    }
  }, [isPlayingScript, currentScriptIndex, script, gameState]);

  // 发牌动画
  useEffect(() => {
    if (stage === 'dealing' && gameState) {
      const steps = [
        { delay: 500, action: () => setDealingStep(1) },  // 洗牌
        { delay: 1500, action: () => setDealingStep(2) }, // 发牌
        { delay: 2500, action: () => setDealingStep(3) }, // 翻牌
        { delay: 4000, action: () => {
          setUserRole(gameState.players.find(p => p.isUser)!.role);
          setDealingStep(4);
        }},
        { delay: 6500, action: () => setStage('playing') }
      ];
      
      const timers = steps.map(step => setTimeout(step.action, step.delay));
      return () => timers.forEach(clearTimeout);
    }
  }, [stage, gameState]);

  // 选择/取消选择角色
  const toggleCharacter = (char: Character) => {
    if (selectedCharacters.find(c => c.id === char.id)) {
      setSelectedCharacters(prev => prev.filter(c => c.id !== char.id));
    } else if (selectedCharacters.length < 5) {
      setSelectedCharacters(prev => [...prev, char]);
    }
  };

  // 开始游戏
  const startGame = () => {
    if (selectedCharacters.length < 1) return;
    
    // 将选择的角色转换为游戏角色
    const gameCharacters = selectedCharacters.map(c => ({
      id: c.id,
      name: c.realName,
      avatar: c.avatar || ''
    }));
    
    // 如果不足5人，用NPC补充
    const npcCount = 5 - gameCharacters.length;
    if (npcCount > 0) {
      const existingNames = gameCharacters.map(c => c.name);
      const npcs = generateNPCs(npcCount, existingNames);
      gameCharacters.push(...npcs);
    }
    
    const newGame = initializeGameWithCharacters(
      gameCharacters,
      userInfo.name,
      userInfo.avatar
    );
    
    setGameState(newGame);
    setStage('dealing');
  };
  
  // 获取法官Player对象
  const getJudge = (): Player => ({
    id: 'judge', name: '法官', avatar: '', role: 'villager', isAlive: true, isUser: false
  });

  // --- 角色选择界面 ---
  if (stage === 'character_select') {
    return (
      <div className="h-screen bg-[#0a0a0a] text-gray-200 flex flex-col relative overflow-hidden">
        {/* 背景纹理 */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none" />
        
        {/* 顶部 */}
        <div className="p-4 flex items-center border-b border-white/5 bg-black/20 backdrop-blur-sm z-10">
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white mr-4">
            <BackIcon />
          </button>
          <div>
            <h1 className="text-xl font-bold">🐺 狼人杀</h1>
            <p className="text-xs text-gray-400">选择1-5位角色，其余NPC补位</p>
          </div>
        </div>

        {/* 已选择的角色 */}
        <div className="p-6 bg-[#111]/80 backdrop-blur-md border-b border-white/5 z-10">
          <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex justify-between items-center">
            <span>Selected Team ({selectedCharacters.length}/5)</span>
            {selectedCharacters.length > 0 && (
              <span className="text-amber-500/80 text-[10px]">点击头像移除</span>
            )}
          </div>
          <div className="flex gap-4 min-h-[70px] overflow-x-auto pb-2 scrollbar-hide">
            {selectedCharacters.map(char => (
              <div 
                key={char.id} 
                onClick={() => toggleCharacter(char)}
                className="relative cursor-pointer group flex-shrink-0"
              >
                <div className="w-14 h-14 rounded-full border border-amber-500/30 p-0.5 group-hover:border-red-500/50 transition-colors">
                  {char.avatar ? (
                    <img 
                      src={char.avatar} 
                      className="w-full h-full rounded-full object-cover grayscale-[30%]"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-gray-300 font-bold text-lg">
                      {char.realName.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-900/90 text-red-200 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity border border-red-500/30">×</div>
              </div>
            ))}
            {Array(5 - selectedCharacters.length).fill(0).map((_, i) => (
              <div key={i} className="w-14 h-14 rounded-full border border-dashed border-white/10 flex items-center justify-center text-gray-700 bg-white/5 flex-shrink-0">
                <span className="text-xl opacity-20">?</span>
              </div>
            ))}
          </div>
        </div>

        {/* 角色列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          {availableCharacters.length === 0 ? (
            <div className="text-center text-gray-400 mt-8">
              <div className="text-4xl mb-4">😢</div>
              <div>还没有创建任何角色</div>
              <div className="text-sm mt-2">先去聊天页面创建一些角色吧~</div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 pb-20">
              {availableCharacters.map(char => {
                const isSelected = selectedCharacters.find(c => c.id === char.id);
                return (
                  <div 
                    key={char.id}
                    onClick={() => toggleCharacter(char)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all duration-300 group relative overflow-hidden
                      ${isSelected 
                        ? 'bg-amber-900/10 border-amber-500/50 shadow-[0_0_15px_-3px_rgba(245,158,11,0.1)]' 
                        : 'bg-[#161616] border-white/5 hover:border-white/20 hover:bg-[#1a1a1a]'}
                    `}
                  >
                    <div className="relative aspect-square mb-3 overflow-hidden rounded-md bg-[#0a0a0a]">
                      {char.avatar ? (
                        <img 
                          src={char.avatar}
                          className={`w-full h-full object-cover transition-all duration-500
                            ${isSelected ? 'grayscale-0 scale-105' : 'grayscale-[40%] group-hover:grayscale-0 group-hover:scale-105'}
                          `}
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center text-gray-300 font-bold text-4xl transition-all duration-500 bg-gradient-to-br from-gray-800 to-gray-900
                          ${isSelected ? 'text-amber-500' : 'group-hover:text-gray-200'}
                        `}>
                          {char.realName.charAt(0)}
                        </div>
                      )}
                      {isSelected && (
                        <div className="absolute inset-0 bg-amber-500/10 pointer-events-none" />
                      )}
                    </div>
                    <div className={`text-sm font-medium truncate text-center transition-colors
                      ${isSelected ? 'text-amber-500' : 'text-gray-400 group-hover:text-gray-200'}
                    `}>{char.realName}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 开始按钮 */}
        <div className="p-4 border-t border-white/5 bg-[#0a0a0a]/90 backdrop-blur-md z-20">
          <button
            onClick={startGame}
            disabled={selectedCharacters.length < 1}
            className={`w-full py-4 rounded-lg font-bold text-lg transition-all tracking-wider
              ${selectedCharacters.length >= 1
                ? 'bg-[#8B0000] hover:bg-[#A00000] text-red-50 shadow-lg shadow-red-900/20'
                : 'bg-[#1a1a1a] text-gray-600 cursor-not-allowed border border-white/5'}
            `}
          >
            {selectedCharacters.length >= 1 
              ? `🐺 开始狩猎${selectedCharacters.length < 5 ? ` (${5 - selectedCharacters.length} NPC)` : ''}` 
              : '选择祭品...'}
          </button>
        </div>
      </div>
    );
  }

  // --- 发牌动画界面 ---
  if (stage === 'dealing') {
    return (
      <div className="h-screen bg-[#0a0a0a] flex flex-col items-center justify-center relative overflow-hidden">
        {/* 背景纹理 */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none" />
        
        <div className="text-center z-10">
          {dealingStep === 0 && <div className="text-2xl text-gray-400 font-serif tracking-widest">准备中...</div>}
          
          {dealingStep === 1 && (
            <div className="animate-pulse">
              <div className="text-6xl mb-6 opacity-80">🃏</div>
              <div className="text-xl text-gray-400 font-serif tracking-widest">正在洗牌...</div>
            </div>
          )}
          
          {dealingStep === 2 && (
            <div className="animate-bounce">
              <div className="text-6xl mb-6 opacity-80">🎴</div>
              <div className="text-xl text-gray-400 font-serif tracking-widest">正在发牌...</div>
            </div>
          )}
          
          {dealingStep === 3 && (
            <div>
              <div className="text-6xl mb-6 animate-spin opacity-80">❓</div>
              <div className="text-xl text-gray-400 font-serif tracking-widest">请查看你的身份...</div>
            </div>
          )}
          
          {dealingStep === 4 && userRole && (
            <div className="animate-fade-in">
              <div className="w-64 h-80 mx-auto bg-[#1a1a1a] rounded-xl border border-amber-500/30 shadow-[0_0_30px_-5px_rgba(245,158,11,0.15)] flex flex-col items-center justify-center p-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
                
                <div className="text-7xl mb-6 scale-110 drop-shadow-lg">
                  {ROLE_INFO[userRole].emoji}
                </div>
                <div className="text-3xl font-bold text-gray-100 mb-3 tracking-wide font-serif border-b border-white/10 pb-2 px-4">
                  {ROLE_INFO[userRole].name}
                </div>
                <div className="text-sm text-gray-400 text-center leading-relaxed">
                  {ROLE_INFO[userRole].desc}
                </div>
              </div>
              <div className="mt-8 text-gray-500 text-xs tracking-[0.2em] uppercase">Game Starting...</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- 游戏主界面 ---
  if (!gameState) return <div className="bg-[#0a0a0a] h-screen text-white flex items-center justify-center">加载中...</div>;

  const user = gameState.players.find(p => p.isUser)!;

  // 设置击杀目标（同时更新state和ref）
  const updateNightKillTarget = (targetId: string | null) => {
    setNightKillTarget(targetId);
    nightKillTargetRef.current = targetId;
  };

  // 开始夜晚
  const startNight = () => {
    setNightPhase('werewolf');
    updateNightKillTarget(null);
    setSeerResult(null);
    setSelectedTarget(null);
    setGameState(prev => {
      if (!prev) return null;
      return { ...prev, phase: 'night' };
    });
    
    // 如果用户不是狼人，AI狼人自动选择目标
    if (user.role !== 'werewolf' || !user.isAlive) {
      setTimeout(() => {
        const nonWolves = gameState.players.filter(p => p.isAlive && p.role !== 'werewolf');
        if (nonWolves.length > 0) {
          const target = nonWolves[Math.floor(Math.random() * nonWolves.length)];
          updateNightKillTarget(target.id);
        }
        advanceNightPhase('werewolf');
      }, 2000);
    }
  };

  // 推进夜间阶段
  const advanceNightPhase = (currentPhase: NightPhase) => {
    const witch = gameState.players.find(p => p.role === 'witch' && p.isAlive);
    const seer = gameState.players.find(p => p.role === 'seer' && p.isAlive);
    const currentKillTarget = nightKillTargetRef.current; // 使用ref获取最新值
    
    if (currentPhase === 'werewolf') {
      // 进入女巫救人阶段
      if (witch && currentKillTarget && gameState.witchPotions.heal) {
        if (witch.isUser) {
          setNightPhase('witch_save');
        } else {
          // AI女巫：50%概率救人
          if (Math.random() > 0.5) {
            updateNightKillTarget(null); // 救人
            setGameState(prev => prev ? { ...prev, witchPotions: { ...prev.witchPotions, heal: false } } : null);
          }
          advanceNightPhase('witch_save');
        }
      } else {
        advanceNightPhase('witch_save');
      }
    } else if (currentPhase === 'witch_save') {
      // 进入女巫毒人阶段
      if (witch && gameState.witchPotions.poison) {
        if (witch.isUser) {
          setNightPhase('witch_poison');
        } else {
          // AI女巫：不主动毒人
          advanceNightPhase('witch_poison');
        }
      } else {
        advanceNightPhase('witch_poison');
      }
    } else if (currentPhase === 'witch_poison') {
      // 进入预言家阶段
      if (seer) {
        if (seer.isUser) {
          setNightPhase('seer');
        } else {
          // AI预言家验人（结果不显示给玩家）
          advanceNightPhase('seer');
        }
      } else {
        advanceNightPhase('seer');
      }
    } else if (currentPhase === 'seer') {
      // 夜晚结束
      endNight();
    }
  };

  // 结束夜晚
  const endNight = () => {
    const killTarget = nightKillTargetRef.current; // 使用ref获取最新值
    const deadThisNight: string[] = [];
    if (killTarget) deadThisNight.push(killTarget);

    // 先获取死者名字（在状态更新前）
    const deadNames = deadThisNight.length > 0 
      ? gameState.players.filter(p => deadThisNight.includes(p.id)).map(p => p.name).join('、')
      : '无人';

    setGameState(prev => {
      if (!prev) return null;
      const newPlayers = prev.players.map(p => ({
        ...p,
        isAlive: deadThisNight.includes(p.id) ? false : p.isAlive
      }));
      return {
        ...prev,
        players: newPlayers,
        day: prev.day + 1,
        phase: 'day_discussion',
        deadThisNight
      };
    });

    // 天亮公告
    setTimeout(() => {
      setDisplayLog(prev => [...prev, { speaker: getJudge(), content: `天亮了！昨晚 ${deadNames} 死亡。` }]);
      setHasUserSpoken(false);
      
      // 开始讨论
      setTimeout(() => {
        setDisplayLog(prev => [...prev, { speaker: getJudge(), content: '请开始自由讨论，你可以发言。' }]);
      }, 1000);
    }, 500);
  };

  // 狼人选择刀人
  const handleWerewolfKill = () => {
    if (!selectedTarget) return;
    updateNightKillTarget(selectedTarget);
    setSelectedTarget(null);
    advanceNightPhase('werewolf');
  };

  // 女巫救人
  const handleWitchSave = (save: boolean) => {
    if (save && nightKillTargetRef.current) {
      updateNightKillTarget(null);
      setGameState(prev => prev ? { ...prev, witchPotions: { ...prev.witchPotions, heal: false } } : null);
    }
    advanceNightPhase('witch_save');
  };

  // 女巫毒人
  const handleWitchPoison = () => {
    if (selectedTarget) {
      // 毒药直接杀死目标
      updateNightKillTarget(selectedTarget);
      setGameState(prev => prev ? { ...prev, witchPotions: { ...prev.witchPotions, poison: false } } : null);
    }
    setSelectedTarget(null);
    advanceNightPhase('witch_poison');
  };

  // 预言家验人
  const handleSeerVerify = () => {
    if (!selectedTarget) return;
    const target = gameState.players.find(p => p.id === selectedTarget);
    if (target) {
      setSeerResult({ name: target.name, isWolf: target.role === 'werewolf' });
    }
  };

  // 确认预言家结果
  const confirmSeerResult = () => {
    setSeerResult(null);
    setSelectedTarget(null);
    advanceNightPhase('seer');
  };

  // 用户发言
  const handleUserSpeak = () => {
    if (!userSpeech.trim() || !user.isAlive) return;
    
    setDisplayLog(prev => [...prev, { speaker: user, content: userSpeech }]);
    setUserSpeech('');
    setHasUserSpoken(true);
    
    // AI开始发言
    setTimeout(async () => {
      try {
        const newScript = await generateDayDiscussions(gameState, gameState.deadThisNight);
        setScript(newScript);
        setIsPlayingScript(true);
        setCurrentScriptIndex(0);
      } catch (e) {
        console.error(e);
        // 如果AI发言失败，直接进入投票
        setDisplayLog(prev => [...prev, { speaker: getJudge(), content: '讨论结束，开始投票。' }]);
        setGameState(prev => prev ? { ...prev, phase: 'day_voting' } : null);
      }
    }, 1000);
  };

  // 点击玩家
  const handlePlayerClick = (targetId: string) => {
    if (!gameState) return;
    const target = gameState.players.find(p => p.id === targetId);
    if (!target || !target.isAlive) return;
    if (target.isUser && gameState.phase !== 'night') return;
    setSelectedTarget(targetId);
  };

  // 投票
  const handleVote = () => {
    if (!gameState || !selectedTarget) return;

    const votes: Record<string, string> = { ...script?.votes };
    votes[user.id] = selectedTarget;
    
    const voteCounts: Record<string, number> = {};
    Object.values(votes).forEach(target => {
      voteCounts[target] = (voteCounts[target] || 0) + 1;
    });
    
    let maxVotes = 0;
    let outId: string | null = null;
    let draw = false;
    
    Object.entries(voteCounts).forEach(([id, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        outId = id;
        draw = false;
      } else if (count === maxVotes) {
        draw = true;
      }
    });
    
    const outPlayer = gameState.players.find(p => p.id === outId);
    
    if (outId && !draw) {
      setDisplayLog(prev => [...prev, { speaker: getJudge(), content: `投票结束，${outPlayer?.name} 以 ${maxVotes} 票被放逐。` }]);
    } else {
      setDisplayLog(prev => [...prev, { speaker: getJudge(), content: '投票平局，无人被放逐。' }]);
    }
    
    setGameState(prev => {
      if (!prev) return null;
      let newPlayers = [...prev.players];
      if (outId && !draw) {
        newPlayers = newPlayers.map(p => p.id === outId ? { ...p, isAlive: false } : p);
      }
      return { ...prev, players: newPlayers, phase: 'setup' };
    });
    
    setSelectedTarget(null);
    
    const newPlayers = gameState.players.map(p => p.id === outId ? { ...p, isAlive: false } : p);
    const winner = checkGameOver(newPlayers);
    if (!winner) {
      setTimeout(() => startNight(), 2000);
    }
  };

  // 获取夜间提示
  const getNightPrompt = () => {
    const currentKillTarget = nightKillTargetRef.current;
    if (nightPhase === 'werewolf' && user.role === 'werewolf' && user.isAlive) {
      return { title: '🐺 狼人请睁眼', desc: '选择一名玩家击杀', action: '确认击杀' };
    }
    if (nightPhase === 'witch_save' && user.role === 'witch' && user.isAlive && currentKillTarget) {
      const victim = gameState.players.find(p => p.id === currentKillTarget);
      return { title: '🧪 女巫请睁眼', desc: `${victim?.name} 被杀，是否使用解药？`, action: '救人' };
    }
    if (nightPhase === 'witch_poison' && user.role === 'witch' && user.isAlive && gameState.witchPotions.poison) {
      return { title: '🧪 女巫毒药', desc: '是否使用毒药？', action: '毒人' };
    }
    if (nightPhase === 'seer' && user.role === 'seer' && user.isAlive) {
      return { title: '🔮 预言家请睁眼', desc: '选择一名玩家查验身份', action: '查验' };
    }
    return null;
  };

  const nightPrompt = getNightPrompt();

  const getPhaseTitle = () => {
    switch (gameState?.phase) {
      case 'setup': return '游戏准备';
      case 'night': return nightPrompt?.title || '天黑请闭眼';
      case 'day_discussion': return '自由讨论';
      case 'day_voting': return '投票放逐';
      case 'game_over': return '游戏结束';
      default: return '';
    }
  };

  return (
    <div className="h-screen bg-[#0a0a0a] text-gray-200 flex flex-col overflow-hidden relative">
      {/* 氛围背景 */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 pointer-events-none" />
      
      {/* 顶部栏 */}
      <div className="relative z-10 p-4 flex justify-between items-center bg-[#111]/80 backdrop-blur-md border-b border-white/5 shadow-sm">
        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition-colors">
          <BackIcon />
        </button>
        <div className="flex flex-col items-center">
          <div className="text-lg font-bold text-gray-200 tracking-wider">🐺 狼人杀</div>
          <div className="text-[10px] text-amber-500/80 uppercase tracking-widest mt-0.5">{getPhaseTitle()} · DAY {gameState.day}</div>
        </div>
        <div className="w-8" />
      </div>

      {/* 游戏区 */}
      <div className="flex-1 relative flex flex-col">
        {/* 夜晚遮罩 - 非交互时显示 */}
        {gameState.phase === 'night' && !nightPrompt && (
          <div className="absolute inset-0 z-20 bg-[#050505]/95 flex items-center justify-center animate-fade-in pointer-events-none">
            <div className="text-center">
              <div className="text-6xl mb-6 opacity-60">🌙</div>
              <div className="text-2xl text-blue-900/80 font-serif tracking-[0.2em] animate-pulse">Night is falling...</div>
            </div>
          </div>
        )}

        {/* 夜晚交互界面 */}
        {gameState.phase === 'night' && nightPrompt && (
          <div className="absolute inset-0 z-40 bg-[#0a0a0a]/98 flex flex-col">
            <div className="text-center pt-10 pb-6">
              <div className="text-3xl mb-2 font-serif text-gray-100">{nightPrompt.title}</div>
              <div className="text-gray-500 text-sm tracking-wide">{nightPrompt.desc}</div>
            </div>
            
            {/* 预言家结果 */}
            {seerResult && (
              <div className="absolute inset-0 z-50 bg-black/95 flex flex-col items-center justify-center">
                <div className="text-6xl mb-4">{seerResult.isWolf ? '🐺' : '👼'}</div>
                <div className="text-2xl mb-2">{seerResult.name}</div>
                <div className={`text-xl ${seerResult.isWolf ? 'text-red-500' : 'text-green-500'}`}>
                  {seerResult.isWolf ? '是狼人！' : '是好人'}
                </div>
                <button onClick={confirmSeerResult} className="mt-8 px-8 py-3 bg-amber-700 hover:bg-amber-600 text-white rounded-lg font-bold transition-all shadow-lg shadow-amber-900/20">
                  我知道了
                </button>
              </div>
            )}
            
            {/* 玩家选择网格 */}
            <div className="flex-1 flex items-center justify-center px-6">
              <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
                {gameState.players.filter(p => !p.isUser && p.isAlive).map(player => (
                  <div 
                    key={player.id} 
                    onClick={() => setSelectedTarget(player.id)}
                    className={`flex flex-col items-center p-3 rounded-xl cursor-pointer transition-all
                      ${selectedTarget === player.id ? 'bg-red-500/30 ring-2 ring-red-500' : 'bg-white/5 hover:bg-white/10'}
                    `}
                  >
                    {player.avatar ? (
                      <img 
                        src={player.avatar}
                        className="w-14 h-14 rounded-full border-2 border-gray-600 object-cover"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full border-2 border-gray-600 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-gray-300 font-bold text-lg">
                        {player.name.charAt(0)}
                      </div>
                    )}
                    <span className="text-sm mt-2 text-gray-300">{player.name}</span>
                    {user.role === 'werewolf' && player.role === 'werewolf' && (
                      <span className="text-xs text-red-400">狼队友</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* 操作按钮 */}
            <div className="p-4 flex gap-3 justify-center">
              {nightPhase === 'witch_save' && (
                <button onClick={() => handleWitchSave(false)} className="px-6 py-3 bg-gray-700 rounded-lg font-bold">
                  不救
                </button>
              )}
              {nightPhase === 'witch_poison' && (
                <button onClick={() => advanceNightPhase('witch_poison')} className="px-6 py-3 bg-gray-700 rounded-lg font-bold">
                  不毒
                </button>
              )}
              
              <button 
                onClick={() => {
                  if (nightPhase === 'werewolf') handleWerewolfKill();
                  else if (nightPhase === 'witch_save') handleWitchSave(true);
                  else if (nightPhase === 'witch_poison') handleWitchPoison();
                  else if (nightPhase === 'seer') handleSeerVerify();
                }}
                disabled={!selectedTarget && nightPhase !== 'witch_save'}
                className={`px-6 py-3 rounded-lg font-bold transition-all
                  ${selectedTarget || nightPhase === 'witch_save' 
                    ? 'bg-red-600 hover:bg-red-500' 
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'}
                `}
              >
                {nightPrompt.action}
              </button>
            </div>
          </div>
        )}

        {/* 玩家圆桌 */}
        <div className="flex-1 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="grid grid-cols-3 gap-6 w-full max-w-sm px-6">
              {gameState.players.filter(p => !p.isUser).map(player => (
                <div 
                  key={player.id} 
                  onClick={() => handlePlayerClick(player.id)}
                  className={`flex flex-col items-center transition-all duration-300 relative
                    ${!player.isAlive ? 'opacity-30 grayscale' : ''}
                    ${(gameState.phase === 'day_voting') && player.isAlive ? 'cursor-pointer hover:scale-105' : ''}
                  `}
                >
                  <div className="relative">
                    {player.avatar ? (
                      <img 
                        src={player.avatar} 
                        className={`w-14 h-14 rounded-full border-2 bg-gray-800 object-cover shadow-lg
                          ${selectedTarget === player.id ? 'border-amber-400 ring-2 ring-amber-400/50' : 
                            player.role === 'werewolf' && user.role === 'werewolf' ? 'border-red-500' : 'border-gray-600'}
                        `}
                      />
                    ) : (
                      <div className={`w-14 h-14 rounded-full border-2 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-gray-300 font-bold text-lg shadow-lg
                        ${selectedTarget === player.id ? 'border-amber-400 ring-2 ring-amber-400/50' : 
                          player.role === 'werewolf' && user.role === 'werewolf' ? 'border-red-500' : 'border-gray-600'}
                      `}>
                        {player.name.charAt(0)}
                      </div>
                    )}
                    {!player.isAlive && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-full text-red-500 text-xs font-bold">
                        出局
                      </div>
                    )}
                  </div>
                  <span className={`text-xs mt-1.5 font-medium truncate max-w-[60px] ${selectedTarget === player.id ? 'text-amber-400' : 'text-gray-400'}`}>
                    {player.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 底部控制区 */}
        <div className="h-[30%] min-h-[140px] max-h-[200px] bg-[#0a0a0a]/90 backdrop-blur-md border-t border-white/5 p-3 flex flex-col z-30">
          {/* 日志区域 - 紧凑显示 */}
          <div className="flex-1 overflow-y-auto mb-2 space-y-1.5 scrollbar-hide">
            {displayLog.slice(-6).map((log, i) => (
              <div key={i} className="flex gap-2 animate-fade-in items-center">
                {log.speaker.avatar ? (
                  <img src={log.speaker.avatar} className="w-5 h-5 rounded-full border border-white/10 object-cover flex-shrink-0" />
                ) : log.speaker.id === 'judge' ? (
                  <div className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[10px] flex-shrink-0">⚖️</div>
                ) : (
                  <div className="w-5 h-5 rounded-full bg-gray-800 border border-white/10 flex items-center justify-center text-gray-400 text-[10px] font-bold flex-shrink-0">
                    {log.speaker.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-amber-500/70 mr-1.5">{log.speaker.name}:</span>
                  <span className={`text-xs ${log.speaker.isUser ? 'text-amber-200' : 'text-gray-400'}`}>
                    {log.content.length > 50 ? log.content.slice(0, 50) + '...' : log.content}
                  </span>
                </div>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>

          {/* 用户发言输入框 */}
          {gameState.phase === 'day_discussion' && user.isAlive && !hasUserSpoken && !isPlayingScript && (
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={userSpeech}
                onChange={(e) => setUserSpeech(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUserSpeak()}
                placeholder="输入你的发言..."
                className="flex-1 bg-[#1a1a1a] border border-white/10 rounded-lg px-4 py-2 text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-colors"
              />
              <button 
                onClick={handleUserSpeak}
                disabled={!userSpeech.trim()}
                className="px-4 py-2 bg-amber-700 hover:bg-amber-600 disabled:bg-[#1a1a1a] disabled:text-gray-600 rounded-lg font-bold text-amber-50 transition-all border border-white/5"
              >
                发言
              </button>
            </div>
          )}

          {/* 玩家状态 & 操作栏 */}
          <div className="flex items-center justify-between border-t border-white/5 pt-3">
            <div className="flex items-center gap-3">
              <div className="relative">
                {user.avatar ? (
                  <img 
                    src={user.avatar} 
                    className="w-11 h-11 rounded-full border-2 border-amber-500/50 object-cover" 
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full border-2 border-amber-500/50 bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-gray-300 font-bold text-lg">
                    {user.name.charAt(0)}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 text-base drop-shadow-md">
                  {ROLE_INFO[user.role].emoji}
                </div>
              </div>
              <div>
                <div className="font-bold text-amber-500 text-sm tracking-wide">{ROLE_INFO[user.role].name}</div>
                <div className="text-xs text-gray-500">{user.isAlive ? '存活' : '已出局'}</div>
              </div>
            </div>
            
            <div className="flex gap-2">
              {gameState.phase === 'setup' && (
                <button 
                  onClick={startNight}
                  className="px-5 py-2 bg-[#8B0000] hover:bg-[#A00000] text-red-50 rounded-lg font-bold transition-all shadow-lg shadow-red-900/20 border border-white/5"
                >
                  开始游戏
                </button>
              )}
              {gameState.phase === 'day_voting' && user.isAlive && (
                <button 
                  onClick={handleVote}
                  disabled={!selectedTarget}
                  className={`px-5 py-2 rounded-lg font-bold transition-all border border-white/5
                    ${selectedTarget 
                      ? 'bg-amber-700 hover:bg-amber-600 text-amber-50 shadow-lg shadow-amber-900/20' 
                      : 'bg-[#1a1a1a] text-gray-600 cursor-not-allowed'}
                  `}
                >
                  确认投票
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 游戏结束弹窗 */}
      {checkGameOver(gameState.players) && (
        <div className="absolute inset-0 z-50 bg-[#0a0a0a]/98 flex flex-col items-center justify-center animate-fade-in">
          <div className="text-7xl mb-6 animate-bounce drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            {checkGameOver(gameState.players) === 'werewolf' ? '🐺' : '🎉'}
          </div>
          <div className={`text-4xl font-bold mb-3 font-serif tracking-widest ${checkGameOver(gameState.players) === 'werewolf' ? 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]'}`}>
            {checkGameOver(gameState.players) === 'werewolf' ? 'WEREWOLF WIN' : 'VILLAGER WIN'}
          </div>
          <div className="text-gray-500 mb-10 tracking-widest text-sm uppercase">
            {checkGameOver(gameState.players) === 'werewolf' ? 'The darkness consumes all...' : 'Light pierces through the shadows'}
          </div>
          <button 
            onClick={() => {
              setStage('character_select');
              setGameState(null);
              setSelectedCharacters([]);
              setDisplayLog([]);
              setDealingStep(0);
              setUserRole(null);
              setNightPhase('werewolf');
              updateNightKillTarget(null);
              setSeerResult(null);
              setHasUserSpoken(false);
              setUserSpeech('');
            }}
            className="px-8 py-3 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-gray-200 border border-white/10 rounded-lg font-bold transition-all tracking-widest uppercase text-sm hover:border-white/30"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};

export default WerewolfGame;
