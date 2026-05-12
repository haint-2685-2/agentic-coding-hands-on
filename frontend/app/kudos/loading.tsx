export default function Loading() {
  return (
    <main className="relative min-h-screen w-full bg-saa-bg text-white">
      <div className="h-[80px] w-full bg-saa-header" aria-hidden="true" />
      <div className="mx-auto flex w-full max-w-[1296px] flex-col gap-[40px] px-6 pt-[40px] lg:px-[144px]">
        <div className="h-[160px] w-full max-w-[600px] animate-pulse rounded-[12px] bg-white/5" />
        <div className="h-[72px] w-full max-w-[738px] animate-pulse rounded-[68px] bg-white/5" />
        <div className="h-[600px] w-full animate-pulse rounded-[24px] bg-white/5" />
        <div className="flex gap-[40px]">
          <div className="h-[1200px] flex-1 animate-pulse rounded-[24px] bg-white/5" />
          <div className="hidden h-[1200px] w-[422px] animate-pulse rounded-[17px] bg-white/5 lg:block" />
        </div>
      </div>
    </main>
  );
}
