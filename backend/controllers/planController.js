const openai = require("../config/openai");
const fs = require("fs").promises;
const path = require("path");

const generatePlan = async (userData, day) => {
  try {
    const prompt = `Based on the following user information:
Objective: ${userData.objective}
Time Without Contact: ${userData.timeWithoutContact}
Separation Cause: ${userData.separationCause}
Reaction to Messages: ${userData.messagesReaction}
Last Message: ${userData.lastMessage}
Current Interest: ${userData.currentInterest}
Current Status: ${userData.currentStatus}

Now, generate a highly personalized 7-day reconquest plan for DAY ${day}. Do NOT offer generic advice like "be yourself" or "stay confident." Instead, deliver a tactical blueprint that leverages dark psychology and concrete, proven techniques to re-capture his attention and transform your life.

Your strategy must be bold and precise—designed to unsettle his complacency and trigger his primal instincts. Include specific language cues, exact timing recommendations, and behavioral triggers that exploit his vulnerabilities at a deep neurochemical level. Think in terms of environmental triggers, emotional cues, and targeted messaging that force him to re-evaluate his current state and crave your influence.

Return ONLY a VALID JSON OBJECT in the EXACT format below:
{
  "day": ${day},
  "title": "A motivational and assertive title for the day",
  "subtitle": "A subtitle that frames the day's strategy with clarity and intensity",
  "message": {
    "text": "A strategically crafted message designed to be sent, laden with persuasive, dark psychological cues",
    "context": "A brief explanation of the message's objective and optimal timing"
  },
  "tips": [
    {
      "title": "Clear, action-driven title for the first tip",
      "text": "A direct explanation of the first tip, highlighting its strategic value"
    },
    {
      "title": "Clear, action-driven title for the second tip",
      "text": "A direct explanation of the second tip, emphasizing its role in reactivating his desire"
    },
    {
      "title": "Clear, action-driven title for the third tip",
      "text": "A direct explanation of the third tip, focusing on consolidating your influence"
    }
  ],
  "avoid": [
    {
      "title": "First critical point to avoid",
      "text": "An explanation of why this must be avoided and the potential consequences of ignoring it"
    },
    {
      "title": "Second critical point to avoid",
      "text": "An explanation of why this must be avoided and the potential consequences of ignoring it"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini-2024-07-18",
      messages: [
        {
          role: "system",
          content:
            "You are a relationship expert who provides responses EXCLUSIVELY in a valid JSON format. Never include text or explanations outside the JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
      presence_penalty: 0.3,
      frequency_penalty: 0.3,
    });

    const responseContent = completion.choices[0].message.content.trim();
    const planDoDia = JSON.parse(responseContent);

    if (
      !planDoDia.day ||
      !planDoDia.title ||
      !planDoDia.message ||
      !Array.isArray(planDoDia.tips) ||
      !Array.isArray(planDoDia.avoid)
    ) {
      throw new Error("The AI response does not contain the expected structure");
    }

    // Salvar o plano na pasta do usuário
    const planDir = path.join(
      __dirname,
      "../data/users",
      userData.email,
      "plans"
    );
    
    await fs.mkdir(planDir, { recursive: true });
    
    const planPath = path.join(planDir, `day-${day}.json`);
    await fs.writeFile(
      planPath,
      JSON.stringify({
        ...planDoDia,
        generatedAt: new Date().toISOString()
      }, null, 2)
    );

    return planDoDia;
  } catch (error) {
    console.error("Error generating plan:", error);
    if (error instanceof SyntaxError) {
      throw new Error("Error processing AI response: Invalid JSON");
    }
    throw error;
  }
};

module.exports = { generatePlan };