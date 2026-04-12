import { useEffect, useMemo, useRef, useState } from "react";
import { FiMessageCircle, FiX } from "react-icons/fi";
import Chatbox from "../Chatbox";
import "./ChatWidget.scss";

function createMessageId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function ChatWidget({
  title = "Tư vấn đặt tour",
  status = "online",
  defaultOpen = false,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [messages, setMessages] = useState(() => [
    {
      id: "welcome",
      sender: "bot",
      text: "Chào bạn! Mình có thể hỗ trợ tư vấn tour, lịch khởi hành và giá.",
      createdAt: new Date(),
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const timersRef = useRef([]);

  const toggleLabel = useMemo(
    () => (isOpen ? "Đóng chat" : "Mở chat"),
    [isOpen],
  );

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current = [];
    };
  }, []);

  const onSend = async (text) => {
    const now = new Date();

    setMessages((prev) => [
      ...prev,
      {
        id: createMessageId(),
        sender: "user",
        text,
        createdAt: now,
      },
    ]);

    setIsSending(true);

    const sendDoneTimer = setTimeout(() => {
      setIsSending(false);
      setIsTyping(true);
    }, 350);
    timersRef.current.push(sendDoneTimer);

    const replyTimer = setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: createMessageId(),
          sender: "bot",
          text: "Mình đã nhận được. Bạn muốn đi đâu và dự kiến ngày khởi hành nào ạ?",
          createdAt: new Date(),
        },
      ]);
    }, 1200);
    timersRef.current.push(replyTimer);
  };

  const onAttach = (file) => {
    setMessages((prev) => [
      ...prev,
      {
        id: createMessageId(),
        sender: "bot",
        text: `Đã đính kèm: ${file.name}`,
        createdAt: new Date(),
      },
    ]);
  };

  return (
    <div className="chat-widget" data-open={isOpen ? "true" : "false"}>
      <div className="chat-widget__panel" aria-hidden={isOpen ? "false" : "true"}>
        {isOpen && (
          <Chatbox
            title={title}
            status={status}
            messages={messages}
            isTyping={isTyping}
            isSending={isSending}
            onSend={onSend}
            onAttach={onAttach}
          />
        )}
      </div>

      <button
        type="button"
        className="chat-widget__toggle"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={toggleLabel}
      >
        {isOpen ? <FiX /> : <FiMessageCircle />}
      </button>
    </div>
  );
}

export default ChatWidget;
