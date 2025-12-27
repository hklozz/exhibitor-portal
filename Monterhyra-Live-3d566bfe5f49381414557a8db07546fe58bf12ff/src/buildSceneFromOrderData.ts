// Bygg upp en THREE.Scene från orderData (förenklad, utbyggbar)
import * as THREE from 'three';


export function buildSceneFromOrderData(orderData: any): THREE.Scene {
  const scene = new THREE.Scene();

  // --- Golv och matta ---
  if (orderData.floorSize) {
    const { width, depth } = orderData.floorSize;
    // Golvplatta (vit/grå)
    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.05, depth),
      new THREE.MeshStandardMaterial({ color: 0xf8f9fa })
    );
    floor.position.y = -0.025;
    scene.add(floor);

    // Matta (om vald)
    if (orderData.carpetColor) {
      let mattaColor = orderData.carpetColor;
      // Hantera rutmönster (checkerboard)
      if (typeof mattaColor === 'string' && mattaColor.startsWith('checkerboard-')) {
        // Endast enkel svart/vit för export (DAE/STL har ej texturer)
        mattaColor = 0xcccccc;
      }
      const carpet = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.01, depth),
        new THREE.MeshStandardMaterial({ color: mattaColor })
      );
      carpet.position.y = 0.01;
      scene.add(carpet);
    }
  }

  // --- Väggar ---
  if (orderData.wallConfig && orderData.floorSize) {
    const { shape } = orderData.wallConfig;
    const floorSize = orderData.floorSize;

    if (shape === 'straight') {
      // Huvudvägg (bakvägg)
      const backWall = new THREE.Mesh(
        new THREE.BoxGeometry(floorSize.width, 2.5, 0.15),
        new THREE.MeshStandardMaterial({ color: 0xf8f9fa })
      );
      backWall.position.set(0, 1.25, -floorSize.length/2);
      scene.add(backWall);
    } else if (shape === 'l') {
      // Bakvägg
      const backWall = new THREE.Mesh(
        new THREE.BoxGeometry(floorSize.width, 2.5, 0.15),
        new THREE.MeshStandardMaterial({ color: 0xf8f9fa })
      );
      backWall.position.set(0, 1.25, -floorSize.length/2);
      scene.add(backWall);

      // Sidovägg (vänster)
      const leftWall = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 2.5, floorSize.length),
        new THREE.MeshStandardMaterial({ color: 0xf8f9fa })
      );
      leftWall.position.set(-floorSize.width/2, 1.25, 0);
      scene.add(leftWall);
    } else if (shape === 'u') {
      // Bakvägg
      const backWall = new THREE.Mesh(
        new THREE.BoxGeometry(floorSize.width, 2.5, 0.15),
        new THREE.MeshStandardMaterial({ color: 0xf8f9fa })
      );
      backWall.position.set(0, 1.25, -floorSize.length/2);
      scene.add(backWall);

      // Vänster sidovägg
      const leftWall = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 2.5, floorSize.length),
        new THREE.MeshStandardMaterial({ color: 0xf8f9fa })
      );
      leftWall.position.set(-floorSize.width/2, 1.25, 0);
      scene.add(leftWall);

      // Höger sidovägg
      const rightWall = new THREE.Mesh(
        new THREE.BoxGeometry(0.15, 2.5, floorSize.length),
        new THREE.MeshStandardMaterial({ color: 0xf8f9fa })
      );
      rightWall.position.set(floorSize.width/2, 1.25, 0);
      scene.add(rightWall);
    }
  }

  // --- Möbler ---
  if (Array.isArray(orderData.furniture)) {
    orderData.furniture.forEach((item: any) => {
      let mesh: THREE.Mesh | null = null;
      let color = item.color || 0xcccccc;
      if (item.type === 'barbord') {
        mesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.3, 0.3, 1.1, 16),
          new THREE.MeshStandardMaterial({ color })
        );
      } else if (item.type === 'barstol' || item.type === 'pall') {
        mesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, 0.2, 0.5, 12),
          new THREE.MeshStandardMaterial({ color })
        );
      } else if (item.type === 'soffa' || item.type === 'fatolj') {
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 0.7, 0.6),
          new THREE.MeshStandardMaterial({ color })
        );
      } else if (item.type === 'sidobord') {
        mesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.25, 0.25, 0.4, 12),
          new THREE.MeshStandardMaterial({ color })
        );
      }
      if (mesh) {
        mesh.position.set(item.position?.x || 0, 0.35, item.position?.z || 0);
        scene.add(mesh);
      }
    });
  }

  // --- Växter ---
  if (Array.isArray(orderData.plants)) {
    orderData.plants.forEach((item: any) => {
      const potColor = item.potColor || 0x8B5A2B;
      const leafColor = item.leafColor || 0x228B22;
      const pot = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.18, 0.2, 10),
        new THREE.MeshStandardMaterial({ color: potColor })
      );
      pot.position.set(item.position?.x || 0, 0.1, item.position?.z || 0);
      scene.add(pot);
      const plant = new THREE.Mesh(
        new THREE.ConeGeometry(0.25, 0.6, 10),
        new THREE.MeshStandardMaterial({ color: leafColor })
      );
      plant.position.set(item.position?.x || 0, 0.5, item.position?.z || 0);
      scene.add(plant);
    });
  }

  // --- Truss ---
  if (Array.isArray(orderData.truss)) {
    orderData.truss.forEach((item: any) => {
      const trussColor = item.color || 0xaaaaaa;
      if (item.type === 'front-straight') {
        const truss = new THREE.Mesh(
          new THREE.BoxGeometry(2, 0.2, 0.2),
          new THREE.MeshStandardMaterial({ color: trussColor })
        );
        truss.position.set(0, 2.5, 0);
        scene.add(truss);
      }
      // Fler truss-typer kan läggas till här
    });
  }

  // --- TV ---
  if (Array.isArray(orderData.tvs)) {
    orderData.tvs.forEach((item: any) => {
      const tvColor = item.color || 0x222244;
      if (item.width && item.height) {
        const tv = new THREE.Mesh(
          new THREE.BoxGeometry(item.width, item.height, 0.05),
          new THREE.MeshStandardMaterial({ color: tvColor })
        );
        tv.position.set(item.position?.x || 0, 1.5, item.position?.z || 0);
        scene.add(tv);
      }
    });
  }

  // --- Diskar/counters ---
  if (Array.isArray(orderData.counters)) {
    orderData.counters.forEach((item: any) => {
      const counterColor = item.color || 0xffe4b5;
      const mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 0.5),
        new THREE.MeshStandardMaterial({ color: counterColor })
      );
      mesh.position.set(item.position?.x || 0, 0.5, item.position?.z || 0);
      scene.add(mesh);
    });
  }

  // --- Förråd/storages ---
  if (Array.isArray(orderData.storages)) {
    orderData.storages.forEach((item: any) => {
      const storageColor = item.color || 0xffffff;
      const storageHeight = orderData.wallConfig?.height || 2.5;
      const wallThickness = 0.1;

      // Storage dimensions based on type (simplified mapping)
      let width = 1;
      let depth = 1;
      if (item.type === 1) { width = 1; depth = 1; } // 1x1m
      else if (item.type === 2) { width = 2; depth = 1; } // 2x1m
      else if (item.type === 3) { width = 3; depth = 1; } // 3x1m
      else if (item.type === 4) { width = 4; depth = 1; } // 4x1m

      // Storage floor
      const floorMesh = new THREE.Mesh(
        new THREE.BoxGeometry(width, 0.06, depth),
        new THREE.MeshStandardMaterial({ color: storageColor })
      );
      floorMesh.position.set(item.position?.x || 0, 0.03, item.position?.z || 0);
      if (item.rotation) {
        floorMesh.rotation.y = item.rotation * Math.PI / 180;
      }
      scene.add(floorMesh);

      // Storage walls (back, left, right, front)
      // Back wall
      const backWall = new THREE.Mesh(
        new THREE.BoxGeometry(width, storageHeight, wallThickness),
        new THREE.MeshStandardMaterial({ color: storageColor })
      );
      backWall.position.set(item.position?.x || 0, storageHeight/2, (item.position?.z || 0) - depth/2 + wallThickness/2);
      if (item.rotation) {
        backWall.rotation.y = item.rotation * Math.PI / 180;
      }
      scene.add(backWall);

      // Left wall
      const leftWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, storageHeight, depth),
        new THREE.MeshStandardMaterial({ color: storageColor })
      );
      leftWall.position.set((item.position?.x || 0) - width/2 + wallThickness/2, storageHeight/2, item.position?.z || 0);
      if (item.rotation) {
        leftWall.rotation.y = item.rotation * Math.PI / 180;
      }
      scene.add(leftWall);

      // Right wall
      const rightWall = new THREE.Mesh(
        new THREE.BoxGeometry(wallThickness, storageHeight, depth),
        new THREE.MeshStandardMaterial({ color: storageColor })
      );
      rightWall.position.set((item.position?.x || 0) + width/2 - wallThickness/2, storageHeight/2, item.position?.z || 0);
      if (item.rotation) {
        rightWall.rotation.y = item.rotation * Math.PI / 180;
      }
      scene.add(rightWall);

      // Front wall
      const frontWall = new THREE.Mesh(
        new THREE.BoxGeometry(width, storageHeight, wallThickness),
        new THREE.MeshStandardMaterial({ color: storageColor })
      );
      frontWall.position.set(item.position?.x || 0, storageHeight/2, (item.position?.z || 0) + depth/2 - wallThickness/2);
      if (item.rotation) {
        frontWall.rotation.y = item.rotation * Math.PI / 180;
      }
      scene.add(frontWall);
    });
  }

  // --- Dekorationer ---
  if (Array.isArray(orderData.decorations)) {
    orderData.decorations.forEach((item: any) => {
      const decoColor = item.color || 0xff69b4;
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.15, 12, 8),
        new THREE.MeshStandardMaterial({ color: decoColor })
      );
      mesh.position.set(item.position?.x || 0, 1, item.position?.z || 0);
      scene.add(mesh);
    });
  }

  // --- Lampor och belysning ---
  if (Array.isArray(orderData.lights)) {
    orderData.lights.forEach((item: any) => {
      const lampColor = item.color || 0xffffcc;
      const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.08, 10, 8),
        new THREE.MeshStandardMaterial({ color: lampColor, emissive: lampColor, emissiveIntensity: 0.7 })
      );
      mesh.position.set(item.position?.x || 0, item.position?.y || 2.5, item.position?.z || 0);
      scene.add(mesh);
    });
  }

  // --- Ljus (ambient/directional) ---
  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 7.5);
  scene.add(light);

  console.log('Antal objekt i scenen:', scene.children.length);
  return scene;
}

