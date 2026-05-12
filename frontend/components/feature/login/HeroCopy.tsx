interface HeroCopyProps {
  line1: string;
  line2: string;
}

export function HeroCopy({ line1, line2 }: HeroCopyProps) {
  return (
    <p
      className="w-[480px] max-w-full whitespace-pre-line font-montserrat text-[20px] font-bold leading-[40px] tracking-[0.5px] text-white"
      style={{ userSelect: 'none' }}
    >
      {line1}
      {'\n'}
      {line2}
    </p>
  );
}
