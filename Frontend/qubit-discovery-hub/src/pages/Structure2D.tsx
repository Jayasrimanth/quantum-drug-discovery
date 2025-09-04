import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import {
  Atom,
  User,
  LogOut,
  ArrowLeft,
} from "lucide-react";
import Structure2DViewer from "@/components/Structure2DViewer";
import quantumHero from "@/assets/quantum-hero.jpg";

const Structure2D = () => {
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
            alt="2D molecular structure viewer"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/60 to-background/80" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold bg-gradient-quantum bg-clip-text text-transparent">
                2D Structure Viewer
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Generate 2D molecular structures from SMILES notation with molecular properties
              </p>
            </div>

            {/* 2D Structure Viewer Component */}
            <Structure2DViewer />
          </div>
        </div>
      </section>
    </main>
  );
};

export default Structure2D;
