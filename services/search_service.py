"""
Search service — DuckDuckGo, GitHub, ArXiv unified interface.
"""
from __future__ import annotations

import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from configs.settings import settings

logger = logging.getLogger(__name__)


@dataclass
class SearchResult:
    title: str
    url: str
    snippet: str
    source: str  # "web" | "github" | "arxiv"
    extra: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "title": self.title,
            "url": self.url,
            "snippet": self.snippet,
            "source": self.source,
            **self.extra,
        }


# ─── DuckDuckGo ─────────────────────────────────────────────────────────────

def _search_duckduckgo(query: str, max_results: int = 5) -> List[SearchResult]:
    """Search using duckduckgo-search library."""
    try:
        from duckduckgo_search import DDGS
        results = []
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=max_results):
                results.append(
                    SearchResult(
                        title=r.get("title", ""),
                        url=r.get("href", ""),
                        snippet=r.get("body", ""),
                        source="web",
                    )
                )
        return results
    except Exception as exc:
        logger.error("DuckDuckGo search failed: %s", exc)
        return []


# ─── GitHub Search ──────────────────────────────────────────────────────────

def _search_github(query: str, max_results: int = 5) -> List[SearchResult]:
    """Search GitHub repositories via the public API."""
    import httpx
    try:
        params = {"q": query, "sort": "stars", "order": "desc", "per_page": max_results}
        with httpx.Client(timeout=10.0) as client:
            resp = client.get("https://api.github.com/search/repositories", params=params)
            resp.raise_for_status()
            data = resp.json()

        results = []
        for item in data.get("items", []):
            results.append(
                SearchResult(
                    title=item.get("full_name", ""),
                    url=item.get("html_url", ""),
                    snippet=item.get("description", "") or "",
                    source="github",
                    extra={
                        "stars": item.get("stargazers_count", 0),
                        "language": item.get("language", ""),
                        "topics": item.get("topics", []),
                    },
                )
            )
        return results
    except Exception as exc:
        logger.error("GitHub search failed: %s", exc)
        return []


# ─── ArXiv Search ───────────────────────────────────────────────────────────

def _search_arxiv(query: str, max_results: int = 3) -> List[SearchResult]:
    """Search academic papers on ArXiv."""
    try:
        import arxiv
        client = arxiv.Client()
        search = arxiv.Search(query=query, max_results=max_results, sort_by=arxiv.SortCriterion.Relevance)
        results = []
        for paper in client.results(search):
            results.append(
                SearchResult(
                    title=paper.title,
                    url=paper.entry_id,
                    snippet=paper.summary[:400],
                    source="arxiv",
                    extra={
                        "authors": [a.name for a in paper.authors[:3]],
                        "published": str(paper.published.date()) if paper.published else "",
                    },
                )
            )
        return results
    except Exception as exc:
        logger.error("ArXiv search failed: %s", exc)
        return []

# ─── Wikipedia Search ───────────────────────────────────────────────────────

def _search_wikipedia(query: str, max_results: int = 1) -> List[SearchResult]:
    """Fetch Wikipedia summaries using wikipedia-api."""
    try:
        import wikipediaapi
        wiki = wikipediaapi.Wikipedia('OpenHackathonGPT/1.0', 'en')
        page = wiki.page(query)
        if page.exists():
            return [SearchResult(
                title=page.title,
                url=page.fullurl,
                snippet=page.summary[:800],
                source="wikipedia"
            )]
        return []
    except Exception as exc:
        logger.error("Wikipedia search failed: %s", exc)
        return []

# ─── Crawl4AI ───────────────────────────────────────────────────────────────

async def _scrape_urls(urls: List[str]) -> Dict[str, str]:
    """Crawl URLs asynchronously to get rich markdown content."""
    try:
        from crawl4ai import AsyncWebCrawler
        results = {}
        async with AsyncWebCrawler() as crawler:
            for url in urls:
                try:
                    res = await crawler.arun(url=url)
                    if res and res.markdown:
                        # Limit length to avoid context bloat
                        results[url] = res.markdown[:1500]
                except Exception as e:
                    logger.error(f"Failed to crawl {url}: {e}")
        return results
    except ImportError:
        logger.warning("Crawl4AI not installed.")
        return {}
    except Exception as exc:
        logger.error(f"Crawl4AI initialization failed: {exc}")
        return {}


