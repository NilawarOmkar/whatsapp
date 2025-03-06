'use client';

import { useState, useRef } from 'react';
import axios from 'axios';
import { Upload as UploadIcon } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';

interface PhoneVariant {
  storage: string;
  colors: string[];
  stock: number;
}

interface Smartphone {
  id: string;
  brand: string;
  model: string;
  price: number;
  variants: PhoneVariant[];
}

const initialPhones: Smartphone[] = [
  {
    id: '1',
    brand: 'Apple',
    model: 'iPhone 15 Pro',
    price: 999,
    variants: [
      { storage: '128GB', colors: ['#000000', '#FFFFFF'], stock: 50 },
      { storage: '256GB', colors: ['#000000', '#FFD700'], stock: 30 },
    ],
  },
];

const SOLID_COLORS = [
  { name: 'Black', value: '#000000' },
  { name: 'White', value: '#FFFFFF' },
  { name: 'Red', value: '#FF0000' },
  { name: 'Blue', value: '#0000FF' },
  { name: 'Green', value: '#00FF00' },
  { name: 'Aqua', value: '#00FFFF' },
  { name: 'Gold', value: '#FFD700' },
];

export default function SmartphoneCatalog() {
  const [phones, setPhones] = useState<Smartphone[]>(initialPhones);
  const [currentModel, setCurrentModel] = useState<Omit<Smartphone, 'id' | 'variants'>>({
    brand: '',
    model: '',
    price: 0,
  });
  const [currentVariant, setCurrentVariant] = useState<PhoneVariant>({
    storage: '',
    colors: [],
    stock: 0,
  });
  const [selectedPhoneId, setSelectedPhoneId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateStock = (phoneId: string, variantIndex: number, newStock: number) => {
    setPhones(prev => prev.map(phone => {
      if (phone.id === phoneId) {
        const updatedVariants = [...phone.variants];
        updatedVariants[variantIndex].stock = Math.max(0, newStock);
        return { ...phone, variants: updatedVariants };
      }
      return phone;
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      await handleFileUpload(selectedFile);
    }
  };

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post('http://45.33.101.184:3000/products/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('File uploaded successfully');
      setFile(null);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
      setFile(null);
    }
  };

  const addNewModel = () => {
    if (!currentModel.brand || !currentModel.model || currentModel.price <= 0) return;

    const newSmartphone: Smartphone = {
      id: Math.random().toString(36).substr(2, 9),
      ...currentModel,
      variants: [],
    };

    setPhones([...phones, newSmartphone]);
    setCurrentModel({ brand: '', model: '', price: 0 });
  };

  const addVariant = () => {
    if (!selectedPhoneId || !currentVariant.storage || currentVariant.stock <= 0) return;

    setPhones(prev => prev.map(phone => {
      if (phone.id === selectedPhoneId) {
        return {
          ...phone,
          variants: [...phone.variants, currentVariant]
        };
      }
      return phone;
    }));

    setCurrentVariant({ storage: '', colors: [], stock: 0 });
  };

  const discontinueModel = (phoneId: string) => {
    setPhones(prev => prev.filter(phone => phone.id !== phoneId));
  };

  return (
    <div className="p-8 space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-2xl">Smartphone Inventory</CardTitle>
            <div className="flex items-center gap-4">
              {file && <span className="text-sm text-muted-foreground">{file.name}</span>}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".xlsx, .xls"
              />
              <Button onClick={() => fileInputRef.current?.click()}>
                <UploadIcon className="mr-2 h-4 w-4" />
                Choose Excel File
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Base Price</TableHead>
                  <TableHead>Variants</TableHead>
                  <TableHead>Total Stock</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {phones.map((phone) => (
                  <TableRow key={phone.id}>
                    <TableCell className="font-semibold">{phone.brand}</TableCell>
                    <TableCell>{phone.model}</TableCell>
                    <TableCell>${phone.price.toFixed(2)}</TableCell>
                    <TableCell>
                      <Accordion type="single" collapsible>
                        <AccordionItem value="variants">
                          <AccordionTrigger className="py-1">
                            {phone.variants.length} Variants
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="space-y-2">
                              {phone.variants.map((variant, index) => (
                                <div key={index} className="flex items-center gap-4 p-2 bg-muted/50 rounded">
                                  <div className="flex items-center gap-4">
                                    <Badge variant="outline">{variant.storage}</Badge>
                                    <div className="flex gap-2">
                                      {variant.colors.map((color) => (
                                        <div
                                          key={color}
                                          className="h-6 w-6 rounded-full border-2 shadow-sm"
                                          style={{ backgroundColor: color }}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                  <div className="ml-auto flex items-center gap-4">
                                    <Input
                                      type="number"
                                      value={variant.stock}
                                      onChange={(e) => updateStock(phone.id, index, Number(e.target.value))}
                                      className="w-24"
                                      min="0"
                                    />
                                    <Badge className={variant.stock > 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                      {variant.stock > 0 ? "In Stock" : "Out of Stock"}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </TableCell>
                    <TableCell>
                      {phone.variants.reduce((sum, variant) => sum + variant.stock, 0)}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedPhoneId(phone.id)}
                          >
                            Add Variant
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Variant</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Storage Capacity *</Label>
                              <Input
                                placeholder="e.g., 256GB"
                                value={currentVariant.storage}
                                onChange={(e) => setCurrentVariant(prev => ({ ...prev, storage: e.target.value }))}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Colors *</Label>
                              <div className="grid grid-cols-4 gap-2">
                                {SOLID_COLORS.map((color) => (
                                  <Button
                                    key={color.value}
                                    variant={currentVariant.colors.includes(color.value) ? 'default' : 'outline'}
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-full"
                                    onClick={() => setCurrentVariant(prev => ({
                                      ...prev,
                                      colors: prev.colors.includes(color.value)
                                        ? prev.colors.filter(c => c !== color.value)
                                        : [...prev.colors, color.value]
                                    }))}
                                  >
                                    <div
                                      className="h-6 w-6 rounded-full"
                                      style={{ backgroundColor: color.value }}
                                    />
                                  </Button>
                                ))}
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Initial Stock *</Label>
                              <Input
                                type="number"
                                value={currentVariant.stock}
                                onChange={(e) => setCurrentVariant(prev => ({ ...prev, stock: Number(e.target.value) }))}
                              />
                            </div>
                            <Button onClick={addVariant} className="w-full">
                              Add Variant
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => discontinueModel(phone.id)}
                      >
                        Discontinue
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}