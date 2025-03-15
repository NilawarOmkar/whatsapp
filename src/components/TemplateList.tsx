'use client';
import { Template } from '@/types';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

interface TemplateListProps {
    templates?: Template[];
    onEdit: (template: Template) => void;
    onDelete: (templateId: string) => void;
}

export default function TemplateList({
    templates = [],
    onEdit,
    onDelete
}: TemplateListProps) {
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
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
