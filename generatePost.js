require('dotenv').config();
const fs = require('fs');
const axios = require('axios');
const OpenAI = require('openai');
const { log } = require('console');

const TEST_MODE = true; // Set to true to use the mock response, false to call OpenAI
const SAMPLE_OPENAI_RESPONSE_FILE = 'sample_openai_response.txt';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Blog post generator
async function generateBlogPost(topic) {
  try {
    const prompt = `Write a blog post about ${topic}. 
    The target audience is brand new moms. 
    Use a conversational and informative tone.
    Write a visually appealing sensitive post.
    The post should be around 500 words. 
    Include sections.
    Include keywords related to ${topic}.
    Use ordered and unordered lists, and links to useful sites.
    Return the response in Spanish with Argentina's tone and words.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 0.9,
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful and knowledgeable Argentinian blog writer with a wide worldview. You are also an anthroposophic reference and always write in Spanish.',
        },
        { role: 'user', content: prompt },
      ],
    });

    if (!response.choices || response.choices.length === 0) {
      console.error('No content generated from OpenAI.');
      return;
    }

    const postContent = response.choices[0].message.content;
    // const keywords = extractKeywords(postContent);
    // const imageQuery = keywords.slice(0, 3).join(' '); // Use top 3 keywords
    const imageQuery = topic;

    const imageUrl = await fetchImage(imageQuery);
    const fileName = `./src/content/${topic.replace(/\s+/g, '-').toLowerCase()}.md`;

    const frontMatter = `---
title: "${topic}"
date: "${new Date().toISOString()}"
tags: blog
heroImage: "${imageUrl || ''}"
---`;

    const markdown = `${frontMatter}
 <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
  <link rel="stylesheet" href="../../styles/styles.css">
</head>
<body>
<h1 class="post-title">${topic}</h1>
<div class="custom-wrapper">${postContent}</div>
</body>
</html>   
`;


    fs.writeFileSync(fileName, markdown);
    console.log(`✅ Blog post generated: ${fileName}`);
  } catch (error) {
    console.error(
      '❌ Error generating blog post:',
      error.response ? error.response.data : error.message
    );
  }
}

// Keyword extractor
// function extractKeywords(text) {
//   const stopWords = [
//     'de', 'la', 'el', 'en', 'a', 'y', 'que', 'los', 'las',
//     'un', 'una', 'para', 'con', 'por', 'como', 'es', 'son',
//     'se', 'al', 'del', 'su', 'le', 'me', 'nos', 'te', 'lo'
//   ];

//   const words = text
//     .toLowerCase()
//     .replace(/[^a-záéíóúüñ\s]/gi, '')
//     .split(/\s+/)
//     .filter(word => word.length > 3 && !stopWords.includes(word));

//   const frequency = {};
//   for (const word of words) {
//     frequency[word] = (frequency[word] || 0) + 1;
//   }

//   return Object.entries(frequency)
//     .sort(([, a], [, b]) => b - a)
//     .map(([word]) => word)
//     .slice(0, 5);
// }

// Image fetch
async function fetchImage(topic) {
  try {
    const refinedQuery = `${topic} bebés maternidad cuidados infantiles`;
    const encodedQuery = encodeURIComponent(refinedQuery);

    const response = await axios.get('https://api.pexels.com/v1/search', {
      params: {
        query: encodedQuery,
        per_page: 5,
        orientation: 'landscape',
        order_by: 'relevant'
      },
      headers: {
        Authorization: process.env.PEXELS_API_KEY, // Replace with your Pexels API key
      },
    });

    const results = response.data.photos;
    return results.length > 0 ? results[0].src.landscape : null;
  } catch (error) {
    console.error('❌ Error fetching image:', error.message);
    return null;
  }
}

// List of topics
const topics = [
  'Rudolph Steiner',
  'Montesori',
  // Agregá más temas si querés generar más blogs
];

// Batch generator
async function generateMultipleBlogPosts(topicList) {
  for (const topic of topicList) {
    await generateBlogPost(topic);
  }
}

// Start generation
generateMultipleBlogPosts(topics);
