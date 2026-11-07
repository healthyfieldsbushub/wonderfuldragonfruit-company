import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FileCheck, Leaf, Bug, Info, Package } from "lucide-react";
import { motion } from "framer-motion";

export interface ExportCertificationOptions {
  phytoCertificate: boolean; // R600
  inspectionCertificate: boolean; // R650 (must be with phyto)
  plantInspection: boolean; // R800 (standalone)
}

interface ExportCertificationsProps {
  options: ExportCertificationOptions;
  onChange: (options: ExportCertificationOptions) => void;
  formatPrice: (price: number) => string;
}

export const CERTIFICATION_PRICES = {
  phytoCertificate: 600,
  inspectionCertificate: 650,
  plantInspection: 800,
};

export function calculateCertificationTotal(options: ExportCertificationOptions): number {
  let total = 0;
  if (options.phytoCertificate) total += CERTIFICATION_PRICES.phytoCertificate;
  if (options.inspectionCertificate) total += CERTIFICATION_PRICES.inspectionCertificate;
  if (options.plantInspection) total += CERTIFICATION_PRICES.plantInspection;
  return total;
}

export function ExportCertifications({ options, onChange, formatPrice }: ExportCertificationsProps) {
  const handlePhytoChange = (checked: boolean) => {
    const newOptions = { ...options, phytoCertificate: checked };
    // If phyto is disabled, also disable inspection certificate
    if (!checked) {
      newOptions.inspectionCertificate = false;
    }
    onChange(newOptions);
  };

  const handleInspectionChange = (checked: boolean) => {
    // Inspection certificate requires phyto certificate
    if (checked && !options.phytoCertificate) {
      onChange({ ...options, phytoCertificate: true, inspectionCertificate: true });
    } else {
      onChange({ ...options, inspectionCertificate: checked });
    }
  };

  const handlePlantInspectionChange = (checked: boolean) => {
    onChange({ ...options, plantInspection: checked });
  };

  const total = calculateCertificationTotal(options);

  return (
    <Card className="glass-card border-amber-500/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="h-5 w-5 text-amber-500" />
          Export Certifications
          <Badge variant="outline" className="text-amber-600 border-amber-500">
            Optional
          </Badge>
        </CardTitle>
        <CardDescription>
          Required for international export of plant material
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Phytosanitary Certificate */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
            options.phytoCertificate
              ? "border-green-500 bg-green-500/5"
              : "border-border hover:border-green-500/50"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Leaf className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="phyto" className="font-medium cursor-pointer">
                  Phytosanitary Certificate
                </Label>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Official certificate confirming plants are free from pests and diseases. Required for most international plant exports.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-sm text-muted-foreground">
                Official plant health certificate for export
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-green-600">
              {formatPrice(CERTIFICATION_PRICES.phytoCertificate)}
            </span>
            <Switch
              id="phyto"
              checked={options.phytoCertificate}
              onCheckedChange={handlePhytoChange}
            />
          </div>
        </motion.div>

        {/* Inspection Certificate (requires Phyto) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
            options.inspectionCertificate
              ? "border-blue-500 bg-blue-500/5"
              : "border-border hover:border-blue-500/50"
          } ${!options.phytoCertificate ? "opacity-60" : ""}`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <FileCheck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="inspection" className="font-medium cursor-pointer">
                  Inspection Certificate
                </Label>
                <Badge variant="outline" className="text-xs">
                  + Phyto
                </Badge>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Additional inspection report that accompanies the Phytosanitary Certificate. Both certificates are issued together.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-sm text-muted-foreground">
                Must be ordered together with Phyto Certificate
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-blue-600">
              {formatPrice(CERTIFICATION_PRICES.inspectionCertificate)}
            </span>
            <Switch
              id="inspection"
              checked={options.inspectionCertificate}
              onCheckedChange={handleInspectionChange}
            />
          </div>
        </motion.div>

        {/* Standalone Plant Inspection */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
            options.plantInspection
              ? "border-amber-500 bg-amber-500/5"
              : "border-border hover:border-amber-500/50"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10">
              <Bug className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Label htmlFor="plantInspection" className="font-medium cursor-pointer">
                  Plant Health Inspection
                </Label>
                <Badge variant="outline" className="text-xs text-amber-600 border-amber-500">
                  Standalone
                </Badge>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Professional inspection to verify plants are pest and disease free. Ideal for farmers who want quality assurance before planting.</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <p className="text-sm text-muted-foreground">
                Pest & disease inspection for local farmers
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-semibold text-amber-600">
              {formatPrice(CERTIFICATION_PRICES.plantInspection)}
            </span>
            <Switch
              id="plantInspection"
              checked={options.plantInspection}
              onCheckedChange={handlePlantInspectionChange}
            />
          </div>
        </motion.div>

        {/* Total */}
        {total > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-between pt-3 border-t"
          >
            <span className="font-medium">Certification Total</span>
            <span className="text-lg font-bold text-gradient-sunset">
              {formatPrice(total)}
            </span>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
