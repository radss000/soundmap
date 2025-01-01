'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SlidersHorizontal } from 'lucide-react';

export function FilterPanel() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="bg-background/80 backdrop-blur-sm">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Node Types</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked>Artists</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked>Labels</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked>Releases</DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Connection Types</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem checked>Collaborations</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked>Releases</DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem checked>Remixes</DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}