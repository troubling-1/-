"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const initialMessages = [
  { id: "1", from: "护航师 夜枭", content: "今晚可以接，主要打撤离还是物资？" },
  { id: "2", from: "我", content: "优先撤离，顺路带一点物资。" },
];

export default function ChatPage() {
  const [messages, setMessages] = useState(initialMessages);
  const [content, setContent] = useState("");

  function sendMessage() {
    const text = content.trim();

    if (!text) {
      return;
    }

    setMessages((current) => [...current, { id: `${Date.now()}`, from: "我", content: text }]);
    setContent("");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>实时聊天</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid min-h-[420px] gap-3 rounded-md border border-border bg-black/30 p-4">
            {messages.map((message) => (
              <div key={message.id} className={message.from === "我" ? "justify-self-end" : "justify-self-start"}>
                <div className="max-w-md rounded-md bg-muted px-4 py-3 text-sm">
                  <p className="mb-1 text-xs text-muted-foreground">{message.from}</p>
                  <p>{message.content}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <Input value={content} onChange={(event) => setContent(event.target.value)} placeholder="输入消息" onKeyDown={(event) => event.key === "Enter" && sendMessage()} />
            <Button type="button" onClick={sendMessage} size="icon" aria-label="发送消息">
              <Send className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
