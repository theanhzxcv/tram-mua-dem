import { html, useCallback, useEffect, useMemo, useRef, useState } from './lib/html.js';
import {
  BOT_CONTEXT_RULES,
  BOT_HEALING_REPLIES,
  BOT_PERSONAS,
  CARO_SIZE,
  CARO_TURN_SECONDS,
  createRandomPersona,
  MOOD_OPTIONS
} from './data/constants.js';
import { evaluateCaro6x6, pickSmartBotMove6x6 } from './utils/caroEngine.js';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { useRainAudio } from './hooks/useRainAudio.js';
import { useBroadcastP2P } from './hooks/useBroadcastP2P.js';
import { RainCanvas } from './components/RainCanvas.js';
import { Toast } from './components/Toast.js';
import { Header } from './components/Header.js';
import { LobbyScreen } from './components/LobbyScreen.js';
import { MatchingScreen } from './components/MatchingScreen.js';
import { ChatScreen } from './components/ChatScreen.js';
import { GameModal } from './components/GameModal.js';
import { MiniChatWidget } from './components/MiniChatWidget.js';
import { BreathingModal } from './components/BreathingModal.js';
import { ThoughtReleaseModal } from './components/ThoughtReleaseModal.js';

function createInitialCaroState() {
  return {
    started: false,
    board: Array(CARO_SIZE * CARO_SIZE).fill(''),
    turn: 'MOON',
    winner: '',
    winLine: [],
    lastMove: -1,
    turnDeadline: Date.now() + CARO_TURN_SECONDS * 1000
  };
}

