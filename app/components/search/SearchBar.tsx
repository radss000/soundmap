import { useState, useCallback, useEffect } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { trpc } from '@/lib/trpc/client';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
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
  const debouncedValue = useDebounce(value, 300);
  const { setNodes, setLinks } = useGraphStore();

  const searchQuery = trpc.artist.search.useQuery(
    { 
      query: debouncedValue,
      page: 1,
      limit: 10 
    },
    {
      enabled: debouncedValue.length > 0,
    }
  );

  const handleSelect = useCallback((artistId: string) => {
    // Fetch artist details and related artists
    const fetchArtistData = async () => {
      const [artist, related] = await Promise.all([
        trpc.artist.getById.fetch(artistId),
        trpc.artist.getRelated.fetch(artistId)
      ]);

      // Transform data for graph visualization
      const nodes = [
        {
          id: artist.id,
          name: artist.name,
          type: 'artist',
          color: '#ff4081',
          size: 20
        },
        ...related.collaborations.map((collab: any) => ({
          id: collab.id,
          name: collab.name,
          type: 'artist',
          color: '#ff4081',
          size: 15
        })),
        ...related.releases.map((release: any) => ({
          id: release.id,
          name: release.title,
          type: 'release',
          color: '#4caf50',
          size: 12
        }))
      ];

      const links = [
        ...related.collaborations.map((collab: any) => ({
          source: artist.id,
          target: collab.id,
          type: 'collaboration'
        })),
        ...related.releases.map((release: any) => ({
          source: artist.id,
          target: release.id,
          type: 'release'
        }))
      ];

      setNodes(nodes);
      setLinks(links);
    };

    fetchArtistData();
    setOpen(false);
  }, [setNodes, setLinks]);

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
            ) : (
              <CommandGroup heading="Artists">
                {searchQuery.data?.results.map((artist: any) => (
                  <CommandItem
                    key={artist.id}
                    value={artist.id}
                    onSelect={() => handleSelect(artist.id)}
                  >
                    {artist.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}