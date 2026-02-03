export default function Launching() {
  return (
    <div className="min-h-screen bg-[#121212] text-zinc-200 flex items-center justify-center px-6">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 h-12 w-12 rounded-full border-2 border-zinc-700 border-t-blue-500 animate-spin" />
        <h1 className="text-2xl font-semibold text-white mb-2">
          Launching dashboard…
        </h1>
        <p className="text-sm text-zinc-400">
          Waiting for the backend to start.
        </p>
      </div>
    </div>
  );
}
