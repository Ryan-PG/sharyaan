export function buildRouteUrl(originId: string | null, destinationId: string | null) {
  const url = new URL(window.location.href);
  url.searchParams.delete("from");
  url.searchParams.delete("to");

  if (originId) url.searchParams.set("from", originId);
  if (destinationId) url.searchParams.set("to", destinationId);

  return url.toString();
}

export async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "true");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  document.body.removeChild(input);
}
