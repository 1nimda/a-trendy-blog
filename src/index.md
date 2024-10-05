---
layout: "layout.njk"
title: "My trendy Blog"
---
## Welcome to My Blog

{% for post in collections.posts %}
<article>
    <h2><a href="{{ post.url }}">{{ post.data.title }}</a></h2>
    <p class="template-content">{{ post.templateContent }}</p>
</article>
{% endfor %}
