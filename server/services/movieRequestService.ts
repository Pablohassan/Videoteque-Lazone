import { prisma } from "../utils/prisma.js";
import type { MovieRequest } from "@prisma/client";

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

export class MovieRequestService {
  // Créer une nouvelle demande de film
  async createRequest(data: CreateMovieRequestData): Promise<MovieRequest> {
    return await prisma.movieRequest.create({
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
  }

  // Obtenir toutes les demandes d'un utilisateur
  async getUserRequests(userId: number): Promise<MovieRequest[]> {
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
  async getAllRequests(): Promise<MovieRequest[]> {
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
  async getRequestById(id: number): Promise<MovieRequest | null> {
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
  ): Promise<MovieRequest> {
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
  ): Promise<MovieRequest> {
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
  async deleteRequest(id: number): Promise<MovieRequest> {
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
