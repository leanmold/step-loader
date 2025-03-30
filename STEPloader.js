javascript

// STEPLoader.js
class STEPLoader {
  constructor() {
    this.entities = {}; // Store parsed entities by ID
  }

  // Parse the STEP file content
  parse(data, onLoad, onError) {
    try {
      // Split file into lines and filter DATA section
      const lines = data.split('\n').map(line => line.trim());
      const dataStart = lines.indexOf('DATA;');
      const dataEnd = lines.indexOf('ENDSEC;', dataStart);
      const dataLines = lines.slice(dataStart + 1, dataEnd);

      // Parse entities
      this.entities = {};
      dataLines.forEach(line => {
        if (line.startsWith('#') && line.endsWith(';')) {
          this.parseEntity(line);
        }
      });

      // Build geometry from parsed entities
      const geometry = this.buildGeometry();
      const material = new THREE.LineBasicMaterial({ color: 0xaaaaaa });
      const mesh = new THREE.LineSegments(geometry, material);

      onLoad(mesh);
    } catch (error) {
      onError(error);
    }
  }

  // Parse a single entity line
  parseEntity(line) {
    const match = line.match(/^#(\d+)\s*=\s*(\w+)\s*\('[^']*',\s*(.+)\);$/);
    if (!match) return;

    const id = match[1];
    const type = match[2];
    const params = match[3];

    if (type === 'CARTESIAN_POINT') {
      const coords = this.parseCoordinates(params);
      if (coords) {
        this.entities[id] = { type, coords };
      }
    } else if (type === 'LINE') {
      const refs = this.parseReferences(params);
      if (refs && refs.length === 2) {
        this.entities[id] = { type, points: refs };
      }
    }
  }

  // Extract coordinates from CARTESIAN_POINT
  parseCoordinates(params) {
    const match = params.match(/\(([-.\d]+),\s*([-.\d]+),\s*([-.\d]+)\)/);
    if (match) {
      return [
        parseFloat(match[1]),
        parseFloat(match[2]),
        parseFloat(match[3])
      ];
    }
    return null;
  }

  // Extract entity references from LINE
  parseReferences(params) {
    const match = params.match(/#(\d+),\s*#(\d+)/);
    if (match) {
      return [match[1], match[2]];
    }
    return null;
  }

  // Build Three.js geometry from parsed entities
  buildGeometry() {
    const vertices = [];
    for (const id in this.entities) {
      const entity = this.entities[id];
      if (entity.type === 'LINE') {
        const startPoint = this.entities[entity.points[0]];
        const endPoint = this.entities[entity.points[1]];
        if (startPoint && endPoint && startPoint.coords && endPoint.coords) {
          vertices.push(...startPoint.coords); // Start point
          vertices.push(...endPoint.coords);   // End point
        }
      }
    }

    const geometry = new THREE.BufferGeometry();
    if (vertices.length > 0) {
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    } else {
      // Fallback: a single line if no valid data
      geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 1, 1, 1], 3));
    }
    return geometry;
  }
}

// Make it available globally for external use
window.STEPLoader = STEPLoader;

