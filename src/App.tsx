import { Button } from '@/components/ui/button';

export default function App() {
  return (
    <div className="min-h-full flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Insighta Labs</h1>
        <p className="text-muted-foreground">Frontend scaffold ready.</p>
        <Button>It works</Button>
      </div>
    </div>
  );
}