function formatTimeNow() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export function App() {
  // Unique per-tab id so two tabs in the same browser can pair via BroadcastChannel
  const myTabId = useMemo(() => 'user_' + Math.random().toString(36).slice(2, 10), []);
  const [savedProfile, setSavedProfile] = useLocalStorage('tram_profile_v1', () => {
    const p = createRandomPersona();
    return { name: p.name, avatar: p.avatar };
  });
  const [mood, setMood] = useLocalStorage('tram_mood_v1', 'overthinking');

  const persona = useMemo(
    () => ({ id: myTabId, name: savedProfile.name, avatar: savedProfile.avatar }),
    [myTabId, savedProfile.name, savedProfile.avatar]
  );

  const [toast, setToast] = useState({ visible: false, message: '' });
  const toastTimerRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToast({ visible: true, message: msg });
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  }, []);

  useEffect(() => () => clearTimeout(toastTimerRef.current), []);

  const audio = useRainAudio(showToast);

  const [currentView, setCurrentView] = useState('lobby'); // 'lobby' | 'matching' | 'chat'
  const [partner, setPartner] = useState(BOT_PERSONAS[0]);
  const [partnerStatusText, setPartnerStatusText] = useState('Người giữ lửa Trạm Mưa • Lắng nghe dịu dàng');
  const [myCaroSymbol, setMyCaroSymbol] = useState('MOON');
  const [messages, setMessages] = useState([]);
  const [partnerTyping, setPartnerTyping] = useState(false);

  const [badges, setBadges] = useState({ draw: false, caro: false });
  const [firstInviteShown, setFirstInviteShown] = useState({ draw: false, caro: false });
  const [pendingInviteGame, setPendingInviteGame] = useState(null);
  const [showInviteBanner, setShowInviteBanner] = useState(false);

  const [activeCenterGame, setActiveCenterGame] = useState(null); // null | 'draw' | 'caro'
  const [isMiniChatOpen, setIsMiniChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [previewText, setPreviewText] = useState('');

  const [glassStrokes, setGlassStrokes] = useState([]);
  const [caroState, setCaroState] = useState(createInitialCaroState);
  const [caroScore, setCaroScore] = useState({ me: 0, draw: 0, partner: 0 });

  const [breathingOpen, setBreathingOpen] = useState(false);
  const [releaseOpen, setReleaseOpen] = useState(false);

  const msgCounterRef = useRef(0);
  const userMsgCountRef = useRef(0);
  const botInviteStageRef = useRef(0);
  const botEmpathyIdxRef = useRef(0);
  const botDoodleCounterRef = useRef(0);
  const botDoodleCooldownRef = useRef(false);
  const typingDebounceRef = useRef(null);
  const pendingTimersRef = useRef([]);

  const stateRef = useRef({});
  stateRef.current = {
    currentView,
    partner,
    myCaroSymbol,
    activeCenterGame,
    isMiniChatOpen,
    firstInviteShown,
    caroState,
    persona,
    mood
  };

  const scheduleTimeout = useCallback((fn, delayMs) => {
    const id = setTimeout(() => {
      pendingTimersRef.current = pendingTimersRef.current.filter((t) => t !== id);
      fn();
    }, delayMs);
    pendingTimersRef.current.push(id);
    return id;
  }, []);

  const clearScheduledTimeouts = useCallback(() => {
    pendingTimersRef.current.forEach((id) => clearTimeout(id));
    pendingTimersRef.current = [];
  }, []);

  useEffect(() => () => clearScheduledTimeouts(), [clearScheduledTimeouts]);

  const appendMessage = useCallback((entry) => {
    msgCounterRef.current += 1;
    setMessages((prev) => [
      ...prev,
      {
        id: `m_${msgCounterRef.current}`,
        time: entry.kind === 'chat' ? formatTimeNow() : '',
        ...entry
      }
    ]);
  }, []);

  const resetRoomSession = useCallback(() => {
    clearScheduledTimeouts();
    userMsgCountRef.current = 0;
    botInviteStageRef.current = 0;
    botDoodleCooldownRef.current = false;

    setMessages([]);
    setPartnerTyping(false);
    setBadges({ draw: false, caro: false });
    setFirstInviteShown({ draw: false, caro: false });
    setPendingInviteGame(null);
    setShowInviteBanner(false);
    setActiveCenterGame(null);
    setIsMiniChatOpen(false);
    setUnreadCount(0);
    setPreviewText('');
    setGlassStrokes([]);
    setCaroState(createInitialCaroState());
    setCaroScore({ me: 0, draw: 0, partner: 0 });
  }, [clearScheduledTimeouts]);

  const handleIncomingChatMessage = useCallback(
    (text) => {
      setPartnerTyping(false);
      appendMessage({ kind: 'chat', sender: 'partner', text });

      const s = stateRef.current;
      if (s.activeCenterGame !== null && !s.isMiniChatOpen) {
        setUnreadCount((c) => c + 1);
        setPreviewText(text);
      }
    },
    [appendMessage]
  );

  const receiveGameInvite = useCallback(
    (game) => {
      const s = stateRef.current;
      if (s.activeCenterGame === game) return;

      const icon = game === 'caro' ? '🌙' : '🪟';
      const title = game === 'caro' ? 'chơi Cờ Caro 6x6' : 'vẽ lên cửa kính mưa';

      setBadges((prev) => ({ ...prev, [game]: true }));

      if (!s.firstInviteShown[game]) {
        setFirstInviteShown((prev) => ({ ...prev, [game]: true }));
        setPendingInviteGame(game);
        setShowInviteBanner(true);
        if (s.activeCenterGame !== null) {
          showToast(`${icon} ${s.partner.name} lần đầu mời bạn ${title}!`);
        }
      } else {
        appendMessage({
          kind: 'sys',
          text: `${icon} ${s.partner.name} đang chờ bạn ở mục ${game === 'caro' ? 'Cờ Caro 6x6' : 'Vẽ kính mưa'}.`
        });
      }
    },
    [appendMessage, showToast]
  );

  const recordCaroResult = useCallback((winner, mySym) => {
    if (!winner) return;
    setCaroScore((prev) => {
      if (winner === 'DRAW') return { ...prev, draw: prev.draw + 1 };
      if (winner === mySym) return { ...prev, me: prev.me + 1 };
      return { ...prev, partner: prev.partner + 1 };
    });
  }, []);

  const enterChatWithBot = useCallback(
    (botIndex = 0) => {
      const chosenBot = BOT_PERSONAS[botIndex % BOT_PERSONAS.length];
      resetRoomSession();
      setPartner(chosenBot);
      setPartnerStatusText('Người giữ lửa Trạm Mưa • Lắng nghe dịu dàng');
      setMyCaroSymbol('MOON');
      setCurrentView('chat');

      const s = stateRef.current;
      const moodLabel = MOOD_OPTIONS.find((m) => m.id === s.mood)?.label?.toLowerCase() || '';
      appendMessage({
        kind: 'sys',
        text: `🕯️ Bạn (${s.persona.name}) vừa ghé mái hiên cùng ${chosenBot.name}.`
      });

      scheduleTimeout(() => {
        const cur = stateRef.current;
        if (cur.currentView === 'chat' && cur.partner.isBot) {
          const moodGreeting =
            s.mood === 'sleepless'
              ? `Chào ${s.persona.name}... Thấy bạn đang trằn trọc khó ngủ. Ngoài trời mưa rơi tí tách dịu lắm, cứ ngồi đây thở chậm một lát nhé.`
              : s.mood === 'tired'
              ? `Chào ${s.persona.name}... Hôm nay chắc bạn mệt nhiều rồi. Ở đây không cần gồng mình nữa đâu, có chuyện gì muốn kể không?`
              : `Chào ${s.persona.name}... Ngoài trời mưa rơi tí tách dịu quá nhỉ${moodLabel ? ` (đêm nay bạn đang thấy “${moodLabel}” đúng không?)` : ''}. Đêm nay có suy nghĩ nào đang làm bạn khó chợp mắt à?`;
          handleIncomingChatMessage(moodGreeting);
        }
      }, 480);
    },
    [appendMessage, handleIncomingChatMessage, resetRoomSession, scheduleTimeout]
  );

  const enterChatWithRealPartner = useCallback(
    (remotePersona, assignedSymbol) => {
      resetRoomSession();
      setPartner({
        id: remotePersona.id,
        name: remotePersona.name,
        avatar: remotePersona.avatar,
        isBot: false
      });
      setPartnerStatusText('Người cùng thức • Kết nối ẩn danh 1-1');
      setMyCaroSymbol(assignedSymbol);
      setCurrentView('chat');

      const s = stateRef.current;
      appendMessage({
        kind: 'sys',
        text: `✨ Đã ghép đôi ẩn danh 1-1 cùng ${remotePersona.name}! (Bạn là ${s.persona.name})`
      });
      showToast(`Đã kết nối với ${remotePersona.avatar} ${remotePersona.name}`);
    },
    [appendMessage, resetRoomSession, showToast]
  );

  const handleP2PMessage = useCallback(
    (data) => {
      const s = stateRef.current;

      if (data.type === 'SEEK_PAIR' && s.currentView === 'matching') {
        postRawRef.current?.({
          type: 'PAIR_ACCEPT',
          sender: s.persona,
          senderId: s.persona.id,
          targetId: data.sender.id
        });
        enterChatWithRealPartner(data.sender, 'STAR');
        return;
      }

      if (data.type === 'PAIR_ACCEPT' && data.targetId === s.persona.id && s.currentView === 'matching') {
        enterChatWithRealPartner(data.sender, 'MOON');
        return;
      }

      if (s.currentView !== 'chat' || s.partner.isBot || data.senderId !== s.partner.id) return;

      if (data.type === 'PARTNER_LEFT') {
        appendMessage({
          kind: 'sys',
          text: `🌧️ ${s.partner.name} vừa rời khỏi Trạm Mưa Đêm.`
        });
        showToast(`${s.partner.name} đã rời cuộc trò chuyện.`);
        setPartner((prev) => ({ ...prev, isBot: true }));
        setPartnerStatusText('Đối phương đã rời trạm • Bấm Tìm người mới');
      } else if (data.type === 'CHAT_MSG') {
        handleIncomingChatMessage(data.text);
      } else if (data.type === 'TYPING') {
        setPartnerTyping(Boolean(data.isTyping));
      } else if (data.type === 'GAME_INVITE') {
        receiveGameInvite(data.game);
      } else if (data.type === 'DRAW_STROKE') {
        setGlassStrokes((prev) => [
          ...prev,
          { points: data.points, color: data.color, size: data.size }
        ]);
      } else if (data.type === 'DRAW_UNDO') {
        setGlassStrokes((prev) => prev.slice(0, -1));
      } else if (data.type === 'DRAW_CLEAR') {
        setGlassStrokes([]);
        showToast(`${s.partner.name} vừa phủ sương lại cửa kính 💨`);
      } else if (data.type === 'CARO_START' || data.type === 'CARO_RESET') {
        setCaroState({
          started: true,
          board: Array(CARO_SIZE * CARO_SIZE).fill(''),
          turn: 'MOON',
          winner: '',
          winLine: [],
          lastMove: -1,
          turnDeadline: Date.now() + CARO_TURN_SECONDS * 1000
        });
        if (data.type === 'CARO_START') {
          showToast(`${s.partner.name} đã bắt đầu ván Cờ Caro 6x6!`);
        }
      } else if (data.type === 'CARO_MOVE') {
        setCaroState({
          started: true,
          board: data.board,
          turn: data.nextTurn,
          winner: data.winner,
          winLine: data.winLine || [],
          lastMove: typeof data.lastMove === 'number' ? data.lastMove : -1,
          turnDeadline: data.deadline
        });
        if (data.winner) {
          recordCaroResult(data.winner, s.myCaroSymbol);
        }
      }
    },
    [appendMessage, enterChatWithRealPartner, handleIncomingChatMessage, receiveGameInvite, recordCaroResult, showToast]
  );

  const { postRaw, broadcastToPartner } = useBroadcastP2P(myTabId, handleP2PMessage);
  const postRawRef = useRef(postRaw);
  postRawRef.current = postRaw;

  // Broadcast SEEK_PAIR automatically while in matching view
  useEffect(() => {
    if (currentView !== 'matching') return;
    const sendSeek = () => {
      const s = stateRef.current;
      postRaw({
        type: 'SEEK_PAIR',
        sender: s.persona,
        senderId: s.persona.id
      });
    };
    sendSeek();
    const id = setInterval(sendSeek, 1200);
    return () => clearInterval(id);
  }, [currentView, postRaw]);

  // Notify P2P partner if tab closes
  useEffect(() => {
    const notifyLeave = () => {
      const s = stateRef.current;
      if (s.currentView === 'chat' && !s.partner.isBot) {
        broadcastToPartner(s.partner, { type: 'PARTNER_LEFT' });
      }
    };
    window.addEventListener('beforeunload', notifyLeave);
    return () => window.removeEventListener('beforeunload', notifyLeave);
  }, [broadcastToPartner]);

  const startMatchingFlow = useCallback(() => {
    const s = stateRef.current;
    if (s.currentView === 'chat' && !s.partner.isBot) {
      broadcastToPartner(s.partner, { type: 'PARTNER_LEFT' });
    }
    resetRoomSession();
    setCurrentView('matching');
  }, [broadcastToPartner, resetRoomSession]);

  const leaveStation = useCallback(() => {
    const s = stateRef.current;
    if (!s.partner.isBot) {
      broadcastToPartner(s.partner, { type: 'PARTNER_LEFT' });
    }
    resetRoomSession();
    setCurrentView('lobby');
    showToast('Bạn đã quay lại sảnh Trạm Mưa Đêm 🕯️');
  }, [broadcastToPartner, resetRoomSession, showToast]);

  const triggerBotReply = useCallback(
    (userText) => {
      const lower = userText.toLowerCase();
      setPartnerTyping(true);

      scheduleTimeout(() => {
        const s = stateRef.current;
        if (s.currentView !== 'chat' || !s.partner.isBot) return;

        if (lower.includes('caro') || lower.includes('cờ')) {
          handleIncomingChatMessage('Được luôn, mình gửi lời mời Cờ Caro 6x6 cho bạn rồi đó 🌙');
          scheduleTimeout(() => receiveGameInvite('caro'), 450);
          return;
        }
        if (lower.includes('vẽ') || lower.includes('kính')) {
          handleIncomingChatMessage('Ý hay đó! Cùng vẽ vài nét ánh sáng lên cửa kính mưa nhé 🪟');
          scheduleTimeout(() => receiveGameInvite('draw'), 450);
          return;
        }

        let reply = null;
        for (const rule of BOT_CONTEXT_RULES) {
          if (rule.keywords.some((kw) => lower.includes(kw))) {
            reply = rule.replies[botEmpathyIdxRef.current % rule.replies.length];
            break;
          }
        }
        if (!reply) {
          reply = BOT_HEALING_REPLIES[botEmpathyIdxRef.current % BOT_HEALING_REPLIES.length];
        }
        botEmpathyIdxRef.current += 1;
        handleIncomingChatMessage(reply);

        if (userMsgCountRef.current === 2 && botInviteStageRef.current === 0) {
          botInviteStageRef.current = 1;
          scheduleTimeout(() => receiveGameInvite('caro'), 880);
        } else if (userMsgCountRef.current === 4 && botInviteStageRef.current === 1) {
          botInviteStageRef.current = 2;
          scheduleTimeout(() => receiveGameInvite('draw'), 880);
        } else if (userMsgCountRef.current === 6 && botInviteStageRef.current === 2) {
          botInviteStageRef.current = 3;
          scheduleTimeout(() => receiveGameInvite('caro'), 880);
        }
      }, 800 + Math.random() * 420);
    },
    [handleIncomingChatMessage, receiveGameInvite, scheduleTimeout]
  );

  const sendChatMessage = useCallback(
    (raw) => {
      const text = raw.trim();
      if (!text) return;
      appendMessage({ kind: 'chat', sender: 'me', text });
      userMsgCountRef.current += 1;

      const s = stateRef.current;
      if (s.partner.isBot) {
        triggerBotReply(text);
      } else {
        broadcastToPartner(s.partner, { type: 'CHAT_MSG', text });
        broadcastToPartner(s.partner, { type: 'TYPING', isTyping: false });
      }
    },
    [appendMessage, broadcastToPartner, triggerBotReply]
  );

  const sendGameInvite = useCallback(
    (game) => {
      const msg =
        game === 'draw'
          ? 'Mình mời bạn cùng vẽ lên cửa kính mưa nhé 🪟'
          : 'Mình rủ bạn làm một ván Cờ Caro 6x6 thư giãn nhé 🌙';

      appendMessage({ kind: 'chat', sender: 'me', text: msg });
      const s = stateRef.current;
      if (s.partner.isBot) {
        setPartnerTyping(true);
        scheduleTimeout(() => {
          handleIncomingChatMessage(
            game === 'draw'
              ? 'Tuyệt vời! Mình đang đứng bên ô cửa kính mờ chờ bạn rồi đây 🪟'
              : 'Mình sẵn sàng rồi! Bạn mở bàn Cờ Caro 6x6 lên nhé 🌙'
          );
          receiveGameInvite(game);
        }, 650);
      } else {
        broadcastToPartner(s.partner, { type: 'CHAT_MSG', text: msg });
        broadcastToPartner(s.partner, { type: 'GAME_INVITE', game });
        showToast('Đã gửi lời mời đến đối phương!');
      }
    },
    [appendMessage, broadcastToPartner, handleIncomingChatMessage, receiveGameInvite, scheduleTimeout, showToast]
  );

  const handleTypingSignal = useCallback(() => {
    const s = stateRef.current;
    if (s.partner.isBot) return;
    broadcastToPartner(s.partner, { type: 'TYPING', isTyping: true });
    clearTimeout(typingDebounceRef.current);
    typingDebounceRef.current = setTimeout(() => {
      broadcastToPartner(stateRef.current.partner, { type: 'TYPING', isTyping: false });
    }, 1200);
  }, [broadcastToPartner]);

  const selectModalGameTab = useCallback((game) => {
    setActiveCenterGame(game);
    setBadges((prev) => ({ ...prev, [game]: false }));
    setPendingInviteGame((prev) => {
      if (prev === game) {
        setShowInviteBanner(false);
        return null;
      }
      return prev;
    });
  }, []);

  const openCenterGame = useCallback(
    (game) => {
      const s = stateRef.current;
      if (!s.partner.isBot) {
        broadcastToPartner(s.partner, { type: 'GAME_INVITE', game });
      }
      setIsMiniChatOpen(false);
      selectModalGameTab(game);
    },
    [broadcastToPartner, selectModalGameTab]
  );

  const closeCenterGame = useCallback(() => {
    setActiveCenterGame(null);
    setIsMiniChatOpen(false);
    setUnreadCount(0);
    setPreviewText('');
  }, []);

  const toggleMiniChat = useCallback((forceState) => {
    setIsMiniChatOpen((prev) => {
      const next = typeof forceState === 'boolean' ? forceState : !prev;
      if (next) {
        setUnreadCount(0);
        setPreviewText('');
      }
      return next;
    });
  }, []);

  // Frosted Glass Game handlers
  const drawBotDoodleReply = useCallback(() => {
    const shapeIdx = botDoodleCounterRef.current % 3;
    botDoodleCounterRef.current += 1;
    const cx = 0.72 + (Math.random() - 0.5) * 0.14;
    const cy = 0.3 + (Math.random() - 0.5) * 0.16;

    let stroke = null;
    if (shapeIdx === 0) {
      const r = 0.065;
      stroke = {
        points: [
          { x: cx, y: cy - r },
          { x: cx + r * 0.65, y: cy + r * 0.85 },
          { x: cx - r * 0.9, y: cy - r * 0.15 },
          { x: cx + r * 0.9, y: cy - r * 0.15 },
          { x: cx - r * 0.65, y: cy + r * 0.85 },
          { x: cx, y: cy - r }
        ],
        color: '#38bdf8',
        size: 5
      };
    } else if (shapeIdx === 1) {
      const pts = [];
      for (let t = 0; t <= Math.PI * 2 + 0.1; t += 0.32) {
        const hx = 16 * Math.pow(Math.sin(t), 3) * 0.0036;
        const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * 0.0042;
        pts.push({ x: cx + hx, y: cy + hy });
      }
      stroke = { points: pts, color: '#c084fc', size: 5 };
    } else {
      const pts = [];
      for (let a = -0.6; a <= Math.PI + 0.6; a += 0.28) {
        pts.push({ x: cx + Math.cos(a) * 0.055, y: cy + Math.sin(a) * 0.075 });
      }
      stroke = { points: pts, color: '#fbbf24', size: 5 };
    }

    setGlassStrokes((prev) => [...prev, stroke]);
  }, []);

  const handleCommitGlassStroke = useCallback(
    (stroke) => {
      setGlassStrokes((prev) => [...prev, stroke]);
      const s = stateRef.current;
      if (!s.partner.isBot) {
        broadcastToPartner(s.partner, {
          type: 'DRAW_STROKE',
          points: stroke.points,
          color: stroke.color,
          size: stroke.size
        });
      } else if (!botDoodleCooldownRef.current) {
        botDoodleCooldownRef.current = true;
        scheduleTimeout(() => {
          drawBotDoodleReply();
          scheduleTimeout(() => {
            botDoodleCooldownRef.current = false;
          }, 2200);
        }, 550);
      }
    },
    [broadcastToPartner, drawBotDoodleReply, scheduleTimeout]
  );

  const handleUndoGlassStroke = useCallback(() => {
    setGlassStrokes((prev) => prev.slice(0, -1));
    const s = stateRef.current;
    if (!s.partner.isBot) {
      broadcastToPartner(s.partner, { type: 'DRAW_UNDO' });
    }
  }, [broadcastToPartner]);

  const handleRefogGlass = useCallback(() => {
    setGlassStrokes([]);
    const s = stateRef.current;
    if (!s.partner.isBot) {
      broadcastToPartner(s.partner, { type: 'DRAW_CLEAR' });
    }
  }, [broadcastToPartner]);

  // Caro 6x6 handlers
  const scheduleBotCaroMove = useCallback(() => {
    scheduleTimeout(() => {
      const s = stateRef.current;
      if (!s.partner.isBot || !s.caroState.started || s.caroState.winner || s.caroState.turn === s.myCaroSymbol) {
        return;
      }
      const botSym = s.myCaroSymbol === 'MOON' ? 'STAR' : 'MOON';
      const moveIdx = pickSmartBotMove6x6(s.caroState.board, botSym, s.myCaroSymbol);
      if (moveIdx === -1) return;

      const nextBoard = s.caroState.board.slice();
      nextBoard[moveIdx] = botSym;
      const res = evaluateCaro6x6(nextBoard);

      setCaroState({
        started: true,
        board: nextBoard,
        turn: s.myCaroSymbol,
        winner: res.winner,
        winLine: res.winLine,
        lastMove: moveIdx,
        turnDeadline: Date.now() + CARO_TURN_SECONDS * 1000
      });

      if (res.winner) {
        recordCaroResult(res.winner, s.myCaroSymbol);
      }
      if (res.winner === botSym && s.activeCenterGame === 'caro') {
        handleIncomingChatMessage('Hehe mình vừa nối được 4 ngôi sao rồi! Làm thêm ván nữa cho vui nhé ⭐');
      }
    }, 700);
  }, [handleIncomingChatMessage, recordCaroResult, scheduleTimeout]);

  const startCaroGame = useCallback(() => {
    const next = {
      started: true,
      board: Array(CARO_SIZE * CARO_SIZE).fill(''),
      turn: 'MOON',
      winner: '',
      winLine: [],
      lastMove: -1,
      turnDeadline: Date.now() + CARO_TURN_SECONDS * 1000
    };
    setCaroState(next);

    const s = stateRef.current;
    if (!s.partner.isBot) {
      broadcastToPartner(s.partner, { type: 'CARO_START' });
    } else if (next.turn !== s.myCaroSymbol) {
      scheduleBotCaroMove();
    }
  }, [broadcastToPartner, scheduleBotCaroMove]);

  const resetCaroGame = useCallback(() => {
    const next = {
      started: true,
      board: Array(CARO_SIZE * CARO_SIZE).fill(''),
      turn: 'MOON',
      winner: '',
      winLine: [],
      lastMove: -1,
      turnDeadline: Date.now() + CARO_TURN_SECONDS * 1000
    };
    setCaroState(next);

    const s = stateRef.current;
    if (!s.partner.isBot) {
      broadcastToPartner(s.partner, { type: 'CARO_RESET' });
    } else if (next.turn !== s.myCaroSymbol) {
      scheduleBotCaroMove();
    }
  }, [broadcastToPartner, scheduleBotCaroMove]);

  const handleCaroCellClick = useCallback(
    (index) => {
      const s = stateRef.current;
      const c = s.caroState;
      if (!c.started || c.winner || c.board[index] !== '') return;
      if (c.turn !== s.myCaroSymbol) {
        showToast('Đang chờ đối phương đi lượt của họ nhé!');
        return;
      }

      const nextBoard = c.board.slice();
      nextBoard[index] = s.myCaroSymbol;
      const res = evaluateCaro6x6(nextBoard);
      const nextTurn = s.myCaroSymbol === 'MOON' ? 'STAR' : 'MOON';
      const deadline = Date.now() + CARO_TURN_SECONDS * 1000;

      setCaroState({
        started: true,
        board: nextBoard,
        turn: nextTurn,
        winner: res.winner,
        winLine: res.winLine,
        lastMove: index,
        turnDeadline: deadline
      });

      if (res.winner) {
        recordCaroResult(res.winner, s.myCaroSymbol);
      }

      if (!s.partner.isBot) {
        broadcastToPartner(s.partner, {
          type: 'CARO_MOVE',
          board: nextBoard,
          nextTurn,
          winner: res.winner,
          winLine: res.winLine,
          lastMove: index,
          deadline
        });
      } else if (!res.winner) {
        scheduleBotCaroMove();
      } else if (res.winner === s.myCaroSymbol) {
        scheduleTimeout(() => {
          handleIncomingChatMessage('Bạn đánh hay quá, thắng ván 6x6 thật đẹp! 🌙✨');
        }, 550);
      }
    },
    [broadcastToPartner, handleIncomingChatMessage, recordCaroResult, scheduleBotCaroMove, scheduleTimeout, showToast]
  );

  // Deterministic 15s timeout watcher for Caro
  useEffect(() => {
    if (currentView !== 'chat' || !caroState.started || caroState.winner) return;

    const msLeft = Math.max(0, caroState.turnDeadline - Date.now());
    const timeoutId = setTimeout(() => {
      const s = stateRef.current;
      const c = s.caroState;
      if (!c.started || c.winner) return;

      const empty = [];
      for (let i = 0; i < c.board.length; i++) {
        if (c.board[i] === '') empty.push(i);
      }
      if (empty.length === 0) return;

      const activeSym = c.turn;
      const wasMyTurn = activeSym === s.myCaroSymbol;
      const moveIdx = empty[Math.floor(Math.random() * empty.length)];
      const nextBoard = c.board.slice();
      nextBoard[moveIdx] = activeSym;
      const res = evaluateCaro6x6(nextBoard);
      const nextTurn = activeSym === 'MOON' ? 'STAR' : 'MOON';
      const deadline = Date.now() + CARO_TURN_SECONDS * 1000;

      if (wasMyTurn) {
        showToast('Hết 15 giây, hệ thống đã tự đi giúp bạn 1 nước 🌙');
      }

      setCaroState({
        started: true,
        board: nextBoard,
        turn: nextTurn,
        winner: res.winner,
        winLine: res.winLine,
        lastMove: moveIdx,
        turnDeadline: deadline
      });

      if (res.winner) {
        recordCaroResult(res.winner, s.myCaroSymbol);
      }

      if (!s.partner.isBot) {
        broadcastToPartner(s.partner, {
          type: 'CARO_MOVE',
          board: nextBoard,
          nextTurn,
          winner: res.winner,
          winLine: res.winLine,
          lastMove: moveIdx,
          deadline
        });
      } else if (!res.winner && nextTurn !== s.myCaroSymbol) {
        scheduleBotCaroMove();
      }
    }, msLeft + 40);

    return () => clearTimeout(timeoutId);
  }, [currentView, caroState.started, caroState.winner, caroState.turnDeadline, broadcastToPartner, recordCaroResult, scheduleBotCaroMove, showToast]);

  const handleRerollPersona = useCallback(() => {
    const next = createRandomPersona(myTabId);
    setSavedProfile({ name: next.name, avatar: next.avatar });
    showToast(`Danh tính mới: ${next.avatar} ${next.name}`);
  }, [myTabId, setSavedProfile, showToast]);

  const handleUpdateName = useCallback(
    (newName) => {
      setSavedProfile((prev) => ({ ...prev, name: newName }));
      showToast(`Đã đổi tên thành ${savedProfile.avatar} ${newName}`);
    },
    [savedProfile.avatar, setSavedProfile, showToast]
  );

  return html`
    <div className="app-shell">
      <${RainCanvas} density=${audio.rainDensity} />

      <${Toast} message=${toast.message} visible=${toast.visible} />

      <${Header}
        audio=${audio}
        onOpenBreathing=${() => setBreathingOpen(true)}
        onOpenRelease=${() => setReleaseOpen(true)}
      />

      <main className="main-stage">
        ${currentView === 'lobby' &&
        html`
          <${LobbyScreen}
            persona=${persona}
            mood=${mood}
            audio=${audio}
            onSelectMood=${setMood}
            onRerollPersona=${handleRerollPersona}
            onUpdateName=${handleUpdateName}
            onStartMatching=${startMatchingFlow}
            onMeetBot=${() => enterChatWithBot(0)}
            onOpenRelease=${() => setReleaseOpen(true)}
          />
        `}

        ${currentView === 'matching' &&
        html`
          <${MatchingScreen}
            persona=${persona}
            onMeetBot=${() => enterChatWithBot(0)}
            onCancel=${() => setCurrentView('lobby')}
          />
        `}

        ${currentView === 'chat' &&
        html`
          <${ChatScreen}
            partner=${partner}
            partnerStatusText=${partnerStatusText}
            messages=${messages}
            partnerTyping=${partnerTyping}
            badges=${badges}
            pendingInviteGame=${pendingInviteGame}
            showInviteBanner=${showInviteBanner}
            hidden=${activeCenterGame !== null}
            onAcceptInvite=${() => {
              setShowInviteBanner(false);
              if (pendingInviteGame) {
                const target = pendingInviteGame;
                setPendingInviteGame(null);
                openCenterGame(target);
              }
            }}
            onDismissInvite=${() => setShowInviteBanner(false)}
            onOpenGame=${openCenterGame}
            onSendMessage=${sendChatMessage}
            onSendGameInvite=${sendGameInvite}
            onTypingSignal=${handleTypingSignal}
            onFindNewPartner=${startMatchingFlow}
            onLeaveStation=${leaveStation}
          />
        `}
      </main>

      ${currentView === 'chat' &&
      html`
        <${GameModal}
          activeGame=${activeCenterGame}
          badges=${badges}
          onSelectTab=${selectModalGameTab}
          onClose=${closeCenterGame}
          glassStrokes=${glassStrokes}
          onCommitStroke=${handleCommitGlassStroke}
          onUndoStroke=${handleUndoGlassStroke}
          onRefog=${handleRefogGlass}
          onExportSuccess=${() => showToast('Đã lưu bức tranh kính mưa về máy 💾')}
          caroState=${caroState}
          caroScore=${caroScore}
          myCaroSymbol=${myCaroSymbol}
          partner=${partner}
          onStartCaro=${startCaroGame}
          onResetCaro=${resetCaroGame}
          onCaroCellClick=${handleCaroCellClick}
        />
      `}

      ${currentView === 'chat' &&
      html`
        <${MiniChatWidget}
          visible=${activeCenterGame !== null}
          partner=${partner}
          messages=${messages}
          isOpen=${isMiniChatOpen}
          unreadCount=${unreadCount}
          previewText=${previewText}
          onToggle=${toggleMiniChat}
          onOpenFromPreview=${() => toggleMiniChat(true)}
          onSendMessage=${sendChatMessage}
        />
      `}

      <${BreathingModal}
        isOpen=${breathingOpen}
        onClose=${() => setBreathingOpen(false)}
        onPhaseCue=${audio.playBreathCue}
      />

      <${ThoughtReleaseModal}
        isOpen=${releaseOpen}
        onClose=${() => setReleaseOpen(false)}
        onReleased=${() => showToast('Suy nghĩ đã trôi theo màn mưa 🌧️')}
      />
    </div>
  `;
}
