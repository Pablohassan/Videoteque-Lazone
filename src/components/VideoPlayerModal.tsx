import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Download, ExternalLink, AlertTriangle, Info, PlayCircle, Settings, Subtitles } from "lucide-react";
import {
    VideoPlayer,
    VideoPlayerContent,
} from "./ui/shadcn-io/video-player";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "./ui/dropdown-menu";

interface VideoPlayerModalProps {
    isOpen: boolean;
    onClose: () => void;
    videoUrl: string;
    title: string;
    subtitleFiles?: Array<{ path: string; filename: string; language: string; size: number }>;
    fileSize?: number;
    filePath?: string;
    filename?: string;
    codec?: string;
    container?: string;
}

interface SubtitleTrack {
    id: string;
    index: number;
    language: string;
    label: string;
    kind: 'subtitles' | 'captions' | 'descriptions';
    mode: 'disabled' | 'hidden' | 'showing';
}

export function VideoPlayerModal({
    isOpen,
    onClose,
    videoUrl,
    title,
    subtitleFiles,
    fileSize,
    filePath,
    filename,
    codec,
    container
}: VideoPlayerModalProps) {
    const [showWarning, setShowWarning] = useState(false);
    const [isLargeFile, setIsLargeFile] = useState(false);
    const [isAC3File, setIsAC3File] = useState(false);
    const [showAC3Warning, setShowAC3Warning] = useState(false);
    const [embeddedSubtitles, setEmbeddedSubtitles] = useState<SubtitleTrack[]>([]);
    const [currentSubtitleTrack, setCurrentSubtitleTrack] = useState<number | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Détection automatique des fichiers volumineux (> 2GB) et AC3
    useEffect(() => {
        if (fileSize) {
            const isLarge = fileSize > 2 * 1024 * 1024 * 1024; // 2GB en bytes
            setIsLargeFile(isLarge);
            setShowWarning(isLarge);
        }

        // Détection des fichiers AC3 dans le nom
        if (filename || filePath) {
            const fileName = filename || (filePath ? filePath.split('/').pop() : '');
            const hasAC3 = fileName ? fileName.toLowerCase().includes('ac3') : false;
            console.log('🎵 Détection AC3:', { fileName, hasAC3, filename, filePath });
            setIsAC3File(hasAC3);
            setShowAC3Warning(hasAC3);
        }
    }, [fileSize, filename, filePath]);

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setShowWarning(false);
            setShowAC3Warning(false);
            setEmbeddedSubtitles([]);
            setCurrentSubtitleTrack(null);
        }
    }, [isOpen]);

    // Détection des pistes de sous-titres intégrées
    const handleVideoLoad = () => {
        if (videoRef.current) {
            const video = videoRef.current;
            const tracks: SubtitleTrack[] = [];

            // Parcourir toutes les pistes de texte
            for (let i = 0; i < video.textTracks.length; i++) {
                const track = video.textTracks[i];
                if (track.kind === 'subtitles' || track.kind === 'captions') {
                    tracks.push({
                        id: `track-${i}`,
                        index: i,
                        language: track.language || 'unknown',
                        label: track.label || `Sous-titres ${i + 1}`,
                        kind: track.kind as 'subtitles' | 'captions',
                        mode: track.mode,
                    });
                }
            }

            setEmbeddedSubtitles(tracks);

            // Activer automatiquement la première piste de sous-titres si disponible
            if (tracks.length > 0 && video.textTracks.length > 0) {
                const firstTrack = video.textTracks[tracks[0].index];
                if (firstTrack) {
                    firstTrack.mode = 'showing';
                    setCurrentSubtitleTrack(tracks[0].index);
                }
            }
        }
    };

    // Gestion du changement de piste de sous-titres
    const handleSubtitleChange = (trackIndex: number | null) => {
        if (videoRef.current) {
            const video = videoRef.current;

            // Désactiver toutes les pistes
            for (let i = 0; i < video.textTracks.length; i++) {
                video.textTracks[i].mode = 'disabled';
            }

            // Activer la piste sélectionnée
            if (trackIndex !== null && video.textTracks[trackIndex]) {
                video.textTracks[trackIndex].mode = 'showing';
                setCurrentSubtitleTrack(trackIndex);
            } else {
                setCurrentSubtitleTrack(null);
            }
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const handleDownloadForVLC = () => {
        if (filePath) {
            // Extraire le nom réel du fichier depuis le chemin
            const realFilename = filePath.split('/').pop() || 'film';
            const downloadUrl = `/api/files/download/${encodeURIComponent(realFilename)}?path=${encodeURIComponent(filePath)}`;

            // Créer un lien temporaire et déclencher le téléchargement
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = realFilename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleContinuePlaying = () => {
        setShowWarning(false);
    };

    const handleContinueAC3 = () => {
        setShowAC3Warning(false);
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
                        {isAC3File && (
                            <Badge variant="secondary" className="text-xs">
                                <Info className="h-3 w-3 mr-1" />
                                AC3 Audio
                            </Badge>
                        )}
                        {embeddedSubtitles.length > 0 && (
                            <Badge variant="default" className="text-xs">
                                <Subtitles className="h-3 w-3 mr-1" />
                                {embeddedSubtitles.length} Sous-titres
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

                {/* Overlay d'avertissement pour les fichiers AC3 */}
                {showAC3Warning && (
                    <div className="absolute inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-6">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
                            <div className="flex items-center gap-2 text-blue-600">
                                <Info className="h-6 w-6" />
                                <h3 className="text-lg font-semibold">Format audio AC3 détecté</h3>
                            </div>

                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertDescription>
                                    Ce fichier contient une piste audio AC3 qui ne peut pas être lue nativement dans un navigateur web.
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-3">
                                <Alert>
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                        <strong>Conseils d'utilisation :</strong>
                                        <ul className="mt-2 space-y-1 text-sm">
                                            <li>• Téléchargez le fichier pour le regarder sur VLC</li>
                                            <li>• Utilisez un lecteur externe compatible AC3</li>
                                            <li>• La lecture dans le navigateur peut ne pas avoir de son</li>
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
                                        onClick={handleContinueAC3}
                                        className="flex-1 flex items-center gap-2"
                                    >
                                        <PlayCircle className="h-4 w-4" />
                                        Continuer malgré tout
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
                            ref={videoRef}
                            src={videoUrl}
                            controls
                            className="w-full h-full"
                            crossOrigin="anonymous"
                            onLoadedMetadata={handleVideoLoad}
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

                    {/* Indicateur de sous-titres intégrés */}
                    {embeddedSubtitles.length > 0 && (
                        <div className="absolute top-4 left-4">
                            <Badge variant="secondary" className="bg-black bg-opacity-50 text-white border-white border">
                                <Subtitles className="h-3 w-3 mr-1" />
                                CC
                            </Badge>
                        </div>
                    )}

                    {/* Bouton de téléchargement permanent pour les gros fichiers et AC3 */}
                    {(isLargeFile || isAC3File) && (!showWarning && !showAC3Warning) && (
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
