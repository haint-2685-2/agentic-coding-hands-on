import Image from 'next/image';

/**
 * Long-form narrative introducing the "Root Further" theme of SAA 2025.
 * Sits between the Hero and the AwardsGrid on the homepage. Pure RSC —
 * the text is static brand copy, not i18n'd (Vietnamese only per spec).
 */
export function RootFurtherStory() {
  return (
    <section
      aria-labelledby="root-further-story-title"
      className="flex w-full max-w-[920px] flex-col items-center gap-[40px] text-center"
    >
      <Image
        src="/assets/homepage-saa/root-further-logo.png"
        alt="Root Further"
        width={280}
        height={124}
        className="h-auto w-[200px] md:w-[260px]"
        priority={false}
      />

      <h2
        id="root-further-story-title"
        className="font-montserrat text-[12px] font-bold uppercase tracking-[3px] text-saa-gold/80 md:text-[14px]"
      >
        Chủ đề Sun* Annual Awards 2025
      </h2>

      <div className="flex flex-col gap-[24px] text-left font-montserrat text-[15px] font-medium leading-[26px] text-white/85 md:text-[16px] md:leading-[28px]">
        <p>
          Đứng trước bối cảnh thay đổi như vũ bão của thời đại AI và yêu cầu
          ngày càng cao từ khách hàng, Sun* lựa chọn chiến lược đa dạng hóa
          năng lực để không chỉ nỗ lực trở thành tinh anh trong lĩnh vực của
          mình, mà còn hướng đến một cái đích cao hơn, nơi mọi Sunner đều là{' '}
          <span className="font-bold text-saa-gold">
            &ldquo;problem-solver&rdquo;
          </span>{' '}
          — chuyên gia trong việc giải quyết mọi vấn đề, tìm lời giải cho mọi
          bài toán của dự án, khách hàng và xã hội.
        </p>
        <p>
          Lấy cảm hứng từ sự đa dạng năng lực, khả năng phát triển linh hoạt
          cùng tinh thần đào sâu để bứt phá trong kỷ nguyên AI,{' '}
          <span className="font-bold text-saa-gold">&ldquo;Root Further&rdquo;</span>{' '}
          đã được chọn để trở thành chủ đề chính thức của Lễ trao giải Sun*
          Annual Awards 2025.
        </p>
        <p>
          Vượt ra khỏi nét nghĩa bề mặt, &ldquo;Root Further&rdquo; chính là
          hành trình chúng ta không ngừng vươn xa hơn, cắm rễ mạnh hơn, chạm
          đến những tầng &ldquo;địa chất&rdquo; ẩn sâu để tiếp tục tồn tại,
          vươn lên và nuôi dưỡng đam mê kiến tạo giá trị luôn cháy bỏng của
          người Sun*. Mượn hình ảnh bộ rễ liên tục đâm sâu vào lòng đất, mạnh
          mẽ len lỏi qua từng lớp &ldquo;trầm tích&rdquo; để thẩm thấu những
          gì tinh tuý nhất, người Sun* cũng đang &ldquo;hấp thụ&rdquo; dưỡng
          chất từ thời đại và những thử thách của thị trường để làm mới mình
          mỗi ngày, mở rộng năng lực và mạnh mẽ &ldquo;bén rễ&rdquo; vào kỷ
          nguyên AI — một tầng &ldquo;địa chất&rdquo; hoàn toàn mới, phức tạp
          và khó đoán, nhưng cũng hội tụ vô vàn tiềm năng cùng cơ hội.
        </p>
      </div>

      <blockquote className="relative my-[8px] flex w-full flex-col items-center gap-[12px] rounded-[16px] border border-saa-gold/30 bg-saa-gold/[0.04] px-[32px] py-[28px] md:px-[48px] md:py-[36px]">
        <span
          aria-hidden="true"
          className="absolute left-[16px] top-[8px] font-montserrat text-[64px] font-black leading-none text-saa-gold/40 md:left-[24px] md:top-[12px] md:text-[80px]"
        >
          “
        </span>
        <p className="font-montserrat text-[20px] font-bold italic leading-[30px] text-saa-gold md:text-[26px] md:leading-[36px]">
          A tree with deep roots fears no storm
        </p>
        <p className="font-montserrat text-[14px] font-medium leading-[22px] text-white/70 md:text-[15px]">
          (Cây sâu bền rễ, bão giông chẳng nề — Ngạn ngữ Anh)
        </p>
      </blockquote>

      <div className="flex flex-col gap-[24px] text-left font-montserrat text-[15px] font-medium leading-[26px] text-white/85 md:text-[16px] md:leading-[28px]">
        <p>
          Trước giông bão, chỉ những tán cây có bộ rễ đủ mạnh mới có thể trụ
          vững. Một tổ chức với những cá nhân tự tin vào năng lực đa dạng, sẵn
          sàng kiến tạo và đón nhận thử thách, làm chủ sự thay đổi — đó là tổ
          chức không chỉ vững vàng trước biến động, mà còn khai thác được mọi
          lợi thế, chinh phục các thách thức của thời cuộc. Không đơn thuần là
          tên gọi của chương mới trên hành trình phát triển tổ chức,{' '}
          <span className="font-bold text-saa-gold">
            &ldquo;Root Further&rdquo;
          </span>{' '}
          còn như một lời cổ vũ, động viên mỗi chúng ta hãy dám tin vào bản
          thân, dám đào sâu, khai mở mọi tiềm năng, dám phá bỏ giới hạn, dám
          trở thành phiên bản đa nhiệm và xuất sắc nhất của mình. Bởi trong
          thời đại AI, đa dạng năng lực và tận dụng sức mạnh thời cuộc chính
          là điều kiện tiên quyết để trường tồn.
        </p>
        <p>
          Không ai biết trước ẩn sâu trong &ldquo;lòng đất&rdquo; của ngành
          công nghệ và thị trường hiện đại còn biết bao tầng &ldquo;địa
          chất&rdquo; bí ẩn. Chỉ biết rằng khi &ldquo;Root Further&rdquo; đã
          trở thành tinh thần cội rễ, chúng ta sẽ không sợ hãi, mà càng thấy
          hào hứng trước bất cứ vùng vô định nào trên hành trình tiến về phía
          trước. Vì ta luôn tin rằng, trong chính những miền vô tận đó, là bao
          điều kỳ diệu và cơ hội vươn mình đang chờ ta.
        </p>
      </div>
    </section>
  );
}
