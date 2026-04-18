import { useMemo, useState } from "react";
import { FiMessageCircle, FiX } from "react-icons/fi";
import ChatBox from "../ChatBox";
import "./ChatWidget.scss";

function ChatWidget({
  title = "Tư vấn đặt tour",
  status = "online",
  defaultOpen = false,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggleLabel = useMemo(
    () => (isOpen ? "Đóng chat" : "Mở chat"),
    [isOpen],
  );

  return (
    <div className="chat-widget" data-open={isOpen ? "true" : "false"}>
      <div
        className="chat-widget__panel"
        aria-hidden={isOpen ? "false" : "true"}
      >
        {isOpen && <ChatBox title={title} status={status} />}
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
