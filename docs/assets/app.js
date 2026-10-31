import { filterMovies, mean, groupBy, financialMovies, summarize, rankMovies, escapeHtml as esc, toCsv } from './metrics.js';

const pages = [
  { id: 'welcome', label: 'Welcome', icon: '⌂', title: 'A different lens on cinema.' },
  { id: 'overview', label: 'Overview', icon: '◫', title: 'The big picture.' },
  { id: 'genres', label: 'Movies & genres', icon: '▦', title: 'Every genre tells a story.' },
  { id: 'ratings', label: 'Ratings & popularity', icon: '☆', title: 'Attention meets appreciation.' },
  { id: 'financials', label: 'Financials', icon: '↗', title: 'Behind the box office.' },
];
const state = { data: null, page: 'welcome', filters: { from: '', to: '', genre: '', votes: '0', search: '' }, sort: 'votes', limit: 25 };
const number = new Intl.NumberFormat('en-US');
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

function format(value, decimals = 1) {
  return value === null || !Number.isFinite(value) ? '—' : value.toLocaleString('en-US', { maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}

function card(label, value, note = '') {
  return `<div class="stat"><div class="stat-label">${label}</div><strong>${value}</strong><small>${note}</small></div>`;
}

function panel(title, subtitle, content, className = '') {
  return `<section class="panel ${className}"><div class="panel-head"><h2>${title}</h2><p>${subtitle}</p></div>${content}</section>`;
}

function empty() {
  return '<div class="empty"><h2>No movies match this selection.</h2><p>Try a wider release period or reset the filters.</p><button data-reset class="primary">Reset filters</button></div>';
}

function bars(groups, metric = 'count', maxItems = 10) {
  const items = [...groups].filter(group => Number.isFinite(group[metric])).sort((a, b) => b[metric] - a[metric]).slice(0, maxItems);
  if (!items.length) return '<p class="empty">No eligible groups in this selection.</p>';
  const max = metric === 'rating' ? 10 : Math.max(...items.map(item => item[metric]), 1);
  return `<div class="bars">${items.map((item, index) => `<div class="bar-row"><div class="bar-label">${esc(item.label)}<small>${metric === 'rating' ? `${number.format(item.count)} films` : String(index + 1).padStart(2, '0')}</small></div><div class="bar-track"><div style="width:${item[metric] / max * 100}%"></div></div><b>${metric === 'rating' ? format(item[metric]) : number.format(item[metric])}</b></div>`).join('')}</div>`;
}

function histogram(movies) {
  const bins = Array.from({ length: 10 }, (_, index) => ({ label: `${index}–${index + 1}`, count: movies.filter(movie => movie.rating !== null && movie.rating >= index && (index === 9 ? movie.rating <= 10 : movie.rating < index + 1)).length }));
  const max = Math.max(...bins.map(bin => bin.count), 1);
  return `<div class="histogram">${bins.map(bin => `<div class="hist-column"><span>${number.format(bin.count)}</span><div style="height:${bin.count / max * 180}px" title="${bin.label}: ${bin.count} films"></div><small>${bin.label}</small></div>`).join('')}</div><p class="chart-note">TMDB rating / 10 · Films with at least one vote</p>`;
}

function timeline(movies) {
  const groups = groupBy(movies.filter(movie => movie.year !== null), movie => [movie.year]).sort((a, b) => a.label - b.label);
  if (!groups.length) return '<p class="empty">No known release years in this selection.</p>';
  const min = groups[0].label;
  const max = groups.at(-1).label;
  const high = Math.max(...groups.map(group => group.count), 1);
  const x = year => 48 + (year - min) / (max - min || 1) * 640;
  const y = count => 220 - count / high * 175;
  const lookup = new Map(groups.map(group => [group.label, group.count]));
  const points = Array.from({ length: max - min + 1 }, (_, index) => [min + index, lookup.get(min + index) || 0]);
  const line = points.map(([year, count]) => `${x(year)},${y(count)}`).join(' ');
  const ticks = [...new Set([min, Math.round(min + (max - min) / 3), Math.round(min + (max - min) * 2 / 3), max])];
  return `<svg class="plot" viewBox="0 0 720 265" role="img" aria-label="Films by release year"><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#baabf4" stop-opacity=".3"/><stop offset="1" stop-color="#baabf4" stop-opacity="0"/></linearGradient></defs>${[0, .5, 1].map(ratio => `<line class="grid-line" x1="48" x2="688" y1="${y(high * ratio)}" y2="${y(high * ratio)}"/><text x="38" y="${y(high * ratio) + 4}" text-anchor="end">${Math.round(high * ratio)}</text>`).join('')}<polygon points="48,220 ${line} ${x(max)},220" fill="url(#area)"/><polyline points="${line}" fill="none" stroke="#c5b7ff" stroke-width="2.5"/>${groups.map(group => `<circle tabindex="0" cx="${x(group.label)}" cy="${y(group.count)}" r="3" fill="#c5b7ff" aria-label="${group.label}: ${group.count} films"><title>${group.label}: ${group.count} films</title></circle>`).join('')}${ticks.map(year => `<text x="${x(year)}" y="250" text-anchor="middle">${year}</text>`).join('')}</svg>`;
}

function scatter(movies, financial = false) {
  const rows = financial ? financialMovies(movies) : movies.filter(movie => movie.rating !== null);
  if (!rows.length) return '<p class="empty">No eligible records for this chart.</p>';
  const getX = movie => financial ? movie.budget / 1e6 : movie.rating;
  const getY = movie => financial ? movie.revenue / 1e6 : movie.popularity;
  const maxX = financial ? Math.max(...rows.map(getX), 1) : 10;
  const maxY = Math.max(...rows.map(getY), 1);
  const x = value => 60 + value / maxX * 600;
  const y = value => 260 - value / maxY * 215;
  return `<svg class="plot scatter" viewBox="0 0 720 315" role="img" aria-label="${financial ? 'Reported revenue versus budget in millions of USD' : 'Popularity versus average rating'}">${[0, .25, .5, .75, 1].map(ratio => `<line class="grid-line" x1="60" x2="660" y1="${y(maxY * ratio)}" y2="${y(maxY * ratio)}"/><text x="49" y="${y(maxY * ratio) + 4}" text-anchor="end">${compact.format(maxY * ratio)}</text><text x="${x(maxX * ratio)}" y="281" text-anchor="middle">${format(maxX * ratio, financial ? 0 : 1)}</text>`).join('')}${rows.map(movie => `<circle cx="${x(getX(movie))}" cy="${y(getY(movie))}" r="3.3" fill="${financial ? '#e7b78b' : '#b6a4ff'}" fill-opacity=".45"><title>${esc(movie.title)} · ${financial ? `Budget $${number.format(movie.budget)}; revenue $${number.format(movie.revenue)}` : `Rating ${movie.rating}; popularity ${movie.popularity}`}</title></circle>`).join('')}<text x="60" y="20">${financial ? 'Reported revenue ($M)' : 'Popularity score'}</text><text x="360" y="309" text-anchor="middle">${financial ? 'Reported budget ($M)' : 'TMDB average rating / 10'}</text></svg><p class="chart-note">${number.format(rows.length)} films · Every eligible film plotted · Exact values in the explorer below</p>`;
}

function renderWelcome() {
  const meta = state.data.meta;
  return `<section class="hero"><div class="hero-copy"><div class="eyebrow"><span class="status-dot"></span> TMDB / THE FILM COLLECTION</div><h1>A different lens<br>on <em>cinema.</em></h1><p>Explore the stories behind the screen.<br>A journey through film, audience taste,<br>and the economics of moviemaking.</p><a href="#overview" class="primary">Explore the collection <span>↗</span></a><div class="hero-meta">${number.format(meta.rows)} FILMS <span>·</span> ${meta.yearMin}—${meta.yearMax} RELEASE YEARS</div></div><div class="cinema-art" aria-hidden="true"><div class="orbit orbit-one"></div><div class="orbit orbit-two"></div><div class="orbit orbit-three"></div><div class="film-card card-back"><span>THE ART OF</span><b>SEEING<br>THE BIG<br>PICTURE.</b><small>FRAME / 001</small></div><div class="film-card card-front"><span>BEHIND EVERY FRAME</span><div class="art-star">✳</div><b>THERE IS<br>A STORY.</b><small>CINEMA ATLAS / DATA EDITION</small></div><span class="art-caption">A COLLECTION. COUNTLESS PERSPECTIVES.</span></div></section><div class="section-heading"><h2>Choose your perspective</h2><span>FOUR WAYS INTO THE DATA</span></div><div class="journeys">${pages.slice(1).map((page, index) => `<a class="journey" href="#${page.id}"><div class="journey-number">0${index + 1}<span>↗</span></div><span class="journey-icon">${page.icon}</span><h3>${page.label}</h3><p>${['The collection at a glance. Release years, languages, and coverage.', 'Discover the genres that shape this collection and find individual films.', 'Explore audience scores, vote counts, and attention.', 'Compare reported budgets, revenues, and financial data coverage.'][index]}</p></a>`).join('')}</div><div class="welcome-note"><span>THE CONTEXT</span><p>A historical TMDB dataset, published on Kaggle in 2017. An exploratory view of this collection — not a census of cinema or a live box-office tracker.</p></div>`;
}

function renderFilters() {
  const genres = [...new Set(state.data.movies.flatMap(movie => movie.genres))].sort();
  return `<form id="filters" class="filters"><label>From year<input name="from" type="number" min="${state.data.meta.yearMin}" max="${state.data.meta.yearMax}" placeholder="Any" value="${esc(state.filters.from)}"></label><label>To year<input name="to" type="number" min="${state.data.meta.yearMin}" max="${state.data.meta.yearMax}" placeholder="Any" value="${esc(state.filters.to)}"></label><label>Genre<select name="genre"><option value="">All genres</option>${genres.map(genre => `<option ${state.filters.genre === genre ? 'selected' : ''}>${esc(genre)}</option>`).join('')}</select></label><label>Minimum votes<select name="votes">${[0, 50, 100, 500, 1000].map(votes => `<option value="${votes}" ${Number(state.filters.votes) === votes ? 'selected' : ''}>${votes === 0 ? 'All films' : number.format(votes) + '+'}</option>`).join('')}</select></label><label class="search-label">Find a film<input name="search" type="search" placeholder="Search movie titles…" value="${esc(state.filters.search)}"></label><button type="submit" class="apply">Apply</button><button type="button" data-reset class="quiet">Reset</button></form>`;
}

function renderOverview(movies) {
  const stats = summarize(movies);
  const languages = groupBy(movies, movie => [movie.language || 'Unknown']);
  return `<div class="stats">${card('Films in selection', number.format(stats.count), 'Unique TMDB movie IDs')}${card('Mean film rating', format(stats.rating) + ' <i>/ 10</i>', 'Unweighted · films with votes')}${card('Median runtime', format(stats.runtime, 0) + ' <i>min</i>', 'Known, positive runtimes')}${card('Financial coverage', format(stats.financialCount / stats.count * 100) + '<i>%</i>', `${number.format(stats.financialCount)} films with both values`)}</div><div class="chart-grid wide-left">${panel('A century of releases', 'Films by release year · counts in this collection', timeline(movies))}${panel('Original languages', 'Top 6 · ISO language codes', bars(languages, 'count', 6))}</div><div class="chart-grid">${panel('Audience rating distribution', 'How scores are distributed across the collection', histogram(movies))}${panel('Data coverage', 'Known values in the current selection', bars([{ label: 'Release year', count: movies.filter(movie => movie.year !== null).length }, { label: 'Runtime', count: movies.filter(movie => movie.runtime !== null).length }, { label: 'At least one vote', count: movies.filter(movie => movie.votes > 0).length }, { label: 'Reported budget', count: movies.filter(movie => movie.budget !== null).length }, { label: 'Reported revenue', count: movies.filter(movie => movie.revenue !== null).length }]))}</div>`;
}

function renderGenres(movies) {
  const groups = groupBy(movies, movie => movie.genres);
  return `<div class="stats three">${card('Films in selection', number.format(movies.length), 'Each film counted once')}${card('Genres represented', number.format(groups.length), 'Films can belong to several genres')}${card('Genre assignments', number.format(groups.reduce((sum, group) => sum + group.count, 0)), 'Overlapping categories; not market share')}</div><div class="chart-grid">${panel('Genres by film count', 'Top 12 genres · a film may appear in multiple bars', bars(groups, 'count', 12))}${panel('Ratings by genre', 'Mean film rating · genres with ≥ 20 rated films', bars(groups.map(group => ({ ...group, count: group.rows.filter(movie => movie.rating !== null).length })).filter(group => group.count >= 20), 'rating', 12) || '<p>No eligible genres.</p>')}</div>`;
}

function renderRatings(movies) {
  const rated = movies.filter(movie => movie.rating !== null);
  const eligible = rankMovies(rated.filter(movie => movie.votes >= 100), 'rating').slice(0, 7);
  return `<div class="stats three">${card('Mean film rating', format(mean(rated.map(movie => movie.rating))) + ' <i>/ 10</i>', `${number.format(rated.length)} rated films`)}${card('Recorded votes', compact.format(movies.reduce((sum, movie) => sum + movie.votes, 0)), 'Historical snapshot · not unique voters')}${card('Mean popularity', format(mean(movies.map(movie => movie.popularity))), 'TMDB snapshot score · not a percentage')}</div><div class="chart-grid wide-left">${panel('Popularity vs. rating', 'Association only; this chart does not imply causation', scatter(movies))}${panel('Highly rated films', 'At least 100 votes · ties resolved by vote count', `<ol class="ranking">${eligible.map(movie => `<li><a href="https://www.themoviedb.org/movie/${movie.id}" target="_blank" rel="noreferrer">${esc(movie.title)}<small>${movie.year ?? 'Unknown year'} · ${number.format(movie.votes)} votes</small></a><strong>${format(movie.rating)}</strong></li>`).join('') || '<li>No films meet the vote threshold.</li>'}</ol>`)}</div>`;
}

function renderFinancials(movies) {
  const financial = financialMovies(movies);
  const stats = summarize(movies);
  return `<div class="notice">Reported amounts are treated as nominal USD; the dataset publisher notes uncertainty about currency and global coverage. Zero values are treated as missing. Revenue is not profit.</div><div class="stats">${card('Eligible films', number.format(financial.length), `${format(financial.length / movies.length * 100)}% of the selection`)}${card('Reported revenue', financial.length ? '$' + compact.format(stats.revenue) : '—', 'Only films with budget + revenue')}${card('Reported budget', financial.length ? '$' + compact.format(stats.budget) : '—', 'Same eligible population')}${card('Median revenue / budget', format(stats.multiple) + (stats.multiple === null ? '' : '<i>×</i>'), 'Not ROI · excludes marketing and distribution')}</div><div class="chart-grid wide-left">${panel('Budget vs. reported revenue', 'Complete financial pairs · nominal amounts, not inflation-adjusted', scatter(movies, true))}${panel('Largest reported revenues', 'Top 8 within the complete-pair population', `<div class="revenue-list">${rankMovies(financial, 'revenue').slice(0, 8).map(movie => `<div><span>${esc(movie.title)}<small>${movie.year ?? 'Unknown year'}</small></span><b>$${compact.format(movie.revenue)}</b></div>`).join('') || '<p>No complete financial pairs.</p>'}</div>`)}</div>`;
}

function renderTable(movies) {
  const ranked = rankMovies(movies, state.sort);
  const shown = ranked.slice(0, state.limit);
  return `<section class="panel explorer"><div class="table-heading"><div><h2>Film explorer</h2><p>${number.format(movies.length)} matching films · ${number.format(ranked.length)} with a known sort value · ${shown.length} shown</p></div><div class="table-actions"><label>Sort by <select id="sort">${[['votes', 'Vote count'], ['rating', 'Rating'], ['popularity', 'Popularity'], ['revenue', 'Revenue'], ['budget', 'Budget'], ['year', 'Release year']].map(([value, title]) => `<option value="${value}" ${state.sort === value ? 'selected' : ''}>${title} ↓</option>`).join('')}</select></label><button id="export" class="quiet">Export selection ↓</button></div></div><div class="table-scroll"><table><caption class="sr-only">Filtered films sorted descending by ${esc(state.sort)}. Export includes all matching films.</caption><thead><tr><th>FILM</th><th>YEAR</th><th>GENRES</th><th>RATING</th><th>VOTES</th><th>POPULARITY</th><th>BUDGET</th><th>REVENUE</th></tr></thead><tbody>${shown.map(movie => `<tr><td><a href="https://www.themoviedb.org/movie/${movie.id}" target="_blank" rel="noreferrer">${esc(movie.title)} ↗</a></td><td>${movie.year ?? '—'}</td><td>${esc(movie.genres.join(', ') || 'Unknown')}</td><td><span class="rating">${format(movie.rating)}</span></td><td>${number.format(movie.votes)}</td><td>${format(movie.popularity)}</td><td>${movie.budget === null ? '—' : '$' + compact.format(movie.budget)}</td><td>${movie.revenue === null ? '—' : '$' + compact.format(movie.revenue)}</td></tr>`).join('')}</tbody></table></div>${shown.length < ranked.length ? '<button id="show-more" class="quiet more">Show 25 more films ↓</button>' : ''}</section>`;
}

function renderSources() {
  const meta = state.data.meta;
  document.querySelector('#source-content').innerHTML = `<a href="https://www.themoviedb.org"><img class="tmdb-logo" src="assets/tmdb-logo.svg" alt="The Movie Database"></a><p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p><p>The dashboard uses a static export, with no live API calls or API keys.</p><dl><dt>Dataset</dt><dd><a href="${meta.url}" target="_blank" rel="noreferrer">TMDB 5000 Movie Dataset on Kaggle ↗</a></dd><dt>Coverage</dt><dd>${number.format(meta.rows)} unique films · release years ${meta.yearMin}–${meta.yearMax}. ${meta.missingYear} film has no release date.</dd><dt>Freshness</dt><dd>Publisher last updated ${meta.sourceLastUpdated}; retrieved ${meta.retrievedOn}. Exact observation times of individual metrics are unavailable.</dd><dt>Definitions</dt><dd>Rating: unweighted mean across films with votes. Genre counts overlap. Popularity: historical TMDB score, not unique viewers. Financials: only records with both positive budget and revenue; zero values are missing. Revenue / budget is not ROI or profit.</dd><dt>Limitations</dt><dd>Selected historical sample, not a complete or random movie census. Amounts are assumed nominal USD; the publisher notes unresolved currency/global coverage questions. No inflation adjustment. Records and future-dated releases are retained as supplied.</dd><dt>Filters and export</dt><dd>Filters apply across all four analysis pages. Year bounds exclude unknown release dates. CSV exports all matching records, including those with missing sort values. The ratings leaderboard additionally requires 100 votes.</dd><dt>Rights</dt><dd>Non-commercial educational portfolio. Data is subject to <a href="https://www.themoviedb.org/api-terms-of-use">TMDB terms</a>; it is not covered by the code license.</dd><dt>Reproducibility</dt><dd><a href="https://github.com/LHGiaPhuc/tmdb-cinema-atlas">Project source, transformation, tests, and metric definitions ↗</a></dd></dl>`;
}

function render() {
  const page = pages.find(item => item.id === state.page) || pages[0];
  document.title = `${page.label} · Cinema Atlas`;
  document.querySelector('#breadcrumb').textContent = page.label;
  document.querySelector('#navigation').innerHTML = pages.map(item => `<a href="#${item.id}" ${item.id === page.id ? 'aria-current="page"' : ''}><span>${item.icon}</span>${item.label}</a>`).join('');
  const movies = filterMovies(state.data.movies, state.filters);
  const renderers = { overview: renderOverview, genres: renderGenres, ratings: renderRatings, financials: renderFinancials };
  document.querySelector('#main').innerHTML = page.id === 'welcome' ? renderWelcome() : `<div class="page-heading"><div><div class="eyebrow">THE COLLECTION / ${page.label.toUpperCase()}</div><h1>${page.title}</h1></div><span class="pill">${number.format(movies.length)} / ${number.format(state.data.movies.length)} films</span></div>${renderFilters()}<div id="analysis-results" aria-live="polite">${movies.length ? renderers[page.id](movies) + renderTable(movies) : empty()}</div>`;
  bindPageEvents(movies);
}

function exportMovies(movies) {
  const blob = new Blob(['\ufeff' + toCsv(movies)], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `cinema-atlas-${state.page}-selection.csv`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function bindPageEvents(movies) {
  document.querySelector('#filters')?.addEventListener('submit', event => {
    event.preventDefault();
    state.filters = Object.fromEntries(new FormData(event.currentTarget));
    state.limit = 25;
    render();
  });
  document.querySelectorAll('[data-reset]').forEach(button => button.addEventListener('click', () => {
    state.filters = { from: '', to: '', genre: '', votes: '0', search: '' };
    state.limit = 25;
    render();
  }));
  document.querySelector('#sort')?.addEventListener('change', event => { state.sort = event.target.value; state.limit = 25; render(); });
  document.querySelector('#show-more')?.addEventListener('click', () => { const y = window.scrollY; state.limit += 25; render(); window.scrollTo(0, y); });
  document.querySelector('#export')?.addEventListener('click', () => exportMovies(movies));
}

function navigate() {
  const id = location.hash.slice(1);
  state.page = pages.some(page => page.id === id) ? id : 'welcome';
  state.limit = 25;
  render();
  window.scrollTo(0, 0);
}

async function main() {
  try {
    const response = await fetch(new URL('../data/movies.json', import.meta.url));
    if (!response.ok) throw new Error('Data request failed');
    state.data = await response.json();
    renderSources();
    window.addEventListener('hashchange', navigate);
    document.querySelector('#sources-button').addEventListener('click', () => document.querySelector('#sources').showModal());
    document.querySelector('#close-sources').addEventListener('click', () => document.querySelector('#sources').close());
    navigate();
  } catch (error) {
    document.querySelector('#main').innerHTML = '<div class="empty" role="alert"><h1>The collection could not load.</h1><p>Reload the page. For local use, start the HTTP server with npm start rather than opening the HTML file directly.</p><button onclick="location.reload()">Retry</button></div>';
    console.error(error);
  }
}

main();
