export function FullScreenLoader() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-100 via-slate-50 to-white text-slate-500 dark:from-slate-900 dark:via-slate-950 dark:to-black dark:text-slate-400">
      <div
        className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-sky-500 dark:border-slate-700 dark:border-t-sky-400"
        aria-hidden
      />
      <span className="text-sm font-medium">Loading...</span>
    </div>
  );
}
