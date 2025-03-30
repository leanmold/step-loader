javascript

// STEPLoader.js
class STEPLoader {
  constructor() {
    this.entities = {};
  }

  parse(data, onLoad, onError) {
    console.log('Starting STEP parsing...');
    try {
      const lines = data.split('\n').map(line => line.trim());
      const dataStart = lines.indexOf('DATA;');
      const dataEnd = lines.indexOf('ENDSEC;', dataStart);
      const dataLines = lines.slice(dataStart + 1, dataEnd);
      console.log('Data lines found:', dataLines.length);

      this.entities = {};
      dataLines.forEach(line => {
        if (line.startsWith('#') && line.endsWith(';')) {
          this.parseEntity(line);
        }
      });
      console.log('Parsed entities:', this.entities);

      const geometry = this.buildGeometry();
      console.log('Geometry vertices:', geometry.attributes.position.array);

      const material = new THREE.LineBasicMaterial({ color: 0xff0000 }); // Red for visibility
      const mesh = new THREE.LineSegments(geometry, material);
      console.log('Mesh created');
      onLoad(mesh);
    } catch (error) {
      console.error('Parsing error:', error);
      onError(error);
    }
  }

  parseEntity(line) {
    const match = line.match(/^#(\d+)\s*=\s*(\w+)\s*\('[^']*',\s*(.+)\);$/);
    if (!match) return;

    const id = match[1];
    const type = match[2];
    const params = match[3];
    console.log(`Parsing entity #${id}: ${type}`);

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

  parseCoordinates(params) {
    const match = params.match(/\(([-.\d]+),\s*([-.\d]+),\s*([-.\d]+)\)/);
    if (match) {
      return [parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3])];
    }
    return null;
  }

  parseReferences(params) {
    const match = params.match(/#(\d+),\s*#(\d+)/);
    if (match) {
      return [match[1], match[2]];
    }
    return null;
  }

  buildGeometry() {
    const vertices = [];
    for (const id in this.entities) {
      const entity = this.entities[id];
      if (entity.type === 'LINE') {
        const startPoint = this.entities[entity.points[0]];
        const endPoint = this.entities[entity.points[1]];
        if (startPoint && endPoint && startPoint.coords && endPoint.coords) {
          vertices.push(...startPoint.coords);
          vertices.push(...endPoint.coords);
          console.log(`Added line from ${startPoint.coords} to ${endPoint.coords}`);
        }
      }
    }

    const geometry = new THREE.BufferGeometry();
    if (vertices.length > 0) {
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    } else {
      console.log('No vertices found, using fallback');
      geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 10, 10, 10], 3));
    }
    return geometry;
  }
}

window.STEPLoader = STEPLoader;

