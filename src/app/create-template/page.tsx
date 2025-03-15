'use client'
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Save, MessageSquareText } from "lucide-react"

export default function TemplateCreator() {
  const [template, setTemplate] = useState({
    category: 'MARKETING',
    name: '',
    language: 'en_US',
    header: '',
    body: '',
    footer: '',
    buttons: [] as Array<{ type: string; text: string; url?: string }>
  })

  const addButton = () => {
    setTemplate(prev => ({
      ...prev,
      buttons: [...prev.buttons, { type: 'QUICK_REPLY', text: '' }]
    }))
  }

  const updateButton = (index: number, field: string, value: string) => {
    const updatedButtons = template.buttons.map((btn, i) =>
      i === index ? { ...btn, [field]: value } : btn
    )
    setTemplate(prev => ({ ...prev, buttons: updatedButtons }))
  }

  const generateJSON = () => ({
    name: template.name,
    language: template.language,
    category: template.category,
    components: [
      ...(template.header ? [{
        type: 'HEADER',
        format: 'TEXT',
        text: template.header,
        example: { 
          header_text: [template.header] // Array of strings
        }
      }] : []),
      {
        type: 'BODY',
        text: template.body,
        example: {
          body_text: [["hello"]] // REQUIRED format for static text
        }
      },
      ...(template.footer ? [{
        type: 'FOOTER',
        text: template.footer
      }] : []),
      ...(template.buttons.length > 0 ? [{
        type: 'BUTTONS',
        buttons: template.buttons.map(btn => ({
          type: btn.type,
          text: btn.text,
          ...(btn.type === 'URL' && { url: btn.url })
        }))
      }] : [])
    ]
  })
  
  const handleSaveTemplate = async () => {
    const jsonData = generateJSON();

    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData),
      });

      if (!response.ok) {
        throw new Error('Failed to save template');
      }

      const result = await response.json();
      alert('Template saved successfully');
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Panel - Editor */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Top Row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={template.category} onValueChange={v => setTemplate(p => ({ ...p, category: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MARKETING">Marketing</SelectItem>
                  <SelectItem value="UTILITY">Utility</SelectItem>
                  <SelectItem value="AUTHENTICATION">Authentication</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Template Name</Label>
              <Input
                value={template.name}
                onChange={e => setTemplate(p => ({ ...p, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={template.language} onValueChange={v => setTemplate(p => ({ ...p, language: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
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
                <Label className="text-sm font-medium">Header (Optional)</Label>
                <span className="text-xs text-gray-500">{template.header.length}/60</span>
              </div>
              <Input
                value={template.header}
                onChange={e => setTemplate(p => ({ ...p, header: e.target.value }))}
                placeholder="Enter header text"
                maxLength={60}
              />
            </CardContent>
          </Card>

          {/* Body Section */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Body*</Label>
                <span className="text-xs text-gray-500">{template.body.length}/1024</span>
              </div>
              <Textarea
                value={template.body}
                onChange={e => setTemplate(p => ({ ...p, body: e.target.value }))}
                placeholder="Enter body text"
                rows={4}
                maxLength={1024}
                className="min-h-[120px]"
              />
            </CardContent>
          </Card>

          {/* Footer Section */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Footer (Optional)</Label>
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
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="QUICK_REPLY">Quick Reply</SelectItem>
                          <SelectItem value="URL">URL</SelectItem>
                          <SelectItem value="PHONE_NUMBER">Phone Number</SelectItem>
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
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div className="w-96 border-l bg-white p-6">
        <div className="sticky top-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MessageSquareText className="h-5 w-5" />
            WhatsApp Preview
          </h3>

          <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
            {/* Header Preview */}
            {template.header && (
              <div className="bg-green-600 text-white rounded-t-lg p-3 mb-2">
                <p className="text-center font-medium">{template.header}</p>
              </div>
            )}

            {/* Body Preview */}
            <div className="bg-white p-3 rounded-lg">
              <p className="text-gray-800 whitespace-pre-wrap">
                {template.body || ""}
              </p>
            </div>

            {/* Footer Preview */}
            {template.footer && (
              <div className="mt-2 p-3 bg-gray-100 rounded-b-lg">
                <p className="text-xs text-gray-600">{template.footer}</p>
              </div>
            )}

            {/* Buttons Preview */}
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

          {/* Save Button */}
          <Button
            className="w-full mt-6 bg-green-600 hover:bg-green-700"
            onClick={handleSaveTemplate}
            disabled={!template.body || template.buttons.some(b => !b.text)}
          >
            <Save className="mr-2 h-4 w-4" />
            Save Template
          </Button>
        </div>
      </div>
    </div>
  )
}