"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useState } from "react";
import { BlogCategory, BlogPost } from "@/lib/blogPosts";

const categories: Array<"Alles" | BlogCategory> = [
  "Alles",
  "Meeting",
  "Reis",
  "Event",
  "Pitch",
  "Pers",
];

export default function BlogExplorer({ posts }: { posts: BlogPost[] }) {
  const [category, setCategory] = useState<(typeof categories)[number]>("Alles");
  const filtered =
    category === "Alles"
      ? posts
      : posts.filter((post) => post.category === category);

  return (
    <>
      <div className="blog-filters" aria-label="Filter blogposts">
        {categories.map((item) => (
          <button
            type="button"
            className={category === item ? "is-active" : ""}
            onClick={() => setCategory(item)}
            aria-pressed={category === item}
            key={item}
          >
            {item}
          </button>
        ))}
      </div>
      {filtered.length ? (
        <div className="blog-grid">
          {filtered.map((post) => (
            <Link className="blog-card" href={`/blog/${post.slug}`} key={post.slug}>
              <div className="blog-card-image">
                <img src={post.cover} alt="" />
              </div>
              <div className="blog-card-meta">
                <span className="eyebrow accent-text">{post.category}</span>
                <time dateTime={post.date}>{post.displayDate}</time>
              </div>
              <h2>{post.title}</h2>
              <p>{post.excerpt}</p>
              <span className="text-link">Lees verder →</span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="empty-state">Binnen deze categorie zijn nog geen artikelen gepubliceerd.</p>
      )}
    </>
  );
}
