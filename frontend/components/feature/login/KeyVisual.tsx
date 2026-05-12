import Image from 'next/image';

export function KeyVisual() {
  return (
    <div className="flex h-[200px] w-full flex-col items-start gap-[24px]">
      <Image
        src="/assets/login/root-further-logo.png"
        alt="ROOT FURTHER"
        width={451}
        height={200}
        priority
        className="h-[200px] w-[451px] object-cover"
      />
    </div>
  );
}
