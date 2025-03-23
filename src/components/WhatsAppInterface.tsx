'use client';

import { JSX, useState, useRef, useEffect } from "react";
import { MessageSquareMore, Users, X, Plus, Pencil } from "lucide-react";
import { Button } from "./ui/button";
import pLimit from 'p-limit';

interface Message {
  content: string;
  isSent: boolean;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  file?: File | null;
  phone?: string;
  group?: string;
}

interface Group {
  id: string;
  name: string;
  numbers: string[];
}

export default function SendMessagePage(): JSX.Element {
  const [phone, setPhone] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [phoneNumbers, setPhoneNumbers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [responseMessage, setResponseMessage] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Group state
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<Group[]>([]);
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupNumbers, setNewGroupNumbers] = useState<string>("");
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [newNumberInput, setNewNumberInput] = useState<string>("");
  const [selectedNumbersForGroup, setSelectedNumbersForGroup] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const groupMenuRef = useRef<HTMLDivElement>(null);
  const groupModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    const savedGroups = localStorage.getItem('whatsapp-groups');
    if (savedGroups) setGroups(JSON.parse(savedGroups));
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (groupMenuRef.current && !groupMenuRef.current.contains(event.target as Node)) {
        setIsGroupMenuOpen(false);
      }
      if (groupModalRef.current && !groupModalRef.current.contains(event.target as Node)) {
        setIsGroupModalOpen(false);
        setEditingGroup(null);
        setNewGroupName("");
        setNewGroupNumbers("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function fetchData() {
      try {
        const usersRes = await fetch("/api/proxy");
        if (!usersRes.ok) throw new Error("Failed to fetch users");
        const users: { phone_number: string }[] = await usersRes.json();
        const numbers = [...new Set(users.map((user: any) => String(user.phone_number)))];
        setPhoneNumbers(numbers);

        const messagesRes = await fetch("/api/messages");
        if (!messagesRes.ok) throw new Error("Failed to fetch messages");
        const { messages: apiMessages } = await messagesRes.json();

        const receivedMessages: Message[] = apiMessages.map((msg: any) => ({
          content: msg.message,
          isSent: false,
          timestamp: new Date(msg.timestamp),
          status: 'delivered',
          phone: msg.phone_number
        }));

        setMessages(prev => [...receivedMessages, ...prev]);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const createOrUpdateGroup = () => {
    if (!newGroupName || selectedNumbersForGroup.length === 0) return;

    const newGroup: Group = {
      id: editingGroup ? editingGroup.id : Date.now().toString(),
      name: newGroupName,
      numbers: [...new Set(selectedNumbersForGroup)]
    };

    setGroups(prev => {
      const updatedGroups = editingGroup
        ? prev.map(g => g.id === editingGroup.id ? newGroup : g)
        : [...prev, newGroup];
      localStorage.setItem('whatsapp-groups', JSON.stringify(updatedGroups));
      return updatedGroups;
    });

    setNewGroupName("");
    setSelectedNumbersForGroup([]);
    setEditingGroup(null);
    setIsGroupModalOpen(false);
  };

  // Add number to group
  const addNumberToGroup = () => {
    const number = newNumberInput.trim();
    if (number && !selectedNumbersForGroup.includes(number)) {
      setSelectedNumbersForGroup(prev => [...prev, number]);
      setNewNumberInput("");
    }
  };

  // Remove number from group
  const removeNumberFromGroup = (number: string) => {
    setSelectedNumbersForGroup(prev => prev.filter(n => n !== number));
  };


  const deleteGroup = (groupId: string) => {
    setGroups(prev => {
      const updatedGroups = prev.filter(g => g.id !== groupId);
      localStorage.setItem('whatsapp-groups', JSON.stringify(updatedGroups));
      return updatedGroups;
    });
    setSelectedGroups(prev => prev.filter(g => g.id !== groupId));
  };

  const sendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!message || (selectedGroups.length === 0 && !phone)) return;

    try {
      let numbersToSend: string[] = [];

      if (selectedGroups.length > 0) {
        numbersToSend = selectedGroups.flatMap(group => group.numbers);
      } else if (phone) {
        numbersToSend = [phone];
      }

      const failedNumbers: string[] = [];
      const limit = pLimit(10);

      const requests = numbersToSend.map((number) => {
        const newMessage: Message = {
          content: message,
          isSent: true,
          timestamp: new Date(),
          status: 'sent',
          file,
          phone: number,
          group: selectedGroups.length > 0 ? selectedGroups.map(g => g.name).join(', ') : undefined
        };

        setMessages(prev => [...prev, newMessage]);

        const formData = new FormData();
        formData.append("phone", number);
        formData.append("message", message);
        if (file) formData.append("file", file);

        return limit(async () => {
          try {
            const res = await fetch("/api/send-message", {
              method: "POST",
              body: formData,
            });

            setMessages(prev => prev.map(msg =>
              msg === newMessage ? { ...msg, status: res.ok ? 'delivered' : 'sent' } : msg
            ));

            if (!res.ok) failedNumbers.push(number);
          } catch (error) {
            failedNumbers.push(number);
          }
        });
      });

      await Promise.allSettled(requests);

      setResponseMessage({
        success: true,
        message: `Message sent to ${numbersToSend.length - failedNumbers.length} recipients. Failed: ${failedNumbers.length}`
      });

    } catch (error) {
      setResponseMessage({
        success: false,
        message: "Failed to connect to server"
      });
    }

    setMessage("");
    setFile(null);
    setSelectedGroups([]);
    setPhone("");
  };

  const broadcastMessages = async () => {
    if (isBroadcasting) return;
    setIsBroadcasting(true);

    const limit = pLimit(10);

    const requests = phoneNumbers.map((number) => {
      const newMessage: Message = {
        content: `Broadcast message to ${number}`,
        isSent: true,
        timestamp: new Date(),
        status: 'sent',
        file: null
      };
      setMessages(prev => [...prev, newMessage]);

      const formData = new FormData();
      formData.append("phone", number);
      formData.append("message", message);
      if (file) formData.append("file", file);

      return limit(async () => {
        const response = await fetch("/api/send-message", { method: "POST", body: formData });

        setMessages(prev => prev.map(msg =>
          msg === newMessage ? { ...msg, status: response.ok ? 'delivered' : 'sent' } : msg
        ));

        return response;
      });
    });

    const results = await Promise.allSettled(requests);

    const failedNumbers = results
      .map((result, index) => (result.status === "rejected" ? phoneNumbers[index] : null))
      .filter(Boolean);

    setResponseMessage({
      success: true,
      message: `Broadcasted to ${phoneNumbers.length - failedNumbers.length} contacts. Failed: ${failedNumbers.length}`
    });

    if (failedNumbers.length > 0) {
      console.warn("Failed to send messages to:", failedNumbers);
    }
    setIsBroadcasting(false);
  };

  const sendInteractiveMessage = async () => {
    if (!phone) return;

    try {
      const formData = new FormData();
      formData.append("phone", phone);

      const response = await fetch("/api/send-interactive", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to send interactive message");
      }
    } catch (error) {
      console.error("Error sending interactive message:", error);
    }
  };

  const sendTemplateMessage = async () => {
    if (!phone) return;

    const newMessage: Message = {
      content: `Registration Form`,
      isSent: true,
      timestamp: new Date(),
      status: 'sent',
      file: null
    };
    setMessages(prev => [...prev, newMessage]);

    const formData = new FormData();
    formData.append("phone", phone);

    console.log(`Sending to: ${phone}`);

    try {
      const response = await fetch("/api/sendMessage", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      console.log(`Response for ${phone}:`, result);

      setMessages(prev => prev.map(msg =>
        msg === newMessage ? { ...msg, status: response.ok ? 'delivered' : 'sent' } : msg
      ));

      setResponseMessage(response.ok ?
        { success: true, message: `Template message sent to ${phone}` } :
        { success: false, message: result.error || "Failed to send template message" }
      );

    } catch (error) {
      console.error(`Error sending to ${phone}:`, error);
      setResponseMessage({
        success: false,
        message: "Failed to connect to server"
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setFile(e.target.files[0]);
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  return (
    <div className="h-full flex flex-col bg-[#ece5dd]">
      {/* Chat Header */}
      <div className="bg-[#075e54] p-4 flex items-center gap-2 relative">
        <div className="flex-1 flex flex-wrap gap-2 items-center min-h-[40px]">
          {selectedGroups.map(group => (
            <div key={group.id} className="bg-[#128c7e] rounded-full px-3 py-1 text-sm flex items-center gap-2 text-white">
              {group.name}
              <button
                onClick={() => setSelectedGroups(prev => prev.filter(g => g.id !== group.id))}
                className="hover:text-[#dcf8c6]"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          <input
            type="text"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setSelectedGroups([]);
            }}
            placeholder={selectedGroups.length > 0 ? "" : "Enter phone number or select groups"}
            className="bg-transparent text-white placeholder-gray-300 focus:outline-none flex-1 min-w-[200px]"
          />
        </div>

        <div className="relative" ref={groupMenuRef}>
          <button
            onClick={() => setIsGroupMenuOpen(!isGroupMenuOpen)}
            className="text-white hover:text-[#dcf8c6] p-2 relative"
          >
            <Users />
            {selectedGroups.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {selectedGroups.length}
              </span>
            )}
          </button>

          {isGroupMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg p-2 z-50">
              <div className="max-h-64 overflow-y-auto">
                <button
                  onClick={() => {
                    setIsGroupModalOpen(true);
                    setIsGroupMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 p-2 hover:bg-gray-100 rounded text-sm"
                >
                  <Plus size={16} /> Create New Group
                </button>

                {groups.map(group => (
                  <div key={group.id} className="flex items-center justify-between p-2 hover:bg-gray-100 rounded">
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedGroups.some(g => g.id === group.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedGroups(prev => [...prev, group]);
                            setPhone("");
                          } else {
                            setSelectedGroups(prev => prev.filter(g => g.id !== group.id));
                          }
                        }}
                        className="accent-[#075e54]"
                      />
                      <span className="truncate flex-1">{group.name}</span>
                      <span className="text-xs text-gray-500">({group.numbers.length})</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingGroup(group);
                          setNewGroupName(group.name);
                          setNewGroupNumbers(group.numbers.join('\n'));
                          setIsGroupModalOpen(true);
                          setIsGroupMenuOpen(false);
                        }}
                        className="text-gray-500 hover:text-[#075e54] p-1"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => deleteGroup(group.id)}
                        className="text-gray-500 hover:text-red-600 p-1"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Group Creation/Edit Modal */}
      {isGroupModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-end p-4 z-50">
          <div ref={groupModalRef} className="bg-white p-4 rounded-lg w-80 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">
                {editingGroup ? "Edit Group" : "New Group"}
              </h3>
              <button
                onClick={() => {
                  setIsGroupModalOpen(false);
                  setEditingGroup(null);
                  setNewGroupName("");
                  setSelectedNumbersForGroup([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <input
              type="text"
              placeholder="Group name"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="w-full mb-4 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#075e54]"
            />

            <div className="mb-4">
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Add number"
                  value={newNumberInput}
                  onChange={(e) => setNewNumberInput(e.target.value)}
                  className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-[#075e54]"
                  onKeyPress={(e) => e.key === 'Enter' && addNumberToGroup()}
                />
                <Button
                  onClick={addNumberToGroup}
                  className="bg-[#075e54] text-white hover:bg-[#054d43]"
                  disabled={!newNumberInput.trim()}
                >
                  Add
                </Button>
              </div>

              <div className="max-h-40 overflow-y-auto">
                {selectedNumbersForGroup.map((number) => (
                  <div key={number} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                    <span className="text-sm">{number}</span>
                    <button
                      onClick={() => removeNumberFromGroup(number)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <Button
              onClick={createOrUpdateGroup}
              className="w-full bg-[#075e54] text-white hover:bg-[#054d43]"
              disabled={!newGroupName || selectedNumbersForGroup.length === 0}
            >
              {editingGroup ? "Save Changes" : "Create Group"}
            </Button>
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#efeae2]">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.isSent ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-lg max-w-[80%] shadow bg-[#dcf8c6]`}>
              {msg.file && (
                <div className="mb-2 text-sm text-gray-500 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  {msg.file.name}
                </div>
              )}
              {msg.group && (
                <div className="text-xs text-gray-500 mb-1">
                  Group: {msg.group}
                </div>
              )}
              {!msg.group && msg.isSent && (
                <div className="text-xs text-gray-500 mb-1">
                  To: {msg.phone}
                </div>
              )}
              <p className="text-gray-800">{msg.content}</p>
              <div className="flex items-center justify-end gap-2 mt-2">
                <span className="text-xs text-gray-500">
                  {new Date(msg.timestamp).toLocaleDateString([], {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}{" "}
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                {msg.isSent && (
                  <span className="text-xs text-gray-500">
                    {msg.status === 'read' ? '✓✓' :
                      msg.status === 'delivered' ? '✓' : '◷'}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white p-4 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <form onSubmit={sendMessage} className="flex gap-2 items-center flex-1">
            <div className="relative flex-1">
              <button
                type="button"
                onClick={triggerFileInput}
                className="absolute left-2 top-2 text-[#075e54] hover:text-[#128c7e]"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
              </button>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type a message"
                className="w-full border rounded-2xl py-2 px-4 pl-12 pr-4 resize-none focus:outline-none focus:border-[#075e54]"
                rows={1}
                required
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
              {file && (
                <div className="absolute bottom-12 left-0 bg-white p-2 rounded-lg shadow flex items-center">
                  <span className="text-sm text-gray-600 mr-2">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="text-red-500 hover:text-red-700"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {/* Send Button */}
            <button
              type="submit"
              className="bg-[#075e54] text-white p-2 rounded-full w-10 h-10 flex items-center justify-center hover:bg-[#054d43]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </form>

          {/* Interactive Message Button (Now outside the form) */}
          <Button onClick={sendTemplateMessage} className="bg-[#075e54] text-white p-2 rounded-full w-10 h-10 flex items-center justify-center hover:bg-[#054d43]">
            <MessageSquareMore />
          </Button>
        </div>

        <button
          onClick={broadcastMessages}
          disabled={isBroadcasting}
          className={`mt-2 w-full text-center text-sm ${isBroadcasting ? "text-gray-400 cursor-not-allowed" : "text-[#075e54] hover:text-[#054d43]"
            }`}
        >
          {isBroadcasting ? "Broadcasting..." : "Broadcast Message"}
        </button>

      </div>




      {/* Status Messages */}
      {/* {responseMessage && (
        <div className={`p-2 text-center text-sm ${responseMessage.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
          {responseMessage.message}
        </div>
      )} */}
    </div>
  );
}