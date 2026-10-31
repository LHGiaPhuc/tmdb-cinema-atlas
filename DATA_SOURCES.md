# Source, rights and reproducibility

- Publisher: TMDB, distributed by Kaggle.
- Dataset: [TMDB 5000 Movie Dataset](https://www.kaggle.com/datasets/tmdb/tmdb-movie-metadata).
- Public archive: https://www.kaggle.com/api/v1/datasets/download/tmdb/tmdb-movie-metadata
- Source metadata: https://www.kaggle.com/api/v1/datasets/view/tmdb/tmdb-movie-metadata
- Source last updated: 2017-09-28. Downloaded: 2026-10-31.
- Input: `tmdb_5000_movies.csv`; 4,803 rows. Credits are not used.
- Input SHA-256: `1e0584a8dd374120e4ed4f2b81f0d2bd0eb95a554708e4a350d00ed5c46d2825`.
- Transformation: `scripts/prepare_data.py`. Output: `docs/data/movies.json`.

Kaggle metadata identifies the license as **Other (specified in description)**. The dataset description says this replacement dataset was obtained from TMDB under its terms. Do not confuse it with the earlier IMDb dataset or claim CC0 ownership.

[TMDB's FAQ](https://developer.themoviedb.org/docs/faq) describes non-commercial use with attribution and its branding requirements. See [TMDB terms](https://www.themoviedb.org/api-terms-of-use) for applicable conditions. The MIT license covers project code only, not data or TMDB branding. No movie posters or stills are included; the Welcome artwork is original CSS typography and shapes.

This product uses the TMDB API but is not endorsed or certified by TMDB.

## Known limits

The dataset publisher explicitly leaves currency consistency and worldwide revenue coverage open. Amounts are assumed nominal USD for presentation and must not be used as audited financial figures. The extraction time of each score is unknown. The snapshot includes a release year of 2017; release dates do not establish when votes or financial amounts were observed. Missing amounts are not imputed. Missingness may be systematic, so complete-pair financial summaries are not representative of all movies.

The release-year chart counts this sample, not annual industry output. Absent years within the displayed range have zero records in this collection. Genre groups overlap. No claims of trends in historical popularity or causality are made from this cross-sectional snapshot.
