import time
import base64
import tempfile
import io
from typing import List, Dict, Tuple
import json
from rdkit import Chem
from rdkit.Chem import AllChem, Draw
from rdkit.Chem.EnumerateStereoisomers import EnumerateStereoisomers, StereoEnumerationOptions

def generate_and_rank_isomers(smiles_string: str):
    """
    Generates all stereoisomers for a given SMILES string, creates 3D structures,
    calculates their stability using the MMFF94 force field, and ranks them.

    Args:
        smiles_string: The input SMILES string for a molecule.

    Returns:
        A ranked list of dictionaries, where each dictionary contains:
        - 'rank': The stability rank (1 is the most stable).
        - 'molecule': The RDKit molecule object with the 3D conformation.
        - 'isomeric_smiles': The specific SMILES string for the stereoisomer.
        - 'energy_kcal_mol': The calculated energy (stability) in kcal/mol.
        - 'visualization': Base64 encoded HTML for 3D visualization.
    """
    print(f"Processing SMILES: {smiles_string}\n")

    # 1. Create a molecule object from the SMILES string
    try:
        mol = Chem.MolFromSmiles(smiles_string)
        if mol is None:
            raise ValueError("Invalid SMILES string provided.")
        # Remove any existing stereochemistry to find all possibilities
        Chem.RemoveStereochemistry(mol)
    except Exception as e:
        print(f"Error: Could not parse the SMILES string. {e}")
        return None

    # 2. Enumerate all possible stereoisomers
    opts = StereoEnumerationOptions(unique=True)
    isomers = tuple(EnumerateStereoisomers(mol, options=opts))
    
    if not isomers:
        print("No stereoisomers could be generated. The molecule may have no stereocenters.")
        isomers = [mol] # Process the base molecule itself

    print(f"Found {len(isomers)} possible stereoisomer(s). Now generating 3D structures and calculating energy...\n")

    results = []
    # 3. For each isomer, generate a 3D structure and calculate its energy
    for i, isomer in enumerate(isomers):
        # Add hydrogens, which are essential for 3D structure and energy calculations
        isomer_h = Chem.AddHs(isomer)

        # Generate a 3D conformation using a random seed for reproducibility
        status = AllChem.EmbedMolecule(isomer_h, randomSeed=42)
        
        # If a 3D structure could be generated, optimize it and get the energy
        if status == 0: # 0 means success
            # Optimize the geometry and calculate the energy using the MMFF94 force field
            props = AllChem.MMFFGetMoleculeProperties(isomer_h)
            if props is None:
                print(f"Warning: Could not get MMFF properties for isomer {i+1}.")
                continue
                
            ff = AllChem.MMFFGetMoleculeForceField(isomer_h, props)
            if ff is None:
                print(f"Warning: Could not create force field for isomer {i+1}.")
                continue
                
            ff.Minimize()
            energy = ff.CalcEnergy()
            
            # Get the specific SMILES for this stereoisomer
            isomeric_smiles = Chem.MolToSmiles(isomer, isomericSmiles=True)
            
            # Generate 3D visualization
            visualization_html = create_3d_visualization(isomer_h, f"Isomer {i+1}", energy, isomeric_smiles)
            
            # Generate 2D structure image
            structure_2d = generate_2d_structure(isomer_h)
            
            results.append({
                'molecule': isomer_h,
                'isomeric_smiles': isomeric_smiles,
                'energy_kcal_mol': energy,
                'visualization': visualization_html,
                'structure_2d': structure_2d
            })
        else:
            print(f"Warning: Could not generate a 3D conformation for isomer {i+1}.")

    # 4. Sort the results by energy (lower energy = more stable)
    if not results:
        print("Could not generate 3D structures for any isomers.")
        return None
        
    sorted_results = sorted(results, key=lambda x: x['energy_kcal_mol'])

    # 5. Add ranks to the sorted results
    for i, result in enumerate(sorted_results):
        result['rank'] = i + 1

    return sorted_results

