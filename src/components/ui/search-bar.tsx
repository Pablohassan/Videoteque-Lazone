import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({ onSearch, placeholder = "Rechercher un film..." }: SearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query);
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-md">
      <div className="relative search-glow rounded-lg">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 bg-secondary/50 border-border/50 focus:bg-secondary/80 transition-all duration-300"
        />
      </div>
    </form>
  );
}