export function filterMovies(movies, filters) {
  return movies.filter(movie => (!filters.genre || movie.genres.includes(filters.genre))
    && (!filters.from || (movie.year !== null && movie.year >= Number(filters.from)))
    && (!filters.to || (movie.year !== null && movie.year <= Number(filters.to)))
    && movie.votes >= Number(filters.votes || 0)
    && movie.title.toLowerCase().includes((filters.search || '').toLowerCase()));
}

export function mean(values) {
  const valid = values.filter(value => Number.isFinite(value));
  return valid.length ? valid.reduce((total, value) => total + value, 0) / valid.length : null;
}

export function median(values) {
  const valid = values.filter(value => Number.isFinite(value)).sort((a, b) => a - b);
  const middle = Math.floor(valid.length / 2);
  return valid.length ? valid.length % 2 ? valid[middle] : (valid[middle - 1] + valid[middle]) / 2 : null;
}

export function groupBy(movies, getKeys) {
  const groups = new Map();
  for (const movie of movies) {
    for (const key of getKeys(movie)) {
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(movie);
    }
  }
  return [...groups].map(([label, rows]) => ({ label, count: rows.length, rating: mean(rows.map(row => row.rating)), rows }));
}

export function financialMovies(movies) {
  return movies.filter(movie => movie.budget > 0 && movie.revenue > 0);
}

export function summarize(movies) {
  const financial = financialMovies(movies);
  return { count: movies.length, rating: mean(movies.map(movie => movie.rating)),
    runtime: median(movies.map(movie => movie.runtime)), financialCount: financial.length,
    budget: financial.reduce((sum, movie) => sum + movie.budget, 0),
    revenue: financial.reduce((sum, movie) => sum + movie.revenue, 0),
    multiple: median(financial.map(movie => movie.revenue / movie.budget)) };
}

export function rankMovies(movies, metric) {
  return [...movies].filter(movie => Number.isFinite(movie[metric])).sort((a, b) => b[metric] - a[metric] || b.votes - a.votes || a.id - b.id);
}

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[character]));
}

export function csvCell(value) {
  let text = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}

export function toCsv(movies) {
  const columns = ['id', 'title', 'year', 'genres', 'language', 'rating', 'votes', 'popularity', 'budget', 'revenue', 'runtime'];
  return [columns.join(','), ...movies.map(movie => columns.map(column => csvCell(Array.isArray(movie[column]) ? movie[column].join(' | ') : movie[column])).join(','))].join('\r\n');
}
