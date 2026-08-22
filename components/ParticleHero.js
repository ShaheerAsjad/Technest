'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const PARTICLE_COUNT = 90;
const CONNECTION_DISTANCE = 14;
const MAX_CONNECTIONS_PER_NODE = 4;

export default function ParticleHero() {
  const mountRef = useRef(null);
  const frameRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const scrollRef = useRef(0);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth;
    const H = mount.clientHeight;

    /* ── Renderer ── */
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    /* ── Scene & Camera ── */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 500);
    camera.position.set(0, 0, 38);

    /* ─────────────────────────────────────────────────────────────
        PARTICLES & CONNECTIONS (Neon Orange theme)
    ───────────────────────────────────────────────────────────── */
    const particlePositions = [];
    const particleVelocities = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particlePositions.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 70,
          (Math.random() - 0.5) * 40 + 4,   // offset upward slightly
          (Math.random() - 0.5) * 20
        )
      );
      particleVelocities.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 0.025,
          (Math.random() - 0.5) * 0.018,
          0
        )
      );
    }

    /* Point cloud */
    const ptGeometry = new THREE.BufferGeometry();
    const ptPositions = new Float32Array(PARTICLE_COUNT * 3);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      ptPositions[i * 3] = particlePositions[i].x;
      ptPositions[i * 3 + 1] = particlePositions[i].y;
      ptPositions[i * 3 + 2] = particlePositions[i].z;
    }
    ptGeometry.setAttribute('position', new THREE.BufferAttribute(ptPositions, 3));

    const ptMaterial = new THREE.PointsMaterial({
      color: 0xFF6600, // Neon Orange
      size: 0.28,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
    });
    const pointCloud = new THREE.Points(ptGeometry, ptMaterial);
    scene.add(pointCloud);

    /* Connection lines (circuit network) */
    const lineGeometry = new THREE.BufferGeometry();
    const MAX_LINE_VERTS = PARTICLE_COUNT * MAX_CONNECTIONS_PER_NODE * 2;
    const linePositions = new Float32Array(MAX_LINE_VERTS * 3);
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    lineGeometry.setDrawRange(0, 0);

    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xFF4500, // Darker neon orange
      transparent: true,
      opacity: 0.25,
    });
    const lineSegments = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lineSegments);

    /* ─────────────────────────────────────────────────────────────
        NEON ORANGE SUN ARC
    ───────────────────────────────────────────────────────────── */
    const sunGroup = new THREE.Group();
    sunGroup.position.set(0, -20, -10);

    const createGlowSphere = (radius, color, opacity) => {
      const g = new THREE.SphereGeometry(radius, 32, 32);
      const m = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false });
      return new THREE.Mesh(g, m);
    };

    sunGroup.add(createGlowSphere(9.5, 0xFF2200, 0.04));   // outer aura
    sunGroup.add(createGlowSphere(8, 0xFF3300, 0.08));   // mid glow
    sunGroup.add(createGlowSphere(6.2, 0xFF4500, 0.15));   // inner glow
    sunGroup.add(createGlowSphere(4.5, 0xFF6600, 0.35));   // core

    const arcGeo = new THREE.TorusGeometry(10, 0.07, 12, 240, Math.PI);
    const arcMat = new THREE.MeshBasicMaterial({ color: 0xFF8800, transparent: true, opacity: 0.95 });
    const arc = new THREE.Mesh(arcGeo, arcMat);
    arc.rotation.z = Math.PI;
    sunGroup.add(arc);

    const arcGeo2 = new THREE.TorusGeometry(10, 0.22, 8, 240, Math.PI);
    const arcMat2 = new THREE.MeshBasicMaterial({ color: 0xFF4500, transparent: true, opacity: 0.25 });
    const arc2 = new THREE.Mesh(arcGeo2, arcMat2);
    arc2.rotation.z = Math.PI;
    sunGroup.add(arc2);

    scene.add(sunGroup);

    /* ─────────────────────────────────────────────────────────────
        GRID FLOOR
    ───────────────────────────────────────────────────────────── */
    const gridHelper = new THREE.GridHelper(100, 28, 0x1f0b00, 0x140500);
    gridHelper.position.y = -18;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.45;
    scene.add(gridHelper);

    /* ─────────────────────────────────────────────────────────────
        AMBIENT SMALL STARS
    ───────────────────────────────────────────────────────────── */
    const starCount = 200;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 200;
      starPos[i * 3 + 1] = (Math.random() - 0.5) * 120;
      starPos[i * 3 + 2] = (Math.random() - 0.5) * 80 - 30;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({ color: 0xffa07a, size: 0.12, transparent: true, opacity: 0.5 });
    scene.add(new THREE.Points(starGeo, starMat));

    /* ─────────────────────────────────────────────────────────────
        EVENT LISTENERS
    ───────────────────────────────────────────────────────────── */
    const onMouseMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = -(e.clientY / window.innerHeight - 0.5) * 2;
    };
    const onScroll = () => {
      scrollRef.current = window.scrollY;
    };
    const onResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);

    /* ─────────────────────────────────────────────────────────────
        ANIMATION LOOP
    ───────────────────────────────────────────────────────────── */
    let time = 0;

    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      time += 0.008;

      const posArr = pointCloud.geometry.attributes.position.array;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particlePositions[i].add(particleVelocities[i]);

        if (Math.abs(particlePositions[i].x) > 35) particleVelocities[i].x *= -1;
        if (Math.abs(particlePositions[i].y - 4) > 20) particleVelocities[i].y *= -1;

        posArr[i * 3] = particlePositions[i].x;
        posArr[i * 3 + 1] = particlePositions[i].y;
        posArr[i * 3 + 2] = particlePositions[i].z;
      }
      pointCloud.geometry.attributes.position.needsUpdate = true;

      let lineVertCount = 0;
      const linePosArr = lineSegments.geometry.attributes.position.array;
      const connectionCount = new Array(PARTICLE_COUNT).fill(0);

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        if (connectionCount[i] >= MAX_CONNECTIONS_PER_NODE) continue;
        for (let j = i + 1; j < PARTICLE_COUNT; j++) {
          if (connectionCount[i] >= MAX_CONNECTIONS_PER_NODE) break;
          if (connectionCount[j] >= MAX_CONNECTIONS_PER_NODE) continue;
          if (lineVertCount * 3 >= MAX_LINE_VERTS * 3 - 6) break;

          const dist = particlePositions[i].distanceTo(particlePositions[j]);
          if (dist < CONNECTION_DISTANCE) {
            const idx = lineVertCount * 3;
            linePosArr[idx] = particlePositions[i].x;
            linePosArr[idx + 1] = particlePositions[i].y;
            linePosArr[idx + 2] = particlePositions[i].z;
            linePosArr[idx + 3] = particlePositions[j].x;
            linePosArr[idx + 4] = particlePositions[j].y;
            linePosArr[idx + 5] = particlePositions[j].z;
            lineVertCount += 2;
            connectionCount[i]++;
            connectionCount[j]++;
          }
        }
      }
      lineSegments.geometry.attributes.position.needsUpdate = true;
      lineSegments.geometry.setDrawRange(0, lineVertCount);

      const pulse = 0.85 + Math.sin(time * 1.8) * 0.15;
      sunGroup.children.forEach((child, idx) => {
        if (child.material) {
          const baseOpacities = [0.04, 0.08, 0.15, 0.35, 0.95, 0.25];
          child.material.opacity = baseOpacities[idx] * pulse;
        }
      });
      sunGroup.position.y = -20 + Math.sin(time * 0.6) * 0.3;

      /* — Enhanced 3D Parallax on Mouse Movement — */
      camera.position.x += (mouseRef.current.x * 16 - camera.position.x) * 0.06;
      camera.position.y += (mouseRef.current.y * 10 + scrollRef.current * 0.01 - camera.position.y) * 0.06;
      
      // Subtle 3D tilt of the scene
      scene.rotation.y = mouseRef.current.x * 0.12;
      scene.rotation.x = -mouseRef.current.y * 0.08;

      camera.lookAt(0, 0, 0);

      gridHelper.position.x = -camera.position.x * 0.3;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      ptGeometry.dispose();
      ptMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}