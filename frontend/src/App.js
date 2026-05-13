import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

function App() {
  const [chats, setChats] = useState(() => {
    const saved = localStorage.getItem("ai-chats");

    return saved
      ? JSON.parse(saved)
      : [
          {
            id: Date.now(),
            title: "New Chat",
            messages: [
              {
                role: "assistant",
                content:
                  "Hello 👋 I am your AI assistant.",
              },
            ],
          },
        ];
  });

  const [activeChatId, setActiveChatId] =
    useState(chats[0].id);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  // Save chats in localStorage
  useEffect(() => {
    localStorage.setItem(
      "ai-chats",
      JSON.stringify(chats)
    );
  }, [chats]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [chats]);

  const activeChat = chats.find(
    (chat) => chat.id === activeChatId
  );

  const createNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: "New Chat",
      messages: [
        {
          role: "assistant",
          content:
            "Hello 👋 I am your AI assistant.",
        },
      ],
    };

    setChats((prev) => [newChat, ...prev]);
    setActiveChatId(newChat.id);
  };

  const updateChatMessages = (messages) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === activeChatId
          ? {
              ...chat,
              messages,
            }
          : chat
      )
    );
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      role: "user",
      content: input,
    };

    const updatedMessages = [
      ...activeChat.messages,
      userMessage,
    ];

    updateChatMessages(updatedMessages);

    // Update title from first message
    if (
      activeChat.title === "New Chat"
    ) {
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId
            ? {
                ...chat,
                title:
                  input.slice(0, 30) || "New Chat",
              }
            : chat
        )
      );
    }

    const currentInput = input;

    setInput("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/chat",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            message: currentInput,
          }),
        }
      );

      const data = await response.json();

      const aiMessage = {
        role: "assistant",
        content: data.reply,
      };

      updateChatMessages([
        ...updatedMessages,
        aiMessage,
      ]);
    } catch (error) {
      console.error(error);

      updateChatMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content:
            "Something went wrong ❌",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex bg-[#0f172a] text-white">
      {/* Sidebar */}
      <div className="w-[280px] bg-[#111827] border-r border-gray-700 flex flex-col">
        {/* New Chat Button */}
        <div className="p-4">
          <button
            onClick={createNewChat}
            className="w-full bg-blue-600 hover:bg-blue-700 transition p-3 rounded-xl"
          >
            + New Chat
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto px-2">
          {chats.map((chat) => (
            <div
              key={chat.id}
              onClick={() =>
                setActiveChatId(chat.id)
              }
              className={`p-3 rounded-xl cursor-pointer mb-2 transition ${
                activeChatId === chat.id
                  ? "bg-[#1e293b]"
                  : "hover:bg-[#1e293b]"
              }`}
            >
              <div className="truncate text-sm">
                {chat.title}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-700 px-6 py-4 bg-[#111827]">
          <h1 className="text-2xl font-bold">
            Claude AI Chat
          </h1>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {activeChat.messages.map(
              (msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.role === "user"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] px-5 py-4 rounded-2xl shadow-lg ${
                      msg.role === "user"
                        ? "bg-blue-600"
                        : "bg-[#1e293b]"
                    }`}
                  >
                    <div className="text-sm mb-2 font-semibold opacity-70">
                      {msg.role === "user"
                        ? "You"
                        : "Claude"}
                    </div>

                    <div className="prose prose-invert max-w-none">
                      <ReactMarkdown>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              )
            )}

            {loading && (
              <div className="bg-[#1e293b] inline-block px-5 py-4 rounded-2xl">
                Thinking...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="border-t border-gray-700 bg-[#111827] p-4">
          <div className="max-w-4xl mx-auto flex gap-3">
            <input
              type="text"
              placeholder="Ask anything..."
              className="flex-1 bg-[#1e293b] border border-gray-600 rounded-xl px-4 py-3 outline-none"
              value={input}
              onChange={(e) =>
                setInput(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSend();
                }
              }}
            />

            <button
              onClick={handleSend}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 transition px-6 rounded-xl disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;