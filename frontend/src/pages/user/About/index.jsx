import {
  FaBullseye,
  FaEye,
  FaGem,
  FaRoute,
  FaUsers,
  FaMapMarkedAlt,
  FaStar,
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

const teamMembers = [
  {
    name: "Nguyễn Minh Anh",
    role: "CEO & Founder",
    image:
      "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Trần Quốc Bảo",
    role: "Giám đốc vận hành tour",
    image:
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Lê Thu Phương",
    role: "Trưởng nhóm chăm sóc khách hàng",
    image:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Phạm Đức Hoàng",
    role: "Travel Designer",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80",
  },
];

function About() {
  return (
    <main className="about-page">
      <section className="about-page__banner">
        <div className="about-page__banner-overlay" />
        <div className="about-page__container about-page__banner-content">
          <p className="about-page__eyebrow">BestPrice Travel Vietnam</p>
          <h1>Về Chúng Tôi</h1>
          <p>
            Chúng tôi xây dựng những chuyến đi trong nước chỉn chu, linh hoạt và
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
            BestPrice Travel là đơn vị cung cấp dịch vụ đặt tour du lịch trong
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

      <section className="about-page__container about-team">
        <div className="about-page__section-head">
          <h2>Đội ngũ của chúng tôi</h2>
        </div>
        <div className="about-team__grid">
          {teamMembers.map((member) => (
            <article key={member.name} className="about-team__card">
              <img src={member.image} alt={member.name} loading="lazy" />
              <div className="about-team__body">
                <h3>{member.name}</h3>
                <p>{member.role}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default About;
