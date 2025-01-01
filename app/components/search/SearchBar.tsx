'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function SearchBar() {
  return (
    <div className="relative w-96">
      <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
      <Input
        placeholder="Search artists, labels, or releases..."
        className="pl-10 bg-background/80 backdrop-blur-sm border-muted"
      />
    </div>
  );
}