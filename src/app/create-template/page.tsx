"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, ArrowRight, Save } from "lucide-react"
import Link from "next/link"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TemplateForm() {
  // Step tracking: 1 = category selection, 2 = template details, 3 = template structure
  const [step, setStep] = useState(1)

  // Category selection state
  const [category, setCategory] = useState("")
  const [subcategory, setSubcategory] = useState("")

  // Template details state
  const [templateName, setTemplateName] = useState("")
  const [language, setLanguage] = useState("en")
  const [embedFlow, setEmbedFlow] = useState(false)

  const nextStep = () => setStep(step + 1)
  const prevStep = () => setStep(step - 1)

  const handleSaveTemplate = async () => {
    // Here you would implement the logic to save the template
    // using environment variables for API endpoints/credentials
    console.log("Saving template...")
  }

  // Only show subcategories for the selected category
  const availableSubcategories = subcategories[category] || []

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Create New Template</h1>
      </div>

      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex justify-between">
          <div className="text-sm font-medium">Category Selection</div>
          <div className="text-sm font-medium">Template Details</div>
          <div className="text-sm font-medium">Template Structure</div>
        </div>
        <div className="relative mt-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-1 bg-muted"></div>
          </div>
          <div className="relative flex justify-between">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              1
            </div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              2
            </div>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
            >
              3
            </div>
          </div>
        </div>
      </div>

      {/* Step 1: Category Selection */}
      {step === 1 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Select Template Category</h2>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="category">Category</Label>
                <RadioGroup
                  value={category}
                  onValueChange={(value) => {
                    setCategory(value)
                    setSubcategory("") // Reset subcategory when category changes
                  }}
                  className="grid grid-cols-1 gap-4"
                >
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-start space-x-2">
                      <RadioGroupItem value={cat.id} id={cat.id} className="mt-1" />
                      <Label htmlFor={cat.id} className="font-normal cursor-pointer">
                        <div className="font-medium">{cat.name}</div>
                        <div className="text-sm text-muted-foreground">{cat.description}</div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {category && availableSubcategories.length > 0 && (
                <div className="space-y-3">
                  <Label htmlFor="subcategory">Type</Label>
                  <RadioGroup value={subcategory} onValueChange={setSubcategory} className="grid grid-cols-1 gap-4">
                    {availableSubcategories.map((subcat) => (
                      <div key={subcat.id} className="flex items-start space-x-2">
                        <RadioGroupItem value={subcat.id} id={subcat.id} className="mt-1" />
                        <Label htmlFor={subcat.id} className="font-normal cursor-pointer">
                          <div className="font-medium">{subcat.name}</div>
                          <div className="text-sm text-muted-foreground">{subcat.description}</div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              )}

              <div className="flex justify-end">
                <Button onClick={nextStep} disabled={!category || (!subcategory && availableSubcategories.length > 0)}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Template Details */}
      {step === 2 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Template Details</h2>

            <div className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="templateName">Template Name</Label>
                <Input
                  id="templateName"
                  placeholder="Enter template name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="language">Language</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="it">Italian</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(category === "marketing" && subcategory === "flows") ||
                (category === "utility" && subcategory === "flows" && (
                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="embedFlow"
                      checked={embedFlow}
                      onCheckedChange={(checked) => setEmbedFlow(checked as boolean)}
                    />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="embedFlow" className="font-normal cursor-pointer">
                        Embed Flow
                      </Label>
                      <p className="text-sm text-muted-foreground">Include an interactive flow within this template</p>
                    </div>
                  </div>
                ))}

              <div className="flex justify-between">
                <Button variant="outline" onClick={prevStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={nextStep} disabled={!templateName}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Template Structure */}
      {step === 3 && (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Template Structure</h2>

            <Tabs defaultValue="header" className="mb-6">
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="header">Header</TabsTrigger>
                <TabsTrigger value="body">Body</TabsTrigger>
                <TabsTrigger value="button">Button</TabsTrigger>
                <TabsTrigger value="footer">Footer</TabsTrigger>
              </TabsList>

              <TabsContent value="header" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="headerTitle">Header Title</Label>
                  <Input id="headerTitle" placeholder="Enter header title" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="headerImage">Header Image</Label>
                  <div className="border border-dashed rounded-md p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Drag and drop an image or click to upload</p>
                    <Button variant="secondary" size="sm">
                      Upload Image
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="headerDescription">Header Description</Label>
                  <Textarea id="headerDescription" placeholder="Enter header description" rows={3} />
                </div>
              </TabsContent>

              <TabsContent value="body" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bodyContent">Body Content</Label>
                  <Textarea id="bodyContent" placeholder="Enter body content" rows={6} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bodyMedia">Body Media</Label>
                  <div className="border border-dashed rounded-md p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Drag and drop media or click to upload</p>
                    <Button variant="secondary" size="sm">
                      Upload Media
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="button" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="buttonText">Button Text</Label>
                  <Input id="buttonText" placeholder="Enter button text" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buttonUrl">Button URL</Label>
                  <Input id="buttonUrl" placeholder="Enter button URL" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buttonStyle">Button Style</Label>
                  <Select defaultValue="primary">
                    <SelectTrigger id="buttonStyle">
                      <SelectValue placeholder="Select button style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="secondary">Secondary</SelectItem>
                      <SelectItem value="outline">Outline</SelectItem>
                      <SelectItem value="link">Link</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="footer" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="footerText">Footer Text</Label>
                  <Textarea id="footerText" placeholder="Enter footer text" rows={3} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="footerLinks">Footer Links</Label>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input placeholder="Link text" className="flex-1" />
                      <Input placeholder="URL" className="flex-1" />
                    </div>
                    <div className="flex gap-2">
                      <Input placeholder="Link text" className="flex-1" />
                      <Input placeholder="URL" className="flex-1" />
                    </div>
                    <Button variant="outline" size="sm" className="w-full">
                      Add Another Link
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="border rounded-md p-4 mb-6">
              <h3 className="text-sm font-medium mb-2">Preview</h3>
              <div className="bg-muted/50 rounded-md p-4 min-h-[200px] flex items-center justify-center">
                <p className="text-muted-foreground">Template preview will appear here</p>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={prevStep}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button onClick={handleSaveTemplate}>
                <Save className="mr-2 h-4 w-4" />
                Save Template
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Facebook-specific categories
const categories = [
  {
    id: "marketing",
    name: "Marketing",
    description: "Templates for marketing campaigns and promotional content",
  },
  {
    id: "utility",
    name: "Utility",
    description: "Templates for functional and service-related communications",
  },
  {
    id: "authentication",
    name: "Authentication",
    description: "Templates for user verification and authentication",
  },
]

// Facebook-specific subcategories
const subcategories: Record<string, Array<{ id: string; name: string; description: string }>> = {
  marketing: [
    {
      id: "custom",
      name: "Custom",
      description: "Create a fully customized marketing template",
    },
    {
      id: "catalogue",
      name: "Catalogue",
      description: "Templates for showcasing products from your catalogue",
    },
    {
      id: "flows",
      name: "Flows",
      description: "Interactive marketing templates with embedded flows",
    },
  ],
  utility: [
    {
      id: "custom",
      name: "Custom",
      description: "Create a fully customized utility template",
    },
    {
      id: "flows",
      name: "Flows",
      description: "Interactive utility templates with embedded flows",
    },
  ],
  authentication: [
    {
      id: "one_time_passcode",
      name: "One Time Passcode",
      description: "Templates for sending one-time verification codes",
    },
  ],
}

