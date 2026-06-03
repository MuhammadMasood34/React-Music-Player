import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const CLIENT_ID_KEY = 'musicplayer-room:client-id';
const SERVER_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_SERVER_URL || 'http://localhost:3000';

const createClientId = () => {
  const existingId = localStorage.getItem(CLIENT_ID_KEY);
  if (existingId) return existingId;

  const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
  localStorage.setItem(CLIENT_ID_KEY, id);
  return id;
};

const normalizeRoomCode = (code) => code.trim().toUpperCase();

const emitWithAck = (socket, eventName, payload) => (
  new Promise((resolve, reject) => {
    socket.timeout(8000).emit(eventName, payload, (error, response) => {
      if (error) {
        reject(new Error('Room server did not respond'));
        return;
      }

      if (!response?.ok) {
        reject(new Error(response?.message || 'Room request failed'));
        return;
      }

      resolve(response);
    });
  })
);

const waitForSocketConnection = (socket) => (
  new Promise((resolve, reject) => {
    if (socket.connected) {
      resolve();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      cleanup();
      reject(new Error('Could not connect to room server'));
    }, 8000);

    const handleConnect = () => {
      cleanup();
      resolve();
    };

    const handleError = () => {
      cleanup();
      socket.disconnect();
      reject(new Error('Could not connect to room server'));
    };

    const cleanup = () => {
      window.clearTimeout(timeoutId);
      socket.off('connect', handleConnect);
      socket.off('connect_error', handleError);
    };

    socket.once('connect', handleConnect);
    socket.once('connect_error', handleError);
    socket.connect();
  })
);

export default function useRoomSync() {
  const clientIdRef = useRef(createClientId());
  const [roomCode, setRoomCode] = useState('');
  const [incomingCommand, setIncomingCommand] = useState(null);
  const [userCount, setUserCount] = useState(0);
  const [sharedPlaylist, setSharedPlaylist] = useState([]);
  const [error, setError] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const socket = useMemo(() => (
    io(SERVER_URL, {
      autoConnect: false,
      withCredentials: true,
      reconnection: false,
    })
  ), []);

  useEffect(() => {
    const handleConnect = () => {
      setIsConnected(true);
      setError('');
    };
    const handleDisconnect = () => setIsConnected(false);
    const handleState = (state) => {
      setRoomCode(state.code || '');
      setUserCount(state.userCount || 0);
      setSharedPlaylist(state.sharedPlaylist || []);

      const lastCommand = state.lastCommand;
      if (lastCommand?.payload && lastCommand.sourceId !== clientIdRef.current) {
        setIncomingCommand({
          ...lastCommand.payload,
          id: lastCommand.id,
          roomCode: state.code,
          sourceId: lastCommand.sourceId,
          sentAt: lastCommand.sentAt,
        });
      }
    };
    const handleCommand = (command) => {
      if (!command || command.sourceId === clientIdRef.current) return;
      setIncomingCommand(command);
    };
    const handleConnectError = () => {
      setIsConnected(false);
      setError('Could not connect to room server');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('room:state', handleState);
    socket.on('room:command', handleCommand);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('room:state', handleState);
      socket.off('room:command', handleCommand);
      socket.disconnect();
    };
  }, [socket]);

  const connectRoomServer = useCallback(async () => {
    setError('');

    try {
      await waitForSocketConnection(socket);
      setIsConnected(true);
      return true;
    } catch (roomError) {
      setIsConnected(false);
      setError(roomError.message);
      throw roomError;
    }
  }, [socket]);

  const createRoom = useCallback(async () => {
    setError('');

    try {
      await connectRoomServer();
      const response = await emitWithAck(socket, 'room:create', {
        clientId: clientIdRef.current,
      });
      const code = response.room.code;

      setRoomCode(code);
      setSharedPlaylist(response.room.sharedPlaylist || []);
      return code;
    } catch (roomError) {
      setError(roomError.message);
      throw roomError;
    }
  }, [connectRoomServer, socket]);

  const joinRoom = useCallback(async (code) => {
    const nextCode = normalizeRoomCode(code);
    if (!nextCode) return '';

    setError('');

    try {
      await connectRoomServer();
      const response = await emitWithAck(socket, 'room:join', {
        code: nextCode,
        clientId: clientIdRef.current,
      });

      setRoomCode(response.room.code);
      setSharedPlaylist(response.room.sharedPlaylist || []);
      return response.room.code;
    } catch (roomError) {
      setError(roomError.message);
      throw roomError;
    }
  }, [connectRoomServer, socket]);

  const leaveRoom = useCallback(() => {
    if (roomCode) {
      socket.emit('room:leave', {
        code: roomCode,
        clientId: clientIdRef.current,
      });
    }

    setRoomCode('');
    setIncomingCommand(null);
    setUserCount(0);
    setSharedPlaylist([]);
    setError('');
  }, [roomCode, socket]);

  const sendPlaylist = useCallback((tracks) => {
    if (!roomCode || !tracks?.length) return;

    socket.emit('room:playlist', {
      roomCode,
      clientId: clientIdRef.current,
      tracks,
    });
  }, [roomCode, socket]);

  const sendCommand = useCallback((command) => {
    if (!roomCode || !command) return;

    socket.emit('room:command', {
      roomCode,
      clientId: clientIdRef.current,
      command: {
        ...command,
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      },
    });
  }, [roomCode, socket]);

  return {
    roomCode,
    userCount,
    sharedPlaylist,
    incomingCommand,
    error,
    isConnected,
    connectRoomServer,
    createRoom,
    joinRoom,
    leaveRoom,
    sendPlaylist,
    sendCommand,
  };
}
