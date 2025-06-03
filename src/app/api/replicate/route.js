import Replicate from "replicate";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const replicate = new Replicate();

export async function POST(req) {
  const body = await req.json();
  const { image } = body;
  console.log('✅ 입력 이미지 URL:', image);

  // 1. Replicate로 이미지 변환 요청
  const response = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
      
      'Content-Type': 'application/json',
      'Prefer': 'wait'
    },
    body: JSON.stringify({
      input: {
        prompt: "Make this a full body cartoon style cat standing upright, plain background, high color contrast",
        input_image: image
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('❌ Replicate 실패:', response.status, errorText);
    return new Response(errorText, { status: response.status });
  }

  const result = await response.json();
  const styledImageUrl = result.output;
  // const styledImageUrl = image;
  console.log('🎨 카툰화된 이미지 URL:', styledImageUrl);

  // 2. 스타일링된 이미지 → base64 인코딩
  const cartoonImageRes = await fetch(styledImageUrl);
  const cartoonImageBuffer = await cartoonImageRes.arrayBuffer();
  const imageBase64 = Buffer.from(cartoonImageBuffer).toString("base64");

  // 3. Meshy에 3D 모델 생성 요청
  const meshyHeaders = {
    // Authorization: `Bearer ${process.env.MESHY_API_KEY}`,
    Authorization: `Bearer ${process.env.MESHY_API_KEY_DUMMY}`,
    "Content-Type": "application/json"
  };

  let taskId;
  try {
    const taskRes = await axios.post(
      'https://api.meshy.ai/openapi/v1/image-to-3d',
      {
        image_url: `data:image/png;base64,${imageBase64}`,
        enable_pbr: true,
        should_remesh: true,
        should_texture: true,
        ai_model: 'meshy-4',  // PBR 사용을 위해 반드시 meshy-4
        topology: 'triangle'
      },
      { headers: meshyHeaders }
    );

    taskId = taskRes.data.result;
    console.log('📤 Meshy 작업 생성됨. Task ID:', taskId);
  } catch (error) {
    console.error('❌ Meshy 작업 생성 실패:', error.response?.data || error.message);
    return new Response("Failed to start Meshy task", { status: 500 });
  }

  // 4. Meshy 작업 완료될 때까지 대기
  let modelUrl;
  try {
    while (true) {
      const statusRes = await axios.get(
        `https://api.meshy.ai/openapi/v1/image-to-3d/${taskId}`,
        { headers: meshyHeaders }
      );

      const { status, model_urls, progress } = statusRes.data;
      console.log(`⌛ Meshy 상태: ${status} (${progress}%)`);
      

      if (status === 'SUCCEEDED') {
        modelUrl = model_urls.glb;
        break;
      }
      if (status === 'FAILED') {
        throw new Error("Meshy task failed");
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  } catch (error) {
    console.error('❌ Meshy 작업 처리 중 오류:', error.message);
    return new Response("Meshy generation failed", { status: 500 });
  }

  console.log('✅ 최종 GLB 모델 주소:', modelUrl);

  // 5. 최종 응답
  return Response.json({
    glbUrl: modelUrl,
    styledImage: styledImageUrl,
    image: styledImageUrl
  });
}
