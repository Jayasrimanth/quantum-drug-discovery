import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import {
  Atom,
  Database,
  Search,
  User,
  LogOut,
  ArrowLeft,
  Pill,
  Beaker,
  Heart,
  Zap,
  Shield,
  Coffee,
  Droplets,
} from "lucide-react";
import quantumHero from "@/assets/quantum-hero.jpg";
import Molecule3DViewer from "@/components/Molecule3DViewer";

interface Molecule {
  name: string;
  smiles: string;
  molecularWeight: number;
  category: string;
  icon: React.ReactNode;
  color: string;
}

const moleculeData: Molecule[] = [
  {
    name: "Paracetamol",
    smiles: "CC(=O)Nc1ccc(cc1)O",
    molecularWeight: 151.16,
    category: "Analgesic, Antipyretic",
    icon: <Pill className="w-4 h-4" />,
    color: "bg-blue-500/20 text-blue-200 border-blue-500/50"
  },
  {
    name: "Ibuprofen",
    smiles: "CC(C)Cc1ccc(cc1)C(C)C(=O)O",
    molecularWeight: 206.29,
    category: "NSAID, Analgesic, Anti-inflammatory",
    icon: <Shield className="w-4 h-4" />,
    color: "bg-red-500/20 text-red-200 border-red-500/50"
  },
  {
    name: "Aspirin",
    smiles: "CC(=O)Oc1ccccc1C(=O)O",
    molecularWeight: 180.16,
    category: "Analgesic, Anti-inflammatory, Antiplatelet",
    icon: <Heart className="w-4 h-4" />,
    color: "bg-pink-500/20 text-pink-200 border-pink-500/50"
  },
  {
    name: "Morphine",
    smiles: "C[C@H]1CC[C@]23C4=CC5=C(C=C4O)C(=O)OC[C@]23CC1N5",
    molecularWeight: 285.34,
    category: "Opioid Analgesic",
    icon: <Pill className="w-4 h-4" />,
    color: "bg-purple-500/20 text-purple-200 border-purple-500/50"
  },
  {
    name: "Caffeine",
    smiles: "CN1C=NC2=C1C(=O)N(C(=O)N2C)C",
    molecularWeight: 194.19,
    category: "CNS Stimulant, Diuretic",
    icon: <Coffee className="w-4 h-4" />,
    color: "bg-amber-500/20 text-amber-200 border-amber-500/50"
  },
  {
    name: "Glucose (D-glucose)",
    smiles: "C([C@@H]1[C@H]([C@@H]([C@H](C(O1)O)O)O)O)O",
    molecularWeight: 180.16,
    category: "Carbohydrate, Energy Source, Sweetener",
    icon: <Zap className="w-4 h-4" />,
    color: "bg-green-500/20 text-green-200 border-green-500/50"
  },
  {
    name: "Metformin",
    smiles: "CN(C)C(=N)N=C(N)N",
    molecularWeight: 129.16,
    category: "Antidiabetic (Type 2 Diabetes)",
    icon: <Beaker className="w-4 h-4" />,
    color: "bg-teal-500/20 text-teal-200 border-teal-500/50"
  },
  {
    name: "L-Ascorbic Acid",
    smiles: "C([C@H]([C@@H]1C(=C(C(=O)O1)O)O)O)O",
    molecularWeight: 176.12,
    category: "Antioxidant, Vitamin (Vitamin C)",
    icon: <Shield className="w-4 h-4" />,
    color: "bg-orange-500/20 text-orange-200 border-orange-500/50"
  },
  {
    name: "Ethanol",
    smiles: "CCO",
    molecularWeight: 46.07,
    category: "Solvent, Fuel, Antiseptic, Beverage",
    icon: <Droplets className="w-4 h-4" />,
    color: "bg-cyan-500/20 text-cyan-200 border-cyan-500/50"
  },
  {
    name: "Glycerol",
    smiles: "C(C(CO)O)O",
    molecularWeight: 92.09,
    category: "Humectant, Solvent, Sweetener",
    icon: <Droplets className="w-4 h-4" />,
    color: "bg-indigo-500/20 text-indigo-200 border-indigo-500/50"
  },
  {
    name: "Amoxicillin",
    smiles: "CC1([C@@H](N2[C@H](S1)[C@@H](C2=O)NC(=O)[C@@H](C3=CC=C(C=C3)O)N)C(=O)O)C",
    molecularWeight: 365.40,
    category: "Antibiotic",
    icon: <Shield className="w-4 h-4" />,
    color: "bg-emerald-500/20 text-emerald-200 border-emerald-500/50"
  }
];

const MoleculeBank = () => {
  const { user, signOut, profile } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/signin");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // Get unique categories
  const categories = useMemo(() => {
    const allCategories = moleculeData.flatMap(mol => 
      mol.category.split(", ").map(cat => cat.trim())
    );
    return ["All", ...Array.from(new Set(allCategories)).sort()];
  }, []);

  // Filter molecules based on search and category
  const filteredMolecules = useMemo(() => {
    return moleculeData.filter(molecule => {
      const matchesSearch = molecule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          molecule.smiles.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          molecule.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = selectedCategory === "All" || 
                            molecule.category.includes(selectedCategory);
      
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

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
            alt="Molecule bank database"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/60 to-background/80" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Database className="w-8 h-8 text-primary" />
                <h1 className="text-4xl font-bold bg-gradient-quantum bg-clip-text text-transparent">
                  Molecule Bank
                </h1>
              </div>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Comprehensive database of pharmaceutical and chemical compounds with molecular structures and usage information
              </p>
            </div>

            {/* Search and Filter Section */}
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="w-5 h-5" />
                  <span>Search & Filter</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="Search by molecule name, SMILES, or category..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="md:w-64">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Showing {filteredMolecules.length} of {moleculeData.length} molecules
                </div>
              </CardContent>
            </Card>

            {/* Molecules Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredMolecules.map((molecule, index) => (
                <Card key={index} className="bg-gradient-card border-border/50 hover:border-primary/50 transition-all duration-300 hover:scale-105">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center space-x-2">
                        {molecule.icon}
                        <span>{molecule.name}</span>
                      </CardTitle>
                      <Badge className={molecule.color}>
                        {molecule.molecularWeight} g/mol
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-muted-foreground">SMILES Structure:</span>
                        <div className="font-mono text-xs bg-muted/30 p-2 rounded break-all">
                          {molecule.smiles}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Category of Usage:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {molecule.category.split(", ").map((cat, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {cat.trim()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* 3D Visualization Component */}
                    <Molecule3DViewer 
                      smiles={molecule.smiles}
                      moleculeName={molecule.name}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* No Results */}
            {filteredMolecules.length === 0 && (
              <Card className="bg-gradient-card border-border/50">
                <CardContent className="p-8 text-center">
                  <Database className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No molecules found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search terms or category filter
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Statistics */}
            <Card className="bg-gradient-card border-border/50">
              <CardHeader>
                <CardTitle>Database Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">{moleculeData.length}</div>
                    <div className="text-sm text-muted-foreground">Total Molecules</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">{categories.length - 1}</div>
                    <div className="text-sm text-muted-foreground">Categories</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {Math.round(moleculeData.reduce((sum, mol) => sum + mol.molecularWeight, 0) / moleculeData.length)}
                    </div>
                    <div className="text-sm text-muted-foreground">Avg. Mol. Weight</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">
                      {Math.round(moleculeData.reduce((sum, mol) => sum + mol.smiles.length, 0) / moleculeData.length)}
                    </div>
                    <div className="text-sm text-muted-foreground">Avg. SMILES Length</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
};

export default MoleculeBank;
