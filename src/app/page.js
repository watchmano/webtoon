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
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'ml_default');
  
      const uploadRes = await axios.post('https://api.cloudinary.com/v1_1/dcbzon77z/image/upload', formData);
      
      const imageUrl = uploadRes.data.secure_url;
      console.log('Uploaded image URL:', imageUrl);
      const resizedUrl = `https://res.cloudinary.com/dcbzon77z/image/upload/w_512,h_512,c_limit/${uploadRes.data.public_id}.jpg`;

      console.log('Resized image URL:', resizedUrl);
      
      const replicateRes = await axios.post('/api/replicate', {
        image: imageUrl,
      });

      
      
      setResultImage(replicateRes.data['styledImage']);
      
      // const readyPlayerMeUrl = 'https://assets.meshy.ai/94d12768-c46a-44d9-b02b-314ae592b5f5/tasks/0197337f-4480-7e0e-a2b4-6f6c01185d2a/output/model.glb?Expires=1749175195&Signature=QlzPbPy~gNex3DWIIxOcAY97Ak8cb0ar2thaU-mRXNf1uPZPZ6JRRfPRqoLfWSHB2vsgzfDxc6-uIiwXg7IRm0c3xUtqFq8HYJGlMBwcll2Rww79Jh8866DNGESdKlZ93ILnfXcSc7dwwiaocrJMNBdKYDhL4cYlFfnpsHNYuLrKBXANSVKHG11U~eXnX~pBXIbUFJKyLrxf5s4LskL-I~HGIJMMd555CQkLlJ39wXya8BcHGs5ZVoBOQ3aPBxNz9W2Iw4t52juq22XJ9ihyroO2XVwoDrO1IQXnKqkfT5UpYZD6N9sxGKGw6xglk6MVH8w0OgCP6rB~6bBf6ghHcA__&Key-Pair-Id=KL5I0C8H7HX83';
      const readyPlayerMeUrl = replicateRes.data['glbUrl'];
      const proxyUrl = `/api/meshygltf?url=${encodeURIComponent(readyPlayerMeUrl)}`;
      setModelUrl(proxyUrl);


    } catch (err) {
      console.error('Error during upload or processing:', err);
      alert('Something went wrong. Check console for details.');
    } finally {
      setLoading(false);
    }
  };
  
  
  useEffect(() => {
    if (!modelUrl) return;
  
    console.log('Loading 3D model from URL:', modelUrl);
    const canvas = document.getElementById('threeCanvas');
    const scene = new THREE.Scene();
  
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 0, 3.5);  // 👈 낮고 가까움
    camera.lookAt(0, 0.1, 0);          // 👈 완전 정면
  
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(600, 400);
    renderer.setClearColor(0xf0f0f0);
    renderer.shadowMap.enabled = true;
  
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.2);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);
  
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(3, 10, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);
  
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.MeshStandardMaterial({ color: 0xf0f0f0 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1.2;
    ground.receiveShadow = true;
    scene.add(ground);
  
    const loader = new GLTFLoader();
    loader.load(modelUrl, (gltf) => {
      const model = gltf.scene;
      model.position.y = 0.;
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
  
      scene.add(model);
  
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
