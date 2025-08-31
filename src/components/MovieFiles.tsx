import { useState, useEffect, useCallback } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Download, Play, FileText, Video, Subtitles } from "lucide-react";
import { useToast } from "./ui/use-toast";
import { VideoPlayerModal } from "./VideoPlayerModal";

interface MovieFile {
    id: number;
    path: string;
    filename: string;
    displayName: string;
    size: number;
    container: string;
}

interface SubtitleFile {
    id: string;
    language: string;
    label: string;
    path: string;
    filename: string;
    size: number;
}

interface MovieFolder {
    movieId: number;
    folderPath: string;
    videoFiles: MovieFile[];
    subtitleFiles: SubtitleFile[];
    otherFiles: unknown[];
}

interface MovieFilesProps {
    movieId: number;
}

export function MovieFiles({ movieId }: MovieFilesProps) {
    const [movieFolder, setMovieFolder] = useState<MovieFolder | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [videoPlayerOpen, setVideoPlayerOpen] = useState(false);
    const [currentVideo, setCurrentVideo] = useState<{ url: string; title: string } | null>(null);
    const { toast } = useToast();

    const loadMovieFiles = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Récupérer les informations de fichiers depuis la nouvelle route
            const response = await fetch(`/api/movies/${movieId}/files-info`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const fileInfo = await response.json();

            if (!fileInfo.success || !fileInfo.data.localPath) {
                setError("Aucun fichier local trouvé pour ce film");
                return;
            }

            // Utiliser les sous-titres retournés par l'API
            const subtitleFiles = fileInfo.data.subtitleFiles || [];

            const mockFolder: MovieFolder = {
                movieId,
                folderPath: fileInfo.data.localPath,
                videoFiles: [{
                    id: 1,
                    path: fileInfo.data.localPath,
                    filename: "film.mkv", // Nom simple pour l'URL
                    displayName: fileInfo.data.filename || "film.mkv", // Nom complet pour l'affichage
                    size: fileInfo.data.fileSize || 0,
                    container: fileInfo.data.container || "mkv"
                }],
                subtitleFiles: subtitleFiles.map(sub => ({
                    id: sub.filename,
                    path: sub.path,
                    filename: sub.filename,
                    language: sub.language,
                    size: sub.size
                })),
                otherFiles: []
            };

            setMovieFolder(mockFolder);
        } catch (err) {
            console.error("Erreur chargement fichiers:", err);
            setError("Impossible de récupérer les fichiers du film");
        } finally {
            setLoading(false);
        }
    }, [movieId]);

    useEffect(() => {
        if (movieId) {
            loadMovieFiles();
        }
    }, [movieId, loadMovieFiles]);

    const handleDownload = async (filePath: string, filename: string) => {
        try {
            toast({
                title: "Téléchargement en cours...",
                description: `Téléchargement de ${filename}`,
            });

            // Créer l'URL de téléchargement
            const downloadUrl = `/api/files/download/${encodeURIComponent(filename)}?path=${encodeURIComponent(filePath)}`;

            // Créer un lien temporaire et déclencher le téléchargement
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast({
                title: "Téléchargement terminé",
                description: `${filename} a été téléchargé`,
            });
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Erreur lors du téléchargement",
                variant: "destructive",
            });
        }
    };

    const handlePlay = (filePath: string, filename: string) => {
        try {
            const videoUrl = `/api/files/stream/${encodeURIComponent(filename)}?path=${encodeURIComponent(filePath)}`;
            setCurrentVideo({ url: videoUrl, title: filename });
            setVideoPlayerOpen(true);
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Erreur lors de l'ouverture du lecteur",
                variant: "destructive",
            });
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Fichiers du film</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Chargement des fichiers...</p>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Fichiers du film</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-red-500">{error}</p>
                </CardContent>
            </Card>
        );
    }

    if (!movieFolder) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Fichiers du film</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Aucun fichier disponible</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card id="movie-files">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Fichiers du film
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Fichiers vidéo */}
                {movieFolder.videoFiles.length > 0 && (
                    <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Video className="h-4 w-4" />
                            Fichiers vidéo
                        </h4>
                        <div className="space-y-2">
                            {movieFolder.videoFiles.map((file) => (
                                <div
                                    key={file.id}
                                    className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium">{file.displayName}</p>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Badge variant="secondary">{file.container.toUpperCase()}</Badge>
                                            <span>{formatFileSize(file.size)}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            onClick={() => handlePlay(file.path, file.filename)}
                                            className="flex items-center gap-2"
                                        >
                                            <Play className="h-4 w-4" />
                                            Regarder
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleDownload(file.path, file.filename)}
                                            className="flex items-center gap-2"
                                        >
                                            <Download className="h-4 w-4" />
                                            Télécharger
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Sous-titres */}
                {movieFolder.subtitleFiles.length > 0 && (
                    <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <Subtitles className="h-4 w-4" />
                            Sous-titres
                        </h4>
                        <div className="space-y-2">
                            {movieFolder.subtitleFiles.map((subtitle) => (
                                <div
                                    key={subtitle.id}
                                    className="flex items-center justify-between p-3 border rounded-lg"
                                >
                                    <div className="flex-1">
                                        <p className="font-medium">{subtitle.filename}</p>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Badge variant="outline">{subtitle.language}</Badge>
                                            <span>{formatFileSize(subtitle.size)}</span>
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleDownload(subtitle.path, subtitle.filename)}
                                        className="flex items-center gap-2"
                                    >
                                        <Download className="h-4 w-4" />
                                        Télécharger
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Aucun fichier */}
                {movieFolder.videoFiles.length === 0 && movieFolder.subtitleFiles.length === 0 && (
                    <p className="text-gray-500 text-center py-4">
                        Aucun fichier disponible pour ce film
                    </p>
                )}
            </CardContent>

            {/* Modal du lecteur vidéo */}
            {currentVideo && movieFolder && (
                <VideoPlayerModal
                    isOpen={videoPlayerOpen}
                    onClose={() => {
                        setVideoPlayerOpen(false);
                        setCurrentVideo(null);
                    }}
                    videoUrl={currentVideo.url}
                    title={currentVideo.title}
                    subtitleFiles={movieFolder.subtitleFiles || []}
                    fileSize={movieFolder.videoFiles[0]?.size}
                    filePath={movieFolder.videoFiles[0]?.path}
                    filename={movieFolder.videoFiles[0]?.filename}
                />
            )}
        </Card>
    );
}
