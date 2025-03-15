'use client';
import { Template } from '@/types';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';

interface TemplateListProps {
    templates?: Template[];
    onEdit: (template: Template) => void;
    onDelete: (templateId: string) => void;
}

interface User {
    id: number;
    first_name: string;
    last_name: string;
    phone_number: string;
    created_at: string;
    email: string;
}

export default function TemplateList({
    templates = [],
    onEdit,
    onDelete
}: TemplateListProps) {

    const [users, setUsers] = useState<User[]>([]);
    const [sharingFlowId, setSharingFlowId] = useState<string | null>(null);
    const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
    const [newNumber, setNewNumber] = useState("");

    useEffect(() => {
        async function fetchMessages() {
            try {
                const res = await fetch("/api/proxy");
                if (!res.ok) throw new Error("Failed to fetch users");
                const users: User[] = await res.json();
                const processedUsers = users.map(user => ({
                    ...user,
                    phone_number: String(user.phone_number)
                }));
                setUsers(processedUsers);
            } catch (error) {
                console.error("Error fetching messages:", error);
            }
        }

        fetchMessages();
    }, []);

    useEffect(() => {
        if (!sharingFlowId) {
            setSelectedNumbers([]);
        }
    }, [sharingFlowId]);

    const shareFlow = async (id: string, numbers: string[]) => {
        if (numbers.length === 0) {
            alert("Please select at least one user");
            return;
        }

        try {
            await Promise.all(
                numbers.map(async (number) => {
                    const response = await fetch("/api/share-template", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id, number }),
                    });
                    if (!response.ok) throw new Error(`Failed to share with ${number}`);
                })
            );
            alert("Template shared successfully with selected users!");
        } catch (error) {
            console.error("Error sharing flow:", error);
            alert("Failed to share with some users");
        } finally {
            setSharingFlowId(null);
        }
    };

    const addNewNumber = () => {
        const trimmedNumber = newNumber.trim();
        if (trimmedNumber && !users.some(user => user.phone_number === trimmedNumber)) {
            setUsers(prev => [...prev, {
                id: Date.now(),
                first_name: "",
                last_name: "",
                phone_number: trimmedNumber,
                created_at: new Date().toISOString(),
                email: ""
            }]);
            setSelectedNumbers(prev => [...prev, trimmedNumber]);
            setNewNumber("");
        }
    };

    return (
        <div className="border rounded-lg bg-white">
            <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b">
                <div className="col-span-3 font-medium">Name</div>
                <div className="col-span-2 font-medium">Category</div>
                <div className="col-span-2 font-medium">Status</div>
                <div className="col-span-2 font-medium">Language</div>
                <div className="col-span-3 font-medium">Actions</div>
            </div>

            {templates.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No templates found</div>
            ) : (
                templates.map(template => (
                    <div key={template.id} className="border-b">
                        <div className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-gray-50">
                            <div className="col-span-3">{template.name}</div>
                            <div className="col-span-2">{template.category || <span className="text-gray-400">N/A</span>}</div>
                            <div className="col-span-2">
                                <span className={`px-2 py-1 rounded-full text-sm 
                                    ${template.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                                        template.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'}`}>
                                    {template.status}
                                </span>
                            </div>
                            <div className="col-span-2">{template.language || <span className="text-gray-400">N/A</span>}</div>
                            <div className="col-span-3 flex gap-2">
                                <button
                                    onClick={() => onEdit(template)}
                                    className="p-2 hover:bg-gray-100 rounded"
                                >
                                    <PencilIcon className="h-5 w-5 text-blue-500" />
                                </button>
                                <button
                                    onClick={() => onDelete(template.name)}
                                    className="p-2 hover:bg-gray-100 rounded"
                                >
                                    <TrashIcon className="h-5 w-5 text-red-500" />
                                </button>
                                <button onClick={() => setSharingFlowId(template.name)} className="p-2 hover:bg-gray-100 rounded">
                                    <Share2 className="h-5 w-5 text-green-500" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))
            )}

            <Dialog open={!!sharingFlowId} onOpenChange={() => setSharingFlowId(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between">
                            <span>Select Users to Share With</span>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="flex gap-2">
                            <Input
                                value={newNumber}
                                onChange={(e) => setNewNumber(e.target.value)}
                                placeholder="Add new phone number"
                                className="flex-1"
                                onKeyDown={(e) => e.key === "Enter" && addNewNumber()}
                            />
                            <Button onClick={addNewNumber} disabled={!newNumber.trim()}>
                                Add
                            </Button>
                        </div>

                        {users.length === 0 ? (
                            <div>No users found</div>
                        ) : (
                            users.map((user) => (
                                <div key={user.phone_number} className="flex items-center gap-2">
                                    <Checkbox
                                        id={user.phone_number}
                                        checked={selectedNumbers.includes(user.phone_number)}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setSelectedNumbers([...selectedNumbers, user.phone_number]);
                                            } else {
                                                setSelectedNumbers(selectedNumbers.filter(n => n !== user.phone_number));
                                            }
                                        }}
                                    />
                                    <Label htmlFor={user.phone_number}>
                                        {user.first_name || user.last_name
                                            ? `${user.first_name} ${user.last_name}`.trim()
                                            : user.phone_number}
                                    </Label>
                                </div>
                            ))
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={() => sharingFlowId && shareFlow(sharingFlowId, selectedNumbers)}
                            disabled={selectedNumbers.length === 0}
                        >
                            Share with Selected ({selectedNumbers.length})
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
