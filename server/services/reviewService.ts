import { prisma } from "../utils/prisma.js";
import { CreateReviewRequest } from "../types/index.js";

export class ReviewService {
  async createReview(
    movieId: number,
    authorId: number,
    data: CreateReviewRequest
  ) {
    // Vérifier si l'utilisateur a déjà une critique pour ce film
    const existingReview = await prisma.review.findUnique({
      where: {
        movieId_authorId: {
          movieId,
          authorId,
        },
      },
    });

    if (existingReview) {
      throw new Error("Vous avez déjà écrit une critique pour ce film");
    }

    // Vérifier que le film existe
    const movie = await prisma.movie.findUnique({
      where: { id: movieId },
    });

    if (!movie) {
      throw new Error("Film non trouvé");
    }

    // Créer la critique
    const review = await prisma.review.create({
      data: {
        rating: data.rating,
        comment: data.comment,
        movieId,
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        movie: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return review;
  }

  async getReviewsByMovie(
    movieId: number,
    options: { page?: number; limit?: number } = {}
  ) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { movieId },
        include: {
          author: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.review.count({
        where: { movieId },
      }),
    ]);

    return {
      reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }

  async getReviewsByUser(
    authorId: number,
    options: { page?: number; limit?: number } = {}
  ) {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { authorId },
        include: {
          movie: {
            select: {
              id: true,
              title: true,
              posterUrl: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.review.count({
        where: { authorId },
      }),
    ]);

    return {
      reviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    };
  }

  async updateReview(
    reviewId: number,
    authorId: number,
    data: CreateReviewRequest
  ) {
    // Vérifier que la critique existe et appartient à l'utilisateur
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      throw new Error("Critique non trouvée");
    }

    if (existingReview.authorId !== authorId) {
      throw new Error("Non autorisé à modifier cette critique");
    }

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
        movie: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return review;
  }

  async deleteReview(reviewId: number, authorId: number) {
    // Vérifier que la critique existe et appartient à l'utilisateur
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!existingReview) {
      throw new Error("Critique non trouvée");
    }

    if (existingReview.authorId !== authorId) {
      throw new Error("Non autorisé à supprimer cette critique");
    }

    await prisma.review.delete({
      where: { id: reviewId },
    });

    return { success: true, message: "Critique supprimée avec succès" };
  }

  async getReviewById(reviewId: number) {
    return await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        movie: {
          select: {
            id: true,
            title: true,
            posterUrl: true,
          },
        },
      },
    });
  }

  async getMovieAverageRating(movieId: number) {
    const result = await prisma.review.aggregate({
      where: { movieId },
      _avg: {
        rating: true,
      },
      _count: {
        rating: true,
      },
    });

    return {
      averageRating: result._avg.rating || 0,
      reviewCount: result._count.rating || 0,
    };
  }
}

export const reviewService = new ReviewService();
