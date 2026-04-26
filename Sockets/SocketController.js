const handleDeliverySockets = (io) => {
  io.on("connection", (socket) => {
    console.log("New user connect:", socket.id);

    socket.on("joinOrderRoom", (orderId) => {
      socket.join(orderId);
      console.log(`User joined room for order: ${orderId}`);
    });

    socket.on("sendLocation", (data) => {
      io.to(data.orderId).emit("receiveLocation", {
        lat: data.lat,
        lng: data.lng,
      });
    });

    socket.on("leaveOrderRoom", (orderId) => {
      socket.leave(orderId);
      console.log(`Socket ${socket.id} left room: ${orderId}`);
    });

    socket.on("disconnect", () => {
      console.log("User Disconnected:", socket.id);
    });
  });
};
module.exports = { handleDeliverySockets };
