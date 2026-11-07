import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Sparkles, 
  Loader2, 
  Copy, 
  Image as ImageIcon, 
  Wand2,
  Eye,
  FileText,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAIImage } from '@/hooks/use-ai-image';
import { useCategories } from '@/hooks/use-products';
import { useAIScopeConfig } from '@/hooks/use-ai-config';

const imageStyles = [
  { value: 'african-artisan', label: 'African Artisan', description: 'Handcrafted, earthy, authentic' },
  { value: 'studio-white', label: 'Studio White', description: 'Clean white background, professional' },
  { value: 'lifestyle', label: 'Lifestyle', description: 'In-context, real-world usage' },
  { value: 'dramatic', label: 'Dramatic', description: 'Bold lighting, cinematic feel' },
  { value: 'rustic', label: 'Rustic', description: 'Natural textures, wooden elements' },
  { value: 'minimal', label: 'Minimal', description: 'Simple, elegant, lots of space' },
];

export default function AIImageGenerator() {
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [style, setStyle] = useState('african-artisan');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  
  const [analyzeUrl, setAnalyzeUrl] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  
  const [altTextUrl, setAltTextUrl] = useState('');
  const [altTextResult, setAltTextResult] = useState('');

  // Hook now routes through unified gateway
  const { generateImagePrompt, analyzeImage, generateAltText, isGenerating, isAnalyzing } = useAIImage();
  const { data: categories } = useCategories();
  
  // Get current scope config for display
  const { data: imageConfig } = useAIScopeConfig("image_prompt_generation");
  const { data: visionConfig } = useAIScopeConfig("vision_documents");

  const handleGeneratePrompt = async () => {
    if (!productName.trim()) {
      toast.error('Please enter a product name');
      return;
    }

    const selectedStyle = imageStyles.find(s => s.value === style);
    const prompt = await generateImagePrompt({
      productName,
      category,
      style: selectedStyle?.label || style,
      additionalNotes,
    });

    if (prompt) {
      setGeneratedPrompt(prompt);
      toast.success('Image prompt generated!');
    }
  };

  const handleAnalyzeImage = async () => {
    if (!analyzeUrl.trim()) {
      toast.error('Please enter an image URL');
      return;
    }

    const result = await analyzeImage({ imageUrl: analyzeUrl });
    if (result) {
      setAnalysisResult(result);
      toast.success('Image analyzed!');
    }
  };

  const handleGenerateAltText = async () => {
    if (!altTextUrl.trim()) {
      toast.error('Please enter an image URL');
      return;
    }

    const result = await generateAltText(altTextUrl);
    if (result) {
      setAltTextResult(result);
      toast.success('Alt text generated!');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-2">
            <ImageIcon className="h-8 w-8 text-primary" />
            AI Image Generator
          </h1>
          <p className="text-muted-foreground">
            Generate AI prompts for product images via unified gateway
          </p>
        </div>
        {imageConfig && (
          <Badge variant="outline">
            {imageConfig.provider}/{imageConfig.model_name}
          </Badge>
        )}
      </div>

      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            Generate Prompt
          </TabsTrigger>
          <TabsTrigger value="analyze" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Analyze Image
          </TabsTrigger>
          <TabsTrigger value="alt-text" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Alt Text
          </TabsTrigger>
        </TabsList>

        {/* Generate Prompt Tab */}
        <TabsContent value="generate" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Product Details
                </CardTitle>
                <CardDescription>
                  Enter product information to generate an AI image prompt
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="productName">Product Name *</Label>
                  <Input
                    id="productName"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g., Dragon Fruit Cutting - Purple Variety"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Category</SelectItem>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Image Style</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {imageStyles.map((s) => (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setStyle(s.value)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          style === s.value
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <p className="font-medium text-sm">{s.label}</p>
                        <p className="text-xs text-muted-foreground">{s.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="Any specific requirements, colors, composition ideas..."
                    rows={3}
                  />
                </div>

                <Button
                  onClick={handleGeneratePrompt}
                  disabled={isGenerating || !productName.trim()}
                  className="w-full btn-sunset"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate Image Prompt
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-primary" />
                    Generated Prompt
                  </span>
                  {generatedPrompt && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(generatedPrompt)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  )}
                </CardTitle>
                <CardDescription>
                  Use this prompt with Midjourney, DALL-E, or Stable Diffusion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  {generatedPrompt ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      <div className="p-4 rounded-lg bg-muted/50 border border-border">
                        <p className="text-sm whitespace-pre-wrap">{generatedPrompt}</p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(generatedPrompt)}
                          className="flex-1"
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          Copy to Clipboard
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleGeneratePrompt}
                          disabled={isGenerating}
                          className="flex-1"
                        >
                          <Sparkles className="h-4 w-4 mr-1" />
                          Regenerate
                        </Button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-48 flex flex-col items-center justify-center text-muted-foreground"
                    >
                      <Wand2 className="h-12 w-12 mb-4 opacity-30" />
                      <p>Enter product details to generate an AI prompt</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analyze Image Tab */}
        <TabsContent value="analyze" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  Analyze Product Image
                </CardTitle>
                <CardDescription>
                  Get AI-powered analysis of your product images
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="analyzeUrl">Image URL</Label>
                  <Input
                    id="analyzeUrl"
                    value={analyzeUrl}
                    onChange={(e) => setAnalyzeUrl(e.target.value)}
                    placeholder="https://example.com/product-image.jpg"
                  />
                </div>

                {analyzeUrl && (
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                    <img
                      src={analyzeUrl}
                      alt="Preview"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                <Button
                  onClick={handleAnalyzeImage}
                  disabled={isAnalyzing || !analyzeUrl.trim()}
                  className="w-full btn-sunset"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Analyze Image
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Analysis Result
                  </span>
                  {analysisResult && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(analysisResult)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  {analysisResult ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-lg bg-muted/50 border border-border max-h-80 overflow-y-auto"
                    >
                      <p className="text-sm whitespace-pre-wrap">{analysisResult}</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-48 flex flex-col items-center justify-center text-muted-foreground"
                    >
                      <Eye className="h-12 w-12 mb-4 opacity-30" />
                      <p>Enter an image URL to analyze</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alt Text Tab */}
        <TabsContent value="alt-text" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Generate Alt Text
                </CardTitle>
                <CardDescription>
                  Create SEO-optimized alt text for product images
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="altTextUrl">Image URL</Label>
                  <Input
                    id="altTextUrl"
                    value={altTextUrl}
                    onChange={(e) => setAltTextUrl(e.target.value)}
                    placeholder="https://example.com/product-image.jpg"
                  />
                </div>

                {altTextUrl && (
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                    <img
                      src={altTextUrl}
                      alt="Preview"
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                <Button
                  onClick={handleGenerateAltText}
                  disabled={isAnalyzing || !altTextUrl.trim()}
                  className="w-full btn-sunset"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Alt Text
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Generated Alt Text
                  </span>
                  {altTextResult && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(altTextResult)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AnimatePresence mode="wait">
                  {altTextResult ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-lg bg-muted/50 border border-border"
                    >
                      <p className="text-sm whitespace-pre-wrap">{altTextResult}</p>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="h-48 flex flex-col items-center justify-center text-muted-foreground"
                    >
                      <FileText className="h-12 w-12 mb-4 opacity-30" />
                      <p>Enter an image URL to generate alt text</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
