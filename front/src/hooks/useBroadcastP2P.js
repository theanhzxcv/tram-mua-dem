import { useCallback, useEffect, useRef } from '../lib/html.js';

const CHANNEL_NAME = 'tram_mua_dem_p2p_v3';

export function useBroadcastP2P(myPersonaId, onMessage) {
  const channelRef = useRef(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    let ch = null;
    try {
      ch = new BroadcastChannel(CHANNEL_NAME);
      channelRef.current = ch;
      ch.onmessage = (event) => {
        const data = event.data;
        if (!data || data.senderId === myPersonaId) return;
        onMessageRef.current?.(data);
      };
    } catch (_) {
      channelRef.current = null;
    }

    return () => {
      if (ch) {
        try { ch.close(); } catch (_) {}
      }
      channelRef.current = null;
    };
  }, [myPersonaId]);

  const postRaw = useCallback((payload) => {
    if (!channelRef.current) return;
    try {
      channelRef.current.postMessage(payload);
    } catch (_) {
      // Ignore closed channel
    }
  }, []);

  const broadcastToPartner = useCallback((partner, payload) => {
    if (!channelRef.current || !partner || partner.isBot) return;
    try {
      channelRef.current.postMessage({
        ...payload,
        senderId: myPersonaId,
        targetId: partner.id
      });
    } catch (_) {
      // Ignore closed channel
    }
  }, [myPersonaId]);

  return {
    isSupported: typeof BroadcastChannel !== 'undefined',
    postRaw,
    broadcastToPartner
  };
}
