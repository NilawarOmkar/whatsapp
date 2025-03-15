'use client';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import TemplateList from '@/components/TemplateList';

export default function TemplateManager() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">WhatsApp Template Manager</h1>
                    <button
                        onClick={() => router.push('/create-template')}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center gap-2"
                    >
                        <PlusIcon className="h-5 w-5" />
                        Create Template
                    </button>
                </div>
                
                <TemplateList />
            </div>
        </div>
    );
}