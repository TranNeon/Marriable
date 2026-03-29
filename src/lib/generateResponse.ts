import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: 'unnecessary', // This is the default and can be omitted
    baseURL: 'http://localhost:8081/v1',

});

const response = await client.responses.create({
  model: 'gpt-5.2', //ommited
  instructions: 'You are a coding assistant that talks like a pirate',
  input: 'Are semicolons optional in JavaScript?',
});

console.log(response.output_text);