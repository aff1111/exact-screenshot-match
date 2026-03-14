import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-parchment">
      {/* Header */}
      <header className="border-b border-gold/20 bg-parchment/90 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="font-cinzel-decorative text-xl text-secondary">مكتوب</h1>
          <div className="flex items-center gap-4">
            <span className="font-amiri text-sm text-accent">أهلاً، أحمد</span>
            <button
              onClick={() => navigate("/")}
              className="font-cinzel text-xs text-accent hover:text-secondary transition-colors tracking-widest uppercase border border-gold/30 px-4 py-2 rounded-sm"
            >
              خروج
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-cinzel text-2xl text-secondary mb-8">لوحة التحكم</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Write new letter */}
            <DashboardCard
              title="كتابة رسالة جديدة"
              titleEn="Compose Letter"
              icon="✍"
              description="اكتب رسالة ملكية جديدة واختم بالشمع"
            />
            {/* Recipients */}
            <DashboardCard
              title="المستلمون"
              titleEn="Recipients"
              icon="📜"
              description="عرض وإدارة المستلمين والروابط"
            />
            {/* Security Events */}
            <DashboardCard
              title="سجل الأمان"
              titleEn="Security Log"
              icon="🛡"
              description="مراقبة الأحداث الأمنية والمحاولات"
            />
            {/* Sessions */}
            <DashboardCard
              title="الجلسات النشطة"
              titleEn="Active Sessions"
              icon="🔑"
              description="إدارة الجلسات وإنهاء الوصول"
            />
            {/* Analytics */}
            <DashboardCard
              title="التحليلات"
              titleEn="Analytics"
              icon="📊"
              description="إحصائيات الزيارات والقراءات"
            />
          </div>
        </motion.div>
      </main>
    </div>
  );
};

const DashboardCard = ({
  title,
  titleEn,
  icon,
  description,
}: {
  title: string;
  titleEn: string;
  icon: string;
  description: string;
}) => (
  <motion.div
    className="bg-parchment/80 border border-gold/20 rounded-sm p-6 cursor-pointer
               hover:border-gold/50 hover:shadow-gold transition-all duration-300"
    whileHover={{ y: -4 }}
  >
    <span className="text-3xl mb-3 block">{icon}</span>
    <h3 className="font-amiri text-lg text-secondary" dir="rtl">
      {title}
    </h3>
    <p className="font-cinzel text-xs text-accent tracking-widest uppercase mt-1">
      {titleEn}
    </p>
    <p className="font-amiri text-sm text-muted-foreground mt-3" dir="rtl">
      {description}
    </p>
  </motion.div>
);

export default Dashboard;
