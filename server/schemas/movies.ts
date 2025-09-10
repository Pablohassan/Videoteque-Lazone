import { z } from "zod";
import path from "path";
import fs from "fs";
import os from "os";

// ========================================================================
// SCHÉMAS DE VALIDATION POUR LES SERVICES DE FILMS
// ========================================================================

// Extensions de fichiers vidéo supportées

// Extensions comme array mutable pour Zod
const SUPPORTED_VIDEO_EXTENSIONS_ARRAY = [
  ".mp4",
  ".mkv",
  ".avi",
  ".mov",
  ".wmv",
  ".flv",
  ".webm",
  ".m4v",
];

// Fonction simplifiée de validation pour les chemins (production-friendly)
const isValidPath = (inputPath: string): boolean => {
  // En production, on accepte les chemins relatifs simples
  // La sécurité est gérée par Docker et les variables d'environnement
  if (!inputPath || inputPath.trim() === "") return false;
  if (inputPath.includes("..")) return false; // Pas de navigation vers le parent
  if (/[<>:"|?*]/.test(inputPath)) return false; // Pas de caractères dangereux
  return true;
};

// Schéma pour valider un chemin de dossier
export const FolderPathSchema = z
  .string()
  .min(1, "Le chemin du dossier ne peut pas être vide")
  .refine(isValidPath, "Le chemin contient des caractères invalides")
  .refine(
    (path) => path.length <= 260,
    "Le chemin du dossier est trop long (maximum 260 caractères)"
  );

// Schéma pour valider un chemin de fichier
export const FilePathSchema = z
  .string()
  .min(1, "Le chemin du fichier ne peut pas être vide")
  .refine(
    (path) => !path.includes(".."),
    "Le chemin ne peut pas contenir '..' pour des raisons de sécurité"
  )
  .refine(
    (path) => path.length <= 260,
    "Le chemin du fichier est trop long (maximum 260 caractères)"
  );

// Schéma pour valider une extension de fichier vidéo
export const VideoFileExtensionSchema = z
  .string()
  .transform((ext) => ext.toLowerCase())
  .refine((ext) => SUPPORTED_VIDEO_EXTENSIONS_ARRAY.includes(ext), {
    message: `Extension non supportée. Extensions autorisées: ${SUPPORTED_VIDEO_EXTENSIONS_ARRAY.join(
      ", "
    )}`,
  });

// Schéma pour valider un nom de fichier de film
export const MovieFilenameSchema = z
  .string()
  .min(1, "Le nom du fichier ne peut pas être vide")
  .max(255, "Le nom du fichier est trop long")
  .refine(
    (filename) => !/[<>:"/\\|?*]/.test(filename),
    "Le nom du fichier contient des caractères interdits"
  );

// Schéma pour valider les options de scan
export const ScanOptionsSchema = z.object({
  folderPath: FolderPathSchema.optional(),
  recursive: z.boolean().default(true),
  extensions: z
    .array(VideoFileExtensionSchema)
    .min(1, "Au moins une extension doit être spécifiée")
    .default(SUPPORTED_VIDEO_EXTENSIONS_ARRAY),
  maxFiles: z
    .number()
    .int()
    .min(1, "Le nombre maximum de fichiers doit être positif")
    .max(10000, "Le nombre maximum de fichiers ne peut pas dépasser 10 000")
    .optional(),
  excludePatterns: z.array(z.string().regex(/^[^<>:"/\\|?*]*$/)).optional(),
});

// Schéma pour valider les options de surveillance
export const WatcherOptionsSchema = z.object({
  watchPath: FolderPathSchema.optional(),
  extensions: z
    .array(VideoFileExtensionSchema)
    .min(1, "Au moins une extension doit être spécifiée")
    .default(SUPPORTED_VIDEO_EXTENSIONS_ARRAY),
  debounceMs: z
    .number()
    .int()
    .min(100, "Le délai anti-rebond doit être d'au moins 100ms")
    .max(30000, "Le délai anti-rebond ne peut pas dépasser 30 secondes")
    .default(2000),
  recursive: z.boolean().default(true),
  ignoreInitial: z.boolean().default(true),
  ignored: z.array(z.union([z.string(), z.instanceof(RegExp)])).default([
    /(^|[/\\])\../, // Fichiers/dossiers cachés (.DS_Store, .tmp, etc.)
    /.*\.tmp$/, // Fichiers temporaires
    /.*\.temp$/,
    /.*\.swp$/, // Fichiers vim
    /.*~$/, // Fichiers backup
    /Thumbs\.db$/, // Windows thumbnails
    /Desktop\.ini$/, // Windows metadata
    /node_modules/, // Dossiers de dépendances
    /\.git/, // Dossiers git
  ]),
  awaitWriteFinish: z
    .object({
      stabilityThreshold: z.number().int().min(100).max(10000).default(1000),
      pollInterval: z.number().int().min(10).max(1000).default(100),
    })
    .default({
      stabilityThreshold: 1000,
      pollInterval: 100,
    }),
});

// Schéma pour valider les informations de recherche TMDB
export const TMDBSearchSchema = z.object({
  title: z
    .string()
    .min(1, "Le titre ne peut pas être vide")
    .max(200, "Le titre est trop long")
    .transform((title) => title.trim()),
  year: z
    .number()
    .int()
    .min(1888, "L'année doit être supérieure à 1888")
    .max(
      new Date().getFullYear() + 5,
      "L'année ne peut pas être trop éloignée dans le futur"
    )
    .optional(),
  language: z
    .string()
    .regex(
      /^[a-z]{2}(-[A-Z]{2})?$/,
      "Le format de langue doit être 'fr' ou 'fr-FR'"
    )
    .default("fr-FR"),
});

// Schéma pour valider les options d'indexation
export const IndexingOptionsSchema = z.object({
  forceReindex: z.boolean().default(false),
  skipExisting: z.boolean().default(true),
  tmdbApiKey: z
    .string()
    .min(1, "La clé API TMDB est requise")
    .regex(/^.{32}$/, "La clé API TMDB doit faire 32 caractères")
    .optional(),
  maxRetries: z
    .number()
    .int()
    .min(0, "Le nombre de tentatives doit être positif")
    .max(5, "Le nombre maximum de tentatives ne peut pas dépasser 5")
    .default(3),
  retryDelay: z
    .number()
    .int()
    .min(100, "Le délai entre tentatives doit être d'au moins 100ms")
    .max(10000, "Le délai entre tentatives ne peut pas dépasser 10 secondes")
    .default(1000),
});

// Schéma pour valider les informations d'un film parsé
export const ParsedMovieSchema = z.object({
  filename: MovieFilenameSchema,
  filepath: FilePathSchema,
  title: z
    .string()
    .min(1, "Le titre ne peut pas être vide")
    .max(200, "Le titre est trop long"),
  year: z
    .number()
    .int()
    .min(1888)
    .max(new Date().getFullYear() + 5)
    .optional(),
  resolution: z
    .string()
    .regex(
      /^\d{3,4}p$/,
      "Le format de résolution doit être comme '1080p' ou '720p'"
    )
    .optional(),
  codec: z
    .string()
    .regex(/^(h264|h265|x264|x265)$/, "Codec non reconnu")
    .optional(),
  container: z
    .string()
    .regex(/^(mp4|mkv|avi|mov)$/, "Format de conteneur non reconnu")
    .optional(),
  size: z.number().int().min(0, "La taille du fichier doit être positive"),
  lastModified: z.date(),
});

// ========================================================================
// VALIDATEURS AVANCÉS
// ========================================================================

/**
 * Valide qu'un chemin de dossier existe et est accessible
 */
export const validateFolderPath = async (
  folderPath: string
): Promise<string> => {
  const validatedPath = FolderPathSchema.parse(folderPath);

  try {
    const stats = await fs.promises.stat(validatedPath);
    if (!stats.isDirectory()) {
      throw new Error("Le chemin spécifié n'est pas un dossier");
    }

    // Vérifier les permissions de lecture
    await fs.promises.access(validatedPath, fs.constants.R_OK);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Dossier non accessible: ${error.message}`);
    }
    throw new Error("Erreur lors de la validation du dossier");
  }

  return validatedPath;
};

/**
 * Valide qu'un chemin de fichier existe et est accessible
 */
export const validateFilePath = async (filePath: string): Promise<string> => {
  const validatedPath = FilePathSchema.parse(filePath);

  try {
    const stats = await fs.promises.stat(validatedPath);
    if (!stats.isFile()) {
      throw new Error("Le chemin spécifié n'est pas un fichier");
    }

    // Vérifier les permissions de lecture
    await fs.promises.access(validatedPath, fs.constants.R_OK);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Fichier non accessible: ${error.message}`);
    }
    throw new Error("Erreur lors de la validation du fichier");
  }

  return validatedPath;
};

/**
 * Valide qu'un fichier est un fichier vidéo supporté
 */
export const validateVideoFile = async (
  filePath: string
): Promise<{
  path: string;
  extension: string;
  filename: string;
}> => {
  const validatedPath = await validateFilePath(filePath);
  const extension = path.extname(validatedPath).toLowerCase();
  const filename = path.basename(validatedPath, extension);

  // Valider l'extension
  VideoFileExtensionSchema.parse(extension);

  // Valider le nom du fichier
  MovieFilenameSchema.parse(filename);

  return {
    path: validatedPath,
    extension,
    filename: filename + extension,
  };
};

/**
 * Valide et nettoie un titre de film
 */
export const validateMovieTitle = (title: string): string => {
  return z
    .string()
    .min(1, "Le titre ne peut pas être vide")
    .max(200, "Le titre est trop long")
    .regex(/^[^<>:"/\\|?*]+$/, "Le titre contient des caractères interdits")
    .transform((t) => t.trim())
    .parse(title);
};

// ========================================================================
// SCHÉMAS POUR LES ROUTES API (existants)
// ========================================================================

// Schéma pour valider l'ID d'un film
export const movieIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

// Schéma pour valider les paramètres de requête des films
export const moviesQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default("1"),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default("20"),
  search: z.string().optional(),
  genre: z.string().optional(),
  sortBy: z
    .enum(["title", "releaseDate", "rating", "createdAt"])
    .optional()
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

// Schéma pour valider une demande de film
export const movieRequestSchema = z.object({
  title: z
    .string()
    .min(1, "Le titre est requis")
    .max(200, "Le titre est trop long"),
  comment: z.string().max(1000, "Le commentaire est trop long").optional(),
});

// ========================================================================
// TYPES INFÉRÉS
// ========================================================================

export type FolderPath = z.infer<typeof FolderPathSchema>;
export type FilePath = z.infer<typeof FilePathSchema>;
export type VideoFileExtension = z.infer<typeof VideoFileExtensionSchema>;
export type MovieFilename = z.infer<typeof MovieFilenameSchema>;
export type ScanOptions = z.infer<typeof ScanOptionsSchema>;
export type WatcherOptions = z.infer<typeof WatcherOptionsSchema>;
export type TMDBSearch = z.infer<typeof TMDBSearchSchema>;
export type IndexingOptions = z.infer<typeof IndexingOptionsSchema>;
export type ParsedMovie = z.infer<typeof ParsedMovieSchema>;

// Types pour les routes API
export type MovieIdParams = z.infer<typeof movieIdSchema>;
export type MoviesQuery = z.infer<typeof moviesQuerySchema>;
export type MovieRequestPayload = z.infer<typeof movieRequestSchema>;
