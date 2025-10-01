"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTranslation } from "@/components/providers/TranslationProvider";
import { Loader2 } from "lucide-react";

export function DemoDialog() {
  const { t } = useTranslation();
  const [isDemoDialogOpen, setIsDemoDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleDialogChange = (open: boolean) => {
    setIsDemoDialogOpen(open);
    if (open) {
      setIsLoading(true); // Reset loading state when opening
    }
  };

  return (
    <Dialog open={isDemoDialogOpen} onOpenChange={handleDialogChange}>
      <DialogTrigger asChild>
        <Button size="lg" variant="outline" className="text-lg px-8 py-4">
          {t("homepage.hero.ctaSecondary")}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-w-6xl max-h-[90vh] p-0"
        aria-describedby={"RefPaper demo"}
      >
        <DialogHeader className="p-6 pb-0">
          <DialogTitle></DialogTitle>
        </DialogHeader>
        <div className="p-6 pt-0">
          <div
            style={{
              boxSizing: "content-box",
              maxHeight: "80vh",
              width: "100%",
              aspectRatio: "2",
            }}
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded">
                <div className="flex flex-col items-center">
                  <Loader2 className="animate-spin text-primary" />
                </div>
              </div>
            )}
            <iframe
              src="https://app.supademo.com/embed/cmg7fkcfg0qfv2nomwungb6qx?embed_v=2&utm_source=embed"
              loading="lazy"
              title="Refpaper Demo"
              allow="clipboard-write"
              onLoad={() => setIsLoading(false)}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                opacity: isLoading ? 0 : 1,
                transition: "opacity 0.3s ease-in-out",
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
