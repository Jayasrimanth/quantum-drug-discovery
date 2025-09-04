import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import {
  Atom,
  Eye,
  Smile,
  Database,
  User,
  LogOut,
} from "lucide-react";
import quantumHero from "@/assets/quantum-hero.jpg";

const Home = () => {
  const { user, signOut, profile } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/signin");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handle3DVisualization = () => {
    navigate("/quantum-discovery");
  };

  return (
    <main className="min-h-screen bg-gradient-hero">
      {/* Header Navigation */}
      <header className="relative z-10 border-b border-border/20 bg-background/10 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Atom className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold bg-gradient-quantum bg-clip-text text-transparent">
                Qpharma
              </span>
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
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={quantumHero}
            alt="Quantum molecular visualization"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/60 to-background/80" />
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-quantum bg-clip-text text-transparent leading-tight">
              Quantum AI for Drug Discovery
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Harness the power of quantum computing to revolutionize molecular analysis, 
              drug discovery, and pharmaceutical research with cutting-edge visualization tools.
            </p>

            {/* Main Action Buttons */}
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-16">
              {/* 3D Visualization */}
              <Card className="bg-gradient-card border-border/50 hover:border-primary/50 transition-all duration-300 hover:scale-105">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <Eye className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">3D Visualization</h3>
                  <p className="text-muted-foreground text-sm">
                    Interactive molecular structure analysis with quantum and classical approaches
                  </p>
                  <Button 
                    variant="quantum" 
                    size="lg" 
                    className="w-full"
                    onClick={handle3DVisualization}
                  >
                    Launch Platform
                  </Button>
                </CardContent>
              </Card>

              {/* SMILE */}
              <Card className="bg-gradient-card border-border/50 hover:border-primary/50 transition-all duration-300 hover:scale-105">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center">
                    <Smile className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">SMILE</h3>
                  <p className="text-muted-foreground text-sm">
                    Simplified Molecular Input Line Entry system for chemical notation
                  </p>
                  <Button 
                    variant="quantum" 
                    size="lg" 
                    className="w-full"
                    onClick={() => navigate("/smiles")}
                  >
                    Launch SMILES
                  </Button>
                </CardContent>
              </Card>

              {/* Molecule Bank */}
              <Card className="bg-gradient-card border-border/50 hover:border-primary/50 transition-all duration-300 hover:scale-105">
                <CardContent className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center">
                    <Database className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold">Molecule Bank</h3>
                  <p className="text-muted-foreground text-sm">
                    Comprehensive database of molecular structures and compounds
                  </p>
                  <Button 
                    variant="quantum" 
                    size="lg" 
                    className="w-full"
                    onClick={() => navigate("/molecule-bank")}
                  >
                    Browse Database
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto mt-20">
              <div className="text-left space-y-4">
                <h3 className="text-2xl font-semibold text-primary">Quantum Computing Power</h3>
                <p className="text-muted-foreground">
                  Leverage quantum algorithms for molecular simulation and drug discovery, 
                  providing unprecedented computational capabilities for complex molecular interactions.
                </p>
              </div>
              <div className="text-left space-y-4">
                <h3 className="text-2xl font-semibold text-primary">Interactive Visualization</h3>
                <p className="text-muted-foreground">
                  Explore molecular structures in stunning 3D detail with real-time manipulation, 
                  quantum effects visualization, and comprehensive analysis tools.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