def create_3d_visualization(mol_object, title: str, energy: float, smiles: str) -> str:
    """Create an interactive 3D molecular visualization using Three.js for SMILES results"""
    
    # Generate mock atomic coordinates from the RDKit molecule
    conf = mol_object.GetConformer()
    atoms = []
    bonds = []
    
    # Extract atom positions and types
    for atom in mol_object.GetAtoms():
        pos = conf.GetAtomPosition(atom.GetIdx())
        atoms.append({
            'element': atom.GetSymbol(),
            'x': pos.x,
            'y': pos.y,
            'z': pos.z
        })
    
    # Extract bonds
    for bond in mol_object.GetBonds():
        bonds.append({
            'atom1': bond.GetBeginAtomIdx(),
            'atom2': bond.GetEndAtomIdx(),
            'order': bond.GetBondType()
        })
    
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
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                font-family: 'Arial', sans-serif;
                overflow: hidden;
            }}
            
            .header {{
                position: absolute;
                top: 20px;
                left: 20px;
                z-index: 100;
                color: white;
                background: rgba(0,0,0,0.3);
                padding: 15px;
                border-radius: 10px;
                backdrop-filter: blur(10px);
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
                font-size: 14px;
                max-width: 250px;
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
                max-width: 400px;
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
        </style>
        <script src="https://unpkg.com/three@0.128.0/build/three.min.js"></script>
    </head>
    <body>
        <div class="header">
            <h1>{title}</h1>
            <p>SMILES Isomer Analysis</p>
        </div>
        
        <div class="controls">
            <h3>Controls</h3>
            <div class="control-item">Mouse - Drag to rotate</div>
            <div class="control-item">Wheel - Scroll to zoom</div>
            <div class="control-item">Atoms - {len(atoms)}</div>
            <div class="control-item">Bonds - {len(bonds)}</div>
        </div>
        
        <div class="info-panel">
            <h3>Isomer Information</h3>
            <div class="control-item"><strong>SMILES:</strong> {smiles}</div>
            <div class="control-item"><strong>Energy:</strong> {energy:.4f} kcal/mol</div>
            <div class="control-item"><strong>Stability Rank:</strong> Will be determined after analysis</div>
        </div>
        
        <div id="loading" class="loading">🧬 Loading 3D Structure...</div>
        <div id="canvas-container"></div>
        
        <script>
            try {{
                // Scene setup
                const scene = new THREE.Scene();
                const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
                const renderer = new THREE.WebGLRenderer({{ antialias: true, alpha: true }});
                renderer.setSize(window.innerWidth, window.innerHeight);
                renderer.setClearColor(0x000000, 0);
                document.getElementById('canvas-container').appendChild(renderer.domElement);
                
                // Lighting
                const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
                scene.add(ambientLight);
                const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
                directionalLight.position.set(10, 10, 5);
                scene.add(directionalLight);
                
                // Molecule group
                const moleculeGroup = new THREE.Group();
                
                // Atom data
                const atoms = {json.dumps(atoms)};
                const bonds = {json.dumps(bonds)};
                
                // Color mapping for elements
                const elementColors = {{
                    'C': 0x909090,
                    'H': 0xffffff,
                    'O': 0xff0000,
                    'N': 0x0000ff,
                    'S': 0xffff00,
                    'P': 0xffa500,
                    'Cl': 0x00ff00,
                    'Br': 0xa52a2a,
                    'F': 0x90e050
                }};
                
                // Create atoms
                atoms.forEach((atom, index) => {{
                    const color = elementColors[atom.element] || 0xff69b4;
                    const geometry = new THREE.SphereGeometry(0.3, 16, 16);
                    const material = new THREE.MeshLambertMaterial({{ color: color }});
                    const sphere = new THREE.Mesh(geometry, material);
                    
                    sphere.position.set(atom.x, atom.y, atom.z);
                    moleculeGroup.add(sphere);
                    
                    // Add element label
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.width = 64;
                    canvas.height = 64;
                    context.font = '48px Arial';
                    context.fillStyle = 'white';
                    context.textAlign = 'center';
                    context.fillText(atom.element, 32, 40);
                    
                    const texture = new THREE.CanvasTexture(canvas);
                    const spriteMaterial = new THREE.SpriteMaterial({{ map: texture }});
                    const sprite = new THREE.Sprite(spriteMaterial);
                    sprite.position.set(atom.x, atom.y + 0.5, atom.z);
                    sprite.scale.set(0.5, 0.5, 0.5);
                    moleculeGroup.add(sprite);
                }});
                
                // Create bonds
                bonds.forEach(bond => {{
                    const atom1 = atoms[bond.atom1];
                    const atom2 = atoms[bond.atom2];
                    
                    const start = new THREE.Vector3(atom1.x, atom1.y, atom1.z);
                    const end = new THREE.Vector3(atom2.x, atom2.y, atom2.z);
                    const direction = end.clone().sub(start);
                    const length = direction.length();
                    
                    const geometry = new THREE.CylinderGeometry(0.1, 0.1, length, 8);
                    const material = new THREE.MeshLambertMaterial({{ color: 0x888888 }});
                    const cylinder = new THREE.Mesh(geometry, material);
                    
                    cylinder.position.copy(start.clone().add(end).multiplyScalar(0.5));
                    cylinder.lookAt(end);
                    cylinder.rotateX(Math.PI / 2);
                    
                    moleculeGroup.add(cylinder);
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
                
                // Animation loop
                function animate() {{
                    requestAnimationFrame(animate);
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
                    }}
                    animate();
                }}, 500);
                        
            }} catch (error) {{
                console.error('3D Visualization Error:', error);
                document.getElementById('loading').innerHTML = '❌ Error: ' + error.message;
                document.getElementById('loading').style.color = 'red';
            }}
        </script>
    </body>
    </html>
    """
    
    return base64.b64encode(html_content.encode('utf-8')).decode('utf-8')

def generate_2d_structure(mol_object) -> str:
    """
    Generate a 2D structure image of the molecule and return it as base64 encoded PNG
    
    Args:
        mol_object: RDKit molecule object
        
    Returns:
        Base64 encoded PNG image string
    """
    try:
        # Remove hydrogens for cleaner 2D visualization
        mol_no_h = Chem.RemoveHs(mol_object)
        
        # Generate 2D coordinates
        AllChem.Compute2DCoords(mol_no_h)
        
        # Create the image
        img = Draw.MolToImage(mol_no_h, size=(400, 400), kekulize=True)
        
        # Convert PIL image to base64
        buffered = io.BytesIO()
        img.save(buffered, format="PNG")
        img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')
        
        return img_str
        
    except Exception as e:
        print(f"Error generating 2D structure: {e}")
        return None

def generate_simple_2d_structure(smiles_string: str) -> Dict:
    """
    Generate a simple 2D structure from a SMILES string without isomer enumeration
    
    Args:
        smiles_string: The input SMILES string
        
    Returns:
        Dictionary containing the 2D structure and molecule info
    """
    try:
        # Create molecule from SMILES
        mol = Chem.MolFromSmiles(smiles_string)
        if mol is None:
            return {
                "success": False,
                "error": "Invalid SMILES string provided"
            }
        
        # Generate 2D structure
        structure_2d = generate_2d_structure(mol)
        
        if structure_2d is None:
            return {
                "success": False,
                "error": "Could not generate 2D structure"
            }
        
        # Get molecular properties
        mol_weight = Chem.rdMolDescriptors.CalcExactMolWt(mol)
        formula = Chem.rdMolDescriptors.CalcMolFormula(mol)
        
        return {
            "success": True,
            "smiles": smiles_string,
            "structure_2d": structure_2d,
            "molecular_weight": mol_weight,
            "molecular_formula": formula,
            "atom_count": mol.GetNumAtoms(),
            "bond_count": mol.GetNumBonds()
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

def process_smiles(smiles_string: str) -> Dict:
    """
    Process a SMILES string and return all isomers with their stability rankings
    """
    start_time = time.time()
    
    try:
        # Generate and rank isomers
        ranked_isomers = generate_and_rank_isomers(smiles_string)
        
        if not ranked_isomers:
            return {
                "success": False,
                "error": "Could not generate isomers from the provided SMILES string",
                "processing_time": time.time() - start_time
            }
        
        # Prepare results for frontend
        results = []
        for isomer in ranked_isomers:
            results.append({
                "rank": isomer["rank"],
                "smiles": isomer["isomeric_smiles"],
                "energy": isomer["energy_kcal_mol"],
                "stability": "Most Stable" if isomer["rank"] == 1 else f"Rank {isomer['rank']}",
                "visualization": isomer["visualization"],
                "structure_2d": isomer.get("structure_2d")
            })
        
        processing_time = time.time() - start_time
        
        return {
            "success": True,
            "input_smiles": smiles_string,
            "total_isomers": len(results),
            "processing_time": processing_time,
            "isomers": results,
            "most_stable": results[0] if results else None
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "processing_time": time.time() - start_time
        }
