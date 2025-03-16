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
  | 'FLOW'
  | 'FLOW';

type Button = {
  type: ButtonType;
  text: string;
  // Type-specific fields
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
  body: { text: string; variables: string[] };
  footer: string;
  buttons: Button[];
};

export default function TemplateCreator() {
  const [flows, setFlows] = useState<any[]>([])
  const [template, setTemplate] = useState<TemplateState>({
    category: 'MARKETING',
    name: '',
    language: 'en_US',
    header: { text: '', variables: [] as string[] },
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
        console.log('Flows:', result)
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
        // Reset unrelated fields when changing type
        const updatedBtn: Button = {
          ...btn,
          [field]: value,
          url: undefined,
          phone_number: undefined,
          flow_id: undefined,
          example: undefined
        };

        if (field === 'type') {
          // Type-specific initializations
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
        }
        return updatedBtn;
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
        format: 'TEXT',
        text: template.header.text
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
                  phone_number: btn.phone_number
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

        // Add validation for button limits
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
    };
  }

  const handleSaveTemplate = async () => {
    const jsonData = generateJSON()
    console.log('Sending template:', JSON.stringify(jsonData, null, 2))

    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jsonData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to save template')
      }

      alert('Template saved successfully!')
    } catch (error) {
      console.error('Error:', error)
      alert(`Error saving template: ${(error as Error).message}`)
    }
  }

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
                  <Button variant="outline" size="sm" onClick={() => handleAddVariable('header')}>
                    <Plus className="h-4 w-4 mr-1" /> Add Variable
                  </Button>
                </div>
                <span className="text-xs text-gray-500">{template.header.text.length}/60</span>
              </div>

              <Input
                value={template.header.text}
                onChange={e => setTemplate(p => ({ ...p, header: { ...p.header, text: e.target.value } }))}
                placeholder="Enter header text"
                maxLength={60}
              />

              {template.header.variables.length > 0 && (
                <div className="space-y-2">
                  {template.header.variables.map((varName, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        placeholder={`Sample value for {{${varName}}}`}
                        value={varName}
                        onChange={e => {
                          const newVars = [...template.header.variables]
                          newVars[index] = e.target.value
                          setTemplate(p => ({
                            ...p,
                            header: {
                              ...p.header,
                              variables: newVars,
                              text: p.header.text.replace(new RegExp(`{{${varName}}}`, 'g'), `{{${e.target.value}}}`)
                            }
                          }))
                        }}
                      />
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveVariable('header', index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
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
                  <Button variant="outline" size="sm" onClick={() => handleAddVariable('body')}>
                    <Plus className="h-4 w-4 mr-1" /> Add Variable
                  </Button>
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

                  {button.type === 'FLOW' && (
                    <div className="space-y-1">
                      <Label>Select Flow</Label>
                      <Select
                        value={button.url || ''}
                        onValueChange={value => updateButton(index, 'url', value)}
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
                {template.buttons.map((button, index) => {
                  const flowName = button.type === 'FLOW'
                    ? flows.find(f => f.id === button.url)?.name
                    : null

                  return (
                    <div
                      key={index}
                      className={`p-2 rounded text-center ${button.type === 'QUICK_REPLY'
                        ? 'bg-gray-100 hover:bg-gray-200'
                        : 'bg-blue-100 hover:bg-blue-200 text-blue-800'
                        }`}
                    >
                      {button.text || "Button text"}
                      {button.type === 'FLOW' && flowName && (
                        <div className="text-xs text-gray-500 mt-1">{flowName}</div>
                      )}
                    </div>
                  )
                })}
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