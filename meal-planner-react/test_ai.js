import { GoogleGenerativeAI } from '@google/generative-ai';

(async () => {
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyCQvC2Q1oRPl5vqvoStq-7WZYrcjjVv1Y8');
    const data = await response.json();
    console.log(data.models.map(m => m.name).join("\n"));
  } catch (e) {
    console.error('ERROR:', e.message);
  }
})();
