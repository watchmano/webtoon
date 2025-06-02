import Replicate from "replicate";
const replicate = new Replicate();
import { writeFile } from "fs/promises";

export async function POST(req) {
    const body = await req.json();
    const { image } = body;
  
    const response = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait'
      },
      body: JSON.stringify({
        input: {
          prompt: "Make this a 90s cartoon",
          input_image: image
        }
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Replicate request failed:', response.status, errorText);
      process.exit(1);
    }
    
    const result = await response.json();
    console.log('Replicate result:', result.output);
    return Response.json({ image: result.output });

    
  }
  
  

  

