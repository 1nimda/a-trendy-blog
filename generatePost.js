require('dotenv').config();  // Load environment variables
const fs = require('fs'); // Import the file system module
const OpenAI = require('openai');
const axios = require('axios') // For making HTTP requests to the Unsplash API

// Initialize the OpenAI API with your configuration
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Function to get a related image from Unsplash
async function fetchImage(topic) {
  try {
    const response = await axios.get('https://api.unsplash.com/search/photos', {
      params: { query: topic, orientation: 'landscape', per_page: 1 },  // Search for 1 image related to the topic
      headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } // Unsplash API key
    });

    if (response.data.results && response.data.results.length > 0) {
      const imageUrl = response.data.results[0].urls.raw;  // Use 'raw' to get the original high-res image URL
      const heroImageUrl = `${imageUrl}&w=1920&h=1080&fit=crop`;  // Customize width/height for hero image

      return heroImageUrl  // Return the small image URL
    } else {
      console.log(`No images found for topic: ${topic}`);
      return null; // No image found
    }
  } catch (error) {
    console.error('Error fetching image:', error.message);
    return null;
  }
}

// Function to generate a blog post
async function generateBlogPost(topic) {
  try {
    // Fetch image related to the topic
    const imageUrl = await fetchImage(topic);

    // Generate blog content using OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: `Write a blog post about ${topic}` }],
    });

    // Check if the response contains choices
    if (response.choices && response.choices.length > 0) {
      const postContent = response.choices[0].message.content; // Correctly access content
      console.log(postContent);
    
      // Create a markdown file
      const postTitle = topic.replace(/\s+/g, '-').toLowerCase(); // Clean the title for filenames
      const fileName = `./src/content/${postTitle}.md`;

       // Include the image if one was found
      const imageMarkdown = imageUrl ? `<img src="${imageUrl}" alt="${topic}" class="hero-image" style="  width: 100%; height: auto; display: block; margin: 0 auto;"/>\n\n` : '';
      const markdown = `---\ntitle: "${topic}"\ndate: "${new Date().toISOString()}"\ntags: blog\n---\n\n${imageMarkdown}<h1 class="post-title">${topic}</h1>\n\n${postContent}`;

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

// List of topics to generate blog posts for
const topics = [
'2024 - Latest investment ideas',
'Ethereum is being affected by the government adminstartion change in Japan',
'Solana promise rising in the first Q 2025',
'The future of Cryptocurrencies',
'Trade with Binance AI',
'Trade with Kucoin AI',
'How to get my first trainee interview',
];

// Function to generate blog posts for all topics in the list
async function generateMultipleBlogPosts(topicList) {
  for (const topic of topicList) {
    await generateBlogPost(topic);
  }
}

// Generate blog posts for all topics
generateMultipleBlogPosts(topics);
