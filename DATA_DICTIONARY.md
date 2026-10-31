# Data dictionary

Grain: one movie per unique TMDB `id`. All numeric values retain source precision.

| Field | Meaning / policy |
| --- | --- |
| id | Integer TMDB movie identifier; unique and required |
| title | Source title; escaped before HTML rendering |
| releaseDate | ISO release date, or null |
| year | Year from releaseDate; null for unknown dates |
| language | Original-language ISO code |
| genres | Array of all genre names; empty array means unspecified |
| rating | TMDB vote_average / 10; null when vote_count = 0 |
| votes | Recorded vote count; not unique people across films |
| popularity | Historical TMDB popularity score |
| budget | Positive reported budget, treated as nominal USD; otherwise null |
| revenue | Positive reported revenue, treated as nominal USD; otherwise null |
| runtime | Positive duration in minutes; otherwise null |
| status | Source release status; retained without inference |

## Metrics

| Metric | Definition |
| --- | --- |
| Film count | Count of unique movie IDs matching all filters |
| Mean film rating | Sum of non-null film ratings / number of rated films |
| Median runtime | Middle known positive runtime, averaging the middle pair for even populations |
| Financial coverage | Films with positive budget AND revenue / filtered films |
| Total reported budget/revenue | Sum within the same complete-pair population |
| Median revenue / budget | Median of per-film revenue / budget among complete pairs |
| Genre count | Film memberships in that genre; categories overlap |
| Genre mean rating | Unweighted mean of rated films in the genre; shown only with ≥20 rated films |
| High-rating leaderboard | Filtered films with ≥100 votes, descending rating then votes then ID |

Blank values are exported as empty CSV fields. Text cells beginning with spreadsheet formula prefixes are escaped. Year filters are inclusive and exclude unknown years when a bound is present. Missing financial values never enter financial totals. Inverted year bounds produce an explicit empty selection. Zero matching rows display an empty state, not a fabricated statistic.
