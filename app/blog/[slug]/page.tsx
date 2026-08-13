/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { blogPosts, getBlogPost } from "@/lib/blogPosts";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  return post
    ? { title: post.title, description: post.excerpt }
    : { title: "Artikel niet gevonden" };
}

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  return (
    <main id="main-content" className="page-shell">
      <article className="article-container">
        <header className="article-header">
          <div className="blog-card-meta">
            <span className="eyebrow accent-text">{post.category}</span>
            <time dateTime={post.date}>{post.displayDate}</time>
          </div>
          <h1>{post.title}</h1>
          <p>{post.excerpt}</p>
        </header>
        <img className="article-cover" src={post.cover} alt="" />
        <div className="article-prose">
          {post.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </div>
        <Link className="text-link article-back" href="/blog">← Terug naar blog</Link>
      </article>
    </main>
  );
}
