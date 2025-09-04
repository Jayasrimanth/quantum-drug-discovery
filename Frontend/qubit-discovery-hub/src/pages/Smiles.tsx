import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import {
  Atom,
  Smile,
  Eye,
  Download,
  Loader2,
  User,
  LogOut,
  ArrowLeft,
  Trophy,
  Zap,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import quantumHero from "@/assets/quantum-hero.jpg";

interface Isomer {
  rank: number;
  smiles: string;
  energy: number;
  stability: string;
  visualization: string;
  structure_2d?: string;
}

interface SmilesResult {
  success: boolean;
  input_smiles?: string;
  total_isomers?: number;
  processing_time?: number;
  isomers?: Isomer[];
  most_stable?: Isomer;
  error?: string;
}

const Smiles = () => {
  const { user, signOut, profile, updatePoints } = useAuth();
  const navigate = useNavigate();
  const [smilesInput, setSmilesInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<SmilesResult | null>(null);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/signin");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleProcessSmiles = async () => {
    if (!smilesInput.trim()) {
      toast.error("Please enter a SMILES notation");
      return;
    }

    // Check if user has enough points
    if (!profile) {
      toast.error("Please wait for your profile to load.");
      return;
    }
    
    const cost = 7;
    if (profile.token_points < cost) {
      toast.error(`Insufficient points for SMILES analysis. You need ${cost} points but only have ${profile.token_points}.`);
      return;
    }

    setIsProcessing(true);
    setResults(null);

    try {
      const response = await fetch("/api/process-smiles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ smiles: smilesInput.trim() }),
      });

      if (response.ok) {
        const result = await response.json();
        setResults(result);
        
        if (result.success) {
          // Deduct points after successful processing
          const newPoints = profile.token_points - cost;
          updatePoints(newPoints);
          toast.success(`Successfully generated ${result.total_isomers} isomer(s)! ${cost} points deducted. Remaining: ${newPoints}`);
        } else {
          toast.error(result.error || "Failed to process SMILES");
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.detail || "Failed to process SMILES");
      }
    } catch (error) {
      console.error("Error processing SMILES:", error);
      toast.error("Network error occurred while processing SMILES");
    } finally {
      setIsProcessing(false);
    }
  };

  const openVisualization = (htmlContent: string, title: string) => {
    try {
      const decodedHtml = atob(htmlContent);
      const newWindow = window.open("", "_blank");
      if (newWindow) {
        newWindow.document.write(decodedHtml);
        newWindow.document.title = title;
        newWindow.document.close();
      }
    } catch (error) {
      toast.error("Failed to open visualization");
    }
  };

  const downloadResults = () => {
    if (!results || !results.success) return;

    const data = {
      input_smiles: results.input_smiles,
      total_isomers: results.total_isomers,
      processing_time: results.processing_time,
      isomers: results.isomers?.map(isomer => ({
        rank: isomer.rank,
        smiles: isomer.smiles,
        energy: isomer.energy,
        stability: isomer.stability
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `smiles_isomers_${results.input_smiles?.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Results downloaded successfully!");
  };

  return (
    <main className="min-h-screen bg-gradient-hero">
      {/* Header Navigation */}
      <header className="relative z-10 border-b border-border/20 bg-background/10 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
              <div className="flex items-center space-x-2">
                <Atom className="w-8 h-8 text-primary" />
                <span className="text-2xl font-bold bg-gradient-quantum bg-clip-text text-transparent">
                  Qpharma
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  {profile && (
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-muted-foreground">Points:</span>
                      <span className="font-semibold text-molecular-green">
                        {profile.token_points}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span>{user.email}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link to="/signin">
                    <Button variant="ghost" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button variant="quantum" size="sm">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-12 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={quantumHero}
            alt="SMILES molecular analysis"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/60 to-background/80" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Smile className="w-8 h-8 text-primary" />
                <h1 className="text-4xl font-bold bg-gradient-quantum bg-clip-text text-transparent">
                  SMILE Isomer Generator
                </h1>
              </div>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Generate and analyze all possible stereoisomers from SMILE notation with stability ranking
              </p>
            </div>

            {/* Input Section */}
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Smile className="w-5 h-5" />
                  <span>Enter SMILE Notation</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="smiles-input">SMILE String</Label>
                  <Input
                    id="smiles-input"
                    type="text"
                    placeholder="e.g., CC(O)C(Br)C (3-bromo-2-butanol)"
                    value={smilesInput}
                    onChange={(e) => setSmilesInput(e.target.value)}
                    disabled={isProcessing}
                    className="font-mono"
                  />
                  <p className="text-sm text-muted-foreground">
                    Enter a valid SMILE notation to generate all possible stereoisomers
                  </p>
                </div>
                <div className="space-y-2">
                  <Button
                    onClick={handleProcessSmiles}
                    disabled={isProcessing || !smilesInput.trim()}
                    variant="quantum"
                    size="lg"
                    className="w-full"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Generate Isomers
                      </>
                    )}
                  </Button>
                  <div className="text-center text-xs text-muted-foreground">
                    Costs 7 points
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results Section */}
            {results && (
              <div className="space-y-6">
                {results.success ? (
                  <>
                    {/* Summary Card */}
                    <Card className="bg-gradient-card border-border/50">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>Analysis Results</span>
                          <Badge variant="default" className="bg-molecular-green">
                            {results.total_isomers} Isomer{results.total_isomers !== 1 ? 's' : ''} Found
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Input SMILES:</span>
                            <div className="font-mono font-medium">{results.input_smiles}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Processing Time:</span>
                            <div className="font-medium">{results.processing_time?.toFixed(3)}s</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Most Stable Energy:</span>
                            <div className="font-medium">{results.most_stable?.energy.toFixed(4)} kcal/mol</div>
                          </div>
                        </div>
                        <Button onClick={downloadResults} variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Download Results
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Isomers Grid */}
                    <div className="grid gap-4">
                      <h3 className="text-2xl font-semibold text-center">Ranked Isomers (Most to Least Stable)</h3>
                      {results.isomers?.map((isomer, index) => (
                        <Card key={index} className="bg-gradient-card border-border/50">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg flex items-center space-x-2">
                                {isomer.rank === 1 && <Trophy className="w-5 h-5 text-yellow-500" />}
                                <span>Isomer {isomer.rank}</span>
                              </CardTitle>
                              <Badge variant={isomer.rank === 1 ? "default" : "secondary"}>
                                {isomer.stability}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">SMILES:</span>
                                <div className="font-mono font-medium">{isomer.smiles}</div>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Energy:</span>
                                <div className="font-medium">{isomer.energy.toFixed(4)} kcal/mol</div>
                              </div>
                            </div>
                            
                            {/* 2D Structure Display */}
                            {isomer.structure_2d && (
                              <div className="space-y-2">
                                <span className="text-sm text-muted-foreground">2D Structure:</span>
                                <div className="flex justify-center p-4 bg-white rounded-lg border">
                                  <img 
                                    src={`data:image/png;base64,${isomer.structure_2d}`}
                                    alt={`2D structure of isomer ${isomer.rank}`}
                                    className="max-w-full h-auto"
                                  />
                                </div>
                              </div>
                            )}
                            
                            <Button
                              variant="quantum"
                              size="sm"
                              onClick={() => openVisualization(isomer.visualization, `Isomer ${isomer.rank}`)}
                              className="w-full"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View 3D Structure
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                ) : (
                  <Card className="bg-gradient-card border-border/50">
                    <CardContent className="p-8 text-center">
                      <div className="flex items-center justify-center space-x-2 text-destructive mb-4">
                        <AlertCircle className="w-6 h-6" />
                        <span className="text-lg font-semibold">Processing Failed</span>
                      </div>
                      <p className="text-muted-foreground">{results.error}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Smiles;
