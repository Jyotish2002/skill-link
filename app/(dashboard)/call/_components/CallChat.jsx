// components/CallChat.js
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { format } from "date-fns";

export default function CallChat({ dataChannel, user, otherPartyName }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef(null);

  // Handle incoming messages
  useEffect(() => {
    if (!dataChannel) return;

    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "chat") {
          setMessages((prev) => [
            ...prev,
            {
              id: `msg-${Date.now()}`,
              sender: data.sender,
              senderName: data.senderName,
              content: data.content,
              timestamp: new Date(),
            },
          ]);
        }
      } catch (err) {
        console.error("Error parsing message:", err);
      }
    };

    dataChannel.addEventListener("message", handleMessage);

    return () => {
      dataChannel.removeEventListener("message", handleMessage);
    };
  }, [dataChannel]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (e) => {
    e.preventDefault();

    if (!newMessage.trim() || !dataChannel) return;

    // Add message to local state
    const messageObj = {
      id: `msg-${Date.now()}`,
      sender: user.id,
      senderName: user.name,
      content: newMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, messageObj]);

    // Send message through data channel
    if (dataChannel.readyState === "open") {
      dataChannel.send(
        JSON.stringify({
          type: "chat",
          sender: user.id,
          senderName: user.name,
          content: newMessage,
        })
      );
    }

    setNewMessage("");
  };

  return (
    <>
      {/* Chat toggle button */}
      <Button
        variant="outline"
        className="flex items-center gap-1.5"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>Chat</span>
        {messages.length > 0 && (
          <div className="bg-blue-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-xs">
            {messages.length}
          </div>
        )}
      </Button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed right-4 bottom-16 w-80 h-96 bg-white rounded-lg shadow-lg flex flex-col overflow-hidden border z-50">
          {/* Chat header */}
          <div className="px-4 py-3 border-b bg-gray-50 flex justify-between items-center">
            <h3 className="font-medium">Chat with {otherPartyName}</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              &times;
            </button>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 my-8">
                <p>No messages yet</p>
                <p className="text-sm">Send a message to start chatting</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex flex-col ${
                    message.sender === user.id ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`px-3 py-2 rounded-lg max-w-[80%] ${
                      message.sender === user.id
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {message.content}
                  </div>
                  <span className="text-xs text-gray-500 mt-1">
                    {format(new Date(message.timestamp), "h:mm a")}
                  </span>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <form onSubmit={sendMessage} className="p-2 border-t flex gap-2">
            <Input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!dataChannel || dataChannel.readyState !== "open"}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
