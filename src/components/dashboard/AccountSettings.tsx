import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  adminId: string;
}

const AccountSettings = ({ adminId }: Props) => {
  const [currentEmail, setCurrentEmail] = useState("");
  
  // Password State
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" });

  // Security Questions State
  const [question1, setQuestion1] = useState("");
  const [answer1, setAnswer1] = useState("");
  const [question2, setQuestion2] = useState("");
  const [answer2, setAnswer2] = useState("");
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityMessage, setSecurityMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    const { data } = await supabase
      .from("admin_users")
      .select("email, security_question_1, security_question_2")
      .eq("id", adminId)
      .single();
    
    if (data) {
      setCurrentEmail(data.email || "");
      setQuestion1(data.security_question_1 || "");
      setQuestion2(data.security_question_2 || "");
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "كلمات المرور غير متطابقة أو فارغة" });
      return;
    }
    
    setPasswordLoading(true);
    setPasswordMessage({ type: "", text: "" });
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      setPasswordMessage({ type: "error", text: error.message || "حدث خطأ أثناء تحديث كلمة المرور" });
    } else {
      setPasswordMessage({ type: "success", text: "تم تحديث كلمة المرور بنجاح" });
      setNewPassword("");
      setConfirmPassword("");
    }
    
    setPasswordLoading(false);
  };

  const handleUpdateSecurity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question1.trim() || !answer1.trim() || !question2.trim() || !answer2.trim()) {
      setSecurityMessage({ type: "error", text: "يرجى ملء جميع حقول أسئلة الأمان" });
      return;
    }

    setSecurityLoading(true);
    setSecurityMessage({ type: "", text: "" });

    try {
      // Hash Answer 1
      const { data: hashedAnswer1, error: hashError1 } = await supabase.rpc("hash_answer", {
        p_answer: answer1.toLowerCase().trim(),
      });
      if (hashError1) throw hashError1;

      // Hash Answer 2
      const { data: hashedAnswer2, error: hashError2 } = await supabase.rpc("hash_answer", {
        p_answer: answer2.toLowerCase().trim(),
      });
      if (hashError2) throw hashError2;

      // Update admin_users table
      const { error: updateError } = await supabase
        .from("admin_users")
        .update({
          security_question_1: question1.trim(),
          security_answer_1_hash: hashedAnswer1,
          security_question_2: question2.trim(),
          security_answer_2_hash: hashedAnswer2,
        })
        .eq("id", adminId);

      if (updateError) throw updateError;

      setSecurityMessage({ type: "success", text: "تم تحديث أسئلة الأمان بنجاح" });
      setAnswer1("");
      setAnswer2("");
    } catch (err: any) {
      setSecurityMessage({ type: "error", text: err.message || "حدث خطأ أثناء تحديث أسئلة الأمان" });
    }

    setSecurityLoading(false);
  };

  return (
    <div className="space-y-8" dir="rtl">
      <div>
        <h2 className="font-cinzel text-xl text-secondary mb-2">إعدادات الحساب</h2>
        <p className="font-amiri text-sm text-muted-foreground">البريد الإلكتروني الحالي: <span className="font-mono text-ink text-left" dir="ltr">{currentEmail}</span></p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Password Section */}
        <div className="bg-parchment/60 border border-gold/20 rounded-sm p-6 shadow-sm">
          <h3 className="font-cinzel text-lg text-secondary mb-4 flex items-center gap-2">
            🔑 تغيير كلمة المرور
          </h3>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="font-amiri text-sm text-accent block mb-1">كلمة المرور الجديدة</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-parchment border border-gold/30 rounded-sm px-3 py-2 font-amiri text-sm focus:outline-none focus:border-gold"
                dir="ltr"
              />
            </div>
            <div>
              <label className="font-amiri text-sm text-accent block mb-1">تأكيد كلمة المرور</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-parchment border border-gold/30 rounded-sm px-3 py-2 font-amiri text-sm focus:outline-none focus:border-gold"
                dir="ltr"
              />
            </div>

            {passwordMessage.text && (
              <p className={`font-amiri text-sm text-center ${passwordMessage.type === "error" ? "text-destructive" : "text-green-700"}`}>
                {passwordMessage.text}
              </p>
            )}

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full py-2 font-cinzel text-sm bg-secondary text-secondary-foreground border border-gold hover:bg-burgundy-light transition-colors disabled:opacity-50 rounded-sm"
            >
              {passwordLoading ? "جارٍ التحديث..." : "تحديث كلمة المرور"}
            </button>
          </form>
        </div>

        {/* Security Questions Section */}
        <div className="bg-parchment/60 border border-gold/20 rounded-sm p-6 shadow-sm">
          <h3 className="font-cinzel text-lg text-secondary mb-4 flex items-center gap-2">
            🛡️ تحديث أسئلة الأمان
          </h3>
          <p className="font-amiri text-xs text-muted-foreground mb-4">
            تُستخدم هذه الأسئلة لاستعادة حسابك في حال نسيان كلمة المرور.
          </p>
          <form onSubmit={handleUpdateSecurity} className="space-y-4">
            <div className="space-y-2">
              <label className="font-amiri text-sm text-accent block">السؤال الأول</label>
              <input
                type="text"
                value={question1}
                onChange={(e) => setQuestion1(e.target.value)}
                placeholder="أدخل سؤال الأمان الأول..."
                className="w-full bg-parchment border border-gold/30 rounded-sm px-3 py-2 font-amiri text-sm focus:outline-none focus:border-gold"
              />
              <input
                type="text"
                value={answer1}
                onChange={(e) => setAnswer1(e.target.value)}
                placeholder="إجابة السؤال الأول..."
                className="w-full bg-parchment border border-gold/30 rounded-sm px-3 py-2 font-amiri text-sm focus:outline-none focus:border-gold"
              />
            </div>

            <div className="space-y-2 mt-4">
              <label className="font-amiri text-sm text-accent block">السؤال الثاني</label>
              <input
                type="text"
                value={question2}
                onChange={(e) => setQuestion2(e.target.value)}
                placeholder="أدخل سؤال الأمان الثاني..."
                className="w-full bg-parchment border border-gold/30 rounded-sm px-3 py-2 font-amiri text-sm focus:outline-none focus:border-gold"
              />
              <input
                type="text"
                value={answer2}
                onChange={(e) => setAnswer2(e.target.value)}
                placeholder="إجابة السؤال الثاني..."
                className="w-full bg-parchment border border-gold/30 rounded-sm px-3 py-2 font-amiri text-sm focus:outline-none focus:border-gold"
              />
            </div>

            {securityMessage.text && (
              <p className={`font-amiri text-sm text-center ${securityMessage.type === "error" ? "text-destructive" : "text-green-700"}`}>
                {securityMessage.text}
              </p>
            )}

            <button
              type="submit"
              disabled={securityLoading}
              className="w-full mt-2 py-2 font-cinzel text-sm bg-accent text-accent-foreground border border-gold hover:bg-gold-light transition-colors disabled:opacity-50 rounded-sm"
            >
              {securityLoading ? "جارٍ التحديث..." : "تحديث أسئلة الأمان"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
