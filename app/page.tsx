import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Music4 } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-background/80">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center space-y-8 text-center">
          <div className="flex items-center space-x-2">
            <Music4 className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl">
              SoundMap
            </h1>
          </div>
          <p className="max-w-[600px] text-muted-foreground">
            Discover music through an interactive 3D visualization of artists, labels, and releases.
            Explore connections, find new artists, and dive deep into the world of music.
          </p>
          <div className="flex space-x-4">
            <Link href="/explore">
              <Button size="lg" className="font-semibold">
                Start Exploring
              </Button>
            </Link>
            <Link href="/about">
              <Button size="lg" variant="outline" className="font-semibold">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}