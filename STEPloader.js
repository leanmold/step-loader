javascript

parse(data, onLoad, onError) {
  try {
    const lines = data.split('\n').map(line => line.trim());
    const dataStart = lines.indexOf('DATA;');
    const dataEnd = lines.indexOf('ENDSEC;', dataStart);
    const dataLines = lines.slice(dataStart + 1, dataEnd);
    console.log('Data lines:', dataLines); // Check if STEP data is read

    this.entities = {};
    dataLines.forEach(line => {
      if (line.startsWith('#') && line.endsWith(';')) {
        this.parseEntity(line);
      }
    });
    console.log('Parsed entities:', this.entities); // Check parsed results

    const geometry = this.buildGeometry();
    console.log('Vertices:', geometry.attributes.position.array); // Check geometry

    const material = new THREE.LineBasicMaterial({ color: 0xaaaaaa });
    const mesh = new THREE.LineSegments(geometry, material);
    onLoad(mesh);
  } catch (error) {
    onError(error);
  }
}

