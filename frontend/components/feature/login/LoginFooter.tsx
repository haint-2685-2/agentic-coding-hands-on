interface LoginFooterProps {
  text: string;
}

export function LoginFooter({ text }: LoginFooterProps) {
  return (
    <footer
      className="fixed bottom-0 left-0 right-0 z-10 flex w-full items-center justify-between px-[90px] py-[40px]"
      style={{
        borderTop: '1px solid #2E3940',
        backgroundColor: 'rgba(0, 16, 26, 1)',
      }}
    >
      <span
        className="block w-full text-center font-montserrat-alternates text-[16px] font-bold leading-[24px] text-white"
      >
        {text}
      </span>
    </footer>
  );
}
