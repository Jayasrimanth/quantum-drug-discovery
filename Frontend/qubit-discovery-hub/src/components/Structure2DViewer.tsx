import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Smile, AlertCircle, Download } from "lucide-react";
import { toast } from "sonner";

interface Structure2DResult {
  success: boolean;
  smiles?: string;
  structure_2d?: string;
  molecular_weight?: number;
  molecular_formula?: string;
  atom_count?: number;
  bond_count?: number;
  error?: string;
}

const Structure2DViewer = () => {
  const [smilesInput, setSmilesInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<Structure2DResult | null>(null);

  const handleGenerate2D = async () => {
    if (!smilesInput.trim()) {
      toast.error("Please enter a SMILES notation");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/generate-2d-structure", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ smiles: smilesInput.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        
        if (data.success) {
          toast.success("2D structure generated successfully!");
        } else {
          toast.error(data.error || "Failed to generate 2D structure");
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || "Failed to generate 2D structure");
      }
    } catch (error) {
      console.error("Error generating 2D structure:", error);
      toast.error("Network error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadStructure = () => {
    if (!result || !result.structure_2d) return;

    // Create a link to download the image
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${result.structure_2d}`;
    link.download = `structure_${result.smiles?.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Structure image downloaded!");
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Smile className="w-5 h-5" />
            <span>2D Structure Viewer</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="smiles-2d-input">SMILES String</Label>
            <Input
              id="smiles-2d-input"
              type="text"
              placeholder="e.g., CCO (ethanol) or c1ccccc1 (benzene)"
              value={smilesInput}
              onChange={(e) => setSmilesInput(e.target.value)}
              disabled={isLoading}
              className="font-mono"
            />
            <p className="text-sm text-muted-foreground">
              Enter a SMILES notation to view its 2D molecular structure
            </p>
          </div>
          <Button
            onClick={handleGenerate2D}
            disabled={isLoading || !smilesInput.trim()}
            variant="quantum"
            size="lg"
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Smile className="w-4 h-4 mr-2" />
                Generate 2D Structure
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Section */}
      {result && (
        <div className="space-y-4">
          {result.success ? (
            <>
              {/* Structure Display */}
              <Card className="bg-gradient-card border-border/50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>2D Molecular Structure</CardTitle>
                    <Badge variant="default" className="bg-molecular-green">
                      Generated
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Structure Image */}
                  <div className="flex justify-center p-6 bg-white rounded-lg border">
                    <img 
                      src={`data:image/png;base64,${result.structure_2d}`}
                      alt="2D molecular structure"
                      className="max-w-full h-auto max-h-96"
                    />
                  </div>
                  
                  {/* Molecular Properties */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">SMILES:</span>
                      <div className="font-mono font-medium">{result.smiles}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Formula:</span>
                      <div className="font-medium">{result.molecular_formula}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Mol. Weight:</span>
                      <div className="font-medium">{result.molecular_weight?.toFixed(2)} g/mol</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Atoms/Bonds:</span>
                      <div className="font-medium">{result.atom_count}/{result.bond_count}</div>
                    </div>
                  </div>
                  
                  <Button onClick={downloadStructure} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download PNG
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-8 text-center">
                <div className="flex items-center justify-center space-x-2 text-destructive mb-4">
                  <AlertCircle className="w-6 h-6" />
                  <span className="text-lg font-semibold">Generation Failed</span>
                </div>
                <p className="text-muted-foreground">{result.error}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default Structure2DViewer;
