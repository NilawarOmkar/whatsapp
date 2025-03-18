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
import axios from 'axios';
import { useRouter } from 'next/navigation';

interface User {
    id: number;
    first_name: string;
    last_name: string;
    phone_number: string;
    created_at: string;
    email: string;
}

export default function TemplateList() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [selectedNumbers, setSelectedNumbers] = useState<string[]>([]);
    const [newNumber, setNewNumber] = useState("");
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [templatesRes, usersRes] = await Promise.all([
                    axios.get('/api/templates'),
                    fetch('/api/proxy')
                ]);

                if (!usersRes.ok) throw new Error("Failed to fetch users");

                setTemplates(templatesRes.data?.data || []);
                const usersData = await usersRes.json();
                setUsers(usersData.map((user: User) => ({
                    ...user,
                    phone_number: String(user.phone_number)
                })));
            } catch (error) {
                console.error("Error fetching data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const deleteTemplate = async (templateId: string) => {
        if (confirm('Are you sure you want to delete this template?')) {
            try {
                await axios.delete(`/api/templates?id=${templateId}`);
                setTemplates(prev => prev.filter(t => t.name !== templateId));
            } catch (error) {
                console.error('Error deleting template:', error);
                alert('Failed to delete template');
            }
        }
    };

    const shareTemplate = async (template: Template, numbers: string[]) => {
        if (numbers.length === 0) {
          alert("Please select at least one user");
          return;
        }
      
        try {
          await Promise.all(
            numbers.map(async (number) => {
              const validatedNumber = number.replace(/[^\d]/g, "");
              if (!validatedNumber.match(/^\d{10,15}$/)) {
                throw new Error(`Invalid number format: ${number}`);
              }
      
              // Format components properly for WhatsApp API
              const formattedComponents: any[] = [];
              
              // Add header if it exists
              if (template.components?.header) {
                const headerType = template.components.header.type.toLowerCase();
                formattedComponents.push({
                  type: "header",
                  parameters: [{
                    type: headerType,
                    ...(headerType === 'text' 
                      ? { text: template.components.header.text }
                      : { 
                          [headerType]: {
                            link: template.components.header.text
                          }
                        }
                    )
                  }]
                });
              }
      
              // Add body (required)
              if (template.components?.body) {
                const bodyParameters: Array<{ type: string; text: string }> = [];
                
                if (template.components.body.example?.body_text?.[0]) {
                  template.components.body.example.body_text[0].forEach(text => {
                    bodyParameters.push({
                      type: "text",
                      text: text
                    });
                  });
                } else {
                  bodyParameters.push({
                    type: "text",
                    text: template.components.body.text
                  });
                }
      
                formattedComponents.push({
                  type: "body",
                  parameters: bodyParameters
                });
              }
      
              // Add footer if it exists
              if (template.components?.footer) {
                formattedComponents.push({
                  type: "footer",
                  text: template.components.footer.text
                });
              }
      
              // Add buttons if they exist (including flow support)
              if (template.components?.buttons?.length) {
                template.components.buttons.forEach((button, index) => {
                  // Handle Flow buttons
                  if (button.type.toLowerCase() === 'flow') {
                    const flowComponent = {
                      type: "button",  // Must be BUTTON type
                      sub_type: "flow",  // Subtype FLOW
                      index: "0",
                      parameters: [{
                        type: "action",
                        action: {
                          flow_token: button.flow_token || "unused",  // Required but can be "unused"
                          flow_action_data: button.target_screen ? { 
                            screen: button.target_screen 
                          } : undefined
                        }
                      }]
                    };
                    formattedComponents.push(flowComponent);
                  } else {
                    // Handle other button types
                    const buttonComponent = {
                      type: "button" as const,
                      sub_type: button.type.toLowerCase() === 'quick_reply' 
                        ? 'quick_reply' 
                        : button.type.toLowerCase(),
                      index: index.toString(),
                      parameters: [] as any[]
                    };
      
                    if (button.type.toLowerCase() === 'quick_reply') {
                      buttonComponent.parameters = [{
                        type: "payload",
                        payload: button.text
                      }];
                    } else if (button.type.toLowerCase() === 'url') {
                      buttonComponent.parameters = [{
                        type: "text",
                        text: button.text
                      }];
                    } else if (button.type.toLowerCase() === 'phone_number') {
                      buttonComponent.parameters = [{
                        type: "text",
                        text: button.text
                      }];
                    }
      
                    formattedComponents.push(buttonComponent);
                  }
                });
              }
      
              const payload = {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: validatedNumber,
                type: "template",
                template: {
                  name: template.name,
                  language: {
                    code: template.language || "en_US"
                  },
                  components: formattedComponents
                }
              };
              
              const response = await fetch("/api/send-template", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              });
      
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Failed to share with ${number}: ${errorData.error?.message}`);
              }
            })
          );
          alert("Template shared successfully with selected users!");
        } catch (error) {
          console.error("Error sharing template:", error);
          alert(error instanceof Error ? error.message : "Failed to share template");
        } finally {
          setSelectedTemplate(null);
        }
      };

    const addNewNumber = () => {
        const trimmedNumber = newNumber.trim().replace(/[^\d]/g, "");
        if (!trimmedNumber.match(/^\d{10,15}$/)) {
            alert("Invalid phone number format");
            return;
        }

        if (!users.some(user => user.phone_number === trimmedNumber)) {
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

    if (loading) {
        return (
            <div className="text-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
                <p className="mt-4 text-gray-600">Loading templates...</p>
            </div>
        );
    }

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
                                    onClick={() => router.push(`/edit-template/${template.name}`)}
                                    className="p-2 hover:bg-gray-100 rounded"
                                >
                                    <PencilIcon className="h-5 w-5 text-blue-500" />
                                </button>
                                <button
                                    onClick={() => deleteTemplate(template.name)}
                                    className="p-2 hover:bg-gray-100 rounded"
                                >
                                    <TrashIcon className="h-5 w-5 text-red-500" />
                                </button>
                                <button
                                    onClick={() => setSelectedTemplate(template)}
                                    className="p-2 hover:bg-gray-100 rounded"
                                >
                                    <Share2 className="h-5 w-5 text-green-500" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))
            )}

            <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Select Users to Share With</DialogTitle>
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

                        {users.map((user) => (
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
                        ))}
                    </div>
                    <DialogFooter>
                        <Button
                            onClick={() => selectedTemplate && shareTemplate(selectedTemplate, selectedNumbers)}
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