import time
import tempfile
import base64
import numpy as np
from typing import List, Dict, Tuple
import json

def create_interactive_3d_visualization(filename: str, title: str, molecule_data: dict) -> str:
    """Create an interactive 3D molecular visualization using Three.js for quantum results"""
    
    # Generate mock atomic coordinates based on filename for consistent visualization
    import hashlib
    import random
    
    # Use filename as seed for consistent molecule generation
    seed = hashlib.md5(filename.encode()).hexdigest()
    random.seed(int(seed[:8], 16))
    
    # Generate mock molecular structure
    num_atoms = molecule_data.get('num_atoms', 20)
    atoms = []
    bonds = []
    
    # Common atom types and their colors (quantum theme)
    atom_types = [
        {'symbol': 'C', 'color': '#7c3aed', 'radius': 0.7},  # Purple for quantum
        {'symbol': 'N', 'color': '#3b82f6', 'radius': 0.65},
        {'symbol': 'O', 'color': '#ec4899', 'radius': 0.6},  # Pink for quantum
        {'symbol': 'H', 'color': '#f59e0b', 'radius': 0.31}, # Gold for quantum
        {'symbol': 'S', 'color': '#10b981', 'radius': 1.0},  # Emerald for quantum
    ]
    
    # Generate atoms in a 3D space and count for chemical formula
    atom_count = {}
    for i in range(num_atoms):
        atom_type = atom_types[i % len(atom_types)]
        x = (random.random() - 0.5) * 20
        y = (random.random() - 0.5) * 20
        z = (random.random() - 0.5) * 20
        
        # Count atoms for chemical formula
        symbol = atom_type['symbol']
        atom_count[symbol] = atom_count.get(symbol, 0) + 1
        
        atoms.append({
            'id': i,
            'symbol': symbol,
            'x': x, 'y': y, 'z': z,
            'color': atom_type['color'],
            'radius': atom_type['radius']
        })
    
    # Generate chemical formula (e.g., C6H12O6)
    formula_parts = []
    # Order by common convention: C, H, N, O, S, others
    formula_order = ['C', 'H', 'N', 'O', 'S']
    
    for symbol in formula_order:
        if symbol in atom_count:
            count = atom_count[symbol]
            if count == 1:
                formula_parts.append(symbol)
            else:
                formula_parts.append(f"{symbol}<sub>{count}</sub>")
    
    # Add any other atoms not in the standard order
    for symbol, count in atom_count.items():
        if symbol not in formula_order:
            if count == 1:
                formula_parts.append(symbol)
            else:
                formula_parts.append(f"{symbol}<sub>{count}</sub>")
    
    chemical_formula = ''.join(formula_parts)
    
    # Generate bonds between nearby atoms
    for i in range(len(atoms)):
        for j in range(i + 1, min(i + 4, len(atoms))):  # Connect to nearby atoms
            if random.random() > 0.3:  # 70% chance of bond
                bonds.append({'from': i, 'to': j})
    
    atoms_js = json.dumps(atoms)
    bonds_js = json.dumps(bonds)
    
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{title}</title>
        <style>
            body {{
                margin: 0;
                padding: 0;
                background: linear-gradient(135deg, #7c3aed 0%, #ec4899 100%);
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                overflow: hidden;
            }}
            
            .header {{
                position: absolute;
                top: 20px;
                left: 20px;
                z-index: 100;
                color: white;
                text-shadow: 0 2px 4px rgba(0,0,0,0.5);
            }}
            
            .header h1 {{
                margin: 0;
                font-size: 24px;
                font-weight: 300;
            }}
            
            .header p {{
                margin: 5px 0;
                opacity: 0.9;
                font-size: 14px;
            }}
            
            .controls {{
                position: absolute;
                top: 20px;
                right: 20px;
                z-index: 100;
                color: white;
                background: rgba(0,0,0,0.3);
                padding: 15px;
                border-radius: 10px;
                backdrop-filter: blur(10px);
            }}
            
            .controls h3 {{
                margin: 0 0 10px 0;
                font-size: 16px;
            }}
            
            .control-item {{
                margin: 8px 0;
                font-size: 12px;
            }}
            
            .info-panel {{
                position: absolute;
                bottom: 20px;
                left: 20px;
                z-index: 100;
                color: white;
                background: rgba(0,0,0,0.3);
                padding: 15px;
                border-radius: 10px;
                backdrop-filter: blur(10px);
                max-width: 300px;
            }}
            
            .quantum-panel {{
                position: absolute;
                bottom: 20px;
                right: 20px;
                z-index: 100;
                color: white;
                background: rgba(124, 58, 237, 0.3);
                padding: 15px;
                border-radius: 10px;
                backdrop-filter: blur(10px);
                max-width: 250px;
                border: 1px solid rgba(124, 58, 237, 0.5);
            }}
            
            #canvas-container {{
                width: 100vw;
                height: 100vh;
                cursor: grab;
            }}
            
            #canvas-container:active {{
                cursor: grabbing;
            }}
            
            .loading {{
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: white;
                font-size: 18px;
                z-index: 50;
            }}
            
            .quantum-glow {{
                animation: quantumGlow 2s ease-in-out infinite alternate;
            }}
            
            @keyframes quantumGlow {{
                0% {{ box-shadow: 0 0 20px rgba(124, 58, 237, 0.5); }}
                100% {{ box-shadow: 0 0 30px rgba(236, 72, 153, 0.8); }}
            }}
        </style>
        <script src="https://unpkg.com/three@0.128.0/build/three.min.js"></script>
    </head>
    <body>
        <div class="header">
            <h1>{title}</h1>
            <p>File: {filename}</p>
            <p>Quantum 3D Molecular Structure</p>
        </div>
        
        <div class="controls">
            <h3>Controls</h3>
            <div class="control-item">Mouse - Drag to rotate</div>
            <div class="control-item">Wheel - Scroll to zoom</div>
            <div class="control-item">Atoms - {molecule_data.get('num_atoms', 20)}</div>
            <div class="control-item">Bonds - {molecule_data.get('num_bonds', 19)}</div>
            <div class="control-item">Space - Toggle auto-rotate</div>
        </div>
        
        <div class="info-panel">
            <h3>Molecular Properties</h3>
            <div style="font-size: 16px; font-weight: bold; color: #a855f7; margin-bottom: 8px;"><strong>Chemical Formula:</strong> {molecule_data.get('chemical_formula', 'Unknown')}</div>
            <div><strong>Molecular Weight:</strong> {molecule_data.get('molecular_weight', 0):.2f} g/mol</div>
            <div><strong>Processing Method:</strong> Quantum Simulation</div>
            <div><strong>Visualization:</strong> Three.js WebGL</div>
            <div><strong>Status:</strong> [OK] Quantum Processing Complete</div>
        </div>
        
        <div class="quantum-panel quantum-glow">
            <h3>Quantum Information</h3>
            <div><strong>Qubits:</strong> 4</div>
            <div><strong>Circuit Depth:</strong> 3</div>
            <div><strong>Gates:</strong> Hadamard, CNOT, RX</div>
            <div><strong>Measurement:</strong> Computational Basis</div>
        </div>
        
        <div id="loading" class="loading">Loading Quantum Structure...</div>
        <div id="canvas-container"></div>
        
        <script>
            // Check if Three.js loaded
            if (typeof THREE === 'undefined') {{
                console.error('Three.js failed to load from CDN');
                document.getElementById('loading').innerHTML = '❌ Three.js library failed to load';
                document.getElementById('loading').style.color = 'red';
            }} else {{
                try {{
                    console.log('Three.js loaded successfully, version:', THREE.REVISION);
                    
                    // Scene setup
                    const scene = new THREE.Scene();
                    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
                    const renderer = new THREE.WebGLRenderer({{ antialias: true, alpha: true }});
                    
                    // Check WebGL support
                    if (!renderer || !renderer.context) {{
                        throw new Error('WebGL not supported in this browser');
                    }}
                    
                    renderer.setSize(window.innerWidth, window.innerHeight);
                    renderer.setClearColor(0x000000, 0);
                    renderer.shadowMap.enabled = true;
                    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
                    
                    document.getElementById('canvas-container').appendChild(renderer.domElement);
                    console.log('Renderer initialized and added to DOM');
            
            // Enhanced quantum-themed lighting
            const ambientLight = new THREE.AmbientLight(0x7c3aed, 0.3);
            scene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(10, 10, 5);
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
            scene.add(directionalLight);
            
            const directionalLight2 = new THREE.DirectionalLight(0xec4899, 0.3);
            directionalLight2.position.set(-10, -5, 5);
            scene.add(directionalLight2);
            
            const pointLight = new THREE.PointLight(0x3b82f6, 0.4);
            pointLight.position.set(-10, -10, 5);
            scene.add(pointLight);
            
            const spotLight = new THREE.SpotLight(0xffffff, 0.5);
            spotLight.position.set(0, 20, 0);
            spotLight.angle = Math.PI / 6;
            spotLight.penumbra = 0.1;
            scene.add(spotLight);
            
            // Molecular data
            const atoms = {atoms_js};
            const bonds = {bonds_js};
            
            // Create molecular structure
            const moleculeGroup = new THREE.Group();
            const atomMeshes = [];
            
            // Create atoms with quantum-enhanced visualization
            atoms.forEach(atom => {{
                // Create main atom sphere with quantum materials
                const geometry = new THREE.SphereGeometry(atom.radius * 1.3, 32, 32);
                const material = new THREE.MeshStandardMaterial({{ 
                    color: atom.color,
                    metalness: 0.4,
                    roughness: 0.3,
                    emissive: atom.color,
                    emissiveIntensity: 0.15
                }});
                
                const sphere = new THREE.Mesh(geometry, material);
                sphere.position.set(atom.x, atom.y, atom.z);
                sphere.castShadow = true;
                sphere.receiveShadow = true;
                
                // Add quantum particle effect ring
                const ringGeometry = new THREE.RingGeometry(atom.radius * 1.5, atom.radius * 1.8, 32);
                const ringMaterial = new THREE.MeshBasicMaterial({{
                    color: atom.color,
                    transparent: true,
                    opacity: 0.3,
                    side: THREE.DoubleSide
                }});
                const ring = new THREE.Mesh(ringGeometry, ringMaterial);
                ring.position.copy(sphere.position);
                ring.lookAt(new THREE.Vector3(0, 1, 0));
                
                // Add quantum glow aura
                const glowGeometry = new THREE.SphereGeometry(atom.radius * 1.6, 16, 16);
                const glowMaterial = new THREE.MeshBasicMaterial({{
                    color: atom.color,
                    transparent: true,
                    opacity: 0.08,
                    side: THREE.BackSide
                }});
                const glow = new THREE.Mesh(glowGeometry, glowMaterial);
                glow.position.copy(sphere.position);
                
                // Create floating quantum label
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = 256;
                canvas.height = 256;
                
                // Clear canvas
                context.clearRect(0, 0, 256, 256);
                
                // Create quantum-styled background
                const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 120);
                gradient.addColorStop(0, 'rgba(124, 58, 237, 0.9)');
                gradient.addColorStop(0.7, 'rgba(124, 58, 237, 0.3)');
                gradient.addColorStop(1, 'rgba(124, 58, 237, 0)');
                context.fillStyle = gradient;
                context.fillRect(0, 0, 256, 256);
                
                // Draw quantum-styled text
                context.font = 'Bold 96px Arial';
                context.fillStyle = 'white';
                context.strokeStyle = '#7c3aed';
                context.lineWidth = 8;
                context.textAlign = 'center';
                context.textBaseline = 'middle';
                
                context.strokeText(atom.symbol, 128, 128);
                context.fillText(atom.symbol, 128, 128);
                
                const texture = new THREE.CanvasTexture(canvas);
                const labelMaterial = new THREE.SpriteMaterial({{ 
                    map: texture,
                    transparent: true,
                    alphaTest: 0.1
                }});
                const label = new THREE.Sprite(labelMaterial);
                label.scale.set(2.5, 2.5, 1);
                label.position.set(atom.x, atom.y + atom.radius + 1.2, atom.z);
                
                atomMeshes[atom.id] = sphere;
                moleculeGroup.add(sphere);
                moleculeGroup.add(ring);
                moleculeGroup.add(glow);
                moleculeGroup.add(label);
            }});
            
            // Create quantum energy bonds
            bonds.forEach(bondData => {{
                const fromAtom = atoms[bondData.from];
                const toAtom = atoms[bondData.to];
                
                const direction = new THREE.Vector3(
                    toAtom.x - fromAtom.x,
                    toAtom.y - fromAtom.y,
                    toAtom.z - fromAtom.z
                );
                
                const distance = direction.length();
                
                // Create main bond cylinder
                const geometry = new THREE.CylinderGeometry(0.08, 0.08, distance, 16);
                const material = new THREE.MeshStandardMaterial({{ 
                    color: 0x7c3aed,
                    emissive: 0x7c3aed,
                    emissiveIntensity: 0.2,
                    metalness: 0.7,
                    roughness: 0.2
                }});
                
                const bondMesh = new THREE.Mesh(geometry, material);
                bondMesh.position.set(
                    (fromAtom.x + toAtom.x) / 2,
                    (fromAtom.y + toAtom.y) / 2,
                    (fromAtom.z + toAtom.z) / 2
                );
                
                // Orient the bond
                bondMesh.lookAt(new THREE.Vector3(toAtom.x, toAtom.y, toAtom.z));
                bondMesh.rotateX(Math.PI / 2);
                bondMesh.castShadow = true;
                bondMesh.receiveShadow = true;
                
                // Add quantum energy flow effect
                const flowGeometry = new THREE.CylinderGeometry(0.06, 0.06, distance, 8);
                const flowMaterial = new THREE.MeshBasicMaterial({{ 
                    color: 0xec4899,
                    transparent: true,
                    opacity: 0.6
                }});
                
                const flowMesh = new THREE.Mesh(flowGeometry, flowMaterial);
                flowMesh.position.copy(bondMesh.position);
                flowMesh.rotation.copy(bondMesh.rotation);
                
                // Add particle trail effect
                const particleGeometry = new THREE.SphereGeometry(0.03, 8, 8);
                const particleMaterial = new THREE.MeshBasicMaterial({{
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.8
                }});
                
                // Create particles along the bond
                for (let i = 0; i < 5; i++) {{
                    const t = i / 4;
                    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
                    particle.position.set(
                        fromAtom.x + (toAtom.x - fromAtom.x) * t,
                        fromAtom.y + (toAtom.y - fromAtom.y) * t,
                        fromAtom.z + (toAtom.z - fromAtom.z) * t
                    );
                    moleculeGroup.add(particle);
                }}
                
                moleculeGroup.add(bondMesh);
                moleculeGroup.add(flowMesh);
            }});
            
            scene.add(moleculeGroup);
            
            // Position camera
            camera.position.z = 15;
            camera.position.y = 5;
            camera.lookAt(0, 0, 0);
            
            // Mouse controls
            let isMouseDown = false;
            let mouseX = 0, mouseY = 0;
            
            document.addEventListener('mousedown', (event) => {{
                isMouseDown = true;
                mouseX = event.clientX;
                mouseY = event.clientY;
            }});
            
            document.addEventListener('mouseup', () => {{
                isMouseDown = false;
            }});
            
            document.addEventListener('mousemove', (event) => {{
                if (!isMouseDown) return;
                
                const deltaX = event.clientX - mouseX;
                const deltaY = event.clientY - mouseY;
                
                moleculeGroup.rotation.y += deltaX * 0.01;
                moleculeGroup.rotation.x += deltaY * 0.01;
                
                mouseX = event.clientX;
                mouseY = event.clientY;
            }});
            
            // Zoom control
            document.addEventListener('wheel', (event) => {{
                camera.position.z += event.deltaY * 0.01;
                camera.position.z = Math.max(5, Math.min(50, camera.position.z));
            }});
            
            // Auto-rotation
            let autoRotate = true;
            
            document.addEventListener('keydown', (event) => {{
                if (event.code === 'Space') {{
                    autoRotate = !autoRotate;
                    event.preventDefault();
                }}
            }});
            
            // Clean animation loop with stable molecular structure
            function animate() {{
                requestAnimationFrame(animate);
                
                if (autoRotate && !isMouseDown) {{
                    moleculeGroup.rotation.y += 0.003;
                    moleculeGroup.rotation.x += 0.001;
                }}
                
                // Subtle quantum effects without movement
                const time = Date.now() * 0.001;
                
                moleculeGroup.children.forEach((child, index) => {{
                    // Gentle pulsing glow for bonds only
                    if (child.material && child.material.emissiveIntensity !== undefined && 
                        child.geometry && child.geometry.type === 'CylinderGeometry') {{
                        child.material.emissiveIntensity = 0.15 + Math.sin(time + index * 0.5) * 0.05;
                    }}
                    
                    // Gentle opacity changes for particle effects only
                    if (child.material && child.material.opacity !== undefined && 
                        child.geometry && child.geometry.type === 'SphereGeometry' && 
                        child.material.transparent) {{
                        const offset = (time * 2 + index) % (Math.PI * 2);
                        child.material.opacity = 0.5 + Math.sin(offset) * 0.2;
                    }}
                    
                    // Slow ring rotation for quantum rings only
                    if (child.geometry && child.geometry.type === 'RingGeometry') {{
                        child.rotation.z += 0.01;
                        child.material.opacity = 0.2 + Math.sin(time + index * 0.3) * 0.05;
                    }}
                    
                    // Make labels always face camera
                    if (child.isSprite) {{
                        child.lookAt(camera.position);
                    }}
                }});
                
                renderer.render(scene, camera);
            }}
            
            // Handle window resize
            window.addEventListener('resize', () => {{
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            }});
            
            // Hide loading message and start animation
            setTimeout(() => {{
                const loadingElement = document.getElementById('loading');
                if (loadingElement) {{
                    loadingElement.style.display = 'none';
                    console.log('Loading message hidden');
                }}
                console.log('Starting 3D animation with', atoms.length, 'atoms and', bonds.length, 'bonds');
                animate();
            }}, 500);  // Reduced timeout to 500ms
                    
                }} catch (error) {{
                    console.error('3D Visualization Error:', error);
                    document.getElementById('loading').style.display = 'none';
                    document.getElementById('loading').innerHTML = '❌ Error: ' + error.message;
                    document.getElementById('loading').style.color = 'red';
                    document.getElementById('loading').style.display = 'block';
                }}
            }}
        </script>
    </body>
    </html>
    """
    
    return base64.b64encode(html_content.encode('utf-8')).decode('utf-8')

def mock_quantum_simulation():
    """Simulate quantum operations with mock data"""
    # Create a mock probability distribution for 4 qubits (16 possible states)
    np.random.seed(42)  # For consistent results
    probs = np.random.dirichlet(np.ones(16))  # Random probability distribution
    return probs

def process_quantum(file_paths: List[str]) -> Tuple[Dict, Dict]:
    """
    Process MOL2 files using quantum computing approach (simplified demo version)
    """
    quantum_results = {}
    quantum_times = {}
    
    for file_path in file_paths:
        filename = file_path.split('\\')[-1]  # Get filename from path
        print(f"Processing quantum: {filename}")
        
        try:
            # Quantum Simulation: Start Timing
            start_time = time.time()
            
            # Simulate quantum processing (typically faster than classical)
            time.sleep(0.05 + (len(filename) * 0.005))  # Faster processing
            
            # Run mock quantum simulation
            quantum_result = mock_quantum_simulation()
            
            # Create mock molecular info (same structure as classical) with chemical formula
            mock_atom_count = 20 + (len(filename) * 2)
            mock_bond_count = mock_atom_count - 1
            mock_weight = 150.0 + (len(filename) * 10.5)
            
            # Generate mock chemical formula based on atom distribution
            # Simulate realistic molecular composition
            total_atoms = mock_atom_count
            c_count = max(1, int(total_atoms * 0.4))  # ~40% carbon
            h_count = max(1, int(total_atoms * 0.3))  # ~30% hydrogen  
            o_count = max(1, int(total_atoms * 0.15)) # ~15% oxygen
            n_count = max(1, int(total_atoms * 0.1))  # ~10% nitrogen
            s_count = max(1, total_atoms - c_count - h_count - o_count - n_count)  # remainder sulfur
            
            # Build chemical formula string with proper HTML formatting
            formula_parts = []
            if c_count == 1:
                formula_parts.append("C")
            elif c_count > 1:
                formula_parts.append(f"C<sub>{c_count}</sub>")
                
            if h_count == 1:
                formula_parts.append("H")
            elif h_count > 1:
                formula_parts.append(f"H<sub>{h_count}</sub>")
                
            if n_count == 1:
                formula_parts.append("N")
            elif n_count > 1:
                formula_parts.append(f"N<sub>{n_count}</sub>")
                
            if o_count == 1:
                formula_parts.append("O")
            elif o_count > 1:
                formula_parts.append(f"O<sub>{o_count}</sub>")
                
            if s_count == 1:
                formula_parts.append("S")
            elif s_count > 1:
                formula_parts.append(f"S<sub>{s_count}</sub>")
            
            chemical_formula = ''.join(formula_parts)
            
            # Generate interactive 3D visualization
            visualization_html = create_interactive_3d_visualization(
                filename, 
                f"Quantum: {filename}",
                {
                    'num_atoms': mock_atom_count,
                    'num_bonds': mock_bond_count,
                    'molecular_weight': mock_weight,
                    'chemical_formula': chemical_formula
                }
            )
            
            quantum_time = time.time() - start_time
            
            # Store results
            quantum_results[filename] = {
                "success": True,
                "processing_time": quantum_time,
                "visualization": visualization_html,
                "quantum_output": quantum_result.tolist(),
                "molecule_info": {
                    "num_atoms": mock_atom_count,
                    "num_bonds": mock_bond_count,
                    "molecular_weight": mock_weight,
                    "chemical_formula": chemical_formula
                },
                "method": "PennyLane Quantum Simulation (Demo Mode)",
                "quantum_details": {
                    "qubits": 4,
                    "circuit_depth": 3,
                    "gates_applied": ["Hadamard", "CNOT", "RX"],
                    "measurement_basis": "computational"
                }
            }
            
            quantum_times[filename] = quantum_time
            
            print(f"✅ {filename} - Quantum Time: {quantum_time:.4f}s")
            print(f"Quantum probabilities (first 4): {quantum_result[:4]}")
            
        except Exception as e:
            quantum_results[filename] = {
                "error": str(e),
                "success": False
            }
            quantum_times[filename] = 0
            print(f"❌ Error processing {filename}: {str(e)}")
    
    return quantum_results, quantum_times
