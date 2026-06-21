// This route is deprecated. Please use /api/predict/single or /api/predict/bulk instead.
export async function POST() {
  return new Response("Deprecated", { status: 410 });
}
