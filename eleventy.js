module.exports = function (eleventyConfig) {
  // Копируем CSS/JS/картинки как есть, без обработки
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/*.svg");

  return {
    dir: {
      input: "src",
      output: "_site",
    },
  };
};