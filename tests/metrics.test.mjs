import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { filterMovies, mean, median, groupBy, summarize, financialMovies, rankMovies, toCsv, escapeHtml } from '../docs/assets/metrics.js';

function fixture() {
  return [
    { id: 1, title: 'Alpha', year: 2000, genres: ['Drama', 'Comedy'], rating: 8, votes: 100, budget: 20, revenue: 100, runtime: 100 },
    { id: 2, title: 'Beta', year: 2010, genres: ['Drama'], rating: 6, votes: 10, budget: null, revenue: 50, runtime: 120 },
    { id: 3, title: '=Unsafe', year: null, genres: [], rating: null, votes: 0, budget: 5, revenue: null, runtime: null },
  ];
}

function main() {
  test('Missing values do not become zeros or financial profit', () => {
    assert.equal(mean([8, 6, null]), 7);
    assert.equal(mean([null]), null);
    assert.equal(median([100, null, 120]), 110);
    assert.equal(median([]), null);
    assert.equal(financialMovies(fixture()).length, 1);
    assert.deepEqual(summarize(fixture()), { count: 3, rating: 7, runtime: 110, financialCount: 1, budget: 20, revenue: 100, multiple: 5 });
  });
  test('Combined filters preserve inclusive boundaries and unknown-year policy', () => {
    assert.equal(filterMovies(fixture(), {}).length, 3);
    assert.deepEqual(filterMovies(fixture(), { from: 2000, to: 2000, genre: 'Drama', votes: 100, search: 'ALP' }).map(movie => movie.id), [1]);
    assert.equal(filterMovies(fixture(), { from: 2000 }).length, 2);
    assert.equal(filterMovies(fixture(), { from: 2010, to: 2000 }).length, 0);
    assert.equal(filterMovies(fixture(), { search: 'not found' }).length, 0);
  });
  test('Genre assignments overlap without changing movie grain', () => {
    const groups = groupBy(fixture(), movie => movie.genres);
    assert.equal(groups.find(group => group.label === 'Drama').count, 2);
    assert.equal(groups.find(group => group.label === 'Drama').rating, 7);
    assert.equal(groups.find(group => group.label === 'Comedy').count, 1);
  });
  test('Sorting excludes unknown values without mutating data', () => {
    const movies = fixture();
    assert.deepEqual(rankMovies(movies, 'rating').map(movie => movie.id), [1, 2]);
    assert.equal(movies.length, 3);
  });
  test('CSV keeps all records and protects formula-like titles', () => {
    const csv = toCsv(fixture());
    assert.equal(csv.split('\r\n').length, 4);
    assert.ok(csv.includes('"\'=Unsafe"'));
    assert.equal(escapeHtml('<script>"&'), '&lt;script&gt;&quot;&amp;');
  });
  test('Published snapshot reconciles and has valid domains', () => {
    const { movies, meta } = JSON.parse(readFileSync(new URL('../docs/data/movies.json', import.meta.url), 'utf8'));
    assert.equal(movies.length, 4803);
    assert.equal(new Set(movies.map(movie => movie.id)).size, 4803);
    assert.equal(movies.filter(movie => movie.budget === null).length, 1037);
    assert.equal(movies.filter(movie => movie.revenue === null).length, 1427);
    assert.equal(financialMovies(movies).length, 3229);
    assert.equal(meta.financialPairs, 3229);
    assert.equal(movies.filter(movie => movie.year === null).length, 1);
    assert.ok(movies.every(movie => movie.rating === null || movie.rating >= 0 && movie.rating <= 10));
    assert.ok(movies.every(movie => movie.votes >= 0 && movie.popularity >= 0));
    const avatar = movies.find(movie => movie.id === 19995);
    assert.equal(avatar.budget, 237000000);
    assert.equal(avatar.revenue, 2787965087);
    assert.equal(avatar.title, 'Avatar');
  });
}

main();
