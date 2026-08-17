import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { socket } from "../lib/socket";

export function JoinGame() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleJoin = () => {
    if (!code || !nickname) {
      setError("Please enter both a code and nickname");
      return;
    }

    setLoading(true);
    setError(null);

    socket.connect();

    socket.emit(
      "player:join",
      { code: code.toUpperCase(), nickname },
      (response: { success: boolean; error?: string }) => {
        setLoading(false);
        if (response.success) {
          navigate("/waiting");
        } else {
          setError(response.error || "Failed to join game");
        }
      },
    );
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-orange-500 to-red-600 p-4 text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <h2 className="mb-8 text-center text-3xl font-bold">Join Game</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-white/80">Room Code</label>
            <input
              type="text"
              maxLength={4}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABCD"
              className="w-full rounded-xl bg-white/10 px-4 py-3 text-center font-mono text-2xl uppercase tracking-widest text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-white/80">Nickname</label>
            <input
              type="text"
              maxLength={32}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-xl bg-white/10 px-4 py-3 text-center text-lg text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-900/50 px-4 py-2 text-center text-sm text-red-200">
              {error}
            </p>
          )}

          <button
            onClick={handleJoin}
            disabled={loading || !code || !nickname}
            className="w-full rounded-xl bg-white px-8 py-4 text-lg font-semibold text-orange-600 shadow-lg transition hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? "Joining..." : "Join"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
