// Test script to check Gemini API key and available models
const https = require('https');
require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in .env file');
  process.exit(1);
}

console.log('🔑 API Key found:', API_KEY.substring(0, 10) + '...');
console.log('\n📋 Testing available models...\n');

// Test 1: List available models
const listModelsUrl = `https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`;

https.get(listModelsUrl, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (response.error) {
        console.error('❌ API Error:', response.error.message);
        process.exit(1);
      }
      
      if (response.models) {
        console.log('✅ Available models:');
        response.models.forEach(model => {
          const name = model.name.replace('models/', '');
          const supportsGenerate = model.supportedGenerationMethods?.includes('generateContent');
          console.log(`  ${supportsGenerate ? '✓' : '✗'} ${name}`);
        });
        
        // Test a simple generation with the first available model
        const availableModels = response.models.filter(m => 
          m.supportedGenerationMethods?.includes('generateContent')
        );
        
        if (availableModels.length > 0) {
          const testModel = availableModels[0].name.replace('models/', '');
          console.log(`\n🧪 Testing generation with: ${testModel}\n`);
          testGeneration(testModel);
        } else {
          console.log('\n❌ No models support generateContent');
        }
      } else {
        console.log('❌ No models found in response');
      }
    } catch (error) {
      console.error('❌ Error parsing response:', error.message);
      console.log('Raw response:', data);
    }
  });
}).on('error', (error) => {
  console.error('❌ Request error:', error.message);
});

function testGeneration(modelName) {
  const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${API_KEY}`;
  
  const postData = JSON.stringify({
    contents: [{
      parts: [{ text: 'Say hello in one word' }]
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 10,
    }
  });
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  const req = https.request(url, options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        
        if (response.error) {
          console.error('❌ Generation Error:', response.error.message);
        } else if (response.candidates) {
          const text = response.candidates[0]?.content?.parts?.[0]?.text;
          console.log('✅ Generation successful!');
          console.log('Response:', text);
          console.log('\n✨ Your API key is working correctly!');
        }
      } catch (error) {
        console.error('❌ Error parsing generation response:', error.message);
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ Generation request error:', error.message);
  });
  
  req.write(postData);
  req.end();
}
