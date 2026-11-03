import { SarvamAIClient } from "sarvamai";

const apiSubscriptionKey = process.env.SARVAM_API_KEY;
if (!apiSubscriptionKey) {
  console.error("SARVAM_API_KEY is not set. Add it to .env and run: node --env-file=.env scripts/sarvam-hello.mjs");
  process.exit(1);
}

const client = new SarvamAIClient({ apiSubscriptionKey });

const response = await client.chat.completions({
  model: "sarvam-105b-conversations",
  messages: [{ role: "user", content: "Say hello in Hindi and English, in one short line." }],
});

console.log(response.choices[0].message.content);
