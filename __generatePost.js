require('dotenv').config();  // Load environment variables
const fs = require('fs'); // Import the file system module
const OpenAI = require('openai');
const axios = require('axios'); // For making HTTP requests to the Unsplash API
const { log } = require('console');

// Initialize the OpenAI API with your configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to generate a blog post
async function generateBlogPost(topic) {
  try {
    // Generate blog content using OpenAI
    const prompt = `Write a blog post about ${topic}. 
    The target audience is brand new moms. 
    Use a conversational and informative tone.
    Write a visually appealing sensitive post.
    The post should be around 500 words. 
    Include sections.
    Include keywords related to ${topic}.
    Use order and unoredered lists, links to useful sites.
    Return the response in spanish with Argentina's tone and words`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      max_tokens: 1024,
      temperature: 0.7, // Adjust for desired randomness (0.2-1.0 is common)
      top_p: 0.9, // Adjust for desired randomness (0.8-1.0 is common)
      messages: [
        {
          role: 'system',
          content:'you are a helpful and knowledgable Argentinian blog writer with a wide look of the world, you are also an anthroposofic reference, you write in Spanish.'
        },
        { 
        role: 'user', content: prompt
       }
      ],
    });

    // Check if the response contains choices
    if (response.choices && response.choices.length > 0) {
      const postContent = response.choices[0].message.content; // Correctly access content
      console.log(postContent);

    // Extract keywords from the OpenAI response
    const keywords = extractKeywords(postContent);

    const imageQuery = keywords.slice(0, 2).join(' ');
    const translatedQuery = await translateToEnglish(imageQuery);
    const imageUrl = await fetchImage(translatedQuery);
    
    
    // Create a markdown file
    const postTitle = topic.replace(/\s+/g, '-').toLowerCase(); // Clean the title for filenames
    const fileName = `./src/content/${postTitle}.md`;

      // Include the dynamically fetched image URL in the front matter
      const frontMatter = `---
title: "${topic}"
date: "${new Date().toISOString()}"
tags: blog
heroImage: "${imageUrl || ''}"
---`;

       // Include the image if one was found
      // const imageMarkdown = imageUrl ? `<img src="${imageUrl}" alt="${topic}" class="hero-image" style="  width: 100%; height: auto; display: block; margin: 0 auto;"/>\n\n` : '';
      const markdown = `${frontMatter}\n<h1 class="post-title">${topic}</h1>\n\n<div class="custom-wrapper">${postContent}</div>`;
      // const markdown = `---\ntitle: "${topic}"\ndate: "${new Date().toISOString()}"\ntags: blog\n---\n\n${imageMarkdown}<h1 class="post-title">${topic}</h1>\n\n${postContent}`;

      fs.writeFileSync(fileName, markdown);
      console.log(`Blog post generated: ${fileName}`);
    } else {
      console.error('No content generated from OpenAI.');
    }
    
  } catch (error) {
    // Enhanced error handling
    console.error('Error generating blog post:', error.response ? error.response.data : error.message);
  }
}

// Helper function to extract keywords from the OpenAI response
function extractKeywords(text) {
  const stopWords = ['de', 'la', 'el', 'en', 'a', 'y', 'que', 'los', 'las', 'un', 'una', 'para', 'con', 'por', 'como', 'es', 'son', 'se', 'al', 'del', 'su', 'le', 'me', 'nos', 'te', 'lo', 'la', 'los', 'las']; // Spanish stop words

  const words = text
      .toLowerCase()
      .replace(/[^a-zA-Z0-9\sáéíóúüñÁÉÍÓÚÜÑ]/g, '') // Remove punctuation
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.includes(word));

  // Simple frequency-based keyword extraction
  const wordFrequency = {};
  words.forEach(word => {
      wordFrequency[word] = (wordFrequency[word] || 0) + 1;
  });

  const sortedWords = Object.entries(wordFrequency)
      .sort(([, freqA], [, freqB]) => freqB - freqA)
      .map(([word]) => word);

      console.log(sortedWords);
  return sortedWords.slice(0, 5); // Return the top 5 keywords
}

// Translate query to english

async function translateToEnglish(text) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      temperature: 0.3,
      messages: [
        { role: 'system', content: 'You are a translation assistant. You translate short phrases or keywords from Spanish to English, keeping the meaning accurate and concise.' },
        { role: 'user', content: `Translate to English: "${text}"` }
      ],
    });

    const translated = response.choices[0].message.content.trim();
    console.log(`Translated query: ${translated}`);
    return translated;

  } catch (error) {
    console.error('Error translating query:', error.message);
    return text; // fallback: use original if translation fails
  }
}


// Function to get a related image from Unsplash
async function fetchImage(query) {
  try {
    const encodedQuery = encodeURIComponent(query); // Encode the query
      console.log('Unsplash API Query (Encoded):', encodedQuery); // Log the encoded query
      const response = await axios.get('https://api.unsplash.com/search/photos', {
      params: { query: encodedQuery, orientation: 'landscape', per_page: 1 },  // Search for 1 image related to the topic
      headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } // Unsplash API key
    });
    console.log('Unsplash API Full Response Data:', JSON.stringify(response.data, null, 2)); // Log the entire response.data with indentation

    if (response.data.results && response.data.results.length > 0) {
      const imageUrl = response.data.results[0].urls.raw;  // Use 'raw' to get the original high-res image URL
      const heroImageUrl = `${imageUrl}&w=1920&h=1080&fit=crop`;  // Customize width/height for hero image

      return heroImageUrl  // Return the small image URL
    } else {
      console.log(`No images found for query: ${query}`);
      return null; // No image found
    }
  } catch (error) {
    console.error('Error fetching image:', error.message);
    return null;
  }
}

// List of topics to generate blog posts for
const topics = [
  'Rudolph Steiner',
// 'Writiting a blog with Eleventy'
// '2024 - Latest investment ideas',
// 'Ethereum is being affected by the government adminstartion change in Japan',
// 'Solana promise rising in the first Q 2025',
// 'The future of Cryptocurrencies',
// 'Trade with Binance AI',
// 'Trade with Kucoin AI',
// 'How to get my first trainee interview',
];

// Function to generate blog posts for all topics in the list
async function generateMultipleBlogPosts(topicList) {
  for (const topic of topicList) {
    await generateBlogPost(topic);
  }
}

// Generate blog posts for all topics
generateMultipleBlogPosts(topics);
  