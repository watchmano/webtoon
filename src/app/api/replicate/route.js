import Replicate from "replicate";
const replicate = new Replicate();
import { writeFile } from "fs/promises";

export async function POST(req) {
    const body = await req.json();
    const { image } = body;
    console.log('image:', image);
    // const response = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions', {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
    //     'Content-Type': 'application/json',
    //     'Prefer': 'wait'
    //   },
    //   body: JSON.stringify({
    //     input: {
    //       prompt: "Make this a 90s cartoon",
    //       input_image: image
    //     }
    //   })
    // });
    
    // if (!response.ok) {
    //   const errorText = await response.text();
    //   console.error('Replicate request failed:', response.status, errorText);
    //   process.exit(1);
    // }
    
    // const result = await response.json();
    // console.log('----------------------------------------');
    // console.log('Replicate result:', result.output);
    // console.log('----------------------------------------');
    // const cartoonImageUrl = await fetch(result.output);
    // const cartoonImageUrl = await fetch("https://replicate.delivery/xezq/CnnDU5e3N7y3Z6kOK9BG0POnTRhFi2Q5ZLGt3DQjrpBa5XZKA/tmpwqye5mei.png");
    const cartoonImageUrl = await fetch(image);
    // const cartoonImageUrl = await fetch("https://res.cloudinary.com/dcbzon77z/image/upload/w_512,h_512,c_limit/KakaoTalk_Photo_2025-06-01-15-09-33_jwxyvm.jpg");
    // const cartoonImageRes = await fetch(cartoonImageUrl);
    
    const cartoonImageArrayBuffer = await cartoonImageUrl.arrayBuffer();
    const imageBase64 = Buffer.from(cartoonImageArrayBuffer).toString("base64");
    const pureBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');


    const userRes = await fetch("https://demo.readyplayer.me/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });


    
    const { data: { id: userId, token } } = await userRes.json();

    const avatarDraftRes = await fetch("https://api.readyplayer.me/v2/avatars", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        data: {

          userId,
          partner: "webtoon-booyrh",
          bodyType: "fullbody",
          base64Image: imageBase64,
          // base64Image: `data:image/png;base64,${pureBase64}`,
          gender: "male",
          assets: {
            body: {}  // ✅ 이 형태로 보내야 함
          }
        }
        
      })
    });
    
    const draftResult = await avatarDraftRes.json();
    console.log('----------------------------------------');
    console.log('errorerrorerrorerrorerror:', draftResult);
    console.log('----------------------------------------');
    // if (!avatarDraftRes.ok) {
    //   const error = await avatarDraftRes.text();
    //   return new Response(error, { status: avatarDraftRes.status });
    // }
  
    const avatarId = draftResult.id || draftResult.data?.id;
  
    // 5. 아바타 저장
    const saveRes = await fetch(`https://api.readyplayer.me/v2/avatars/${avatarId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('----------------------------------------');
    console.log('saveRes:', saveRes);
    
    return Response.json({
      glbUrl: `https://models.readyplayer.me/${avatarId}.glb`,
      // styledImage: cartoonImageUrl,
      // image: result.output
      // image: result.output
      styledImage: image,  // 또는 cartoonImageUrl
      image: image  
    });
    

    
  }
  
  

  

