import { apiService } from "./apiService";

export interface Review {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  author: {
    id: number;
    name: string;
  };
}

export interface CreateReviewData {
  movieId: number;
  rating: number;
  comment: string;
}

export interface UpdateReviewData {
  rating: number;
  comment: string;
}

class ReviewService {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
  }

  async createReview(data: CreateReviewData): Promise<Review> {
    try {
      const response = await fetch(`${this.baseURL}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Erreur lors de la création de la critique"
        );
      }

      const result = await response.json();
      return result.data.review;
    } catch (error) {
      console.error("Erreur lors de la création de la critique:", error);
      throw error;
    }
  }

  async getMovieReviews(movieId: number): Promise<Review[]> {
    try {
      const response = await fetch(`${this.baseURL}/reviews/movie/${movieId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Erreur lors de la récupération des critiques"
        );
      }

      const result = await response.json();
      return result.data.reviews;
    } catch (error) {
      console.error("Erreur lors de la récupération des critiques:", error);
      throw error;
    }
  }

  async updateReview(
    reviewId: number,
    data: UpdateReviewData
  ): Promise<Review> {
    try {
      const response = await fetch(`${this.baseURL}/reviews/${reviewId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Erreur lors de la mise à jour de la critique"
        );
      }

      const result = await response.json();
      return result.data.review;
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la critique:", error);
      throw error;
    }
  }

  async deleteReview(reviewId: number): Promise<void> {
    try {
      const response = await fetch(`${this.baseURL}/reviews/${reviewId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Erreur lors de la suppression de la critique"
        );
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de la critique:", error);
      throw error;
    }
  }

  async getMovieAverageRating(movieId: number): Promise<number> {
    try {
      const response = await fetch(
        `${this.baseURL}/reviews/movie/${movieId}/average`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Erreur lors du calcul de la note moyenne"
        );
      }

      const result = await response.json();
      return result.data.averageRating;
    } catch (error) {
      console.error("Erreur lors du calcul de la note moyenne:", error);
      return 0;
    }
  }

  private getAuthToken(): string {
    // Récupérer le token depuis le localStorage ou un autre endroit
    return localStorage.getItem("authToken") || "";
  }
}

export const reviewService = new ReviewService();
