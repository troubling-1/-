"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const initialMessages = [
  { id: "1", from: "客服", content: "您好，下单前可以先告诉我服务类型、区服、预约时间和是否需要语音。" },
  { id: "2", from: "我", content: "想今晚 9 点后带撤离，最好能顺路护送一点物资。" },
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
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <Card>
        <CardHeader className="p-4 sm:p-5">
          <CardTitle>联系客服</CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">客服时间：每日 10:00 - 24:00。下单后请保持 QQ、微信或站内聊天可联系。</p>
        </CardHeader>
        <CardContent className="p-4 pt-0 sm:p-5 sm:pt-0">
          <div className="grid min-h-[420px] content-end gap-3 rounded-md border border-border bg-black/30 p-3 sm:p-4">
            {messages.map((message) => (
              <div key={message.id} className={message.from === "我" ? "justify-self-end" : "justify-self-start"}>
                <div className="max-w-[78vw] rounded-md bg-muted px-4 py-3 text-sm sm:max-w-md">
                  <p className="mb-1 text-xs text-muted-foreground">{message.from}</p>
                  <p className="leading-6">{message.content}</p>
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
