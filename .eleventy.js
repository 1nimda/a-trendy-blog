module.exports = (eleventyConfig) => {
  eleventyConfig.addCollection("posts", function(collectionApi) {
      const posts = collectionApi.getFilteredByGlob("./src/content/*.md");
      console.log("Posts:", posts); // Debugging output
      return posts;
  });
  eleventyConfig.addPassthroughCopy("src/styles");
  return {
      dir: {
          input: "src",
          includes: "templates",
          output: "dist",
      }
  };
};
