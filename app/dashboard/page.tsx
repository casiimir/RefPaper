"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  return (
    <div className="bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-20">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Plus className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-4">No assistants yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first AI assistant by providing documentation URLs.
              Transform any docs into an intelligent knowledge base.
            </p>
            <Button size="lg" className="font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              Create Assistant
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
