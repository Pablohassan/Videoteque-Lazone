import { describe, it, expect, beforeEach } from "vitest";
import {
  validateFolderPath,
  validateFilePath,
  validateVideoFile,
  validateMovieTitle,
  FolderPathSchema,
  FilePathSchema,
  VideoFileExtensionSchema,
  MovieFilenameSchema,
  ScanOptionsSchema,
  WatcherOptionsSchema,
  TMDBSearchSchema,
  IndexingOptionsSchema,
  ParsedMovieSchema,
} from "../schemas/movies.js";
import {
  createMovieFolderNotFoundError,
  createMovieFolderNotAccessibleError,
  createInvalidFileExtensionError,
  createFileNotAccessibleError,
  createMovieParsingError,
  createMovieAlreadyExistsError,
  createTMDBApiError,
  createTMDBMovieNotFoundError,
  createWatcherStartFailedError,
  createWatcherStopFailedError,
  createWatcherAlreadyRunningError,
  createWatcherNotRunningError,
} from "../utils/errors.js";
import fs from "fs";
import path from "path";

// Mock fs pour les tests
import { vi } from "vitest";

vi.mock("fs", () => ({
  default: {
    promises: {
      stat: vi.fn(),
      access: vi.fn(),
    },
  },
}));

const mockFs = fs as unknown as {
  promises: {
    stat: ReturnType<typeof vi.fn>;
    access: ReturnType<typeof vi.fn>;
  };
};

describe("Validation des schémas Zod", () => {
  describe("FolderPathSchema", () => {
    it("valide un chemin de dossier correct", () => {
      const validPath = "movies/action";
      const result = FolderPathSchema.safeParse(validPath);
      expect(result.success).toBe(true);
      expect(result.data).toBe(validPath);
    });

    it("rejette un chemin avec '..'", () => {
      const invalidPath = "../movies";
      const result = FolderPathSchema.safeParse(invalidPath);
      expect(result.success).toBe(false);
    });

    it("rejette un chemin absolu", () => {
      const invalidPath = "/absolute/path";
      const result = FolderPathSchema.safeParse(invalidPath);
      expect(result.success).toBe(false);
    });

    it("rejette un chemin trop long", () => {
      const longPath = "a".repeat(261);
      const result = FolderPathSchema.safeParse(longPath);
      expect(result.success).toBe(false);
    });
  });

  describe("VideoFileExtensionSchema", () => {
    it("valide une extension supportée", () => {
      const validExt = ".mp4";
      const result = VideoFileExtensionSchema.safeParse(validExt);
      expect(result.success).toBe(true);
      expect(result.data).toBe(".mp4");
    });

    it("convertit automatiquement en minuscules", () => {
      const upperExt = ".MP4";
      const result = VideoFileExtensionSchema.safeParse(upperExt);
      expect(result.success).toBe(true);
      expect(result.data).toBe(".mp4");
    });

    it("rejette une extension non supportée", () => {
      const invalidExt = ".exe";
      const result = VideoFileExtensionSchema.safeParse(invalidExt);
      expect(result.success).toBe(false);
    });
  });

  describe("MovieFilenameSchema", () => {
    it("valide un nom de fichier correct", () => {
      const validName = "The.Matrix.1999.1080p.mp4";
      const result = MovieFilenameSchema.safeParse(validName);
      expect(result.success).toBe(true);
    });

    it("rejette un nom vide", () => {
      const result = MovieFilenameSchema.safeParse("");
      expect(result.success).toBe(false);
    });

    it("rejette un nom avec caractères interdits", () => {
      const invalidName = "Film<>|?*.mp4";
      const result = MovieFilenameSchema.safeParse(invalidName);
      expect(result.success).toBe(false);
    });
  });

  describe("ScanOptionsSchema", () => {
    it("valide des options de scan complètes", () => {
      const options = {
        folderPath: "movies",
        recursive: true,
        extensions: [".mp4", ".mkv"],
        maxFiles: 100,
        excludePatterns: ["sample", "trailer"],
      };
      const result = ScanOptionsSchema.safeParse(options);
      expect(result.success).toBe(true);
    });

    it("utilise les valeurs par défaut", () => {
      const options = {};
      const result = ScanOptionsSchema.safeParse(options);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.recursive).toBe(true);
        expect(result.data.extensions).toContain(".mp4");
      }
    });
  });

  describe("WatcherOptionsSchema", () => {
    it("valide des options de surveillance", () => {
      const options = {
        watchPath: "movies",
        extensions: [".mp4", ".mkv"],
        debounceMs: 2000,
        recursive: true,
        awaitWriteFinish: {
          stabilityThreshold: 1000,
          pollInterval: 100,
        },
      };
      const result = WatcherOptionsSchema.safeParse(options);
      expect(result.success).toBe(true);
    });
  });

  describe("TMDBSearchSchema", () => {
    it("valide une recherche TMDB complète", () => {
      const search = {
        title: "The Matrix",
        year: 1999,
        language: "fr-FR",
      };
      const result = TMDBSearchSchema.safeParse(search);
      expect(result.success).toBe(true);
    });

    it("rejette un titre vide", () => {
      const search = { title: "" };
      const result = TMDBSearchSchema.safeParse(search);
      expect(result.success).toBe(false);
    });

    it("rejette une année trop ancienne", () => {
      const search = { title: "Film", year: 1800 };
      const result = TMDBSearchSchema.safeParse(search);
      expect(result.success).toBe(false);
    });
  });
});

