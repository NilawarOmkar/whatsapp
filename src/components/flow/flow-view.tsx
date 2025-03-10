"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Trash2, Share2 } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

interface User {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  created_at: string;
  email: string;
}

export const ViewFlows = () => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [sharingFlowId, setSharingFlowId] = useState<string | null>(null);
    const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
    const [newNumber, setNewNumber] = useState("");

    useEffect(() => {
        const fetchFlows = async () => {
            try {
                const response = await fetch("/api/flows");
                if (!response.ok) throw new Error("Failed to fetch flows");
                const result = await response.json();
                setData(result?.data || []);
            } catch (err) {
                setError(true);
            } finally {
                setLoading(false);
            }
        };

        fetchFlows();
    }, []);

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

    const deleteFlow = async (id: string) => {
        if (!confirm("Are you sure you want to delete this flow?")) return;
        try {
            const response = await fetch(`/api/flows`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });

            if (!response.ok) throw new Error("Failed to delete flow");
            setData((prev) => prev.filter((flow) => flow.id !== id));
        } catch (error) {
            console.error("Error deleting flow:", error);
        }
    };

    const shareFlow = async (id: string, numbers: string[]) => {
        if (numbers.length === 0) {
            alert("Please select at least one user");
            return;
        }

        try {
            await Promise.all(
                numbers.map(async (number) => {
                    const response = await fetch("/api/share-flow", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id, number }),
                    });
                    if (!response.ok) throw new Error(`Failed to share with ${number}`);
                })
            );
            alert("Flow shared successfully with selected users!");
        } catch (error) {
            console.error("Error sharing flow:", error);
            alert("Failed to share with some users");
        } finally {
            setSharingFlowId(null);
        }
    };

    const toggleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedNumbers(users.map(user => user.phone_number));
        } else {
            setSelectedNumbers([]);
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

    if (error) return <div>Failed to load flows</div>;

    return (
        <div className="p-8">
            <Card>
                <CardHeader>
                    <CardTitle>WhatsApp Flows</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Categories</TableHead>
                                <TableHead>Validation Errors</TableHead>
                                <TableHead>ID</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-[50px]" /></TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                data.map((flow) => (
                                    <TableRow key={flow.id}>
                                        <TableCell className="font-medium">{flow.name}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    flow.status === "PUBLISHED" ? "default" :
                                                        flow.status === "DRAFT" ? "secondary" :
                                                            "destructive"
                                                }
                                            >
                                                {flow.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{flow.categories?.join(", ") || "None"}</TableCell>
                                        <TableCell>
                                            {flow.validation_errors?.length > 0
                                                ? flow.validation_errors.join(", ")
                                                : "No errors"}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">{flow.id}</TableCell>
                                        <TableCell className="text-right flex gap-2">
                                            {flow.preview?.preview_url ? (
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Eye 
                                                            onClick={() => setPreviewUrl(flow.preview.preview_url)} 
                                                            className="cursor-pointer text-blue-500 hover:text-blue-700 transition" 
                                                        />
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-3xl">
                                                        <DialogTitle>Flow Preview</DialogTitle>
                                                        {previewUrl && (
                                                            <iframe 
                                                                src={previewUrl} 
                                                                width="100%" 
                                                                height="800px" 
                                                                className="rounded-md border"
                                                            />
                                                        )}
                                                    </DialogContent>
                                                </Dialog>
                                            ) : (
                                                <span className="text-muted-foreground">No Preview</span>
                                            )}
                                            <Trash2 
                                                onClick={() => deleteFlow(flow.id)} 
                                                className="cursor-pointer text-red-500 hover:text-red-700 transition" 
                                            />
                                            <Share2 
                                                onClick={() => setSharingFlowId(flow.id)} 
                                                className="cursor-pointer text-green-500 hover:text-green-700 transition" 
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

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
};