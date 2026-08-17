import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useSocket } from "../lib/socket-context";
import { SocketEvents } from "@hotseat/shared";
import type { Player, Game } from "@hotseat/shared";

export function HostLobby() {
  const socket = useSocket();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    socket.connect();

    socket.emit(
      SocketEvents.HOST_CREATE,
      (response: { success: boolean; game?: Game; players?: Player[]; error?: string }) => {
        if (response.success && response.game) {
          setGame(response.game);
          setPlayers(response.players || []);
        } else {
          setError(response.error || "Failed to create game");
        }
      },
    );

    socket.on(SocketEvents.PLAYERS_UPDATED, (updatedPlayers: Player[]) => {
      setPlayers(updatedPlayers);
    });

    socket.on(SocketEvents.GAME_STARTED, () => {
      navigate("/game");
    });

    return () => {
      socket.off(SocketEvents.PLAYERS_UPDATED);
      socket.off(SocketEvents.GAME_STARTED);
      socket.disconnect();
    };
  }, [socket, navigate]);

  const handleStart = () => {
    socket.emit(SocketEvents.HOST_START, (response: { success: boolean; error?: string }) => {
      if (!response.success) {
        setError(response.error || "Failed to start game");
      }
    });
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-500 to-red-600 p-4">
        <div className="rounded-xl bg-white p-8 text-center shadow-xl">
          <p className="text-lg text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-500 to-red-600 p-4">
        <p className="text-xl text-white">Creating game...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-orange-500 to-red-600 p-4 text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center"
      >
        <h2 className="mb-2 text-2xl font-bold">Room Code</h2>
        <p className="mb-8 font-mono text-6xl font-bold tracking-widest">{game.code}</p>

        <div className="mb-8 rounded-xl bg-white/10 p-6">
          <h3 className="mb-4 text-lg font-semibold">Players ({players.length})</h3>
          {players.length === 0 ? (
            <p className="text-white/60">Waiting for players to join...</p>
          ) : (
            <ul className="space-y-2">
              {players.map((player) => (
                <li
                  key={player.id}
                  className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-2"
                >
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: player.color }}
                  />
                  <span className="font-medium">{player.nickname}</span>
                  {!player.connected && (
                    <span className="ml-auto text-sm text-white/50">disconnected</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          onClick={handleStart}
          disabled={players.length < 2}
          className="w-full rounded-xl bg-white px-8 py-4 text-lg font-semibold text-orange-600 shadow-lg transition hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100"
        >
          {players.length < 2 ? "Need at least 2 players" : "Start Game"}
        </button>
      </motion.div>
    </div>
  );
}
