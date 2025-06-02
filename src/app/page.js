"use client";

// Tailwind 기반 UI + Ready Player Me 연동 준비 + Three.js 표시 위치
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export default function UploadFantasyPhoto() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [resultImage, setResultImage] = useState('');
  const [modelUrl, setModelUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const uploaded = e.target.files?.[0];
    if (uploaded) {
      setFile(uploaded);
      setPreviewUrl(URL.createObjectURL(uploaded));
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
  
    try {
      // Step 1: Upload original photo to Cloudinary
      // const formData = new FormData();
      // formData.append('file', file);
      // formData.append('upload_preset', 'ml_default');
  
      // const uploadRes = await axios.post('https://api.cloudinary.com/v1_1/dcbzon77z/image/upload', formData);
      // const imageUrl = uploadRes.data.secure_url;
      // console.log('Uploaded image URL:', imageUrl);
  
      // Step 2: Request AI style conversion via Replicate (proxy to /api/replicate)
      const replicateRes = await axios.post('/api/replicate', {
        image: "https://res.cloudinary.com/dcbzon77z/image/upload/v1748761671/KakaoTalk_Photo_2025-06-01-15-09-33_zbimaj.jpg",
      });

      
      console.log('Replicate response:', replicateRes);
      console.log('outputImage:', replicateRes.data.imgae);
      const {image} = replicateRes.data;
      console.log('image:', replicateRes.data['image']);
      setResultImage(replicateRes.data['image']);
      // setResultImage(outputImage);
  
      // Step 4: Placeholder 3D model load (replace with your real ReadyPlayerMe URL)
      const readyPlayerMeUrl = 'https://models.readyplayer.me/YOUR_AVATAR_ID.glb';
      setModelUrl(readyPlayerMeUrl);
    } catch (err) {
      console.error('Error during upload or processing:', err);
      alert('Something went wrong. Check console for details.');
    } finally {
      setLoading(false);
    }
  };
  
  

  useEffect(() => {
    if (!modelUrl) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('threeCanvas') });
    renderer.setSize(600, 400);

    const light = new THREE.HemisphereLight(0xffffff, 0x444444);
    light.position.set(0, 20, 0);
    scene.add(light);

    const loader = new GLTFLoader();
    loader.load(modelUrl, (gltf) => {
      const model = gltf.scene;
      scene.add(model);
      camera.position.z = 2;

      function animate() {
        requestAnimationFrame(animate);
        model.rotation.y += 0.01;
        renderer.render(scene, camera);
      }

      animate();
    });
  }, [modelUrl]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-center mb-8">
          Fantasy 3D Avatar Generator
        </h1>

        <div className="bg-zinc-900 rounded-xl shadow-lg p-6 space-y-6">
          <div>
            <label className="block font-medium mb-2">Upload your photo</label>
            <input type="file" accept="image/*" onChange={handleFileChange} className="file-input file-input-bordered w-full" />
          </div>

          {previewUrl && (
            <div className="flex justify-center">
              <img src={previewUrl} alt="Preview" className="rounded-lg max-h-64 object-contain" />
            </div>
          )}

          <div className="text-center">
            <button
              onClick={handleUpload}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-md"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Generate Avatar'}
            </button>
          </div>

            <div className="text-center">
              <h2 className="text-xl font-semibold mt-4 mb-2">Styled Image Result</h2>
              <img src={resultImage} alt="Result" className="rounded-lg mx-auto max-h-64" />
            </div>
          {/* {resultImage && (
          )} */}
        </div>

        <div className="mt-12 bg-zinc-800 rounded-xl shadow-lg p-4">
          <h2 className="text-xl font-semibold mb-2 text-center">3D Model Viewer</h2>
          <canvas id="threeCanvas" className="w-full h-[400px] rounded-lg" />
        </div>
      </div>
    </div>
  );
}
