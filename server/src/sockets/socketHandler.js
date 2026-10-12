let ioInstance = null;

export function setupSocket(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`[Socket] ⚡ Operator terminal connected: ${socket.id}`);

    socket.emit('system:connected', {
      message: 'Connected to Golden Rescue Live Dispatch Telemetry',
      timestamp: new Date(),
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] 🔌 Operator terminal disconnected: ${socket.id}`);
    });

    socket.on('subscribe:incident', (incidentId) => {
      socket.join(`incident:${incidentId}`);
    });
  });

  return io;
}

export function broadcastEvent(event, data) {
  if (ioInstance) {
    ioInstance.emit(event, data);
  }
}

export function getIO() {
  return ioInstance;
}
