import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Copy, Trash2, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Template {
    id: string;
    name: string;
    category: string;
    language: string;
    status: string;
    thumbnail?: string;
    updatedAt: string;
}

interface TemplateCardProps {
    template: Template;
    onEdit: (template: Template) => void;
    onDelete: (templateId: string) => void;
}

export default function TemplateCard({ template, onEdit, onDelete }: TemplateCardProps) {
    const formattedDate = new Date(template.updatedAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });

    return (
        <Card className="overflow-hidden shadow-md">
            <CardHeader className="p-0 relative">
                <div className="relative h-40 w-full">
                    <Image src={template.thumbnail || "/placeholder.svg"} alt={template.name} fill className="object-cover" />
                    <div className="absolute top-2 right-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/80 rounded-full">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onEdit(template)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Copy className="mr-2 h-4 w-4" />
                                    Duplicate
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                    <Star className="mr-2 h-4 w-4" />
                                    Add to favorites
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => onDelete(template.id)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4">
                <h3 className="font-semibold text-lg">{template.name}</h3>
                <div className="flex flex-wrap gap-2 my-2">
                    <Badge variant="secondary">{template.category}</Badge>
                    <Badge variant="outline">{template.language}</Badge>
                </div>
                <span className={`px-2 py-1 text-sm rounded-full ${template.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                    template.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'}`}>
                    {template.status}
                </span>
                <p className="text-xs text-muted-foreground mt-2">Updated {formattedDate}</p>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex justify-between">
                <Button variant="outline" size="sm" asChild>
                    <Link href={`/templates/preview/${template.id}`}>Preview</Link>
                </Button>
                <Button size="sm" asChild>
                    <Link href={`/templates/edit/${template.id}`}>Use Template</Link>
                </Button>
            </CardFooter>
        </Card>
    );
}
