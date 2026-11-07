import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Leaf,
  ShoppingBag,
  HeadphonesIcon,
  PiggyBank,
  Truck,
  FileText,
  Bot,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface AIAgent {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  mcpEndpoint: string;
  tools: string[];
  scope: string;
}

export const AI_AGENTS: AIAgent[] = [
  {
    id: 'agricultural-advisor',
    name: 'Agricultural Advisor',
    description: 'Expert guidance on dragon fruit cultivation, pest management, and seasonal planning.',
    icon: Leaf,
    color: 'bg-green-500',
    mcpEndpoint: 'agricultural-knowledge-mcp',
    tools: ['get_variety_info', 'get_pest_treatment', 'get_seasonal_advice', 'compare_varieties'],
    scope: 'agricultural_advisor',
  },
  {
    id: 'ecommerce-assistant',
    name: 'E-commerce Assistant',
    description: 'Product descriptions, SEO optimization, pricing strategies, and inventory management.',
    icon: ShoppingBag,
    color: 'bg-blue-500',
    mcpEndpoint: 'ecommerce-mcp',
    tools: ['generate_product_description', 'optimize_product_seo', 'get_pricing_strategy', 'get_inventory_advice'],
    scope: 'ecommerce_assistant',
  },
  {
    id: 'customer-support',
    name: 'Customer Support',
    description: 'Order tracking, FAQ answers, product information, and farming advice for customers.',
    icon: HeadphonesIcon,
    color: 'bg-purple-500',
    mcpEndpoint: 'customer-support-mcp',
    tools: ['lookup_order', 'get_faq_answer', 'get_product_info', 'get_farming_advice'],
    scope: 'customer_support',
  },
  {
    id: 'financial-planner',
    name: 'Financial Planner',
    description: 'ROI calculations, funding options, budget projections, and break-even analysis.',
    icon: PiggyBank,
    color: 'bg-amber-500',
    mcpEndpoint: 'financial-planning-mcp',
    tools: ['calculate_roi', 'get_funding_options', 'create_budget_projection', 'calculate_break_even'],
    scope: 'financial_planning',
  },
  {
    id: 'supply-chain',
    name: 'Supply Chain Manager',
    description: 'Warehouse optimization, shipping costs, supplier recommendations, and route planning.',
    icon: Truck,
    color: 'bg-teal-500',
    mcpEndpoint: 'supply-chain-mcp',
    tools: ['find_optimal_warehouse', 'calculate_shipping_cost', 'get_supplier_recommendations', 'optimize_route'],
    scope: 'supply_chain',
  },
  {
    id: 'content-generator',
    name: 'Content Generator',
    description: 'Blog articles, product descriptions, social media content, and email templates.',
    icon: FileText,
    color: 'bg-pink-500',
    mcpEndpoint: 'content-generation-mcp',
    tools: ['generate_article', 'generate_product_description', 'create_social_media_content', 'generate_email_template'],
    scope: 'content_generation',
  },
];

interface AgentSelectorProps {
  selectedAgent: AIAgent | null;
  onSelectAgent: (agent: AIAgent) => void;
  compact?: boolean;
}

export function AgentSelector({ selectedAgent, onSelectAgent, compact = false }: AgentSelectorProps) {
  const [hoveredAgent, setHoveredAgent] = useState<string | null>(null);

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {AI_AGENTS.map((agent) => {
          const Icon = agent.icon;
          const isSelected = selectedAgent?.id === agent.id;
          return (
            <Button
              key={agent.id}
              variant={isSelected ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSelectAgent(agent)}
              className={`gap-2 ${isSelected ? agent.color : ''}`}
            >
              <Icon className="h-4 w-4" />
              {agent.name}
            </Button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <AnimatePresence>
        {AI_AGENTS.map((agent, index) => {
          const Icon = agent.icon;
          const isSelected = selectedAgent?.id === agent.id;
          const isHovered = hoveredAgent === agent.id;

          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => onSelectAgent(agent)}
                onMouseEnter={() => setHoveredAgent(agent.id)}
                onMouseLeave={() => setHoveredAgent(null)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className={`p-2 rounded-lg ${agent.color} text-white`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    {isSelected && (
                      <Badge variant="secondary" className="gap-1">
                        <Sparkles className="h-3 w-3" />
                        Active
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg mt-2">{agent.name}</CardTitle>
                  <CardDescription className="text-sm">{agent.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {agent.tools.slice(0, 3).map((tool) => (
                      <Badge key={tool} variant="outline" className="text-xs">
                        {tool.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                    {agent.tools.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{agent.tools.length - 3} more
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{agent.tools.length} tools available</span>
                    <ChevronRight 
                      className={`h-4 w-4 transition-transform ${isHovered ? 'translate-x-1' : ''}`} 
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export function AgentBadge({ agent }: { agent: AIAgent }) {
  const Icon = agent.icon;
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${agent.color} text-white text-sm`}>
      <Icon className="h-4 w-4" />
      <span>{agent.name}</span>
    </div>
  );
}
