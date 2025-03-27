'use client'
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Save, MessageSquareText, Plus, X } from "lucide-react"

type Flow = {
  id: string
  name: string
}

type ButtonType =
  | 'QUICK_REPLY'
  | 'URL'
  | 'PHONE_NUMBER'
  | 'COPY_CODE'
  | 'FLOW';

type Button = {
  type: ButtonType;
  text: string;
  url?: string;
  phone_number?: string;
  flow_id?: string;
  example?: string;
};

type TemplateState = {
  category: string;
  name: string;
  language: string;
  header: { text: string; variables: string[] };
  headerType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'LOCATION';
  body: { text: string; variables: string[] };
  footer: string;
  buttons: Button[];
};

export default function TemplateCreator() {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [flows, setFlows] = useState<any[]>([])
  const [template, setTemplate] = useState<TemplateState>({
    category: 'MARKETING',
    name: '',
    language: 'en_US',
    header: { text: '', variables: [] as string[] },
    headerType: 'TEXT',
    body: { text: '', variables: [] as string[] },
    footer: '',
    buttons: []
  })

  // Fetch flows on component mount
  useEffect(() => {
    const fetchFlows = async () => {
      try {
        const response = await fetch('/api/flows')
        if (!response.ok) {
          throw new Error('Failed to fetch flows')
        }
        const result = await response.json()
        setFlows(result?.data || [])
      } catch (error) {
        console.error('Error fetching flows:', error)
        setFlows([])
      }
    }
    fetchFlows()
  }, [])

  // Add/remove variables
  const handleAddVariable = (section: 'header' | 'body') => {
    const newVar = `var${template[section].variables.length + 1}`
    setTemplate(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        variables: [...prev[section].variables, newVar],
        text: prev[section].text + `{{${newVar}}}`
      }
    }))
  }

  const handleRemoveVariable = (section: 'header' | 'body', index: number) => {
    const varName = template[section].variables[index]
    const regex = new RegExp(`\\{\\{${varName}\\}\\}`, 'g')
    setTemplate(prev => ({
      ...prev,
      [section]: {
        text: prev[section].text.replace(regex, ''),
        variables: prev[section].variables.filter((_, i) => i !== index)
      }
    }))
  }

  // Button management
  const addButton = () => {
    setTemplate(prev => ({
      ...prev,
      buttons: [...prev.buttons, {
        type: 'QUICK_REPLY',
        text: '',
        url: undefined,
        phone_number: undefined,
        flow_id: undefined,
        example: undefined
      }]
    }));
  };

  const updateButton = (index: number, field: keyof Button, value: string) => {
    const updatedButtons = template.buttons.map((btn, i) => {
      if (i === index) {
        if (field === 'type') {
          const updatedBtn: Button = {
            ...btn,
            type: value as ButtonType,
            text: btn.text,
            url: undefined,
            phone_number: undefined,
            flow_id: undefined,
            example: undefined
          };

          switch (value) {
            case 'URL':
              updatedBtn.url = '';
              break;
            case 'PHONE_NUMBER':
              updatedBtn.phone_number = '';
              break;
            case 'FLOW':
              updatedBtn.flow_id = '';
              break;
            case 'COPY_CODE':
              updatedBtn.example = '';
              break;
          }
          return updatedBtn;
        } else {
          return {
            ...btn,
            [field]: value
          };
        }
      }
      return btn;
    });

    setTemplate(prev => ({ ...prev, buttons: updatedButtons }));
  };

  const generateJSON = () => {
    const components = [];

    // Header component
    if (template.header.text) {
      const headerComponent: any = {
        type: 'HEADER',
        format: template.headerType,
        ...(template.headerType === 'TEXT' && { text: template.header.text }),
        ...(template.headerType === 'IMAGE' && {
          example: {
            header_handle: [template.header.text]
          }
        }),
        ...(template.headerType === 'VIDEO' && {
          example: {
            header_handle: [template.header.text]
          }
        }),
        ...(template.headerType === 'DOCUMENT' && {
          example: {
            header_handle: [template.header.text]
          }
        })
      };

      if (template.header.variables.length > 0) {
        headerComponent.example = {
          header_text: [template.header.variables]
        };
      }
      components.push(headerComponent);
    }

    // Body component (required)
    const bodyComponent = {
      type: 'BODY',
      text: template.body.text,
      ...(template.body.variables.length > 0 && {
        example: {
          body_text: [template.body.variables]
        }
      })
    };
    components.push(bodyComponent);

    // Footer component
    if (template.footer) {
      components.push({
        type: 'FOOTER',
        text: template.footer
      });
    }

    // Process buttons
    if (template.buttons.length > 0) {
      const buttonComponent = {
        type: 'BUTTONS',
        buttons: template.buttons.map(btn => {
          const base = { type: btn.type, text: btn.text };

          switch (btn.type) {
            case 'URL':
              return {
                ...base,
                url: btn.url,
                ...(btn.url?.includes('{{') && { example: [btn.url.replace(/{{.*}}/, 'example')] })
              };

            case 'PHONE_NUMBER':
              return {
                ...base,
                phone_number: btn.phone_number,
                ...(btn.phone_number?.includes('{{') && {
                  example: [btn.phone_number.replace(/{{.*}}/, '+1234567890')]
                })
              };

            case 'FLOW':
              return {
                ...base,
                flow_id: btn.flow_id,
                flow_action: 'navigate'
              };

            case 'COPY_CODE':
              return {
                type: 'COPY_CODE',
                example: btn.example
              };

            default:
              return base;
          }
        })
      };

      // Validation for button limits
      const buttonCounts = template.buttons.reduce((acc: Record<string, number>, btn) => {
        acc[btn.type] = (acc[btn.type] || 0) + 1;
        return acc;
      }, {});

      if (buttonCounts['COPY_CODE'] > 1) throw new Error('Max 1 COPY_CODE button allowed');
      if (buttonCounts['FLOW'] > 1) throw new Error('Max 1 FLOW button allowed');
      if (buttonCounts['PHONE_NUMBER'] > 1) throw new Error('Max 1 PHONE_NUMBER button allowed');
      if (buttonCounts['URL'] > 2) throw new Error('Max 2 URL buttons allowed');

      components.push(buttonComponent);
    }

    return {
      name: template.name,
      language: template.language,
      category: template.category,
      allow_category_change: true,
      components
    };
  }

  const handleSaveTemplate = async () => {
    try {
      // Validate phone number buttons
      const phoneNumberButtons = template.buttons.filter(btn => btn.type === 'PHONE_NUMBER');
      if (phoneNumberButtons.length > 0) {
        const invalidPhone = phoneNumberButtons.some(btn =>
          !btn.phone_number || !/^\+?[1-9]\d{1,14}$/.test(btn.phone_number)
        );

        if (invalidPhone) {
          throw new Error('Phone number buttons must use E.164 format (+1234567890)');
        }
      }

      const jsonData = generateJSON();
      console.log('Sending template:', JSON.stringify(jsonData, null, 2));

      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to save template');
      }

      alert('Template saved successfully!');
    } catch (error) {
      console.error('Error:', error);
      alert(`Error saving template: ${(error as Error).message}`);
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/upload/', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file');
      }

      const { fileHandle } = await uploadResponse.json();

      setTemplate(prev => ({
        ...prev,
        header: { ...prev.header, text: fileHandle },
      }));

    } catch (error) {
      console.error('File upload failed:', error);
      alert('Failed to upload file. Please try again.');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Editor Panel */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={template.category} onValueChange={v => setTemplate(p => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MARKETING">Marketing</SelectItem>
                  <SelectItem value="UTILITY">Utility</SelectItem>
                  <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input value={template.name} onChange={e => setTemplate(p => ({ ...p, name: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={template.language} onValueChange={v => setTemplate(p => ({ ...p, language: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="en_US">English (US)</SelectItem>
                  <SelectItem value="es_ES">Spanish</SelectItem>
                  <SelectItem value="fr_FR">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Header Section */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Header</Label>
                  {/* <Button variant="outline" size="sm" onClick={() => handleAddVariable('header')}>
                    <Plus className="h-4 w-4 mr-1" /> Add Variable
                  </Button> */}
                </div>
                <span className="text-xs text-gray-500">{template.header.text.length}/60</span>
              </div>

              {/* Header Type Selector */}
              <div className="space-y-2">
                {/* <Label>Header Type</Label> */}
                <Select
                  value={template.headerType}
                  onValueChange={v => setTemplate(p => ({ ...p, headerType: v as TemplateState['headerType'] }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TEXT">Text</SelectItem>
                    <SelectItem value="IMAGE">Image</SelectItem>
                    <SelectItem value="VIDEO">Video</SelectItem>
                    <SelectItem value="DOCUMENT">Document</SelectItem>
                    {/* <SelectItem value="LOCATION">Location</SelectItem> */}
                  </SelectContent>
                </Select>
              </div>

              {/* Conditionally Render Header Input */}
              {template.headerType === 'TEXT' && (
                <Input
                  value={template.header.text}
                  onChange={e => setTemplate(p => ({ ...p, header: { ...p.header, text: e.target.value } }))}
                  placeholder="Enter header text"
                  maxLength={60}
                />
              )}

              {template.headerType === "IMAGE" && (
                <div className="space-y-2">
                  <Label>Upload IMAGE</Label>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="relative overflow-hidden"
                      onClick={() => document.getElementById('file-input')?.click()}
                    >
                      Select File
                      <input
                        id="file-input"
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleFileUpload}
                      />
                    </Button>
                  </div>
                </div>
              )}

              {template.headerType === 'LOCATION' && (
                <div className="space-y-1">
                  <Label>Location</Label>
                  <Input
                    value={template.header.text}
                    onChange={e => setTemplate(p => ({ ...p, header: { ...p.header, text: e.target.value } }))}
                    placeholder="Enter location details"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Body Section */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium">Body*</Label>
                  {/* <Button variant="outline" size="sm" onClick={() => handleAddVariable('body')}>
                    <Plus className="h-4 w-4 mr-1" /> Add Variable
                  </Button> */}
                </div>
                <span className="text-xs text-gray-500">{template.body.text.length}/1024</span>
              </div>

              <Textarea
                value={template.body.text}
                onChange={e => setTemplate(p => ({ ...p, body: { ...p.body, text: e.target.value } }))}
                placeholder="Enter body text"
                rows={4}
                maxLength={1024}
                className="min-h-[120px]"
              />

              {template.body.variables.length > 0 && (
                <div className="space-y-2">
                  {template.body.variables.map((varName, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder={`Sample value for {{${varName}}}`}
                        value={varName}
                        onChange={e => {
                          const newVars = [...template.body.variables]
                          newVars[index] = e.target.value
                          setTemplate(p => ({
                            ...p,
                            body: {
                              ...p.body,
                              variables: newVars,
                              text: p.body.text.replace(new RegExp(`{{${varName}}}`, 'g'), `{{${e.target.value}}}`)
                            }
                          }))
                        }}
                      />
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveVariable('body', index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer Section */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Footer</Label>
                <span className="text-xs text-gray-500">{template.footer.length}/60</span>
              </div>
              <Input
                value={template.footer}
                onChange={e => setTemplate(p => ({ ...p, footer: e.target.value }))}
                placeholder="Enter footer text"
                maxLength={60}
              />
            </CardContent>
          </Card>

          {/* Buttons Section */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Buttons</Label>
                <Button variant="outline" size="sm" onClick={addButton}>
                  Add Button
                </Button>
              </div>

              {template.buttons.map((button, index) => (
                <div key={index} className="space-y-2 border p-3 rounded">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>Button Type</Label>
                      <Select
                        value={button.type}
                        onValueChange={v => updateButton(index, 'type', v)}
                        disabled={template.category === 'AUTHENTICATION' && button.type === 'FLOW'}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="QUICK_REPLY">Quick Reply</SelectItem>
                          <SelectItem value="URL">URL</SelectItem>
                          <SelectItem value="PHONE_NUMBER">Phone Number</SelectItem>
                          {(template.category === 'MARKETING' || template.category === 'UTILITY') && (
                            <SelectItem value="FLOW">Flow</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <Label>Button Text</Label>
                      <Input
                        value={button.text}
                        onChange={e => updateButton(index, 'text', e.target.value)}
                        placeholder="Button text"
                      />
                    </div>
                  </div>

                  {button.type === 'URL' && (
                    <div className="space-y-1">
                      <Label>URL</Label>
                      <Input
                        value={button.url || ''}
                        onChange={e => updateButton(index, 'url', e.target.value)}
                        placeholder="https://example.com"
                      />
                    </div>
                  )}

                  {button.type === 'PHONE_NUMBER' && (
                    <div className="space-y-1">
                      <Label>Phone Number (E.164 format)</Label>
                      <Input
                        value={button.phone_number || ''}
                        onChange={e => updateButton(index, 'phone_number', e.target.value)}
                        placeholder="+1234567890"
                      />
                    </div>
                  )}

                  {button.type === 'FLOW' && (
                    <div className="space-y-1">
                      <Label>Select Flow</Label>
                      <Select
                        value={button.flow_id || ''}
                        onValueChange={value => updateButton(index, 'flow_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a flow" />
                        </SelectTrigger>
                        <SelectContent>
                          {flows.length > 0 ? (
                            flows.map(flow => (
                              <SelectItem key={flow.id} value={flow.id}>
                                {flow.name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="unavailable" disabled>
                              No flows available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="w-96 border-l bg-white p-6">
        <div className="sticky top-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageSquareText className="h-5 w-5" />
            Template Preview
          </h3>

          <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
            {template.header.text && (
              <div className="bg-green-600 text-white rounded-t-lg p-3 mb-2">
                <p className="text-center font-medium">
                  {template.header.text.match(/(\{\{\w+\}\}|[^{}]+)/g)?.map((part, i) => {
                    const match = part.match(/\{\{(\w+)\}\}/);
                    return match ? match[1] : part;
                  })}
                </p>
              </div>
            )}

            {/* Header Preview */}
            {template.headerType === "IMAGE" && imagePreview && (
              <img src={imagePreview} alt="Header Preview" className="rounded-lg w-full" />
            )}

            {template.headerType === 'VIDEO' && template.header.text && (
              <video controls className="rounded-lg w-full">
                <source src={template.header.text} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}

            {template.headerType === 'DOCUMENT' && template.header.text && (
              <a
                href={template.header.text} // Use the file path or URL
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                View Document
              </a>
            )}

            <div className="bg-white p-3 rounded-lg">
              <p className="text-gray-800 whitespace-pre-wrap">
                {template.body.text.match(/(\{\{\w+\}\}|[^{}]+)/g)?.map((part, i) => {
                  const match = part.match(/\{\{(\w+)\}\}/);
                  return match ? match[1] : part;
                })}
              </p>
            </div>

            {template.footer && (
              <div className="mt-2 p-3 bg-gray-100 rounded-b-lg">
                <p className="text-xs text-gray-600">{template.footer}</p>
              </div>
            )}

            {template.buttons.length > 0 && (
              <div className="mt-4 space-y-2">
                {template.buttons.map((button, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded text-center ${button.type === 'QUICK_REPLY'
                      ? 'bg-gray-100 hover:bg-gray-200'
                      : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                      }`}
                  >
                    {button.text || "Button text"}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Button
            className="w-full mt-6 bg-green-600 hover:bg-green-700"
            onClick={handleSaveTemplate}
            disabled={!template.body.text || template.buttons.some(b => !b.text)}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Template
          </Button>
        </div>
      </div>
    </div>
  )
}