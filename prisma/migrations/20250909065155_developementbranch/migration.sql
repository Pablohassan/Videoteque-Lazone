-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."RegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "role" "public"."UserRole" NOT NULL DEFAULT 'USER',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admin_actions" (
    "id" SERIAL NOT NULL,
    "action" TEXT NOT NULL,
    "targetUserId" INTEGER,
    "details" TEXT,
    "adminId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."movies" (
    "id" SERIAL NOT NULL,
    "tmdbId" INTEGER,
    "title" TEXT NOT NULL,
    "synopsis" TEXT NOT NULL,
    "posterUrl" TEXT NOT NULL,
    "trailerUrl" TEXT,
    "releaseDate" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "rating" DOUBLE PRECISION,
    "isWeeklySuggestion" BOOLEAN NOT NULL DEFAULT false,
    "localPath" TEXT,
    "filename" TEXT,
    "resolution" TEXT,
    "codec" TEXT,
    "container" TEXT,
    "lastScanned" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "fileSize" BIGINT,

    CONSTRAINT "movies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."genres" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "genres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."actors" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "profileUrl" TEXT,

    CONSTRAINT "actors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."movie_genres" (
    "movieId" INTEGER NOT NULL,
    "genreId" INTEGER NOT NULL,

    CONSTRAINT "movie_genres_pkey" PRIMARY KEY ("movieId","genreId")
);

-- CreateTable
CREATE TABLE "public"."movie_actors" (
    "movieId" INTEGER NOT NULL,
    "actorId" INTEGER NOT NULL,
    "character" TEXT,

    CONSTRAINT "movie_actors_pkey" PRIMARY KEY ("movieId","actorId")
);

-- CreateTable
CREATE TABLE "public"."reviews" (
    "id" SERIAL NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "comment" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "movieId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."movie_requests" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "comment" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "movie_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_registration_requests" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "public"."RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "adminNotes" TEXT,
    "adminId" INTEGER,

    CONSTRAINT "user_registration_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "movies_tmdbId_key" ON "public"."movies"("tmdbId");

-- CreateIndex
CREATE UNIQUE INDEX "genres_name_key" ON "public"."genres"("name");

-- CreateIndex
CREATE UNIQUE INDEX "actors_name_key" ON "public"."actors"("name");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_movieId_authorId_key" ON "public"."reviews"("movieId", "authorId");

-- AddForeignKey
ALTER TABLE "public"."admin_actions" ADD CONSTRAINT "admin_actions_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."movie_genres" ADD CONSTRAINT "movie_genres_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "public"."genres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."movie_genres" ADD CONSTRAINT "movie_genres_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "public"."movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."movie_actors" ADD CONSTRAINT "movie_actors_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "public"."actors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."movie_actors" ADD CONSTRAINT "movie_actors_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "public"."movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reviews" ADD CONSTRAINT "reviews_movieId_fkey" FOREIGN KEY ("movieId") REFERENCES "public"."movies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."movie_requests" ADD CONSTRAINT "movie_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_registration_requests" ADD CONSTRAINT "user_registration_requests_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
