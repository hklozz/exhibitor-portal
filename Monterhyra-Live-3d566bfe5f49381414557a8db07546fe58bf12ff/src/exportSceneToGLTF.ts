import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';

// GLTF/GLB export funktion
export function exportSceneToGLTF(scene: THREE.Scene | THREE.Group, filename: string, binary: boolean = true): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      console.log('🚀 Starting GLTF export...');

      const exporter = new GLTFExporter();

      const options = {
        binary: binary, // true = .glb, false = .gltf + separata filer
        embedImages: true, // Bädda in texturer i filen
        includeCustomExtensions: false
      };

      exporter.parse(
        scene,
        (result) => {
          try {
            console.log('📦 GLTF export successful, creating blob...');

            let blob: Blob;
            let finalFilename: string;

            if (binary) {
              // GLB format (binärt)
              blob = new Blob([result as ArrayBuffer], { type: 'application/octet-stream' });
              finalFilename = filename.replace(/\.(obj|gltf?)$/i, '.glb');
              console.log('📦 Created GLB blob:', blob.size, 'bytes');
            } else {
              // GLTF format (JSON + separata filer)
              const gltfData = JSON.stringify(result, null, 2);
              blob = new Blob([gltfData], { type: 'application/json' });
              finalFilename = filename.replace(/\.(obj|glb)$/i, '.gltf');
              console.log('📦 Created GLTF blob:', blob.size, 'bytes');
            }

            // Skapa nedladdningslänk
            const gltfUrl = URL.createObjectURL(blob);
            const gltfLink = document.createElement('a');
            gltfLink.href = gltfUrl;
            gltfLink.download = finalFilename;
            gltfLink.style.display = 'none';
            document.body.appendChild(gltfLink);
            gltfLink.click();
            document.body.removeChild(gltfLink);
            URL.revokeObjectURL(gltfUrl);

            console.log('✅ GLTF download completed');

            // Räkna meshes för feedback
            let meshCount = 0;
            scene.traverse((child) => {
              if (child instanceof THREE.Mesh) meshCount++;
            });

            const format = binary ? 'GLB' : 'GLTF';
            const message = `${format}-export klar!\n\n📄 ${finalFilename} (${blob.size} bytes)\nObjekt: ${meshCount}\nFormat: ${format}`;
            console.log('📢 Showing alert:', message);
            alert(message);

            resolve(finalFilename);

          } catch (error) {
            console.error('❌ Error creating GLTF blob:', error);
            reject(error);
          }
        },
        (error) => {
          console.error('❌ GLTF export failed:', error);
          reject(error);
        },
        options
      );

    } catch (error) {
      console.error('❌ GLTF export setup failed:', error);
      reject(error);
    }
  });
}

// Three.js JSON export - sparar hela scenen som JSON
export function exportSceneToThreeJSON(scene: THREE.Scene | THREE.Group, filename: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      console.log('🚀 Starting Three.js JSON export...');

      // Använd ObjectLoader för att serialisera hela scenen
      const loader = new THREE.ObjectLoader();

      // Serialisera scenen till JSON
      const jsonData = loader.parse(scene.toJSON());
      const jsonString = JSON.stringify(jsonData, null, 2);

      console.log('📦 JSON serialization complete, creating blob...');

      const blob = new Blob([jsonString], { type: 'application/json' });
      const finalFilename = filename.replace(/\.(obj|gltf?|glb)$/i, '.three.json');

      console.log('📦 Created JSON blob:', blob.size, 'bytes');

      // Skapa nedladdningslänk
      const jsonUrl = URL.createObjectURL(blob);
      const jsonLink = document.createElement('a');
      jsonLink.href = jsonUrl;
      jsonLink.download = finalFilename;
      jsonLink.style.display = 'none';
      document.body.appendChild(jsonLink);
      jsonLink.click();
      document.body.removeChild(jsonLink);
      URL.revokeObjectURL(jsonUrl);

      console.log('✅ Three.js JSON download completed');

      // Räkna meshes för feedback
      let meshCount = 0;
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) meshCount++;
      });

      const message = `Three.js JSON-export klar!\n\n📄 ${finalFilename} (${blob.size} bytes)\nObjekt: ${meshCount}\nFormat: Three.js JSON (återanvändbar)`;
      console.log('📢 Showing alert:', message);
      alert(message);

      resolve(finalFilename);

    } catch (error) {
      console.error('❌ Three.js JSON export failed:', error);
      reject(error);
    }
  });
}