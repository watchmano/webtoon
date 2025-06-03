import Replicate from "replicate";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const replicate = new Replicate();

export async function POST(req) {
  const body = await req.json();
  const { image } = body;
  console.log('✅ 입력 이미지 URL:', image);

  // 0. remove.bg로 배경 제거
  let removedBgImageBase64 = "";
  try {
    const removeBgRes = await axios.post(
      "https://api.remove.bg/v1.0/removebg",
      {
        image_url: image,
        size: "auto"
      },
      {
        headers: {
          "X-Api-Key": process.env.REMOVE_BG_API_KEY
        },
        responseType: "arraybuffer"
      }
    );

    const buffer = Buffer.from(removeBgRes.data);
    removedBgImageBase64 = buffer.toString("base64");
    console.log("🧼 remove.bg 처리 완료");
  } catch (error) {
    console.error("❌ remove.bg 실패:", error.response?.data || error.message);
    return new Response("remove.bg failed", { status: 500 });
  }

  // 1. Replicate로 카툰 스타일 변환 요청
  let styledImageUrl = "";
  try {
    const response = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Prefer': 'wait'
      },
      body: JSON.stringify({
        input: {
          prompt: "A full-body cartoon illustration of in studio jibri and Pixar style, front-facing, clean silhouette, flat colors, simplified clothes, natural lighting, no background, high contrast",
          input_image: `data:image/png;base64,${removedBgImageBase64}`
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Replicate 실패:', response.status, errorText);
      return new Response(errorText, { status: response.status });
    }

    const result = await response.json();
    styledImageUrl = result.output;
    console.log('🎨 카툰화된 이미지 URL:', styledImageUrl);
  } catch (err) {
    console.error('❌ Replicate 호출 실패:', err.message);
    return new Response("Replicate failed", { status: 500 });
  }

  // 2. 카툰 이미지 → base64 인코딩
  const cartoonImageRes = await fetch(styledImageUrl);
  const cartoonImageBuffer = await cartoonImageRes.arrayBuffer();
  const imageBase64 = Buffer.from(cartoonImageBuffer).toString("base64");

  // 3. Meshy로 3D 모델 생성 요청
  const meshyHeaders = {
    // Authorization: `Bearer ${process.env.MESHY_API_KEY_DUMMY}`,
    Authorization: `Bearer ${process.env.MESHY_API_KEY}`,
    "Content-Type": "application/json"
  };

  let taskId;
  try {
    const taskRes = await axios.post(
      'https://api.meshy.ai/openapi/v1/image-to-3d',
      {
        image_url: `data:image/png;base64,${imageBase64}`,
        should_remesh: true,
        should_texture: true,
        enable_pbr: true, // ✅ 추가: 물리 기반 텍스처 사용
        ai_model: 'meshy-4',
        topology: 'quad',
        target_polycount: 300000,
        texture_prompt: "Pixar-style cartoon kid, smooth simple color clothes, clean face and eyes, natural skin tone, clear body parts, vibrant color separation"
      },
      { headers: meshyHeaders }
    );

    taskId = taskRes.data.result;
    console.log('📤 Meshy 작업 생성됨. Task ID:', taskId);
  } catch (error) {
    console.error('❌ Meshy 작업 생성 실패:', error.response?.data || error.message);
    return new Response("Failed to start Meshy task", { status: 500 });
  }

  // 4. Meshy 작업 완료 대기
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
    styledImage: styledImageUrl
  });
}