describe("Fonctions de validation avancées", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateFolderPath", () => {
    it("valide un dossier existant accessible", async () => {
      mockFs.promises.stat.mockResolvedValue({ isDirectory: () => true });
      mockFs.promises.access.mockResolvedValue(undefined);

      const result = await validateFolderPath("movies");
      expect(result).toBe("movies");
    });

    it("rejette un dossier inexistant", async () => {
      mockFs.promises.stat.mockRejectedValue(new Error("ENOENT"));

      await expect(validateFolderPath("nonexistent")).rejects.toThrow(
        "non accessible"
      );
    });

    it("rejette un fichier au lieu d'un dossier", async () => {
      mockFs.promises.stat.mockResolvedValue({ isDirectory: () => false });

      await expect(validateFolderPath("file.txt")).rejects.toThrow(
        "n'est pas un dossier"
      );
    });
  });

  describe("validateFilePath", () => {
    it("valide un fichier existant accessible", async () => {
      mockFs.promises.stat.mockResolvedValue({ isFile: () => true });
      mockFs.promises.access.mockResolvedValue(undefined);

      const result = await validateFilePath("movie.mp4");
      expect(result).toBe("movie.mp4");
    });
  });

  describe("validateVideoFile", () => {
    it("valide un fichier vidéo complet", async () => {
      mockFs.promises.stat.mockResolvedValue({ isFile: () => true });
      mockFs.promises.access.mockResolvedValue(undefined);

      const result = await validateVideoFile("The.Matrix.1999.mp4");
      expect(result.path).toBe("The.Matrix.1999.mp4");
      expect(result.extension).toBe(".mp4");
      expect(result.filename).toBe("The.Matrix.1999.mp4");
    });
  });

  describe("validateMovieTitle", () => {
    it("valide et nettoie un titre", () => {
      const title = "  The Matrix  ";
      const result = validateMovieTitle(title);
      expect(result).toBe("The Matrix");
    });

    it("rejette un titre vide", () => {
      expect(() => validateMovieTitle("")).toThrow();
    });

    it("rejette un titre avec caractères interdits", () => {
      expect(() => validateMovieTitle("Film<>|?*")).toThrow();
    });
  });
});

describe("Classes d'erreurs personnalisées", () => {
  describe("Erreurs de films", () => {
    it("crée une erreur de dossier non trouvé", () => {
      const error = createMovieFolderNotFoundError("movies");
      expect(error.code).toBe("MOVIE_FOLDER_NOT_FOUND");
      expect(error.message).toContain("movies");
      expect(error.statusCode).toBe(404);
      expect(error.details).toEqual({ folderPath: "movies" });
    });

    it("crée une erreur de film déjà existant", () => {
      const error = createMovieAlreadyExistsError("The Matrix", 1999);
      expect(error.code).toBe("MOVIE_ALREADY_EXISTS");
      expect(error.message).toContain("The Matrix");
      expect(error.message).toContain("1999");
      expect(error.statusCode).toBe(409);
    });

    it("crée une erreur TMDB", () => {
      const cause = new Error("API timeout");
      const error = createTMDBApiError(cause);
      expect(error.code).toBe("TMDB_API_ERROR");
      expect(error.statusCode).toBe(502);
      expect(error.cause).toBe(cause);
    });
  });

  describe("Erreurs de surveillance", () => {
    it("crée une erreur de watcher déjà en cours", () => {
      const error = createWatcherAlreadyRunningError();
      expect(error.code).toBe("WATCHER_ALREADY_RUNNING");
      expect(error.statusCode).toBe(409);
    });

    it("crée une erreur de watcher non démarré", () => {
      const error = createWatcherNotRunningError();
      expect(error.code).toBe("WATCHER_NOT_RUNNING");
      expect(error.statusCode).toBe(400);
    });
  });

  describe("Erreurs de fichiers", () => {
    it("crée une erreur d'extension invalide", () => {
      const error = createInvalidFileExtensionError(".exe", [".mp4", ".mkv"]);
      expect(error.code).toBe("INVALID_FILE_EXTENSION");
      expect(error.details).toEqual({
        extension: ".exe",
        supportedExtensions: [".mp4", ".mkv"],
      });
    });

    it("crée une erreur de fichier non accessible", () => {
      const error = createFileNotAccessibleError("movie.mp4");
      expect(error.code).toBe("FILE_NOT_ACCESSIBLE");
      expect(error.details).toEqual({ filePath: "movie.mp4" });
    });
  });
});

describe("ParsedMovieSchema", () => {
  it("valide un film parsé complet", () => {
    const movie = {
      filename: "The.Matrix.1999.1080p.mp4",
      filepath: "movies/The.Matrix.1999.1080p.mp4",
      title: "The Matrix",
      year: 1999,
      resolution: "1080p",
      codec: "h264",
      container: "mp4",
      size: 1000000000,
      lastModified: new Date(),
    };
    const result = ParsedMovieSchema.safeParse(movie);
    expect(result.success).toBe(true);
  });

  it("rejette un film sans titre", () => {
    const movie = {
      filename: "movie.mp4",
      filepath: "movies/movie.mp4",
      title: "",
      size: 1000000,
      lastModified: new Date(),
    };
    const result = ParsedMovieSchema.safeParse(movie);
    expect(result.success).toBe(false);
  });
});
