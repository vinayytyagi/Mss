export default function AuthScene({
  children,
  title,
  subtitle,
  variant = 0,
  stepLabels = [],
  activeStep = 0,
}) {
  const hasStepper = Array.isArray(stepLabels) && stepLabels.length > 0;

  return (
    <main className="relative flex min-h-screen w-full items-center justify-center bg-slate-900 selection:bg-[#ff4f86] selection:text-white">
      {/* Ambience Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/login_bg.png')" }}
      />
      <div className="absolute inset-0 bg-linear-to-br from-slate-900/65 via-slate-900/45 to-[#ff4f86]/20" />

      <div className={`relative z-10 w-full px-4 ${hasStepper ? "max-w-6xl" : "max-w-[560px]"}`}>
        {hasStepper ? (
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.25fr]">
            <div className="hidden lg:block">
              <div className="mx-auto w-full max-w-md">
                <div className="mb-6 flex h-28 w-28 items-center justify-center rounded-full border-4 border-white/70 bg-white/95 text-[#ff4f86] shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
                  <span className="text-4xl">❤</span>
                </div>
                <h2 className="text-6xl font-semibold tracking-tight text-white">MyShaadiStore</h2>
                <p className="mt-4 text-3xl font-medium text-white/95">Sign in to plan your dream wedding</p>
                <div className="mt-5 h-1 w-40 rounded-full bg-[#ff4f86]" />
              </div>
            </div>

            <div>
              <div className="mb-5 px-1">
                <div className="flex items-center justify-between gap-2">
                  {stepLabels.map((label, index) => {
                    const isActive = index <= activeStep;
                    return (
                      <div key={label} className="flex flex-1 flex-col items-center gap-1">
                        <div className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold ${isActive ? "border-[#ff4f86] bg-[#ff4f86] text-white" : "border-white/70 bg-white/90 text-slate-500"}`}>
                          {index + 1}
                        </div>
                        <span className={`text-[11px] ${isActive ? "text-[#ff6b9a]" : "text-white/70"}`}>{label}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-2 h-1 w-full rounded-full bg-white/80">
                  <div
                    className="h-1 rounded-full bg-[#ff4f86] transition-all"
                    style={{ width: `${((activeStep + 1) / stepLabels.length) * 100}%` }}
                  />
                </div>
              </div>

              <div className="overflow-hidden rounded-3xl border border-white/50 bg-[#fff8fb] p-8 shadow-[0_30px_90px_rgba(0,0,0,0.45)] ring-1 ring-black/5 backdrop-blur-sm sm:p-10">
                <div className="mb-8 text-center">
                  <h1 className="text-3xl font-semibold leading-tight tracking-tight text-slate-800 sm:text-4xl">
                    {title || "Plan Your Dream Wedding"}
                  </h1>
                </div>
                <div className="relative space-y-6">{children}</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl border border-white/50 bg-[#fff8fb] p-8 shadow-[0_30px_90px_rgba(0,0,0,0.45)] ring-1 ring-black/5 backdrop-blur-sm sm:p-10">
            <div className="mb-10 text-center">
              <h1 className="text-3xl font-semibold leading-tight tracking-tight text-slate-800 sm:text-4xl">
                {title || "Plan Your Dream Wedding"}
              </h1>
            </div>
            <div className="relative space-y-6">{children}</div>
            <div className="mt-10 text-center">
              <p className="mb-4 text-[11px] font-medium text-slate-400">Trusted by 10k+ couples</p>
              <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs font-medium text-slate-500">
                 <span className="text-slate-400">By continuing, you agree:</span>
                 <div className="flex items-center gap-4">
                   <a href="#" className="text-[#ff4f86] underline decoration-2 underline-offset-4 decoration-[#ff4f86]/20 transition-all hover:decoration-[#ff4f86]">Terms</a>
                   <span className="h-1 w-1 rounded-full bg-slate-300" />
                   <a href="#" className="text-[#ff4f86] underline decoration-2 underline-offset-4 decoration-[#ff4f86]/20 transition-all hover:decoration-[#ff4f86]">Privacy Policy</a>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
