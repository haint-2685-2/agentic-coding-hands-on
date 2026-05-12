import Image from 'next/image';

export function Logo() {
  return (
    <div className="flex h-[56px] w-[52px] items-center">
      <Image
        src="/assets/login/logo.png"
        alt="SAA 2025"
        width={52}
        height={48}
        priority
        className="h-[48px] w-[52px] object-cover"
      />
    </div>
  );
}
