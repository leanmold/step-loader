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

      const material = new THREE.PointsMaterial({ color: 0xff0000, size: 0.1 });
      const mesh = new THREE.Points(geometry, material); // Points instead of lines
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
    } else if (type === 'B_SPLINE_SURFACE_WITH_KNOTS') {
      const controlPoints = this.parseBSplineSurface(params);
      if (controlPoints) {
        this.entities[id] = { type, controlPoints };
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

  parseBSplineSurface(params) {
    const pointRefsMatch = params.match(/\(\(([^)]+)\)/); // Extract control point grid
    if (!pointRefsMatch) return null;

    const rows = pointRefsMatch[1].split('),(').map(row => 
      row.replace(/[()]/g, '').split(',').map(ref => ref.trim())
    );
    const controlPoints = [];
    rows.forEach(row => {
      row.forEach(ref => {
        if (ref.startsWith('#')) {
          controlPoints.push(ref.slice(1)); // Store reference IDs
        }
      });
    });
    return controlPoints;
  }

  buildGeometry() {
    const vertices = [];
    
    // Collect all points from CARTESIAN_POINT and B_SPLINE_SURFACE_WITH_KNOTS
    for (const id in this.entities) {
      const entity = this.entities[id];
      if (entity.type === 'CARTESIAN_POINT' && entity.coords) {
        vertices.push(...entity.coords);
      } else if (entity.type === 'B_SPLINE_SURFACE_WITH_KNOTS' && entity.controlPoints) {
        entity.controlPoints.forEach(pointId => {
          const point = this.entities[pointId];
          if (point && point.coords) {
            vertices.push(...point.coords);
          }
        });
      } else if (entity.type === 'LINE' && entity.points) {
        const startPoint = this.entities[entity.points[0]];
        const endPoint = this.entities[entity.points[1]];
        if (startPoint && endPoint && startPoint.coords && endPoint.coords) {
          vertices.push(...startPoint.coords);
          vertices.push(...endPoint.coords);
        }
      }
    }

    const geometry = new THREE.BufferGeometry();
    if (vertices.length > 0) {
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      console.log('Added', vertices.length / 3, 'points to geometry');
    } else {
      console.log('No vertices found, using fallback');
      geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 10, 10, 10], 3));
    }
    return geometry;
  }
}

window.STEPLoader = STEPLoader;