

// // downloadAndConvertToBase64.js
// import fs from 'fs';
// import fetch from 'node-fetch';

// const imageUrl = 'https://replicate.delivery/xezq/8kKwatZ2qRZ3BRkXZFxEchSHABzNCvIanmunlYIggeUNSeyUA/tmpzhzy5ugn.png'

// async function run() {
//   const res = await fetch(imageUrl);
//   const buffer = await res.arrayBuffer();

//   const base64 = Buffer.from(buffer).toString('base64');

//   // 텍스트 파일로 저장
//   fs.writeFileSync('./cartoon_image_base64.txt', base64);
//   console.log('✅ cartoon_image_base64.txt 생성 완료');
// }

// run().catch(console.error);


// test-meshy.js
import axios from 'axios';
import fs from 'fs';
import dotenv from 'dotenv';


dotenv.config({ path: './.env.local' }); // .env.local 파일에서 환경 변수 로드
// base64 이미지 한 장을 Meshy에 전송해서 3D 모델을 생성하고, GLB 링크를 얻는 테스트 코드
const API_KEY = process.env.MESHY_API_KEY_DUMMY;
console.log('MESHY_API_KEY:', API_KEY);
const HEADERS = {
  Authorization: `Bearer ${API_KEY}`,
  'Content-Type': 'application/json'
};

async function submitImageToMeshy(base64Image) {
  const response = await axios.post(
    'https://api.meshy.ai/openapi/v1/image-to-3d',
    {
      image_url: `data:image/png;base64,${base64Image}`,
      enable_pbr: true,
      should_remesh: true,
      should_texture: true,
      ai_model: 'meshy-4',
      topology: 'triangle'
    },
    { headers: HEADERS }
  );

  return response.data.result; // taskId
}

async function waitForMeshyResult(taskId) {
  while (true) {
    const res = await axios.get(`https://api.meshy.ai/openapi/v1/image-to-3d/${taskId}`, {
      headers: HEADERS
    });

    const status = res.data.status;
    console.log(`⏳ ${status}`);
    if (status === 'SUCCEEDED') return res.data;
    if (status === 'FAILED') throw new Error('❌ Meshy task failed.');

    await new Promise((r) => setTimeout(r, 5000));
  }
}

async function test() {
  const base64Image = fs.readFileSync('./cartoon_image_base64.txt', 'utf-8');

  const taskId = await submitImageToMeshy(base64Image);
  const result = await waitForMeshyResult(taskId);

  console.log('✅ Final GLB URL:', result.model_urls.glb);
}

test().catch(console.error);
