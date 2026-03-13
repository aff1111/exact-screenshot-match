import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Recipient {
  id: string;
  display_label: string;
}

interface Props {
  recipient: Recipient;
  adminId: string;
}

const ConversationThread = ({ recipient, adminId }: Props) => {
  const [letters, setLetters] = useState<any[]>([]);
  const [replies, setReplies] = useState<Record<string, any[]>>({});
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    loadThread();
  }, [recipient.id]);

  const loadThread = async () => {
    setLoading(true);
    const { data: lettersData } = await supabase
      .from("letters")
      .select("id, content_type, is_read, order_index, created_at")
      .eq("recipient_id", recipient.id)
      .eq("is_active", true)
      .order("order_index", { ascending: true });

    setLetters(lettersData || []);

    // Load replies for all letters
    const repliesMap: Record<string, any[]> = {};
    for (const letter of lettersData || []) {
      const { data: repliesData } = await supabase
        .from("replies")
        .select("id, sender_type, is_read_by_admin, created_at")
        .eq("letter_id", letter.id)
        .order("created_at", { ascending: true });
      repliesMap[letter.id] = repliesData || [];
    }
    setReplies(repliesMap);
    setLoading(false);
  };

  const sendReply = async (letterId: string) => {
    const text = replyText[letterId]?.trim();
    if (!text) return;

    setSending(letterId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await supabase.functions.invoke("admin-reply", {
        body: { letter_id: letterId, content: text },
      });

      setReplyText((prev) => ({ ...prev, [letterId]: "" }));
      loadThread();
    } catch (err) {
      console.error(err);
    }
    setSending(null);
  };

  const markAsRead = async (letterId: string) => {
    const letterReplies = replies[letterId] || [];
    const unread = letterReplies.filter((r) => r.sender_type === "recipient" && !r.is_read_by_admin);
    for (const r of unread) {
      await supabase.from("replies").update({ is_read_by_admin: true }).eq("id", r.id);
    }
    loadThread();
  };

  if (loading) {
    return <p className="font-amiri text-muted-foreground text-center py-8">جارٍ التحميل...</p>;
  }

  return (
    <div className="space-y-6" dir="rtl">
      <h2 className="font-cinzel text-xl text-secondary">
        محادثة مع: {recipient.display_label || "بدون اسم"}
      </h2>

      {letters.length === 0 ? (
        <p className="font-amiri text-muted-foreground text-center py-8">لا توجد رسائل بعد</p>
      ) : (
        <div className="space-y-6">
          {letters.map((letter, i) => {
            const letterReplies = replies[letter.id] || [];
            const unreadCount = letterReplies.filter(
              (r) => r.sender_type === "recipient" && !r.is_read_by_admin
            ).length;

            return (
              <div key={letter.id} className="bg-parchment/60 border border-gold/20 rounded-sm p-5">
                {/* Letter header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-cinzel text-xs text-accent">
                      رسالة #{i + 1}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded font-cinzel ${
                      letter.content_type === "poetry"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"
                    }`}>
                      {letter.content_type === "poetry" ? "شعر" : "رسالة"}
                    </span>
                    {letter.is_read && (
                      <span className="text-xs text-green-600">✓ مقروءة</span>
                    )}
                  </div>
                  <span className="font-cinzel text-xs text-muted-foreground">
                    {new Date(letter.created_at).toLocaleDateString("ar")}
                  </span>
                </div>

                {/* Replies */}
                {letterReplies.length > 0 && (
                  <div className="space-y-2 mb-4 mr-4 border-r-2 border-gold/20 pr-4">
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAsRead(letter.id)}
                        className="font-amiri text-xs text-primary hover:underline"
                      >
                        {unreadCount} رد جديد — تعليم كمقروء
                      </button>
                    )}
                    {letterReplies.map((reply) => (
                      <div
                        key={reply.id}
                        className={`p-3 rounded-sm text-sm ${
                          reply.sender_type === "admin"
                            ? "bg-secondary/10 border border-secondary/20"
                            : "bg-primary/10 border border-primary/20"
                        } ${!reply.is_read_by_admin && reply.sender_type === "recipient" ? "ring-2 ring-primary/30" : ""}`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-cinzel text-xs text-accent">
                            {reply.sender_type === "admin" ? "أنت" : "المستلم"}
                          </span>
                          <span className="font-cinzel text-xs text-muted-foreground">
                            {new Date(reply.created_at).toLocaleString("ar")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply input */}
                <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    value={replyText[letter.id] || ""}
                    onChange={(e) => setReplyText((prev) => ({ ...prev, [letter.id]: e.target.value }))}
                    placeholder="اكتب ردك..."
                    className="flex-1 bg-parchment border border-gold/30 rounded-sm px-3 py-2 font-amiri text-sm focus:outline-none focus:border-gold"
                    dir="rtl"
                  />
                  <button
                    onClick={() => sendReply(letter.id)}
                    disabled={sending === letter.id || !replyText[letter.id]?.trim()}
                    className="font-cinzel text-xs bg-secondary text-secondary-foreground px-4 py-2 rounded-sm border border-gold hover:bg-burgundy-light transition-colors disabled:opacity-50"
                  >
                    {sending === letter.id ? "..." : "إرسال"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ConversationThread;
