/**
 * AI Image Hook
 * 
 * Routes all image AI requests through the unified gateway.
 * No hardcoded providers or models - uses the orchestrator.
 */

import { useState } from 'react';
import { toast } from 'sonner';
import { callAIGateway } from './use-ai-config';

interface GeneratePromptParams {
  productName: string;
  category?: string;
  style?: string;
  additionalNotes?: string;
}

interface AnalyzeImageParams {
  imageUrl: string;
  prompt?: string;
}

export function useAIImage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const generateImagePrompt = async (params: GeneratePromptParams): Promise<string | null> => {
    setIsGenerating(true);
    try {
      const result = await callAIGateway({
        scope: "image_prompt_generation",
        prompt: params.additionalNotes || 'Create a professional product photo',
        context: {
          productName: params.productName,
          category: params.category,
          style: params.style || 'African artisan, handcrafted aesthetic',
          imageRequestType: 'generate_prompt',
        },
      });

      return result.content;
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate image prompt');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const analyzeImage = async (params: AnalyzeImageParams): Promise<string | null> => {
    setIsAnalyzing(true);
    try {
      const result = await callAIGateway({
        scope: "vision_documents",
        prompt: params.prompt || 'Analyze this product image in detail',
        context: {
          imageUrl: params.imageUrl,
          imageRequestType: 'analyze',
        },
      });

      return result.content;
    } catch (error: any) {
      toast.error(error.message || 'Failed to analyze image');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateAltText = async (imageUrl: string): Promise<string | null> => {
    setIsAnalyzing(true);
    try {
      const result = await callAIGateway({
        scope: "vision_documents",
        prompt: 'Create SEO-optimized alt text for this product image',
        context: {
          imageUrl,
          imageRequestType: 'describe',
        },
      });

      return result.content;
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate alt text');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return {
    generateImagePrompt,
    analyzeImage,
    generateAltText,
    isGenerating,
    isAnalyzing,
  };
}
