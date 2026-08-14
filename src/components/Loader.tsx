export default function Loader() {
  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="book">
        <div className="page" />
        <div className="page page2" />
      </div>
      <span className="select-none text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
        Made by <span className="bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">KpolitX</span> team
      </span>
    </div>
  );
}