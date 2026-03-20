export const environment = {
  production: true,
  // Da wir WebRTC und P2P nutzen, benötigen wir keinen externen Backend-Server mehr.
  // Die Anwendung läuft vollständig im Browser (GitHub Pages).
  backendUrl: '',
  socketUrl: window.location.origin
};
