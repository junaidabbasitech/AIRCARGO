export function Watermark() {
  return (
    <div className="fixed bottom-3 right-4 z-50 pointer-events-none select-none">
      <p className="text-[10px] text-slate-400/50 font-mono tracking-wide text-right leading-tight">
        © All rights reserved
        <br />
        <span className="font-semibold text-slate-400/60 tracking-widest uppercase text-[9px]">JUNAID ABBASI</span>
      </p>
    </div>
  );
}
