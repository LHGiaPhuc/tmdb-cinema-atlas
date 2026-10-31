import argparse
import csv
import hashlib
import json
from datetime import date
from pathlib import Path


def positive(value):
    number = float(value) if value else 0
    return number if number > 0 else None


def read_movies(path):
    movies = []
    seen = set()
    with path.open(encoding="utf-8", newline="") as handle:
        for row in csv.DictReader(handle):
            movie_id = int(row["id"])
            if movie_id in seen:
                raise ValueError(f"Duplicate movie ID: {movie_id}")
            seen.add(movie_id)
            release = row["release_date"] or None
            if release:
                date.fromisoformat(release)
            votes = int(row["vote_count"])
            rating = float(row["vote_average"]) if votes > 0 else None
            if rating is not None and not 0 <= rating <= 10:
                raise ValueError(f"Invalid rating: {movie_id}")
            movies.append({
                "id": movie_id, "title": row["title"],
                "year": int(release[:4]) if release else None,
                "releaseDate": release, "language": row["original_language"],
                "genres": [item["name"] for item in json.loads(row["genres"])],
                "rating": rating, "votes": votes,
                "popularity": float(row["popularity"]),
                "budget": positive(row["budget"]),
                "revenue": positive(row["revenue"]),
                "runtime": positive(row["runtime"]), "status": row["status"],
            })
    return sorted(movies, key=lambda movie: movie["id"])


def build_metadata(path, movies):
    years = [movie["year"] for movie in movies if movie["year"] is not None]
    return {
        "source": "TMDB 5000 Movie Dataset", "publisher": "TMDB / Kaggle",
        "url": "https://www.kaggle.com/datasets/tmdb/tmdb-movie-metadata",
        "downloadUrl": "https://www.kaggle.com/api/v1/datasets/download/tmdb/tmdb-movie-metadata",
        "sourceLastUpdated": "2017-09-28", "retrievedOn": "2026-10-31",
        "license": "Other (specified in description): TMDB terms; non-commercial portfolio use with attribution",
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "rows": len(movies), "yearMin": min(years), "yearMax": max(years),
        "missingYear": sum(movie["year"] is None for movie in movies),
        "missingBudget": sum(movie["budget"] is None for movie in movies),
        "missingRevenue": sum(movie["revenue"] is None for movie in movies),
        "financialPairs": sum(movie["budget"] is not None and movie["revenue"] is not None for movie in movies),
    }


def main():
    root = Path(__file__).resolve().parents[1]
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=root / "data/raw/tmdb_5000_movies.csv")
    args = parser.parse_args()
    movies = read_movies(args.input)
    payload = {"meta": build_metadata(args.input, movies), "movies": movies}
    output = root / "docs/data/movies.json"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(json.dumps(payload["meta"], indent=2))


if __name__ == "__main__":
    main()
