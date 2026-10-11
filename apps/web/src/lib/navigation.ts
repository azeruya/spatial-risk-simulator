export function buildLocationUrl(
  path: string,
  latitude: number,
  longitude: number
) {
  const params = new URLSearchParams({
    lat: latitude.toString(),
    lon: longitude.toString(),
  });

  return `${path}?${params.toString()}`;
}