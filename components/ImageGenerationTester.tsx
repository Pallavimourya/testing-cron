'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Loader2, Image, Download, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

interface GenerationResult {
  success: boolean
  imageUrl?: string
  prompt?: string
  generationMethod?: string
  imageGenerations?: {
    used: number
    limit: number
  }
  error?: string
}

export default function ImageGenerationTester() {
  const [prompt, setPrompt] = useState('leadership strategies for team growth')
  const [content, setContent] = useState('Effective leadership is about inspiring your team to achieve their full potential. Focus on clear communication, setting achievable goals, and providing constructive feedback.')
  const [style, setStyle] = useState('professional')
  const [theme, setTheme] = useState('business')
  const [generationMethod, setGenerationMethod] = useState('dalle')
  const [isGenerating, setIsGenerating] = useState(false)
  const [results, setResults] = useState<GenerationResult[]>([])

  const styles = [
    { value: 'professional', label: 'Professional', description: 'Corporate blues and grays' },
    { value: 'creative', label: 'Creative', description: 'Vibrant colors and patterns' },
    { value: 'minimal', label: 'Minimal', description: 'Clean and spacious' },
    { value: 'modern', label: 'Modern', description: 'Contemporary and sleek' }
  ]

  const themes = [
    { value: 'business', label: 'Business' },
    { value: 'technology', label: 'Technology' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'leadership', label: 'Leadership' },
    { value: 'innovation', label: 'Innovation' }
  ]

  const methods = [
    { value: 'dalle', label: 'DALL-E 3', description: 'Quick, simplified prompts' },
    { value: 'sdxl', label: 'SDXL', description: 'Better infographics via Replicate' },
    { value: 'hybrid', label: 'Hybrid', description: 'AI + template overlay' }
  ]

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt')
      return
    }

    setIsGenerating(true)
    
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          content,
          style,
          theme,
          generationMethod
        })
      })

      const result: GenerationResult = await response.json()
      
      if (result.success) {
        setResults(prev => [result, ...prev])
        toast.success('Image generated successfully!')
      } else {
        toast.error(result.error || 'Failed to generate image')
      }
    } catch (error) {
      console.error('Generation error:', error)
      toast.error('Failed to generate image')
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Image downloaded!')
    } catch (error) {
      toast.error('Failed to download image')
    }
  }

  const testAllMethods = async () => {
    setIsGenerating(true)
    const newResults: GenerationResult[] = []
    
    for (const method of methods) {
      try {
        toast.info(`Testing ${method.label}...`)
        
        const response = await fetch('/api/generate-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt,
            content,
            style,
            theme,
            generationMethod: method.value
          })
        })

        const result: GenerationResult = await response.json()
        newResults.push(result)
        
        // Wait between requests
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (error) {
        newResults.push({
          success: false,
          error: `Failed to test ${method.label}`,
          generationMethod: method.value
        })
      }
    }
    
    setResults(newResults)
    setIsGenerating(false)
    toast.success('All methods tested!')
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">🎨 Image Generation Tester</h1>
        <p className="text-muted-foreground">
          Test different AI image generation methods for LinkedIn-style visuals
        </p>
      </div>

      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>
            Configure your image generation parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt</Label>
              <Input
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your image prompt..."
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="style">Style</Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {styles.map((style) => (
                    <SelectItem key={style.value} value={style.value}>
                      <div>
                        <div className="font-medium">{style.label}</div>
                        <div className="text-sm text-muted-foreground">{style.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="theme">Theme</Label>
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {themes.map((theme) => (
                    <SelectItem key={theme.value} value={theme.value}>
                      {theme.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="method">Generation Method</Label>
              <Select value={generationMethod} onValueChange={setGenerationMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {methods.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      <div>
                        <div className="font-medium">{method.label}</div>
                        <div className="text-sm text-muted-foreground">{method.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content (for context)</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter content for context..."
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={generateImage} 
              disabled={isGenerating}
              className="flex-1"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Image className="mr-2 h-4 w-4" />
                  Generate Image
                </>
              )}
            </Button>
            
            <Button 
              onClick={testAllMethods} 
              disabled={isGenerating}
              variant="outline"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Test All Methods
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Results</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((result, index) => (
              <Card key={index} className={result.success ? 'border-green-200' : 'border-red-200'}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {result.generationMethod?.toUpperCase() || 'Unknown'}
                    </CardTitle>
                    <Badge variant={result.success ? 'default' : 'destructive'}>
                      {result.success ? 'Success' : 'Failed'}
                    </Badge>
                  </div>
                  {result.imageGenerations && (
                    <CardDescription>
                      Used: {result.imageGenerations.used}/{result.imageGenerations.limit}
                    </CardDescription>
                  )}
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {result.success && result.imageUrl ? (
                    <>
                      <div className="aspect-video relative overflow-hidden rounded-lg">
                        <img
                          src={result.imageUrl}
                          alt="Generated image"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          <strong>Prompt:</strong> {result.prompt?.substring(0, 100)}...
                        </p>
                        
                        <Button
                          onClick={() => downloadImage(
                            result.imageUrl!, 
                            `linkedin-image-${result.generationMethod}-${Date.now()}.jpg`
                          )}
                          size="sm"
                          variant="outline"
                          className="w-full"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-red-500 font-medium">Generation Failed</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {result.error || 'Unknown error'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-semibold mb-2">1. DALL-E 3</h4>
              <p className="text-sm text-muted-foreground">
                Quick generation with simplified prompts. Good for testing but may produce "artsy" results.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">2. SDXL</h4>
              <p className="text-sm text-muted-foreground">
                Better for infographics via Replicate. Requires REPLICATE_API_TOKEN in environment.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">3. Hybrid</h4>
              <p className="text-sm text-muted-foreground">
                Combines AI generation with professional template overlays for LinkedIn-ready results.
              </p>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">💡 Pro Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Use "Test All Methods" to compare results side-by-side</li>
              <li>• Professional style works best for business content</li>
              <li>• SDXL typically produces better infographic-style results</li>
              <li>• Hybrid method adds professional borders and overlays</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
