// /app/api/meshygltf/route.js
export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");
  
    if (!url) {
      return new Response("Missing URL", { status: 400 });
    }
  
    try {
      const res = await fetch(url);
      const buffer = await res.arrayBuffer();
  
      return new Response(buffer, {
        headers: {
          "Content-Type": "model/gltf-binary",
          "Cache-Control": "public, max-age=86400"
        }
      });
    } catch (err) {
      console.error("GLB 프록시 실패:", err);
      return new Response("Failed to proxy GLB", { status: 500 });
    }
  }
  