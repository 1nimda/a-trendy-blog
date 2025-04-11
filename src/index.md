---
layout: "layout.njk"
title: "My trendy Blog"
---
## Welcome to My Blog

<div class="blog-posts-wrapper">
  {% for post in collections.posts %}
  <article class="blog-post-item">
    <h2 class="post-title-link"><a href="{{ post.url }}">{{ post.data.title }}</a></h2>
    {% if post.data.heroImage %}
    <div class="post-thumbnail">
      <a href="{{ post.url }}">
        <img src="{{ post.data.heroImage }}" alt="{{ post.data.title }}" loading="lazy">
      </a>
    </div>
    {% endif %}
    </article>
  {% endfor %}
</div>