'use client';

import { useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { trpc } from '@/lib/trpc/client';
import { Search, Loader2 } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useGraphStore } from '@/lib/store/graphStore';

export function SearchBar() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const debouncedValue = useDebounce(value, 300);
  const { setNodes, setLinks } = useGraphStore();

  const searchQuery = trpc.artist.search.useQuery(
    { 
      query: debouncedValue,
      page: 1,
      perPage: 10 
    },
    {
      enabled: debouncedValue.length > 0,
      onSuccess: (data) => {
        console.log('Search results:', data);
      },
      onError: (error) => {
        console.error('Search error:', error);
        setSearchError(error.message);
      }
    }
  );

  const handleSelect = async (artistId: string) => {
    console.log('Selected artist:', artistId);
    try {
      setNodes([
        {
          id: artistId,
          name: "Selected Artist",
          type: 'artist',
          color: 'rgb(255, 64, 129)',
          size: 20
        }
      ]);
      setLinks([]);
      setOpen(false);
    } catch (error) {
      console.error('Error selecting artist:', error);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-96 justify-between bg-background/80 backdrop-blur-sm"
        >
          <Search className="mr-2 h-4 w-4" />
          {value || "Search artists..."}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0">
        <Command>
          <CommandInput
            value={value}
            onValueChange={setValue}
            placeholder="Search artists..."
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {searchQuery.isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : searchQuery.data ? (
              <CommandGroup heading="Artists">
                {searchQuery.data.results.map((artist) => (
                  <CommandItem
                    key={artist.id}
                    value={artist.id}
                    onSelect={() => handleSelect(artist.id)}
                  >
                    {artist.imageUrl && (
                      <img
                        src={artist.imageUrl}
                        alt={artist.name}
                        className="h-8 w-8 rounded-full object-cover mr-2"
                      />
                    )}
                    <span>{artist.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}