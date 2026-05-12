/**
 * Server skeleton for `/awards`. Brief — auth probe + single fetch finish
 * fast, but the placeholder keeps layout from jumping.
 */
export default function AwardsLoading() {
  return (
    <div className="relative min-h-screen bg-saa-bg text-white">
      <main className="relative z-10 flex flex-col items-center gap-[80px] px-6 pb-[120px] pt-[160px] lg:px-[144px]">
        <div className="flex w-full max-w-[1152px] flex-col items-center gap-[40px]">
          <div className="h-[150px] w-[338px] animate-pulse rounded-[8px] bg-white/5" />
          <div className="h-[32px] w-[320px] animate-pulse rounded-[4px] bg-white/5" />
          <div className="h-[64px] w-[720px] max-w-full animate-pulse rounded-[4px] bg-white/5" />
        </div>

        <div className="flex w-full max-w-[1152px] flex-col gap-[40px] md:flex-row md:items-start md:gap-[80px]">
          <div className="flex flex-row gap-[8px] md:w-[178px] md:flex-col">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-[56px] w-full animate-pulse rounded-[4px] bg-white/5"
              />
            ))}
          </div>
          <div className="flex flex-1 flex-col gap-[80px]">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="flex w-full flex-col gap-[40px] md:flex-row"
              >
                <div className="h-[336px] w-[336px] flex-shrink-0 animate-pulse rounded-[24px] bg-white/5" />
                <div className="flex flex-1 flex-col gap-[16px]">
                  <div className="h-[32px] w-[40%] animate-pulse rounded-[4px] bg-white/5" />
                  <div className="h-[192px] w-full animate-pulse rounded-[4px] bg-white/5" />
                  <div className="h-[44px] w-[60%] animate-pulse rounded-[4px] bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
