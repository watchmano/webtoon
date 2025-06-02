import Replicate from "replicate";
const replicate = new Replicate();

export async function POST(req) {
  const body = await req.json();
  const { image } = body;
  console.log('image:', image);

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
        prompt: "Make this a zibri studio style",
        input_image: image
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Replicate request failed:', response.status, errorText);
    return new Response(errorText, { status: response.status });
  }

  const result = await response.json();
  const styledImageUrl = result.output;

  console.log('Replicate cartoon image URL:', styledImageUrl);

  // 2. 스타일링된 이미지 가져와서 Base64 인코딩
  // const cartoonImageRes = await fetch(image);
  const cartoonImageRes = await fetch(styledImageUrl);
  const cartoonImageBuffer = await cartoonImageRes.arrayBuffer();
  const imageBase64 = Buffer.from(cartoonImageBuffer).toString("base64");

  // 3. Ready Player Me 사용자 생성
  const userRes = await fetch("https://demo.readyplayer.me/api/users", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    }
  });

  const { data: { id: userId, token } } = await userRes.json();

  // 4. 아바타 드래프트 생성
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
        gender: "male",
        assets: {
          body: {}
        }
      }
    })
  });

  const draftResult = await avatarDraftRes.json();

  if (!avatarDraftRes.ok) {
    console.error('Ready Player Me avatar draft error:', draftResult);
    return new Response(JSON.stringify(draftResult), { status: avatarDraftRes.status });
  }

  const avatarId = draftResult.id || draftResult.data?.id;

  // 5. 아바타 저장
  await fetch(`https://api.readyplayer.me/v2/avatars/${avatarId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  // 6. 최종 응답
  return Response.json({
    glbUrl: `https://models.readyplayer.me/${avatarId}.glb`,
    styledImage: styledImageUrl,
    image: styledImageUrl  // 원본 업로드 이미지
  });
}
