import { prisma } from "../utils/prisma.js";
import type { Review, User } from "@prisma/client";

// Utilisation des types Prisma pour éviter la duplication
type CreateReviewData = {
  movieId: number;
  authorId: number;
  rating: number;
  comment: string;
};

type ReviewWithAuthor = Review & {
  author: Pick<User, "id" | "name">;
};

export class ReviewService {
  async createReview(data: CreateReviewData): Promise<ReviewWithAuthor> {
    try {
      // Vérifier que le film existe
      const movie = await prisma.movie.findUnique({
        where: { id: data.movieId },
      });

      if (!movie) {
        throw new Error("Film non trouvé");
      }

      // Vérifier que l'utilisateur existe
      const user = await prisma.user.findUnique({
        where: { id: data.authorId },
      });

      if (!user) {
        throw new Error("Utilisateur non trouvé");
      }

      // Vérifier que l'utilisateur n'a pas déjà critiqué ce film
      const existingReview = await prisma.review.findUnique({
        where: {
          movieId_authorId: {
            movieId: data.movieId,
            authorId: data.authorId,
          },
        },
      });

      if (existingReview) {
        throw new Error("Vous avez déjà critiqué ce film");
      }

      // Créer la critique
      const review = await prisma.review.create({
        data: {
          movieId: data.movieId,
          authorId: data.authorId,
          rating: data.rating,
          comment: data.comment,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return review;
    } catch (error) {
      console.error("Erreur lors de la création de la critique:", error);
      throw error;
    }
  }

  async getMovieReviews(movieId: number): Promise<ReviewWithAuthor[]> {
    try {
      const reviews = await prisma.review.findMany({
        where: { movieId },
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return reviews;
    } catch (error) {
      console.error("Erreur lors de la récupération des critiques:", error);
      throw error;
    }
  }

  async updateReview(
    reviewId: number,
    authorId: number,
    data: { rating: number; comment: string }
  ): Promise<ReviewWithAuthor> {
    try {
      // Vérifier que la critique existe et appartient à l'utilisateur
      const existingReview = await prisma.review.findFirst({
        where: {
          id: reviewId,
          authorId: authorId,
        },
      });

      if (!existingReview) {
        throw new Error("Critique non trouvée ou non autorisée");
      }

      // Mettre à jour la critique
      const review = await prisma.review.update({
        where: { id: reviewId },
        data: {
          rating: data.rating,
          comment: data.comment,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return review;
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la critique:", error);
      throw error;
    }
  }

  async deleteReview(reviewId: number, authorId: number): Promise<void> {
    try {
      // Vérifier que la critique existe et appartient à l'utilisateur
      const existingReview = await prisma.review.findFirst({
        where: {
          id: reviewId,
          authorId: authorId,
        },
      });

      if (!existingReview) {
        throw new Error("Critique non trouvée ou non autorisée");
      }

      // Supprimer la critique
      await prisma.review.delete({
        where: { id: reviewId },
      });
    } catch (error) {
      console.error("Erreur lors de la suppression de la critique:", error);
      throw error;
    }
  }

  async getMovieAverageRating(movieId: number): Promise<number> {
    try {
      const result = await prisma.review.aggregate({
        where: { movieId },
        _avg: { rating: true },
        _count: true,
      });

      return result._avg.rating || 0;
    } catch (error) {
      console.error("Erreur lors du calcul de la note moyenne:", error);
      return 0;
    }
  }
}

export const reviewService = new ReviewService();