# ─── Unified Search Interface ───────────────────────────────────────────────

async def search_all(
    query: str,
    max_web: int = 5,
    max_github: int = 5,
    max_arxiv: int = 3,
    provider: Optional[str] = None,
) -> Dict[str, List[Dict[str, Any]]]:
    """
    Run web + GitHub + ArXiv + Wikipedia searches and scrape top web results.
    """
    import asyncio
    loop = asyncio.get_event_loop()

    def sync_searches():
        search_provider = provider or settings.search_provider
        if search_provider == "duckduckgo":
            w_res = _search_duckduckgo(query, max_results=max_web)
        elif search_provider == "tavily":
            if settings.tavily_api_key:
                try:
                    from langchain_community.tools.tavily_search import TavilySearchResults
                    import os
                    os.environ["TAVILY_API_KEY"] = settings.tavily_api_key
                    tool = TavilySearchResults(max_results=max_web)
                    raw = tool.run(query)
                    w_res = [SearchResult(title=r.get("title", ""), url=r.get("url", ""), snippet=r.get("content", ""), source="web") for r in raw] if isinstance(raw, list) else _search_duckduckgo(query, max_results=max_web)
                except Exception as exc:
                    logger.error("Tavily search failed: %s", exc)
                    w_res = _search_duckduckgo(query, max_results=max_web)
            else:
                w_res = _search_duckduckgo(query, max_results=max_web)
        else:
            w_res = _search_duckduckgo(query, max_results=max_web)

        g_res = _search_github(query, max_results=max_github)
        a_res = _search_arxiv(query, max_results=max_arxiv)
        wiki_res = _search_wikipedia(query, max_results=1)
        return w_res, g_res, a_res, wiki_res

    web_results, github_results, arxiv_results, wiki_results = await loop.run_in_executor(None, sync_searches)

    # Scrape top 2 web results with Crawl4AI
    urls_to_scrape = [r.url for r in web_results[:2]]
    if urls_to_scrape:
        scraped_content = await _scrape_urls(urls_to_scrape)
        for r in web_results:
            if r.url in scraped_content:
                r.snippet = scraped_content[r.url]  # Replace short snippet with rich markdown

    return {
        "web": [r.to_dict() for r in web_results],
        "github": [r.to_dict() for r in github_results],
        "arxiv": [r.to_dict() for r in arxiv_results],
        "wikipedia": [r.to_dict() for r in wiki_results],
    }


def format_search_for_llm(results: Dict[str, List[Dict[str, Any]]]) -> str:
    """Format search results into readable text for LLM context."""
    parts = []

    if results.get("wikipedia"):
        parts.append("## Wikipedia")
        for i, r in enumerate(results["wikipedia"], 1):
            parts.append(f"{i}. **{r['title']}**\n   URL: {r['url']}\n   {r['snippet']}")

    if results.get("web"):
        parts.append("\n## Web Search Results")
        for i, r in enumerate(results["web"], 1):
            snippet_preview = r['snippet'] if len(r['snippet']) < 300 else r['snippet'][:300] + "..."
            parts.append(f"{i}. **{r['title']}**\n   URL: {r['url']}\n   Content:\n{snippet_preview}")

    if results.get("github"):
        parts.append("\n## GitHub Repositories")
        for i, r in enumerate(results["github"], 1):
            stars = r.get("stars", 0)
            lang = r.get("language", "")
            parts.append(f"{i}. **{r['title']}** ⭐{stars} [{lang}]\n   {r['url']}\n   {r['snippet']}")

    if results.get("arxiv"):
        parts.append("\n## Research Papers")
        for i, r in enumerate(results["arxiv"], 1):
            authors = ", ".join(r.get("authors", []))
            parts.append(f"{i}. **{r['title']}** ({r.get('published', '')})\n   Authors: {authors}\n   {r['snippet'][:300]}...")

    return "\n".join(parts) if parts else "No search results found."
