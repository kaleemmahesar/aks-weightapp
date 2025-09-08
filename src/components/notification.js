// src/utils/notification.js
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const notify = {
  success: (msg) => toast.success(msg, { position: "top-right", autoClose: 3000 }),
  error: (msg) => toast.error(msg, { position: "top-right", autoClose: 3000 }),
  warning: (msg) => toast.warning(msg, { position: "top-right", autoClose: 3000 }),
  info: (msg) => toast.info(msg, { position: "top-right", autoClose: 3000 }),
};

export default notify;
