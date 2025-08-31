import fs from "fs-extra";
import path from "path";

export class SubtitleService {
  private subtitleExtensions = [".srt", ".sub", ".vtt", ".ass", ".ssa"];

  /**
   * Convertit un fichier SRT en format WebVTT
   */
  async convertSrtToVtt(srtPath: string): Promise<string> {
    try {
      const srtContent = await fs.readFile(srtPath, "utf-8");
      return this.parseSrtToVtt(srtContent);
    } catch (error) {
      console.error(`Erreur lors de la conversion SRT vers VTT: ${error}`);
      throw error;
    }
  }

  /**
   * Parse le contenu SRT et le convertit en VTT
   */
  private parseSrtToVtt(srtContent: string): string {
    // Supprimer les BOM et normaliser les retours à la ligne
    let content = srtContent
      .replace(/^\uFEFF/, "")
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n");

    // Ajouter l'en-tête WebVTT
    let vttContent = "WEBVTT\n\n";

    // Diviser en blocs de sous-titres
    const blocks = content.split(/\n\n+/);

    blocks.forEach((block) => {
      const lines = block.trim().split("\n");
      if (lines.length >= 3) {
        // Ignorer le numéro de séquence
        const timeLine = lines[1];
        const textLines = lines.slice(2);

        // Convertir le format de temps SRT vers VTT
        const vttTime = this.convertSrtTimeToVtt(timeLine);

        if (vttTime) {
          vttContent += `${vttTime}\n`;
          vttContent += textLines.join("\n") + "\n\n";
        }
      }
    });

    return vttContent;
  }

  /**
   * Convertit le format de temps SRT (00:00:00,000) vers VTT (00:00:00.000)
   */
  private convertSrtTimeToVtt(srtTime: string): string | null {
    // Format SRT: 00:00:00,000 --> 00:00:00,000
    const match = srtTime.match(
      /(\d{2}:\d{2}:\d{2}),(\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}),(\d{3})/
    );

    if (match) {
      const [, startTime, startMs, endTime, endMs] = match;
      // Remplacer la virgule par un point pour VTT
      return `${startTime}.${startMs} --> ${endTime}.${endMs}`;
    }

    return null;
  }

  /**
   * Détecte et analyse les fichiers de sous-titres dans un dossier
   */
  async detectSubtitleFiles(moviePath: string): Promise<
    Array<{
      path: string;
      filename: string;
      language: string;
      size: number;
      format: string;
    }>
  > {
    try {
      const movieDir = path.dirname(moviePath);
      const files = await fs.readdir(movieDir);

      const subtitleFiles = [];

      for (const file of files) {
        const filePath = path.join(movieDir, file);
        const ext = path.extname(file).toLowerCase();

        if (this.subtitleExtensions.includes(ext)) {
          const stats = await fs.stat(filePath);
          const language = await this.detectLanguageFromFilename(
            file,
            filePath
          );

          subtitleFiles.push({
            path: filePath,
            filename: file,
            language,
            size: stats.size,
            format: ext,
          });
        }
      }

      return subtitleFiles;
    } catch (error) {
      console.error(`Erreur lors de la détection des sous-titres: ${error}`);
      return [];
    }
  }

  /**
   * Détecte la langue à partir du nom de fichier et du contenu
   */
  private async detectLanguageFromFilename(
    filename: string,
    filePath?: string
  ): Promise<string> {
    const lowerFilename = filename.toLowerCase();

    // Détection basique des langues courantes dans le nom de fichier
    if (
      lowerFilename.includes(".fr.") ||
      lowerFilename.includes(".français") ||
      lowerFilename.includes(".french")
    ) {
      return "Français";
    } else if (
      lowerFilename.includes(".en.") ||
      lowerFilename.includes(".english") ||
      lowerFilename.includes(".eng")
    ) {
      return "English";
    } else if (
      lowerFilename.includes(".es.") ||
      lowerFilename.includes(".spanish") ||
      lowerFilename.includes(".esp")
    ) {
      return "Español";
    } else if (
      lowerFilename.includes(".de.") ||
      lowerFilename.includes(".german") ||
      lowerFilename.includes(".deu")
    ) {
      return "Deutsch";
    } else if (
      lowerFilename.includes(".it.") ||
      lowerFilename.includes(".italian") ||
      lowerFilename.includes(".ita")
    ) {
      return "Italiano";
    } else if (
      lowerFilename.includes(".pt.") ||
      lowerFilename.includes(".portuguese") ||
      lowerFilename.includes(".por")
    ) {
      return "Português";
    } else if (
      lowerFilename.includes(".ru.") ||
      lowerFilename.includes(".russian") ||
      lowerFilename.includes(".rus")
    ) {
      return "Русский";
    } else if (
      lowerFilename.includes(".ja.") ||
      lowerFilename.includes(".japanese") ||
      lowerFilename.includes(".jpn")
    ) {
      return "日本語";
    } else if (
      lowerFilename.includes(".ko.") ||
      lowerFilename.includes(".korean") ||
      lowerFilename.includes(".kor")
    ) {
      return "한국어";
    } else if (
      lowerFilename.includes(".zh.") ||
      lowerFilename.includes(".chinese") ||
      lowerFilename.includes(".chi")
    ) {
      return "中文";
    }

    // Si pas de langue détectée dans le nom, analyser le contenu
    if (filePath) {
      try {
        const content = await fs.readFile(filePath, "utf-8");
        const sampleText = content
          .split("\n")
          .slice(0, 20)
          .join(" ")
          .toLowerCase();

        // Détection basique basée sur le contenu
        if (
          sampleText.includes("the ") &&
          sampleText.includes(" and ") &&
          sampleText.includes(" of ")
        ) {
          return "English";
        } else if (
          sampleText.includes("le ") &&
          sampleText.includes(" et ") &&
          sampleText.includes(" de ")
        ) {
          return "Français";
        } else if (
          sampleText.includes("el ") &&
          sampleText.includes(" y ") &&
          sampleText.includes(" de ")
        ) {
          return "Español";
        } else if (
          sampleText.includes("der ") &&
          sampleText.includes(" und ") &&
          sampleText.includes(" von ")
        ) {
          return "Deutsch";
        } else if (
          sampleText.includes("il ") &&
          sampleText.includes(" e ") &&
          sampleText.includes(" di ")
        ) {
          return "Italiano";
        }
      } catch (error) {
        console.error(
          "Erreur lors de l'analyse du contenu pour la détection de langue:",
          error
        );
      }
    }

    // Par défaut, essayer de détecter l'anglais (langue la plus courante)
    return "English";
  }
}
