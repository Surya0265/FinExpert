const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const listAvailableModels = async () => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    console.log('📋 Fetching available Gemini models...\n');
    
    const models = await genAI.listModels();
    
    console.log('✅ Available Models:\n');
    models.forEach((model, index) => {
      console.log(`${index + 1}. ${model.name}`);
      console.log(`   Display Name: ${model.displayName || 'N/A'}`);
      console.log(`   Version: ${model.version || 'N/A'}`);
      console.log(`   Input Token Limit: ${model.inputTokenLimit || 'N/A'}`);
      console.log('');
    });
    
    console.log('\n💡 Use one of the model names above in your code.');
  } catch (error) {
    console.error('❌ Error fetching models:', error.message);
    console.log('\n📌 Make sure:');
    console.log('1. Your GEMINI_API_KEY is correct in .env');
    console.log('2. You have access to the Gemini API');
    console.log('3. Your internet connection is working');
  }
};

listAvailableModels();
