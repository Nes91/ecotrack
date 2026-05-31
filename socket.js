let _io = null;
const connectedUsers = {};
 
export function setIo(ioInstance) {
  _io = ioInstance;
}
 
export function getIo() {
  return _io;
}
 
export { connectedUsers };
 