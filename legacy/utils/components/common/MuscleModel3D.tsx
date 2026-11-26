import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface MuscleModelProps {
    targetMuscles: string[];
}

const MuscleModel3D: React.FC<MuscleModelProps> = ({ targetMuscles }) => {
    const mountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mountRef.current) return;

        // Setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        mountRef.current.appendChild(renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 2); // Soft white light
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
        directionalLight.position.set(5, 10, 7.5);
        scene.add(directionalLight);

        // Humanoid Group
        const humanoid = new THREE.Group();
        scene.add(humanoid);

        // Materials
        const defaultMat = new THREE.MeshStandardMaterial({ color: 0x112233, wireframe: true, transparent: true, opacity: 0.5 });
        const highlightMat = new THREE.MeshStandardMaterial({ color: 0xff3300, emissive: 0xff0000, emissiveIntensity: 0.8 });

        const getMat = (muscle: string) => targetMuscles.includes(muscle) ? highlightMat : defaultMat;

        // Geometries (Simplified)
        // Torso
        const torsoGeo = new THREE.BoxGeometry(2, 3, 1);
        const torso = new THREE.Mesh(torsoGeo, getMat('core'));
        torso.position.y = 1.5;
        humanoid.add(torso);

        // Chest
        const chestGeo = new THREE.BoxGeometry(2.1, 1, 1.1);
        const chest = new THREE.Mesh(chestGeo, getMat('chest'));
        chest.position.set(0, 2.5, 0);
        humanoid.add(chest);

        // Back
        const backGeo = new THREE.BoxGeometry(2.1, 2, 0.5);
        const back = new THREE.Mesh(backGeo, getMat('back'));
        back.position.set(0, 2, -0.3);
        humanoid.add(back);

        // Shoulders
        const shoulderGeo = new THREE.SphereGeometry(0.6, 16, 16);
        const leftShoulder = new THREE.Mesh(shoulderGeo, getMat('shoulders'));
        leftShoulder.position.set(-1.3, 2.8, 0);
        humanoid.add(leftShoulder);
        const rightShoulder = new THREE.Mesh(shoulderGeo, getMat('shoulders'));
        rightShoulder.position.set(1.3, 2.8, 0);
        humanoid.add(rightShoulder);

        // Arms (Biceps/Triceps)
        const armGeo = new THREE.CylinderGeometry(0.4, 0.3, 1.5, 16);
        const leftArm = new THREE.Mesh(armGeo, getMat('arms'));
        leftArm.position.set(-1.5, 1.5, 0);
        humanoid.add(leftArm);
        const rightArm = new THREE.Mesh(armGeo, getMat('arms'));
        rightArm.position.set(1.5, 1.5, 0);
        humanoid.add(rightArm);

        // Legs (Quads/Hamstrings/Glutes)
        const legGeo = new THREE.CylinderGeometry(0.5, 0.4, 2, 16);
        const leftLeg = new THREE.Mesh(legGeo, getMat('legs'));
        leftLeg.position.set(-0.6, -1, 0);
        humanoid.add(leftLeg);
        const rightLeg = new THREE.Mesh(legGeo, getMat('legs'));
        rightLeg.position.set(0.6, -1, 0);
        humanoid.add(rightLeg);

        // Head
        const headGeo = new THREE.SphereGeometry(0.7, 16, 16);
        const head = new THREE.Mesh(headGeo, defaultMat);
        head.position.set(0, 4, 0);
        humanoid.add(head);

        // Position Camera
        camera.position.z = 8;
        camera.position.y = 1;

        // Animation Loop
        let animationFrameId: number;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            humanoid.rotation.y += 0.01; // Auto rotate
            renderer.render(scene, camera);
        };
        animate();

        // Handle Resize
        const handleResize = () => {
            if (!mountRef.current) return;
            camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
        };
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
            renderer.dispose();
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
        };
    }, [targetMuscles]);

    return <div ref={mountRef} className="w-full h-full min-h-[300px]" />;
};

export default MuscleModel3D;
