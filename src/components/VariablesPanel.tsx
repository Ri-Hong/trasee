import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export function VariablesPanel() {
  return (
    <Card className="h-full bg-card">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-sm">Variables</h3>
      </div>
      <ScrollArea className="h-[calc(100%-3.5rem)]">
        <div className="p-4 space-y-2">
          <div className="text-sm text-muted-foreground text-center py-8">
            No variables to display yet
          </div>
        </div>
      </ScrollArea>
    </Card>
  );
}
