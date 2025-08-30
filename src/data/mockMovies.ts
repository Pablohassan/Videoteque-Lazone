export interface Movie {
  id: number;
  title: string;
  synopsis: string;
  posterUrl: string;
  trailerUrl?: string;
  releaseDate: string;
  duration: number;
  rating: number;
  releaseYear: number;
  genres: string[];
  actors: string[];
  isWeeklySuggestion?: boolean;
}

export const mockMovies: Movie[] = [
  {
    id: 1,
    title: "Interstellar",
    synopsis: "Un groupe d'explorateurs utilise une faille récemment découverte dans l'espace-temps pour dépasser les limites humaines et partir à la conquête des distances astronomiques dans un voyage interstellaire.",
    posterUrl: "https://image.tmdb.org/t/p/w500/nBNZadXqJSdt05SHLqgT0HuC5Gm.jpg",
    trailerUrl: "https://www.youtube.com/watch?v=zSWdZVtXT7E",
    releaseDate: "2014-11-07",
    duration: 169,
    rating: 4.5,
    releaseYear: 2014,
    genres: ["Science-Fiction", "Drame", "Aventure"],
    actors: ["Matthew McConaughey", "Anne Hathaway", "Jessica Chastain"],
    isWeeklySuggestion: true
  },
  {
    id: 2,
    title: "The Dark Knight",
    synopsis: "Batman lève le niveau dans sa guerre contre le crime à Gotham City avec l'aide du lieutenant Jim Gordon et du procureur Harvey Dent. Mais ils vont bientôt être pris dans un triangle de chaos déclenché par un criminel machiavélique connu sous le nom du Joker.",
    posterUrl: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
    trailerUrl: "https://www.youtube.com/watch?v=EXeTwQWrcwY",
    releaseDate: "2008-07-18",
    duration: 152,
    rating: 4.8,
    releaseYear: 2008,
    genres: ["Action", "Crime", "Drame"],
    actors: ["Christian Bale", "Heath Ledger", "Aaron Eckhart"],
    isWeeklySuggestion: true
  },
  {
    id: 3,
    title: "Inception",
    synopsis: "Dom Cobb est un voleur expérimenté dans l'art dangereux de l'extraction, voler les secrets les plus profonds du subconscient pendant que l'esprit est vulnérable durant le rêve.",
    posterUrl: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
    trailerUrl: "https://www.youtube.com/watch?v=YoHD9XEInc0",
    releaseDate: "2010-07-16",
    duration: 148,
    rating: 4.7,
    releaseYear: 2010,
    genres: ["Action", "Science-Fiction", "Thriller"],
    actors: ["Leonardo DiCaprio", "Marion Cotillard", "Tom Hardy"],
    isWeeklySuggestion: true
  },
  {
    id: 4,
    title: "Pulp Fiction",
    synopsis: "L'odyssée sanglante et burlesque de petits malfrats dans la jungle de Hollywood à travers trois histoires qui s'entremêlent.",
    posterUrl: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
    releaseDate: "1994-10-14",
    duration: 154,
    rating: 4.6,
    releaseYear: 1994,
    genres: ["Crime", "Drame"],
    actors: ["John Travolta", "Samuel L. Jackson", "Uma Thurman"]
  },
  {
    id: 5,
    title: "The Matrix",
    synopsis: "Un pirate informatique découvre que la réalité telle qu'il la connaît n'est qu'une simulation contrôlée par une intelligence artificielle.",
    posterUrl: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    releaseDate: "1999-03-31",
    duration: 136,
    rating: 4.4,
    releaseYear: 1999,
    genres: ["Action", "Science-Fiction"],
    actors: ["Keanu Reeves", "Laurence Fishburne", "Carrie-Anne Moss"]
  },
  {
    id: 6,
    title: "Forrest Gump",
    synopsis: "Les aventures d'un homme au grand cœur mais à l'intelligence limitée qui traverse plusieurs décennies de l'histoire américaine.",
    posterUrl: "https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
    releaseDate: "1994-07-06",
    duration: 142,
    rating: 4.3,
    releaseYear: 1994,
    genres: ["Drame", "Romance"],
    actors: ["Tom Hanks", "Robin Wright", "Gary Sinise"]
  },
  {
    id: 7,
    title: "The Godfather",
    synopsis: "Le patriarche d'une dynastie du crime organisé transfère le contrôle de son empire clandestin à son fils réticent.",
    posterUrl: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
    releaseDate: "1972-03-24",
    duration: 175,
    rating: 4.9,
    releaseYear: 1972,
    genres: ["Crime", "Drame"],
    actors: ["Marlon Brando", "Al Pacino", "James Caan"]
  },
  {
    id: 8,
    title: "Titanic",
    synopsis: "Une romance de dix-sept ans entre un aristocrate de première classe et un artiste de troisième classe à bord du RMS Titanic.",
    posterUrl: "https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg",
    releaseDate: "1997-12-19",
    duration: 194,
    rating: 4.2,
    releaseYear: 1997,
    genres: ["Romance", "Drame"],
    actors: ["Leonardo DiCaprio", "Kate Winslet", "Billy Zane"]
  }
];

export const genres = [
  "Action", "Aventure", "Comédie", "Crime", "Drame", 
  "Fantastique", "Horreur", "Romance", "Science-Fiction", "Thriller"
];