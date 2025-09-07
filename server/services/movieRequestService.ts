import { prisma } from "../utils/prisma.js";
import { emailService } from "./emailService.js";

export interface CreateMovieRequestData {
  title: string;
  comment?: string;
  userId: number;
}

export interface UpdateMovieRequestData {
  title?: string;
  status?: "pending" | "processing" | "available";
  comment?: string;
}

type MovieRequestWithUser = {
  id: number;
  title: string;
  comment: string | null;
  status: string;
  requestedAt: Date;
  updatedAt: Date;
  userId: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
};

export class MovieRequestService {
  // Créer une nouvelle demande de film
  async createRequest(
    data: CreateMovieRequestData
  ): Promise<MovieRequestWithUser> {
    const request = await prisma.movieRequest.create({
      data: {
        title: data.title,
        comment: data.comment,
        userId: data.userId,
        status: "pending",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Envoyer un email à l'admin (asynchrone pour ne pas bloquer la réponse)
    this.sendAdminNotification(request).catch((error) => {
      console.error("Erreur lors de l'envoi de l'email à l'admin:", error);
      // Ne pas échouer la création de la demande si l'email échoue
    });

    return request;
  }

  // Envoyer une notification email à l'admin
  private async sendAdminNotification(
    request: MovieRequestWithUser
  ): Promise<void> {
    const adminEmail = "sesmanovic@gmail.com";
    const subject = `🎬 Nouvelle demande de film: ${request.title}`;
    const html = this.generateAdminNotificationTemplate(request);
    const text = this.generateAdminNotificationText(request);

    await emailService.sendEmail(adminEmail, subject, html, text);
  }

  // Générer le template HTML pour la notification admin
  private generateAdminNotificationTemplate(
    request: MovieRequestWithUser
  ): string {
    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nouvelle demande de film</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #e74c3c; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
          .movie-info { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #e74c3c; }
          .user-info { background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 15px 0; }
          .status { display: inline-block; padding: 5px 10px; background: #f39c12; color: white; border-radius: 3px; font-size: 12px; }
          .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎬 Nouvelle demande de film</h1>
          <p>Un utilisateur a demandé un nouveau film</p>
        </div>

        <div class="content">
          <div class="movie-info">
            <h2>${request.title}</h2>
            ${
              request.comment
                ? `<p><strong>Commentaire:</strong> ${request.comment}</p>`
                : ""
            }
            <p><strong>Date de demande:</strong> ${new Date(
              request.requestedAt
            ).toLocaleString("fr-FR")}</p>
            <p><strong>Statut:</strong> <span class="status">${request.status.toUpperCase()}</span></p>
          </div>

          <div class="user-info">
            <h3>Informations de l'utilisateur</h3>
            <p><strong>Nom:</strong> ${request.user.name}</p>
            <p><strong>Email:</strong> ${request.user.email}</p>
            <p><strong>ID utilisateur:</strong> ${request.user.id}</p>
          </div>

          <p>Vous pouvez gérer cette demande depuis l'interface d'administration de CineScan Connect.</p>
        </div>

        <div class="footer">
          <p>Cet email a été envoyé automatiquement par CineScan Connect</p>
        </div>
      </body>
      </html>
    `;
  }

  // Générer la version texte de la notification admin
  private generateAdminNotificationText(request: MovieRequestWithUser): string {
    return `
🎬 Nouvelle demande de film

Titre: ${request.title}
${request.comment ? `Commentaire: ${request.comment}` : ""}
Date de demande: ${new Date(request.requestedAt).toLocaleString("fr-FR")}
Statut: ${request.status.toUpperCase()}

Utilisateur:
- Nom: ${request.user.name}
- Email: ${request.user.email}
- ID: ${request.user.id}

Vous pouvez gérer cette demande depuis l'interface d'administration.

Cet email a été envoyé automatiquement par CineScan Connect
    `.trim();
  }

  // Obtenir toutes les demandes d'un utilisateur
  async getUserRequests(userId: number): Promise<MovieRequestWithUser[]> {
    return await prisma.movieRequest.findMany({
      where: { userId },
      orderBy: { requestedAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  // Obtenir toutes les demandes (pour les admins)
  async getAllRequests(): Promise<MovieRequestWithUser[]> {
    return await prisma.movieRequest.findMany({
      orderBy: { requestedAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  // Obtenir une demande par ID
  async getRequestById(id: number): Promise<MovieRequestWithUser | null> {
    return await prisma.movieRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  // Mettre à jour le statut d'une demande
  async updateRequestStatus(
    id: number,
    status: "pending" | "processing" | "available"
  ): Promise<MovieRequestWithUser> {
    return await prisma.movieRequest.update({
      where: { id },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  // Mettre à jour une demande
  async updateRequest(
    id: number,
    data: UpdateMovieRequestData
  ): Promise<MovieRequestWithUser> {
    return await prisma.movieRequest.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  // Supprimer une demande
  async deleteRequest(
    id: number
  ): Promise<Awaited<ReturnType<typeof prisma.movieRequest.delete>>> {
    return await prisma.movieRequest.delete({
      where: { id },
    });
  }

  // Obtenir les statistiques des demandes
  async getRequestStats() {
    const [pending, processing, available, total] = await Promise.all([
      prisma.movieRequest.count({ where: { status: "pending" } }),
      prisma.movieRequest.count({ where: { status: "processing" } }),
      prisma.movieRequest.count({ where: { status: "available" } }),
      prisma.movieRequest.count(),
    ]);

    return {
      pending,
      processing,
      available,
      total,
    };
  }
}

export const movieRequestService = new MovieRequestService();
