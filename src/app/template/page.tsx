"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Template } from '@/types';
import TemplateList from '@/components/TemplateList';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';

export default function TemplateManager() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [loading, setLoading] = useState(true);
    const router = useRouter(); // ✅ Correct way to use useRouter

    const fetchTemplates = async () => {
        try {
            const response = await axios.get('/api/templates');
            setTemplates(response.data?.data || []);
        } catch (error) {
            console.error('Error fetching templates:', error);
            setTemplates([]);
        } finally {
            setLoading(false);
        }
    };

    const deleteTemplate = async (templateId: string) => {
        if (confirm('Are you sure you want to delete this template?')) {
            try {
                await axios.delete(`/api/templates/${templateId}`);
                fetchTemplates();
            } catch (error) {
                console.error('Error deleting template:', error);
            }
        }
    };

    // ✅ Correct usage of useRouter
    const createTemplate = () => {
        router.push('/create-template');
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">WhatsApp Template Manager</h1>
                    <button
                        onClick={createTemplate} // ✅ Directly call createTemplate
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Create Template
                    </button>
                </div>

                {loading ? (
                    <div className="text-center p-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto" />
                        <p className="mt-4 text-gray-600">Loading templates...</p>
                    </div>
                ) : (
                    <TemplateList
                        templates={templates}
                        onEdit={(template) => {
                            setSelectedTemplate(template);
                            setShowForm(true);
                        }}
                        onDelete={deleteTemplate}
                    />
                )}
            </div>
        </div>
    );
}
