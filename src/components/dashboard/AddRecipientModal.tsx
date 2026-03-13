import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  adminId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const AddRecipientModal = ({ adminId, onClose, onSuccess }: Props) => {
  const [name, setName] = useState("");
  const [displayLabel, setDisplayLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");

  const handleSubmit = async () => {
    if (!name.trim() || !displayLabel.trim()) {
      setError("يرجى ملء جميع الحقول");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Generate a random token
      const rawToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      // Hash the token using the hash_answer function (blowfish)
      const { data: tokenHash, error: hashError } = await supabase.rpc("hash_answer", {
        p_answer: rawToken,
      });

      if (hashError) throw hashError;

      // Encrypt the name
      const { data: encryptedName, error: encryptError } = await supabase.rpc("encrypt_content", {
        p_content: name.trim(),
      });

      if (encryptError) throw encryptError;

      // Insert recipient
      const { error: insertError } = await supabase.from("recipients").insert({
        admin_id: adminId,
        name_encrypted: encryptedName,
        display_label: displayLabel.trim(),
        token_hash: tokenHash,
      });

      if (insertError) throw insertError;

      // Generate the link
      const baseUrl = window.location.origin;
      setGeneratedLink(`${baseUrl}/s/${rawToken}`);
    } catch (err: any) {
      setError(err.message || "حدث خطأ");
    }
    setLoading(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(generatedLink);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        className="bg-parchment border border-gold/30 rounded-sm p-6 w-full max-w-md shadow-seal"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        dir="rtl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-cinzel text-xl text-secondary">إضافة مستلم جديد</h2>
          <button onClick={generatedLink ? onSuccess : onClose} className="text-accent hover:text-secondary text-xl">✕</button>
        </div>

        {generatedLink ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-sm p-4">
              <p className="font-amiri text-green-800 text-sm mb-2">✓ تم إنشاء المستلم بنجاح!</p>
              <p className="font-amiri text-xs text-muted-foreground mb-3">
                انسخ الرابط وأرسله للمستلم. هذا الرابط لن يظهر مرة أخرى.
              </p>
              <div className="bg-parchment border border-gold/30 rounded-sm p-2 break-all font-mono text-xs" dir="ltr">
                {generatedLink}
              </div>
              <button
                onClick={copyLink}
                className="mt-3 w-full py-2 font-cinzel text-xs bg-secondary text-secondary-foreground border border-gold rounded-sm hover:bg-burgundy-light"
              >
                نسخ الرابط
              </button>
            </div>
            <button
              onClick={onSuccess}
              className="w-full py-2 font-cinzel text-xs text-accent border border-gold/30 rounded-sm hover:bg-parchment-dark"
            >
              إغلاق
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="font-amiri text-sm text-accent block mb-1">اسم المستلم (سري - مشفر)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="الاسم الحقيقي..."
                className="w-full bg-parchment border border-gold/30 rounded-sm px-3 py-2 font-amiri text-sm focus:outline-none focus:border-gold"
                dir="rtl"
              />
            </div>
            <div>
              <label className="font-amiri text-sm text-accent block mb-1">التسمية المعروضة (غير مشفرة)</label>
              <input
                type="text"
                value={displayLabel}
                onChange={(e) => setDisplayLabel(e.target.value)}
                placeholder="مثل: صديق ١"
                className="w-full bg-parchment border border-gold/30 rounded-sm px-3 py-2 font-amiri text-sm focus:outline-none focus:border-gold"
                dir="rtl"
              />
            </div>

            {error && <p className="font-amiri text-destructive text-sm text-center">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2 font-cinzel text-xs text-accent border border-gold/30 rounded-sm hover:bg-parchment-dark"
              >
                إلغاء
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-[2] py-2 font-cinzel text-sm bg-secondary text-secondary-foreground border border-gold shadow-seal hover:bg-burgundy-light transition-colors disabled:opacity-50 rounded-sm"
              >
                {loading ? "جارٍ الإنشاء..." : "إنشاء رابط ✦"}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AddRecipientModal;
