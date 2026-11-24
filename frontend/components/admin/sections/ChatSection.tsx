import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, FileText, User } from "lucide-react";

export const ChatSection: React.FC = () => {
    const { token, user } = useAuth();
    const [clients, setClients] = useState<any[]>([]);
    const [selectedClient, setSelectedClient] = useState<any>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const ws = useRef<WebSocket | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Fetch clients
        const fetchClients = async () => {
            try {
                const res = await fetch("/api/v1/users/by-role?role=client", {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setClients(data);
                }
            } catch (err) {
                console.error("Failed to fetch clients", err);
            }
        };
        fetchClients();
    }, [token]);

    useEffect(() => {
        // Setup WebSocket
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/api/v1/chat/ws?token=${token}`;
        ws.current = new WebSocket(wsUrl);

        ws.current.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            setMessages((prev) => [...prev, msg].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
        };

        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [token]);

    useEffect(() => {
        if (selectedClient) {
            // Fetch history
            const fetchHistory = async () => {
                try {
                    const res = await fetch(`/api/v1/chat/history?other_user_id=${selectedClient.id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (res.ok) {
                        const data = await res.json();
                        setMessages(data);
                    }
                } catch (err) {
                    console.error("Failed to fetch history", err);
                }
            };
            fetchHistory();
        } else {
            setMessages([]);
        }
    }, [selectedClient, token]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    const handleSendMessage = () => {
        if (!newMessage.trim() || !selectedClient || !ws.current) return;

        const payload = {
            content: newMessage,
            recipient_id: selectedClient.id
        };
        ws.current.send(JSON.stringify(payload));
        setNewMessage("");
    };

    const handleExport = () => {
        if (!selectedClient) return;
        window.location.href = `/api/v1/chat/export?other_user_id=${selectedClient.id}&token=${token}`;
    };

    return (
        <div className="flex bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 h-[600px] overflow-hidden">
            {/* Sidebar - Client List */}
            <div className="w-1/3 border-r border-slate-200 dark:border-slate-800 flex flex-col">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                    <h2 className="text-xl font-bold flex items-center gap-2">
                        Zaufani Klienci
                    </h2>
                </div>
                <ScrollArea className="flex-1 p-2">
                    {clients.map((client) => (
                        <div
                            key={client.id}
                            onClick={() => setSelectedClient(client)}
                            className={`p-3 rounded-lg cursor-pointer flex items-center gap-3 transition-colors ${selectedClient?.id === client.id ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                        >
                            <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
                                <User className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                            </div>
                            <div>
                                <p className="font-semibold">{client.display_name || client.email}</p>
                                <p className="text-xs text-slate-500 truncate w-32">{client.email}</p>
                            </div>
                        </div>
                    ))}
                    {clients.length === 0 && (
                        <p className="text-center text-slate-500 mt-10">Brak klientów w systemie.</p>
                    )}
                </ScrollArea>
            </div>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-950">
                {selectedClient ? (
                    <>
                        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center text-blue-600">
                                    <User className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{selectedClient.display_name || selectedClient.email}</h3>
                                    <p className="text-xs text-emerald-500 flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> AES-256 Szyfrowany Kanał
                                    </p>
                                </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={handleExport} className="flex gap-2">
                                <FileText className="h-4 w-4" />
                                Eksport (PDF)
                            </Button>
                        </div>

                        <ScrollArea className="flex-1 p-4">
                            <div className="flex flex-col gap-3">
                                {messages.map((msg, i) => {
                                    // If sender_id is not current user, it's from the client
                                    const isMine = msg.sender_id === user?.id;

                                    // Filter out messages that aren't between us and the selected client
                                    if (!isMine && msg.sender_id !== selectedClient.id) return null;
                                    if (isMine && msg.recipient_id !== selectedClient.id) return null;

                                    return (
                                        <div key={msg.id || i} className={`max-w-[70%] ${isMine ? "self-end" : "self-start"}`}>
                                            <div className={`p-3 rounded-2xl ${isMine ? "bg-blue-600 text-white rounded-br-sm shadow-sm" : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-bl-sm shadow-sm"}`}>
                                                <p>{msg.content}</p>
                                            </div>
                                            <p className={`text-[10px] text-slate-400 mt-1 ${isMine ? "text-right" : "text-left"}`}>
                                                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    );
                                })}
                                <div ref={scrollRef} />
                            </div>
                        </ScrollArea>

                        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <div className="flex gap-2">
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                                    placeholder="Napisz bezpieczną wiadomość..."
                                    className="bg-slate-50 dark:bg-slate-800 focus-visible:ring-blue-500"
                                />
                                <Button onClick={handleSendMessage} className="bg-blue-600 hover:bg-blue-700">
                                    <Send className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center flex-col text-slate-500">
                        <User className="h-16 w-16 mb-4 opacity-20" />
                        <p className="text-lg font-medium">Wybierz klienta z listy, aby rozpocząć czat</p>
                        <p className="text-sm">Twoje rozmowy są kompleksowo szyfrowane (E2E-like).</p>
                    </div>
                )}
            </div>
        </div>
    );
};
