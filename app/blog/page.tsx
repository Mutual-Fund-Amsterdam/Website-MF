/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import BlogExplorer from "@/components/BlogExplorer";
import { blogPosts } from "@/lib/blogPosts";

export const metadata: Metadata = {
  title: "Blog",
  description: "Meetings, reizen en alles daartussenin bij Mutual Fund.",
};

export default function BlogPage() {
  const featured = blogPosts.find(
    (post) => post.slug === "mutual-fund-luidt-gong-euronext",
  )!;
  const rest = blogPosts.filter((post) => post.slug !== featured.slug);
  return (
    <main id="main-content" className="page-shell">
      <header className="container page-header">
        <p className="eyebrow">Uit de vereniging</p>
        <h1>Blog.</h1>
        <p>
          Meetings, reizen en alles daartussenin — het verenigingsleven van Mutual Fund.
        </p>
      </header>
      <section className="container featured-post" aria-label="Uitgelicht artikel">
        <Link className="featured-image" href={`/blog/${featured.slug}`}>
          <img src={featured.cover} alt="" />
        </Link>
        <div className="featured-copy">
          <div className="blog-card-meta">
            <span className="eyebrow accent-text">{featured.category}</span>
            <time dateTime={featured.date}>{featured.displayDate}</time>
          </div>
          <h2>{featured.title}</h2>
          <p>{featured.excerpt}</p>
          <Link className="text-link" href={`/blog/${featured.slug}`}>Lees verder →</Link>
        </div>
      </section>
      <section className="container blog-list-section">
        <div className="section-heading compact-heading">
          <p className="eyebrow">Alle verhalen</p>
          <h2>In het fonds.</h2>
        </div>
        <BlogExplorer posts={rest} />
      </section>
    </main>
  );
}
