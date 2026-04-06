import {
  FaBullseye,
  FaEye,
  FaGem,
  FaRoute,
  FaUsers,
  FaMapMarkedAlt,
  FaStar,
  FaCompass,
  FaHeadset,
  FaSuitcaseRolling,
  FaCameraRetro,
} from "react-icons/fa";
import "./About.scss";

const missionCards = [
  {
    icon: FaBullseye,
    title: "Sứ mệnh",
    description:
      "Mang đến các hành trình du lịch nội địa an toàn, chỉn chu và giàu trải nghiệm văn hóa Việt Nam.",
  },
  {
    icon: FaEye,
    title: "Tầm nhìn",
    description:
      "Trở thành nền tảng đặt tour trong nước hàng đầu, nơi mỗi chuyến đi đều bắt đầu bằng sự tin tưởng.",
  },
  {
    icon: FaGem,
    title: "Giá trị cốt lõi",
    description:
      "Minh bạch dịch vụ, tối ưu lịch trình và đồng hành tận tâm để tạo ra hành trình đáng nhớ cho mọi khách hàng.",
  },
];

const stats = [
  { value: "500+", label: "Tour chất lượng", icon: FaRoute },
  { value: "20.000+", label: "Khách hàng đã phục vụ", icon: FaUsers },
  { value: "63", label: "Điểm đến toàn quốc", icon: FaMapMarkedAlt },
  { value: "4.9/5", label: "Đánh giá khách hàng", icon: FaStar },
];

const travelExperienceStations = [
  {
    title: "Chạm cảm hứng",
    subtitle: "Khám phá điểm đến",
    icon: FaCompass,
    description:
      "Bạn chọn phong cách du lịch yêu thích, ngân sách và thời gian. Hệ thống gợi ý hành trình phù hợp trong vài phút.",
  },
  {
    title: "Chốt lịch nhanh",
    subtitle: "Tư vấn 1-1",
    icon: FaHeadset,
    description:
      "Đội ngũ tư vấn tối ưu lịch trình theo nhu cầu thực tế, xác nhận dịch vụ và gửi lịch trình chi tiết rõ ràng.",
  },
  {
    title: "Lên đường",
    subtitle: "Bắt đầu hành trình",
    icon: FaSuitcaseRolling,
    description:
      "Từ lúc khởi hành đến khi kết thúc tour, bạn luôn có hỗ trợ đồng hành để chuyến đi mượt mà và an tâm.",
  },
  {
    title: "Giữ trọn kỷ niệm",
    subtitle: "Sau chuyến đi",
    icon: FaCameraRetro,
    description:
      "Tổng hợp album, đánh giá trải nghiệm và đề xuất hành trình kế tiếp dựa trên sở thích bạn đã thể hiện.",
  },
];

function About() {
  return (
    <main className="about-page">
      <section className="about-page__banner">
        <div className="about-page__banner-overlay" />
        <div className="about-page__container about-page__banner-content">
          <p className="about-page__eyebrow">VietXanh Travel Vietnam</p>
          <h1>Về Chúng Tôi</h1>
          <p>
            chúng tôi xây dựng những chuyến đi trong nước chỉn chu, linh hoạt và
            giàu bản sắc để mỗi hành trình là một kỷ niệm đẹp.
          </p>
        </div>
      </section>

      <section className="about-page__container about-intro">
        <div className="about-intro__media">
          <img
            src="https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1200&q=80"
            alt="Du lịch Việt Nam"
          />
        </div>
        <div className="about-intro__content">
          <h2>Chúng tôi là ai?</h2>
          <p>
            VietXanh Travel là đơn vị cung cấp dịch vụ đặt tour du lịch trong
            nước, tập trung vào trải nghiệm thực tế, lịch trình hợp lý và chi
            phí tối ưu. Từ những chuyến đi ngắn ngày cuối tuần đến các hành
            trình khám phá dài ngày, chúng tôi luôn đặt sự an tâm và hài lòng
            của khách hàng làm trung tâm.
          </p>
          <p>
            Đội ngũ của chúng tôi kết hợp kinh nghiệm điều hành tour, công nghệ
            đặt chỗ và dịch vụ hỗ trợ 24/7 để giúp bạn dễ dàng lên kế hoạch và
            tận hưởng chuyến đi một cách trọn vẹn.
          </p>
        </div>
      </section>

      <section className="about-page__container about-mission">
        <div className="about-page__section-head">
          <h2>Sứ mệnh và tầm nhìn</h2>
        </div>
        <div className="about-mission__grid">
          {missionCards.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="about-mission__card">
                <div className="about-mission__icon-wrap">
                  <Icon className="about-mission__icon" />
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="about-page__container about-stats">
        <div className="about-stats__grid">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.label} className="about-stats__item">
                <Icon className="about-stats__icon" />
                <h3>{item.value}</h3>
                <p>{item.label}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="about-page__container about-experience">
        <div className="about-page__section-head">
          <h2>Bản đồ trải nghiệm khách hàng</h2>
        </div>
        <div className="about-experience__rail" aria-hidden="true" />
        <div className="about-experience__grid">
          {travelExperienceStations.map((station, index) => {
            const Icon = station.icon;
            return (
              <article key={station.title} className="about-experience__card">
                <div className="about-experience__index">0{index + 1}</div>
                <div className="about-experience__icon-wrap">
                  <Icon className="about-experience__icon" />
                </div>
                <div className="about-experience__body">
                  <p className="about-experience__subtitle">
                    {station.subtitle}
                  </p>
                  <h3>{station.title}</h3>
                  <p>{station.description}</p>
                </div>
              </article>
            );
          })}
        </div>
        <blockquote className="about-experience__quote">
          "Không chỉ là một chuyến đi, đó là hành trình được thiết kế để bạn
          thật sự tận hưởng từng khoảnh khắc."
        </blockquote>
      </section>
    </main>
  );
}

export default About;
