import React, { useState, useEffect } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Subtitles, X } from "lucide-react";

interface SubtitleFile {
    path: string;
    filename: string;
    language: string;
    size: number;
}

interface SubtitleSelectorProps {
    subtitleFiles: SubtitleFile[];
    onSubtitleChange: (subtitleUrl: string | null, language: string | null) => void;
    className?: string;
}

export function SubtitleSelector({
    subtitleFiles,
    onSubtitleChange,
    className
}: SubtitleSelectorProps) {
    const [selectedSubtitle, setSelectedSubtitle] = useState<string | null>(null);
    const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

    // Initialiser avec le premier sous-titre disponible
    useEffect(() => {
        if (subtitleFiles.length > 0 && !selectedSubtitle) {
            const firstSubtitle = subtitleFiles[0];
            const subtitleUrl = `/api/subtitles/${encodeURIComponent(firstSubtitle.filename)}?path=${encodeURIComponent(firstSubtitle.path)}`;
            setSelectedSubtitle(subtitleUrl);
            setSelectedLanguage(firstSubtitle.language);
            onSubtitleChange(subtitleUrl, firstSubtitle.language);
        }
    }, [subtitleFiles, selectedSubtitle, onSubtitleChange]);

    const handleSubtitleSelect = (value: string) => {
        if (value === "none") {
            setSelectedSubtitle(null);
            setSelectedLanguage(null);
            onSubtitleChange(null, null);
        } else {
            const subtitle = subtitleFiles.find(sub =>
                `/api/subtitles/${encodeURIComponent(sub.filename)}?path=${encodeURIComponent(sub.path)}` === value
            );
            if (subtitle) {
                setSelectedSubtitle(value);
                setSelectedLanguage(subtitle.language);
                onSubtitleChange(value, subtitle.language);
            }
        }
    };

    if (subtitleFiles.length === 0) {
        return null;
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={`h-8 w-8 p-0 ${className}`}
                    title={selectedLanguage ? `Sous-titres: ${selectedLanguage}` : "Sous-titres"}
                >
                    {selectedSubtitle ? (
                        <Subtitles className="h-4 w-4" />
                    ) : (
                        <X className="h-4 w-4" />
                    )}
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className="w-48"
                sideOffset={8}
                onCloseAutoFocus={(e) => e.preventDefault()}
            >
                <DropdownMenuLabel>Sous-titres</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuRadioGroup value={selectedSubtitle || "none"} onValueChange={handleSubtitleSelect}>
                    <DropdownMenuRadioItem value="none">
                        <X className="mr-2 h-3 w-3" />
                        Désactivés
                    </DropdownMenuRadioItem>

                    {subtitleFiles.map((subtitle, index) => {
                        const subtitleUrl = `/api/subtitles/${encodeURIComponent(subtitle.filename)}?path=${encodeURIComponent(subtitle.path)}`;
                        return (
                            <DropdownMenuRadioItem key={index} value={subtitleUrl}>
                                {subtitle.language}
                            </DropdownMenuRadioItem>
                        );
                    })}
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
