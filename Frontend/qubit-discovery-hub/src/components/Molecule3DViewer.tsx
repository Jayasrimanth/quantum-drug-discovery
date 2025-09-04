import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Molecule3DViewerProps {
  smiles: string;
  moleculeName: string;
  className?: string;
}

const Molecule3DViewer: React.FC<Molecule3DViewerProps> = ({ 
  smiles, 
  moleculeName, 
  className = "" 
}) => {
  const { profile, updatePoints } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [structure2D, setStructure2D] = useState<string | null>(null);
  const [showVisualization, setShowVisualization] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const generate2DStructure = async () => {
    if (structure2D) {
      setShowVisualization(!showVisualization);
      return;
    }

    // Check if user has enough points
    if (!profile) {
      toast.error("Please wait for your profile to load.");
      return;
    }
    
    const cost = 1;
    if (profile.token_points < cost) {
      toast.error(`Insufficient points for 2D visualization. You need ${cost} point but only have ${profile.token_points}.`);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/generate-2d-structure", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ smiles }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.structure_2d) {
          setStructure2D(data.structure_2d);
          setShowVisualization(true);
          
          // Deduct points after successful generation
          const newPoints = profile.token_points - cost;
          updatePoints(newPoints);
          toast.success(`2D structure generated! ${cost} point deducted. Remaining: ${newPoints}`);
        } else {
          toast.error("Failed to generate structure");
        }
      } else {
        toast.error("Failed to generate structure");
      }
    } catch (error) {
      console.error("Error generating structure:", error);
      toast.error("Network error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const open3DVisualization = async () => {
    // Check if user has enough points
    if (!profile) {
      toast.error("Please wait for your profile to load.");
      return;
    }
    
    const cost = 3;
    if (profile.token_points < cost) {
      toast.error(`Insufficient points for 3D visualization. You need ${cost} points but only have ${profile.token_points}.`);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/process-smiles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ smiles }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.isomers && data.isomers.length > 0) {
          const mostStable = data.isomers[0];
          const decodedHtml = atob(mostStable.visualization);
          const newWindow = window.open("", "_blank");
          if (newWindow) {
            newWindow.document.write(decodedHtml);
            newWindow.document.title = `${moleculeName} - 3D Structure`;
            newWindow.document.close();
          }
          
          // Deduct points after successful generation
          const newPoints = profile.token_points - cost;
          updatePoints(newPoints);
          toast.success(`3D visualization opened! ${cost} points deducted. Remaining: ${newPoints}`);
        } else {
          toast.error("Failed to generate 3D visualization");
        }
      } else {
        toast.error("Failed to generate 3D visualization");
      }
    } catch (error) {
      console.error("Error generating 3D visualization:", error);
      toast.error("Network error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 2D Structure Display */}
      {showVisualization && structure2D && (
        <div className="bg-white rounded-lg p-3 border">
          <img 
            src={`data:image/png;base64,${structure2D}`}
            alt={`2D structure of ${moleculeName}`}
            className="w-full h-auto max-h-48 object-contain"
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <Button
            onClick={generate2DStructure}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="flex-1"
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Eye className="w-3 h-3 mr-1" />
            )}
            {structure2D ? (showVisualization ? "Hide" : "Show") + " 2D" : "View 2D"}
          </Button>
          
          <Button
            onClick={open3DVisualization}
            disabled={isLoading}
            variant="quantum"
            size="sm"
            className="flex-1"
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            ) : (
              <Eye className="w-3 h-3 mr-1" />
            )}
            View 3D
          </Button>
        </div>
        
        {/* Point Cost Information */}
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Costs 1 point</span>
          <span>Costs 3 points</span>
        </div>
      </div>
    </div>
  );
};

export default Molecule3DViewer;
