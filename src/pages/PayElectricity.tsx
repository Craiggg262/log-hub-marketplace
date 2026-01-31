import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Zap, Lock, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const PayElectricity = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-primary">Pay Electricity</h1>
          </div>
        </div>

        {/* Coming Soon Card */}
        <Card className="p-8 bg-card border-border text-center space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="w-10 h-10 text-primary" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Coming Soon</h2>
            <p className="text-muted-foreground">
              Electricity bill payment is currently unavailable. We're working on integrating this service.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Check back later for updates</span>
          </div>

          <Button
            onClick={() => navigate("/services")}
            variant="outline"
            className="w-full"
          >
            Browse Other Services
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default PayElectricity;
