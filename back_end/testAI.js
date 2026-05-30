require("dotenv").config();

const { generateInterviewResponse } =
  require("./services/aiService");

(async () => {
  const result =
    await generateInterviewResponse(
      "Software Engineer",
      "I built a Node.js ecommerce application."
    );

  console.log(result);
})();