const NOT_A_GARMENT_NOTICE = 'SYNTHETIC TEST FIXTURE - NOT A GARMENT - NOT A PRODUCT - NO FIT ACCURACY';

export function createSyntheticFittingRoomGlb(): ArrayBuffer {
  const positions = new Float32Array([
    -0.5, 0, 0,
    0.5, 0, 0,
    0, 1, 0,
  ]);
  const binary = new Uint8Array(positions.buffer);
  const document = {
    asset: { version: '2.0', generator: 'AVERON local synthetic test fixture', extras: { notice: NOT_A_GARMENT_NOTICE } },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0, translation: [0.25, 0.5, 0], scale: [1.5, 1.5, 1.5] }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
    buffers: [{ byteLength: binary.byteLength }],
    bufferViews: [{ buffer: 0, byteOffset: 0, byteLength: binary.byteLength, target: 34962 }],
    accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', min: [-0.5, 0, 0], max: [0.5, 1, 0] }],
  };
  const encoder = new TextEncoder();
  const jsonBytes = encoder.encode(JSON.stringify(document));
  const jsonLength = Math.ceil(jsonBytes.byteLength / 4) * 4;
  const binaryLength = Math.ceil(binary.byteLength / 4) * 4;
  const totalLength = 12 + 8 + jsonLength + 8 + binaryLength;
  const glb = new ArrayBuffer(totalLength);
  const view = new DataView(glb);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, totalLength, true);
  view.setUint32(12, jsonLength, true);
  view.setUint32(16, 0x4e4f534a, true);
  new Uint8Array(glb, 20, jsonLength).fill(0x20);
  new Uint8Array(glb, 20, jsonBytes.byteLength).set(jsonBytes);
  const binaryHeader = 20 + jsonLength;
  view.setUint32(binaryHeader, binaryLength, true);
  view.setUint32(binaryHeader + 4, 0x004e4942, true);
  new Uint8Array(glb, binaryHeader + 8, binaryLength).set(binary);
  return glb;
}

export { NOT_A_GARMENT_NOTICE };
