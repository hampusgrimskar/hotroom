import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-orange-500 to-red-600 p-4 text-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        <h1 className="mb-2 text-6xl font-bold tracking-tight">🔥 HotSeat</h1>
        <p className="mb-8 text-xl text-white/80">The party game that puts you in the hot seat</p>

        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <button
            onClick={() => navigate("/host")}
            className="rounded-xl bg-white px-8 py-4 text-lg font-semibold text-orange-600 shadow-lg transition hover:scale-105 hover:shadow-xl"
          >
            Host a Game
          </button>
          <button
            onClick={() => navigate("/join")}
            className="rounded-xl border-2 border-white px-8 py-4 text-lg font-semibold text-white transition hover:scale-105 hover:bg-white/10"
          >
            Join a Game
          </button>
        </div>
      </motion.div>
    </div>
  );
}
