import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Download, ExternalLink, AlertTriangle, Info, PlayCircle } from "lucide-react";
import {
    VideoPlayer,
    VideoPlayerContent,
} from "./ui/shadcn-io/video-player";

interface VideoPlayerModalProps {
    isOpen: boolean;
    onClose: () => void;
    videoUrl: string;
    title: string;
    subtitleFiles?: Array<{ path: string; filename: string; language: string; size: number }>;
    fileSize?: number;
    filePath?: string;
    filename?: string;
}

export function VideoPlayerModal({
    isOpen,
    onClose,
    videoUrl,
    title,
    subtitleFiles,
    fileSize,
    filePath,
    filename
}: VideoPlayerModalProps) {
    const [showWarning, setShowWarning] = useState(false);
    const [isLargeFile, setIsLargeFile] = useState(false);

    // Détection automatique des fichiers volumineux (> 2GB)
    useEffect(() => {
        if (fileSize) {
            const isLarge = fileSize > 2 * 1024 * 1024 * 1024; // 2GB en bytes
            setIsLargeFile(isLarge);
            setShowWarning(isLarge);
        }
    }, [fileSize]);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setShowWarning(false);
        }
    }, [isOpen]);

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const handleDownloadForVLC = () => {
        if (filePath && filename) {
            const downloadUrl = `/api/files/download/${encodeURIComponent(filename)}?path=${encodeURIComponent(filePath)}`;

            // Créer un lien temporaire et déclencher le téléchargement
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleContinuePlaying = () => {
        setShowWarning(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] p-0">
                <DialogHeader className="p-4 pb-2">
                    <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                        {title}
                        {isLargeFile && (
                            <Badge variant="destructive" className="text-xs">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {fileSize ? formatFileSize(fileSize) : "Large file"}
                            </Badge>
                        )}
                    </DialogTitle>
                </DialogHeader>

                {/* Overlay d'avertissement pour les fichiers volumineux */}
                {showWarning && (
                    <div className="absolute inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-6">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
                            <div className="flex items-center gap-2 text-orange-600">
                                <AlertTriangle className="h-6 w-6" />
                                <h3 className="text-lg font-semibold">Fichier volumineux détecté</h3>
                            </div>

                            <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    Ce fichier fait {fileSize ? formatFileSize(fileSize) : "plus de 2GB"}.
                                    La lecture dans le navigateur peut être limitée.
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-3">
                                <Alert>
                                    <Info className="h-4 w-4" />
                                    <AlertDescription>
                                        <strong>Conseils d'utilisation :</strong>
                                        <ul className="mt-2 space-y-1 text-sm">
                                            <li>• Utilisez VLC ou un lecteur externe pour une meilleure expérience</li>
                                            <li>• Les contrôles de navigation peuvent être limités</li>
                                            <li>• La lecture peut nécessiter plus de temps de chargement</li>
                                        </ul>
                                    </AlertDescription>
                                </Alert>

                                <div className="flex gap-2">
                                    <Button
                                        onClick={handleDownloadForVLC}
                                        className="flex-1 flex items-center gap-2"
                                        variant="outline"
                                    >
                                        <Download className="h-4 w-4" />
                                        Télécharger pour VLC
                                    </Button>
                                    <Button
                                        onClick={handleContinuePlaying}
                                        className="flex-1 flex items-center gap-2"
                                    >
                                        <PlayCircle className="h-4 w-4" />
                                        Continuer la lecture
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="relative">
                    {/* Lecteur vidéo avec contrôles natifs uniquement */}
                    <VideoPlayer className="w-full aspect-video">
                        <VideoPlayerContent
                            src={videoUrl}
                            controls
                            className="w-full h-full"
                            crossOrigin="anonymous"
                        >
                            {/* Intégration des sous-titres HTML5 native */}
                            {subtitleFiles && subtitleFiles.map((subtitle, index) => (
                                <track
                                    key={index}
                                    kind="subtitles"
                                    src={`/api/subtitles/${encodeURIComponent(subtitle.filename)}?path=${encodeURIComponent(subtitle.path)}`}
                                    srcLang={subtitle.language.toLowerCase().substring(0, 2)}
                                    label={subtitle.language}
                                    default={index === 0}
                                />
                            ))}
                        </VideoPlayerContent>
                    </VideoPlayer>

                    {/* Bouton de téléchargement permanent pour les gros fichiers */}
                    {isLargeFile && !showWarning && (
                        <div className="absolute top-4 right-4">
                            <Button
                                onClick={handleDownloadForVLC}
                                size="sm"
                                variant="secondary"
                                className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white border-white border"
                            >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                VLC
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
