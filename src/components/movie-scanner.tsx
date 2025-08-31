import React, { useRef, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { Upload, FileVideo, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { ScanResult } from '../services/movieScannerService';

interface MovieScannerProps {
    onScan: (files: FileList) => Promise<ScanResult[]>;
    scanning: boolean;
    results: ScanResult[];
}

export function MovieScanner({ onScan, scanning, results }: MovieScannerProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);

    const handleFileSelect = async (files: FileList) => {
        if (files.length > 0) {
            await onScan(files);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);

        const files = e.dataTransfer.files;
        handleFileSelect(files);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const successCount = results.filter(r => r.success).length;
    const progress = results.length > 0 ? (successCount / results.length) * 100 : 0;

    return (
        <div className="space-y-6">
            {/* Zone de téléchargement */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileVideo className="h-5 w-5" />
                        Scanner vos films locaux
                    </CardTitle>
                    <CardDescription>
                        Sélectionnez vos fichiers de films pour récupérer automatiquement leurs informations depuis TMDB
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragOver
                            ? 'border-primary bg-primary/5'
                            : 'border-muted-foreground/25 hover:border-primary/50'
                            }`}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                    >
                        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <div className="space-y-2">
                            <p className="text-lg font-medium">
                                Glissez-déposez vos films ici
                            </p>
                            <p className="text-sm text-muted-foreground">
                                ou cliquez pour sélectionner des fichiers
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Formats supportés: MP4, MKV, AVI, MOV, WMV, FLV, WEBM
                            </p>
                        </div>

                        <Button
                            className="mt-4"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={scanning}
                        >
                            {scanning ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Scan en cours...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Sélectionner des fichiers
                                </>
                            )}
                        </Button>

                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept=".mp4,.mkv,.avi,.mov,.wmv,.flv,.webm,.m4v"
                            className="hidden"
                            onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Résultats du scan */}
            {results.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Résultats du scan</CardTitle>
                        <CardDescription>
                            {successCount} film(s) trouvé(s) sur {results.length} fichier(s) analysé(s)
                        </CardDescription>
                        <Progress value={progress} className="w-full" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {results.map((result, index) => (
                                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            {result.success ? (
                                                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                                            )}
                                            <p className="text-sm font-medium truncate">
                                                {result.filename}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-1 mb-1">
                                            <Badge variant="outline" className="text-xs">
                                                {result.parsed.title}
                                            </Badge>
                                            {result.parsed.year && (
                                                <Badge variant="outline" className="text-xs">
                                                    {result.parsed.year}
                                                </Badge>
                                            )}
                                            {result.parsed.resolution && (
                                                <Badge variant="outline" className="text-xs">
                                                    {result.parsed.resolution}
                                                </Badge>
                                            )}
                                        </div>

                                        {result.success && result.tmdbMovie ? (
                                            <p className="text-xs text-green-600">
                                                ✓ Trouvé: {result.tmdbMovie.title} ({result.tmdbMovie.releaseYear})
                                            </p>
                                        ) : (
                                            <p className="text-xs text-red-600">
                                                ✗ {result.error}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {scanning && (
                            <Alert className="mt-4">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <AlertDescription>
                                    Scan en cours... Recherche des informations sur TMDB.
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
